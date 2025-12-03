"""
User Profile routes: Change email, phone, password
"""
import sqlite3
from fastapi import APIRouter, HTTPException
from models.schemas import ChangeEmailRequest, ChangePhoneRequest, ChangePasswordRequest, ChangeUsernameRequest
from models.responses import StatusResponse, BalanceResponse
from database import get_db
from utils.security import hash_password, verify_password

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
