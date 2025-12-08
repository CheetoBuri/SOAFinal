"""
Orders routes: Create orders, view history, cancel, mark received
"""
from fastapi import APIRouter, HTTPException
from models.schemas import CheckoutRequest, PromoCodeRequest, OrderActionRequest
from models.responses import PromoValidationResponse, CheckoutResponse, OrderHistoryResponse, StatusResponse
from database import get_db
from utils.timezone import get_vietnam_time
from utils.email_service import send_refund_email
from utils.menu_data import MENU_PRODUCTS
import json
import uuid
from datetime import datetime
import psycopg2.extras

router = APIRouter(prefix="/api", tags=["3️⃣ Checkout & Promo", "5️⃣ Orders & History"])


@router.post("/promo/validate", summary="Validate Promo Code", response_model=PromoValidationResponse)
def validate_promo(request: PromoCodeRequest):
    """
    Validate promo code and get discount percentage.
    
    - **code**: Promo code string (required)
    
    Returns validation result with discount percentage if valid.
    """
    code = request.code.upper().strip()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("""
        SELECT discount_percent, max_uses, used_count, expires_at
        FROM promo_codes WHERE code = %s
    """, (code,))
    
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Invalid promo code")
    
    discount_percent = result['discount_percent']
    max_uses = result['max_uses']
    used_count = result['used_count']
    expires_at = result['expires_at']
    
    # Check validity
    if hasattr(expires_at, 'isoformat'):
        expires_at = expires_at.isoformat()
    if expires_at and datetime.fromisoformat(expires_at) < get_vietnam_time():
        raise HTTPException(status_code=400, detail="Promo code expired")
    
    if max_uses and used_count >= max_uses:
        raise HTTPException(status_code=400, detail="Promo code usage limit reached")
    
    return {
        "status": "valid",
        "discount_percent": discount_percent,
        "code": code
    }


