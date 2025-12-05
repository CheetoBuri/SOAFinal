"""
User Profile routes: Change email, phone, password
"""
import sqlite3
from fastapi import APIRouter, HTTPException
from models.schemas import ChangeEmailRequest, ChangePhoneRequest, ChangePasswordRequest, ChangeUsernameRequest
from models.responses import StatusResponse, BalanceResponse
from database import get_db
from utils.security import hash_password, verify_password
from utils.timezone import get_vietnam_time
from utils.email_service import send_simple_email
import uuid
import json

router = APIRouter(prefix="/api/user", tags=["6️⃣ User Profile"])


@router.post("/change-email", summary="Change User Email", response_model=StatusResponse)
def change_email(request: ChangeEmailRequest):
    """
    Change user's email address with password verification.
    
    - **user_id**: User ID (required)
    - **new_email**: New email address (required)
    - **password**: Current password for verification (required)
    
    Returns success status and message.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Verify user and password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(request.password, result[0]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if new email already exists
    c.execute("SELECT id FROM users WHERE email = ? AND id != ?", (request.new_email, request.user_id))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update email
    c.execute("UPDATE users SET email = ? WHERE id = ?", (request.new_email, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Email updated successfully"}


@router.post("/change-username", summary="Change Username", response_model=StatusResponse)
def change_username(request: ChangeUsernameRequest):
    """
    Change user's username with password verification.
    
    - **user_id**: User ID (required)
    - **new_username**: New username (required)
    - **password**: Current password for verification (required)
    
    Returns success status and message.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Verify user and password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(request.password, result[0]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if new username already exists
    c.execute("SELECT id FROM users WHERE username = ? AND id != ?", (request.new_username, request.user_id))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Update username
    c.execute("UPDATE users SET username = ? WHERE id = ?", (request.new_username, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Username updated successfully"}


@router.post("/change-phone", summary="Change User Phone", response_model=StatusResponse)
def change_phone(request: ChangePhoneRequest):
    """
    Change user's phone number with password verification.
    
    - **user_id**: User ID (required)
    - **new_phone**: New phone number (required)
    - **password**: Current password for verification (required)
    
    Returns success status and message.
    """
    import time
    max_retries = 5
    retry_delay = 0.05  # 50ms
    
    for attempt in range(max_retries):
        conn = None
        try:
            conn = get_db()
            c = conn.cursor()
            
            # Verify user and password
            c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
            result = c.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="User not found")
            
            if not verify_password(request.password, result[0]):
                raise HTTPException(status_code=401, detail="Invalid password")
            
            # Check if new phone already exists (excluding current user)
            c.execute("SELECT id FROM users WHERE phone = ? AND id != ?", (request.new_phone, request.user_id))
            if c.fetchone():
                raise HTTPException(status_code=400, detail=f"Phone number '{request.new_phone}' is already registered with another account.")
            
            # Update phone
            c.execute("UPDATE users SET phone = ? WHERE id = ?", (request.new_phone, request.user_id))
            conn.commit()
            
            return {"status": "success", "message": "Phone updated successfully"}
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                time.sleep(retry_delay * (1.5 ** attempt))  # Slower exponential backoff
                continue
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            if conn:
                conn.close()


@router.post("/change-password", summary="Change User Password", response_model=StatusResponse)
def change_password(request: ChangePasswordRequest):
    """
    Change user's password with current password verification.
    
    - **user_id**: User ID (required)
    - **current_password**: Current password (required)
    - **new_password**: New password (minimum 6 characters, required)
    
    Returns success status and message.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Verify user and current password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(request.current_password, result[0]):
        conn.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    new_hash = hash_password(request.new_password)
    c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Password changed successfully"}


# ====== VERIFY CURRENT PASSWORD ======
@router.post("/verify-password", summary="Verify current password")
def verify_current_password(user_id: str, current_password: str):
    """Verify if the provided password matches the user's current password"""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(current_password, row[0]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    return {"status": "success", "message": "Password verified"}


# ====== PASSWORD CHANGE VIA OTP ======
@router.post("/send-change-password-otp", summary="Send OTP to current email for password change")
def send_change_password_otp(user_id: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT email FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    email = row[0]

    # generate OTP
    code = str(uuid.uuid4().int)[:6]
    expires = get_vietnam_time().replace(microsecond=0)
    from datetime import timedelta
    expires = (expires + timedelta(minutes=10)).isoformat()

    # store OTP in payment_otp-like table; reuse payment_otp for generic OTPs
    c.execute("""
        INSERT INTO payment_otp (user_id, order_id, code, amount, expires_at, verified)
        VALUES (?, ?, ?, 0.0, ?, 0)
    """, (user_id, f"PWD-{uuid.uuid4().hex[:8]}", code, expires))
    conn.commit()
    conn.close()

    # send email via helper
    try:
        send_simple_email(email, "Password Change OTP", f"Your OTP code is: {code}")
    except Exception:
        pass

    return {"status": "success", "message": "OTP sent to current email"}

@router.post("/verify-change-password-otp", summary="Verify OTP and change password")
def verify_change_password_otp(user_id: str, otp_code: str, new_password: str):
    conn = get_db()
    c = conn.cursor()
    # get latest otp for user
    c.execute(
        """
        SELECT code, expires_at, verified FROM payment_otp
        WHERE user_id = ? AND verified = 0
        ORDER BY created_at DESC LIMIT 1
        """,
        (user_id,)
    )
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No OTP found")
    code, expires_at, verified = row
    from datetime import datetime
    # verified rows are excluded above; no need to recheck here
    if get_vietnam_time() > datetime.fromisoformat(expires_at):
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    if otp_code != code:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # update password
    new_hash = hash_password(new_password)
    c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
    # mark otp used
    c.execute("UPDATE payment_otp SET verified = 1 WHERE user_id = ? AND code = ?", (user_id, code))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Password changed successfully"}

# ====== EMAIL CHANGE VIA OTP ======
@router.post("/send-change-email-otp", summary="Send OTP to new email for email change")
def send_change_email_otp(user_id: str, new_email: str):
    if not new_email:
        raise HTTPException(status_code=400, detail="new_email required")
    conn = get_db()
    c = conn.cursor()
    # Ensure new email not used
    c.execute("SELECT id FROM users WHERE email = ?", (new_email,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already in use")

    code = str(uuid.uuid4().int)[:6]
    from datetime import timedelta
    expires = (get_vietnam_time() + timedelta(minutes=10)).isoformat()

    c.execute("""
        INSERT INTO payment_otp (user_id, order_id, code, amount, expires_at, verified)
        VALUES (?, ?, ?, 0.0, ?, 0)
    """, (user_id, f"EML-{uuid.uuid4().hex[:8]}", code, expires))
    conn.commit()
    conn.close()

    try:
        send_simple_email(new_email, "Email Change OTP", f"Your OTP code is: {code}")
    except Exception:
        pass
    return {"status": "success", "message": "OTP sent to new email"}

@router.post("/verify-change-email-otp", summary="Verify OTP and change email")
def verify_change_email_otp(user_id: str, new_email: str, otp_code: str):
    conn = get_db()
    c = conn.cursor()
    # latest otp
    c.execute(
        """
        SELECT code, expires_at, verified FROM payment_otp
        WHERE user_id = ? AND verified = 0
        ORDER BY created_at DESC LIMIT 1
        """,
        (user_id,)
    )
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No OTP found")
    code, expires_at, verified = row
    from datetime import datetime
    # verified rows are excluded above
    if get_vietnam_time() > datetime.fromisoformat(expires_at):
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    if otp_code != code:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # change email
    c.execute("UPDATE users SET email = ? WHERE id = ?", (new_email, user_id))
    # mark used
    c.execute("UPDATE payment_otp SET verified = 1 WHERE user_id = ? AND code = ?", (user_id, code))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Email changed successfully"}


@router.get("/balance", summary="Get User Balance", response_model=BalanceResponse)
def get_balance(user_id: str):
    """
    Get user's current account balance.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns current balance amount.
    """
    """Get user's current balance"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id query parameter required")
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
    result = c.fetchone()
    
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"balance": result[0]}


# ====== DEV RESET UTILITIES (LOCAL USE ONLY) ======
@router.delete("/delete", summary="Delete user and related data (DEV ONLY)")
def delete_user_dev(user_id: str):
    """Delete a user and all related records. For local testing only."""
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("DELETE FROM favorites WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM orders WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM cart WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM reviews WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM payment_otp WHERE user_id = ?", (user_id,))
        c.execute("SELECT email FROM users WHERE id = ?", (user_id,))
        row = c.fetchone()
        if row and row[0]:
            c.execute("DELETE FROM otp_codes WHERE email = ?", (row[0],))
        c.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        return {"status": "success", "message": "User deleted"}
    finally:
        conn.close()


@router.delete("/reset-db-dev", summary="Reset database data (DEV ONLY)")
def reset_database_dev():
    """Wipe all data rows from tables without dropping schema.

    Robust to missing optional tables: skips gracefully if a table doesn't exist.
    """
    conn = get_db()
    c = conn.cursor()
    tables = [
        "favorites",
        "orders",
        "cart",
        "reviews",
        "payment_otp",
        "otp_codes",
        "users",
    ]
    try:
        for t in tables:
            try:
                c.execute(f"DELETE FROM {t}")
            except sqlite3.OperationalError as e:
                # Skip missing tables
                if "no such table" in str(e):
                    continue
                else:
                    raise
        conn.commit()
        return {"status": "success", "message": "All data reset"}
    finally:
        conn.close()
