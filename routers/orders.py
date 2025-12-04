"""
Orders routes: Create orders, view history, cancel, mark received
"""
from fastapi import APIRouter, HTTPException
from models.schemas import CheckoutRequest, PromoCodeRequest, OrderActionRequest
from models.responses import PromoValidationResponse, CheckoutResponse, OrderHistoryResponse, StatusResponse
from database import get_db
from utils.timezone import get_vietnam_time
from utils.email_service import send_refund_email
import json
import uuid
from datetime import datetime

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
    c = conn.cursor()
    
    c.execute("""
        SELECT discount_percent, max_uses, used_count, expires_at
        FROM promo_codes WHERE code = ?
    """, (code,))
    
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Invalid promo code")
    
    discount_percent, max_uses, used_count, expires_at = result
    
    # Check validity
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
    
    discount = 0
    promo_code = request.promo_code.upper().strip() if request.promo_code else None
    
    # Validate and apply promo code
    if promo_code:
        conn = get_db()
        c = conn.cursor()
        
        c.execute("""
            SELECT id, discount_percent, max_uses, used_count, expires_at
            FROM promo_codes WHERE code = ?
        """, (promo_code,))
        
        result = c.fetchone()
        
        if result:
            promo_id, discount_percent, max_uses, used_count, expires_at = result
            
            # Check validity
            valid = True
            if expires_at and datetime.fromisoformat(expires_at) < get_vietnam_time():
                valid = False
            if max_uses and used_count >= max_uses:
                valid = False
            
            if valid:
                discount = total * (discount_percent / 100)
                c.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", (promo_id,))
        
        conn.commit()
        conn.close()
    
    final_total = total - discount

    # Normalize delivery address
    # If client does not explicitly request to reuse address, clear to NULL to avoid carry-over
    if getattr(request, 'reuse_address', False):
        delivery_district = (request.delivery_district or "").strip() or None
        delivery_ward = (request.delivery_ward or "").strip() or None
        delivery_street = (request.delivery_street or "").strip() or None
    else:
        delivery_district = None
        delivery_ward = None
        delivery_street = None
    
    # Create order
    order_id = str(uuid.uuid4())[:8].upper()
    
    conn = get_db()
    c = conn.cursor()
    
    items_json = json.dumps(request.items)
    created_at = get_vietnam_time().isoformat()
    
    # All orders start as 'pending_payment'
    # Balance: need OTP verification -> then 'paid'
    # COD: will be 'paid' when user clicks 'Received'
    c.execute("""
        INSERT INTO orders
        (id, user_id, items, total, special_notes, promo_code, discount, payment_method, customer_name, customer_phone, delivery_district, delivery_ward, delivery_street, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        request.user_id,
        items_json,
        final_total,
        request.special_notes,
        promo_code,
        discount,
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
    c = conn.cursor()
    
    c.execute("""
        SELECT id, items, total, status, special_notes, promo_code, discount, 
               payment_method, customer_name, customer_phone, delivery_district, 
               delivery_ward, delivery_street, payment_time, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    orders = []
    for row in c.fetchall():
        orders.append({
            "id": row[0],
            "items": json.loads(row[1]),
            "total": row[2],
            "status": row[3],
            "special_notes": row[4],
            "promo_code": row[5],
            "discount": row[6],
            "payment_method": row[7],
            "customer_name": row[8],
            "customer_phone": row[9],
            "delivery_district": row[10],
            "delivery_ward": row[11],
            "delivery_street": row[12],
            "payment_time": row[13],
            "created_at": row[14]
        })
    
    conn.close()
    return {"orders": orders}


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
    c = conn.cursor()
    
    # Get order details and user info
    c.execute("""
        SELECT o.user_id, o.total, o.status, o.payment_method, u.email, u.full_name 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
    """, (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_user_id, total, status, payment_method, user_email, user_name = order
    
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
        c.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
        current_balance = c.fetchone()[0]
        new_balance = current_balance + refund_amount
        
        c.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (refund_amount, user_id))
        
        # Record transaction
        import uuid
        from utils.timezone import get_vietnam_time
        transaction_id = str(uuid.uuid4())[:12].upper()
        transaction_time = get_vietnam_time().isoformat()
        
        c.execute("""
            INSERT INTO transactions 
            (id, user_id, type, amount, balance_before, balance_after, order_id, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    c.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (order_id,))
    
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
    
    - **order_id**: Order ID to mark as received (path parameter, required)
    - **user_id**: User ID for authorization (in request body, required)
    
    Returns success status confirming order completion.
    """
    user_id = request.user_id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    conn = get_db()
    c = conn.cursor()
    
    # Get order details
    c.execute("SELECT user_id, status, payment_method FROM orders WHERE id = ?", (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order[0] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order[1] == 'cancelled':
        conn.close()
        raise HTTPException(status_code=400, detail="Cancelled order cannot be marked as received")
    
    # Update order status to delivered (completed)
    # For COD: this marks payment as successful
    payment_time = get_vietnam_time().isoformat()
    c.execute(
        "UPDATE orders SET status = 'delivered', payment_time = ? WHERE id = ?", 
        (payment_time, order_id)
    )
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Order marked as completed"
    }