@router.post("/checkout", summary="Create Order (Checkout)")
def checkout(request: CheckoutRequest):
    """
    Create new order from cart items.
    
    - **user_id**: User ID (required)
    - **items**: Array of cart items with details (required)
    - **customer_name**: Customer's full name (required)
    - **customer_phone**: Customer's phone number (required)
    - **customer_email**: Customer's email (required)
    - **payment_method**: Payment method (`balance` or `cod`, required)
    - **delivery_district**: Delivery district (optional)
    - **delivery_ward**: Delivery ward (optional)
    - **delivery_street**: Delivery street address (optional)
    - **special_notes**: Special instructions (optional)
    - **promo_code**: Promo code for discount (optional)
    
    Returns order details including order_id, amounts, and payment method.
    """
    if not request.items or len(request.items) == 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total - use price from frontend (already includes size & extras)
    total = 0
    for item in request.items:
        price = item.get("price", 0)
        quantity = item.get("quantity", 1)
        
        # price already includes size modifier and milk extras
        total += price * quantity
    
    # Shipping fee - fixed at 30,000 VND
    shipping_fee = 30000
    
    discount = 0
    promo_code = request.promo_code.upper().strip() if request.promo_code else None
    
    # Validate and apply promo code
    if promo_code:
        conn = get_db()
        c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        c.execute("""
            SELECT id, discount_percent, max_uses, used_count, expires_at
            FROM promo_codes WHERE code = %s
        """, (promo_code,))
        
        result = c.fetchone()
        
        if result:
            promo_id = result['id']
            discount_percent = result['discount_percent']
            max_uses = result['max_uses']
            used_count = result['used_count']
            expires_at = result['expires_at']
            
            # Check validity
            valid = True
            if hasattr(expires_at, 'isoformat'):
                expires_at = expires_at.isoformat()
            if expires_at and datetime.fromisoformat(expires_at) < get_vietnam_time():
                valid = False
            if max_uses and used_count >= max_uses:
                valid = False
            
            if valid:
                discount = total * (discount_percent / 100)
                c.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = %s", (promo_id,))
        
        conn.commit()
        conn.close()
    
    # Calculate final total: subtotal - discount + shipping
    final_total = total - discount + shipping_fee

    # Check balance for balance payment BEFORE creating order
    if request.payment_method == "balance":
        conn = get_db()
        c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        c.execute("SELECT balance FROM users WHERE id = %s", (request.user_id,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_balance = user['balance']
        if user_balance < final_total:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. You need {final_total:,.0f}đ but only have {user_balance:,.0f}đ"
            )

    # Normalize delivery address - strip whitespace and convert empty strings to None
    delivery_district = (request.delivery_district or "").strip() or None
    delivery_ward = (request.delivery_ward or "").strip() or None
    delivery_street = (request.delivery_street or "").strip() or None
    
    # Create order
    order_id = str(uuid.uuid4())[:8].upper()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Convert items to JSON string for PostgreSQL
    items_json = json.dumps(request.items)
    created_at = get_vietnam_time().isoformat()
    
    # All orders start as 'pending_payment'
    # Balance: need OTP verification -> then 'paid'
    # COD: will be 'paid' when user clicks 'Received'
    c.execute("""
        INSERT INTO orders
        (id, user_id, items, total, special_notes, promo_code, discount, shipping_fee, payment_method, customer_name, customer_phone, delivery_district, delivery_ward, delivery_street, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        order_id,
        request.user_id,
        items_json,
        final_total,
        request.special_notes,
        promo_code,
        discount,
        shipping_fee,
        request.payment_method,
        request.customer_name,
        request.customer_phone,
        delivery_district,
        delivery_ward,
        delivery_street,
        "pending_payment",
        created_at
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "order_id": order_id,
        "total": final_total,
        "discount": discount,
        "shipping_fee": shipping_fee,
        "message": "Order created. Please confirm payment with OTP."
    }


@router.get("/orders", summary="Get User's Order History")
def get_orders(user_id: str):
    """
    Get all orders for a user.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns array of user's orders sorted by creation date (newest first).
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("""
        SELECT id, items, total, status, special_notes, promo_code, discount, shipping_fee,
               payment_method, customer_name, customer_phone, delivery_district, 
               delivery_ward, delivery_street, payment_time, created_at, delivered_at
        FROM orders
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    orders = []
    for row in c.fetchall():
        # Parse items from JSON string if needed
        items = row['items']
        if isinstance(items, str):
            import json
            try:
                items = json.loads(items)
            except:
                items = []
        
        orders.append({
            "id": row['id'],
            "items": items,
            "total": row['total'],
            "status": row['status'],
            "special_notes": row['special_notes'],
            "promo_code": row['promo_code'],
            "discount": row['discount'],
            "shipping_fee": row['shipping_fee'],
            "payment_method": row['payment_method'],
            "customer_name": row['customer_name'],
            "customer_phone": row['customer_phone'],
            "delivery_district": row['delivery_district'],
            "delivery_ward": row['delivery_ward'],
            "delivery_street": row['delivery_street'],
            "payment_time": row['payment_time'],
            "created_at": row['created_at'],
            "delivered_at": row['delivered_at']
        })
    
    conn.close()
    return {"orders": orders}


@router.get("/frequent-items", summary="Get User's Frequent Items with Customization Options")
def get_frequent_items(user_id: str, limit: int = 5):
    """
    Get user's most frequently ordered items with their customization options.
    
    - **user_id**: User ID (query parameter, required)
    - **limit**: Maximum number of items to return (default: 5)
    
    Returns array of frequent items sorted by order count (most ordered first).
    Each item includes the customization options that were selected.
    """
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("""
        SELECT product_id, product_name, product_icon, product_image, base_price, order_count, 
               customization, last_ordered_at
        FROM frequent_items
        WHERE user_id = %s
        ORDER BY order_count DESC, last_ordered_at DESC
        LIMIT %s
    """, (user_id, limit))
    
    items = []
    for row in c.fetchall():
        customization = json.loads(row['customization']) if row['customization'] else {}
        
        items.append({
            "product_id": row['product_id'],
            "product_name": row['product_name'],
            "icon": row['product_icon'],
            "image": row.get('product_image'),
            "price": row['base_price'],
            "order_count": row['order_count'],
            "customization": customization,
            "last_ordered_at": row['last_ordered_at']
        })
    
    conn.close()
    return {"items": items}


@router.post("/orders/{order_id}/cancel", summary="Cancel Order and Refund")
def cancel_order(order_id: str, request: OrderActionRequest):
    """
    Cancel order and refund amount to user balance (only for balance payments).
    COD orders are cancelled without refund.
    
    - **order_id**: Order ID to cancel (path parameter, required)
    - **user_id**: User ID for authorization (in request body, required)
    
    Returns success status with refund confirmation (if applicable).
    """
    user_id = request.user_id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get order details and user info
    c.execute("""
        SELECT o.user_id, o.total, o.status, o.payment_method, u.email, u.full_name 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = %s
    """, (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_user_id = order['user_id']
    total = order['total']
    status = order['status']
    payment_method = order['payment_method']
    user_email = order['email']
    user_name = order['full_name']
    
    if order_user_id != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    if status in ['completed', 'delivered', 'cancelled']:
        conn.close()
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    # Only refund for balance payments that were actually paid
    refund_amount = 0
    needs_refund = False
    
    if payment_method == 'balance' and status in ['paid', 'preparing', 'in_transit']:
        # Balance payment was completed - refund needed
        needs_refund = True
        refund_amount = total
        
        # Get current balance
        c.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
        result = c.fetchone()
        current_balance = result['balance'] if result else 0
        new_balance = current_balance + refund_amount
        
        c.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (refund_amount, user_id))
        
        # Record transaction
        import uuid
        from utils.timezone import get_vietnam_time
        transaction_id = str(uuid.uuid4())[:12].upper()
        transaction_time = get_vietnam_time().isoformat()
        
        c.execute("""
            INSERT INTO transactions 
            (id, user_id, type, amount, balance_before, balance_after, order_id, description, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            transaction_id,
            user_id,
            "refund",
            refund_amount,
            current_balance,
            new_balance,
            order_id,
            f"Refund for cancelled Order #{order_id}",
            transaction_time
        ))
    
    # COD orders or unpaid balance orders - no refund needed
    # Just cancel the order
    
    # Update order status
    c.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))
    
    conn.commit()
    conn.close()
    
    # Send refund email notification only if refund was processed
    if needs_refund:
        try:
            send_refund_email(
                recipient_email=user_email,
                recipient_name=user_name,
                order_id=order_id,
                refund_amount=refund_amount
            )
        except Exception as e:
            print(f"⚠️ Email sending failed but refund was successful: {str(e)}")
    
    message = "Order cancelled and refunded" if needs_refund else "Order cancelled"
    
    return {
        "status": "success",
        "message": message,
        "refund_amount": refund_amount
    }


