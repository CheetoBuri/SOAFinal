"""
Payment OTP routes: Request and verify payment OTP
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import PaymentOTPRequest, VerifyPaymentOTPRequest
from models.responses import PaymentOTPResponse, PaymentVerificationResponse
from database import get_db
from utils.security import generate_otp, send_email
from utils.email_service import send_simple_email
from utils.timezone import get_vietnam_time
from datetime import timedelta
import psycopg2.extras

router = APIRouter(prefix="/api/payment", tags=["4️⃣ Payment"])


@router.post("/send-otp", summary="Send Payment OTP")
def send_payment_otp(request: PaymentOTPRequest, background_tasks: BackgroundTasks):
    """
    Generate and send OTP for payment confirmation.
    
    - **user_id**: User ID (required)
    - **order_id**: Order ID to pay for (required)
    - **amount**: Payment amount (required)
    
    Returns OTP sent confirmation.
    """
    order_id = request.order_id
    user_id = request.user_id
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Verify order exists and belongs to user
    c.execute("SELECT user_id, total, status FROM orders WHERE id = %s", (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['user_id'] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order['status'] != "pending_payment":
        conn.close()
        raise HTTPException(status_code=400, detail="Order is not pending payment")
    
    # Check user balance
    c.execute("SELECT email, balance FROM users WHERE id = %s", (user_id,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_email = user['email']
    user_balance = user['balance']
    order_total = order['total']
    
    if user_balance < order_total:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Need {order_total}, have {user_balance}")
    
    # Generate OTP
    otp_code = generate_otp()
    created_at = get_vietnam_time()
    # Save expires_at as naive datetime in Vietnam timezone
    expires_at = (created_at + timedelta(minutes=10)).replace(tzinfo=None)
    created_at = created_at.replace(tzinfo=None)
    
    # Store OTP
    c.execute("""
        INSERT INTO payment_otp (order_id, user_id, code, amount, created_at, expires_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (order_id, user_id, otp_code, order_total, created_at.isoformat(), expires_at.isoformat()))
    
    conn.commit()
    conn.close()
    
    # Prepare email HTML
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #8B4513; text-align: center;">☕ Payment Confirmation</h2>
                <p style="color: #333; font-size: 16px;">Hello,</p>
                <p style="color: #333;">Your payment OTP for order <strong>#{order_id}</strong> is:</p>
                <h1 style="color: #8B4513; text-align: center; font-size: 48px; letter-spacing: 10px; margin: 30px 0;">{otp_code}</h1>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> {order_id}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Total Amount:</strong> ₫{order_total:,.0f}</p>
                </div>
                <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">This OTP will expire in 10 minutes.</p>
                <p style="color: #333; text-align: center;">Please enter this code to complete your payment.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">Thank you for your order!</p>
            </div>
        </body>
    </html>
    """
    
    # Send email in background (non-blocking)
    background_tasks.add_task(
        send_email,
        user_email,
        "🔐 Payment OTP - Confirm Your Order",
        html_body
    )
    
    print(f"✉️  Payment OTP queued for {user_email}: {otp_code}")
    
    return {
        "status": "success",
        "message": "OTP sent to your email",
        "order_id": order_id,
        "total": order_total
    }


@router.post("/verify-otp", summary="Verify Payment OTP and Complete Payment")
def verify_payment_otp(request: VerifyPaymentOTPRequest, background_tasks: BackgroundTasks):
    """
    Verify OTP code and process payment from user balance.
    
    - **user_id**: User ID (required)
    - **order_id**: Order ID to complete payment (required)
    - **otp_code**: 6-digit OTP code received via email (required)
    
    Returns payment confirmation with new balance.
    """
    order_id = request.order_id
    user_id = request.user_id
    otp = request.otp_code
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check OTP
    c.execute("""
        SELECT code, expires_at, verified
        FROM payment_otp
        WHERE order_id = %s AND user_id = %s
        ORDER BY created_at DESC LIMIT 1
    """, (order_id, user_id))
    
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="No OTP found for this order")
    
    stored_otp = result['code']
    expires_at = result['expires_at']
    verified = result['verified']
    
    if verified:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP already used")
    
    # Check expiration using naive datetime comparison
    from datetime import datetime
    current_time = get_vietnam_time().replace(tzinfo=None)
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if current_time > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if otp != stored_otp:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Get order total
    c.execute("SELECT total, status FROM orders WHERE id = %s", (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_total = order['total']
    order_status = order['status']
    
    if order_status != "pending_payment":
        conn.close()
        raise HTTPException(status_code=400, detail="Order is not pending payment")
    
    # Deduct from user balance
    c.execute("SELECT email, balance FROM users WHERE id = %s", (user_id,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_email = user['email']
    user_balance = user['balance']
    
    if user_balance < order_total:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Process payment
    new_balance = user_balance - order_total
    c.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (order_total, user_id))
    
    payment_time = get_vietnam_time().isoformat()
    c.execute("""
        UPDATE orders
        SET status = 'paid', payment_time = %s
        WHERE id = %s
    """, (payment_time, order_id))
    
    # Mark OTP as verified
    c.execute("""
        UPDATE payment_otp
        SET verified = TRUE
        WHERE order_id = %s AND user_id = %s AND code = %s
    """, (order_id, user_id, otp))
    
    # Record transaction
    import uuid
    transaction_id = str(uuid.uuid4())[:12].upper()
    c.execute("""
        INSERT INTO transactions 
        (id, user_id, type, amount, balance_before, balance_after, order_id, description, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        transaction_id,
        user_id,
        "payment",
        -order_total,
        user_balance,
        new_balance,
        order_id,
        f"Payment for Order #{order_id}",
        payment_time
    ))
    
    conn.commit()
    conn.close()

    # Send payment success email asynchronously
    try:
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 520px; margin: 0 auto; background-color: white; padding: 24px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #2e7d32; text-align: center;">✅ Payment Successful</h2>
                    <p style="color: #333;">Your payment for order <strong>#{order_id}</strong> has been completed.</p>
                    <div style="background-color: #f9f9f9; padding: 12px; border-radius: 6px; margin: 16px 0;">
                        <p style="margin: 6px 0; color: #666;"><strong>Order ID:</strong> {order_id}</p>
                        <p style="margin: 6px 0; color: #666;"><strong>Amount Paid:</strong> ₫{order_total:,.0f}</p>
                        <p style="margin: 6px 0; color: #666;"><strong>New Balance:</strong> ₫{new_balance:,.0f}</p>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">Thank you for your purchase!</p>
                </div>
            </body>
        </html>
        """
        background_tasks.add_task(send_email, user_email, "✅ Payment Successful", html_body)
    except Exception:
        # Fallback to plain text
        background_tasks.add_task(send_simple_email, user_email, "Payment Successful", f"Order #{order_id} paid. Amount: {order_total}. New balance: {new_balance}.")
    
    return {
        "status": "success",
        "message": "Payment successful!",
        "order_id": order_id,
        "amount_paid": order_total,
        "new_balance": new_balance,
        "remaining_balance": new_balance
    }
