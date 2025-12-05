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


@router.get("/stats", summary="Get User Order Statistics", tags=["6️⃣ User Profile"])
def get_order_stats(user_id: str):
    """
    Get user's order statistics including spending, order count, and favorite product.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns stats with total orders, spending, averages, and favorite product.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Get basic order stats
    c.execute("""
        SELECT 
            COUNT(*) as total_orders,
            SUM(total) as total_spent,
            AVG(total) as avg_order,
            MAX(total) as highest,
            MIN(total) as lowest
        FROM orders
        WHERE user_id = ? AND status != 'cancelled'
    """, (user_id,))
    
    stats = c.fetchone()
    
    total_orders = stats[0] or 0
    total_spent = stats[1] or 0.0
    avg_order = stats[2] or 0.0
    highest = stats[3] or 0.0
    lowest = stats[4] or 0.0
    
    # Get favorite product (most ordered)
    c.execute("""
        SELECT 
            json_extract(items, '$[0].product_id') as product_id,
            COUNT(*) as count
        FROM (
            SELECT json_each.value as item
            FROM orders, json_each(orders.items)
            WHERE user_id = ? AND status != 'cancelled'
        ) as items_table,
        json_each
        GROUP BY json_extract(items, '$[0].product_id')
        ORDER BY count DESC
        LIMIT 1
    """, (user_id,))
    
    fav_result = c.fetchone()
    favorite_product = fav_result[0] if fav_result else None
    favorite_count = fav_result[1] if fav_result else 0
    
    conn.close()
    
    return {
        "total_orders": total_orders,
        "total_spent": round(total_spent, 2),
        "average_order_value": round(avg_order, 2),
        "highest_order": round(highest, 2),
        "lowest_order": round(lowest, 2),
        "favorite_product": favorite_product,
        "favorite_product_count": favorite_count
    }


@router.get("/frequent-items", summary="Get Frequent Items", tags=["6️⃣ User Profile"])
def get_frequent_items(user_id: str, limit: int = 5):
    """
    Get user's most frequently ordered items.
    
    - **user_id**: User ID (query parameter, required)
    - **limit**: Maximum items to return (query parameter, default 5)
    
    Returns top N most ordered products.
    """
    conn = get_db()
    c = conn.cursor()
    
    # Extract product IDs from JSON items and count occurrences
    c.execute("""
        SELECT 
            json_extract(value, '$.product_id') as product_id,
            COUNT(*) as order_count
        FROM orders, json_each(orders.items)
        WHERE user_id = ? AND status != 'cancelled'
        GROUP BY json_extract(value, '$.product_id')
        ORDER BY order_count DESC
        LIMIT ?
    """, (user_id, limit))
    
    results = c.fetchall()
    conn.close()
    
    return {
        "frequent_items": [
            {
                "product_id": row[0],
                "order_count": row[1]
            }
            for row in results
        ]
    }