@router.post("/orders/{order_id}/received", summary="Mark Order as Received", response_model=StatusResponse)
def mark_order_received(order_id: str, request: OrderActionRequest):
    """
    Mark order as received/completed by customer.
    For COD orders: this also completes the payment.
    Also saves items with their customization options to frequent_items table.
    
    - **order_id**: Order ID to mark as received (path parameter, required)
    - **user_id**: User ID for authorization (in request body, required)
    
    Returns success status confirming order completion.
    """
    user_id = request.user_id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Get order details including items
    c.execute("SELECT user_id, status, payment_method, items FROM orders WHERE id = %s", (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['user_id'] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order['status'] == 'cancelled':
        conn.close()
        raise HTTPException(status_code=400, detail="Cancelled order cannot be marked as received")
    
    # Update order status to delivered (completed)
    # Set delivered_at timestamp when user confirms received
    current_time = get_vietnam_time().isoformat()
    
    # For COD orders that haven't been paid yet, also set payment_time
    if order['payment_method'] == 'cash_on_delivery' and order['status'] == 'pending_payment':
        c.execute("UPDATE orders SET status = 'delivered', payment_time = %s, delivered_at = %s WHERE id = %s", 
            (current_time, current_time, order_id)
        )
    else:
        # For all other orders (balance/already paid), just set delivered_at
        c.execute("UPDATE orders SET status = 'delivered', delivered_at = %s WHERE id = %s", 
            (current_time, order_id)
        )
    
    # Save items to frequent_items table with their customization options
    try:
        items = json.loads(order['items']) if isinstance(order['items'], str) else order['items']
        
        # Build a lookup dictionary for icons and images from menu data
        icon_lookup = {}
        image_lookup = {}
        for category_items in MENU_PRODUCTS.values():
            for menu_item in category_items:
                icon_lookup[menu_item['id']] = menu_item['icon']
                if 'image' in menu_item:
                    image_lookup[menu_item['id']] = menu_item['image']
        
        for item in items:
            product_id = item.get('product_id')
            
            # Skip items without product_id (invalid data from API tests)
            if not product_id:
                print(f"⚠️ Skipping item without product_id: {item.get('product_name', 'Unknown')}")
                continue
            
            product_name = item.get('product_name') or item.get('name', 'Unknown')
            # Get icon from menu data, fallback to item icon or default
            product_icon = icon_lookup.get(product_id) or item.get('icon', '🍽️')
            product_image = image_lookup.get(product_id)
            base_price = item.get('price', 0)
            quantity = item.get('quantity', 1)
            
            # Extract customization options
            customization = {
                'size': item.get('size'),
                'temperature': item.get('temperature'),
                'milk': item.get('milk'),
                'sugar': item.get('sugar'),
                'upsells': item.get('upsells', [])
            }
            
            # Fallback: handle old format with milks array (backward compatibility)
            if not customization['milk'] and item.get('milks') and len(item.get('milks', [])) > 0:
                customization['milk'] = item['milks'][0]
            
            # Remove None values
            customization = {k: v for k, v in customization.items() if v is not None}
            customization_json = json.dumps(customization, sort_keys=True)
            
            # Check if this exact combination exists
            c.execute("""
                SELECT id, order_count FROM frequent_items
                WHERE user_id = %s AND product_id = %s AND customization = %s
            """, (user_id, product_id, customization_json))
            
            existing = c.fetchone()
            
            if existing:
                # Update count and last_ordered_at
                c.execute("""
                    UPDATE frequent_items
                    SET order_count = order_count + %s, last_ordered_at = %s
                    WHERE id = %s
                """, (quantity, current_time, existing['id']))
            else:
                # Insert new frequent item
                c.execute("""
                    INSERT INTO frequent_items 
                    (user_id, product_id, product_name, product_icon, product_image, base_price, order_count, customization, last_ordered_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, product_id, product_name, product_icon, product_image, base_price, quantity, customization_json, current_time))
    except Exception as e:
        print(f"⚠️ Error saving to frequent_items: {str(e)}")
        # Don't fail the whole operation if frequent_items saving fails
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Order marked as completed"
    }
