"""
Authentication routes: OTP registration, login, password reset
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import OTPRequest, VerifyOTPRequest, LoginRequest, ResetPasswordRequest
from models.responses import OTPSentResponse, UserResponse, UserDetailResponse, StatusResponse
from database import get_db
from utils.security import hash_password, verify_password, generate_otp, send_email
from utils.timezone import get_vietnam_time
import re
import secrets
from datetime import datetime, timedelta
import psycopg2.extras

router = APIRouter(prefix="/api/auth", tags=["1️⃣ Authentication"])


@router.post("/send-otp", summary="Send OTP for Registration", response_model=OTPSentResponse)
def send_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """
    Send OTP to email for registration.
    
    - **email**: User's email address (required)
    - **username**: Desired username (optional)
    
    Returns OTP sent confirmation with email address.
    """
    email = request.email.lower().strip()
    
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if email already registered - STOP before sending OTP
    c.execute("SELECT id, email FROM users WHERE email = %s", (email,))
    existing = c.fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Email '{email}' is already registered. Please login instead.")
    
    # Generate OTP
    otp = generate_otp()
    # Save expires_at as naive datetime in Vietnam timezone
    expires_at = (get_vietnam_time() + timedelta(minutes=10)).replace(tzinfo=None)
    
    # Save OTP
    c.execute("""
        INSERT INTO otp_codes (email, code, expires_at)
        VALUES (%s, %s, %s)
    """, (email, otp, expires_at))
    
    conn.commit()
    conn.close()
    
    # Prepare email HTML
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-inline-size: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #006241; text-align: center;">Cafe Ordering System</h2>
                <p style="color: #333; font-size: 16px;">Your OTP code is:</p>
                <h1 style="color: #006241; text-align: center; font-size: 48px; letter-spacing: 10px; margin: 30px 0;">{otp}</h1>
                <p style="color: #999; font-size: 14px; text-align: center;">This code expires in 10 minutes.</p>
            </div>
        </body>
    </html>
    """
    
    # Send email in background
    background_tasks.add_task(send_email, email, "Your Cafe Ordering OTP Code", html_body)
    
    return {
        "status": "success",
        "message": "OTP sent to email",
        "email": email,
        "note": "For demo: OTP is shown in console logs"
    }


@router.post("/verify-otp", summary="Verify OTP and Complete Registration", response_model=UserResponse)
def verify_otp(request: VerifyOTPRequest):
    """
    Verify OTP code and complete user registration.
    
    - **email**: User's email (must match OTP request)
    - **otp_code**: 6-digit OTP code received via email
    - **full_name**: User's full name
    - **phone**: Phone number (optional)
    - **username**: Desired username (optional, auto-generated if not provided)
    - **password**: Account password (required)
    
    Returns user information including user_id, email, name, and username.
    """
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check OTP validity and expiration in one query (compare with Vietnam time)
    c.execute("""
        SELECT code, expires_at,
               CASE WHEN expires_at > (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN TRUE ELSE FALSE END as is_valid
        FROM otp_codes 
        WHERE email = %s AND code = %s AND verified = FALSE
        ORDER BY created_at DESC LIMIT 1
    """, (email, otp_code))
    
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if not result['is_valid']:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Check if email already exists
    c.execute("SELECT id, email FROM users WHERE email = %s", (email,))
    existing_user = c.fetchone()
    if existing_user:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Email '{email}' is already registered. Please login instead.")
    
    # Check if username already exists (if provided)
    if request.username:
        username = request.username.lower().strip()
        c.execute("SELECT id FROM users WHERE username = %s", (username,))
        if c.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check if phone already exists
    if request.phone:
        c.execute("SELECT id FROM users WHERE phone = %s", (request.phone,))
        if c.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Phone number '{request.phone}' is already registered with another account.")
    
    # Create new user with auto-increment ID
    c.execute("SELECT MAX(CAST(id AS INTEGER)) FROM users WHERE id ~ '^[0-9]+$'")
    result = c.fetchone()
    max_id = result['max'] if result else None
    user_id = str((max_id or 0) + 1)
    
    # Use provided password or generate random one
    password_hash = hash_password(request.password) if request.password else hash_password(secrets.token_hex(16))
    c.execute("""
        INSERT INTO users (id, email, username, full_name, phone, password_hash)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, email, request.username.lower().strip() if request.username else None, request.full_name, request.phone, password_hash))
    
    # Mark OTP as verified
    c.execute("UPDATE otp_codes SET verified = TRUE WHERE email = %s AND code = %s", (email, otp_code))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "User registered/verified",
        "user_id": user_id,
        "email": email,
        "name": request.full_name,
        "username": request.username.lower().strip() if request.username else None,
        "phone": request.phone
    }


@router.post("/login", summary="Login with Email or Username", response_model=UserResponse)
def login(request: LoginRequest):
    """
    Login with email or username and password.
    
    - **identifier**: Email address or username (required)
    - **password**: Account password (required)
    
    Returns user information including user_id, email, name, and username.
    """
    # Support both old (email) and new (identifier) fields for backward compatibility
    identifier = (request.identifier or request.email or "").lower().strip()
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or username is required")
    
    password = request.password.strip()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if identifier is email or username
    c.execute("""
        SELECT id, full_name, password_hash, email, username, phone 
        FROM users 
        WHERE email = %s OR username = %s
    """, (identifier, identifier))
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(password, result['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "status": "success",
        "user_id": result['id'],
        "email": result['email'],
        "name": result['full_name'],
        "username": result['username'],
        "phone": result['phone']
    }


@router.get("/me", summary="Get Current User Info", response_model=UserDetailResponse)
def get_current_user(user_id: str):
    """
    Get current user's detailed information.
    
    - **user_id**: User ID (query parameter, required)
    
    Returns detailed user info including balance, phone, and username.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    c.execute("SELECT id, email, full_name, phone, balance, username FROM users WHERE id = %s", (user_id,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": result['id'],
        "email": result['email'],
        "name": result['full_name'],
        "phone": result['phone'],
        "balance": result['balance'],
        "username": result['username']
    }


@router.post("/send-reset-otp", summary="Send OTP for Password Reset", response_model=OTPSentResponse)
def send_reset_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """
    Send OTP code to email for password reset.
    
    - **email**: Registered email address
    
    Returns OTP sent confirmation.
    """
    email = request.email.lower().strip()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if user exists
    c.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate OTP
    otp = generate_otp()
    # Save expires_at as naive datetime in Vietnam timezone
    expires_at = (get_vietnam_time() + timedelta(minutes=10)).replace(tzinfo=None)
    
    # Save OTP
    c.execute("""
        INSERT INTO otp_codes (email, code, expires_at)
        VALUES (%s, %s, %s)
    """, (email, otp, expires_at))
    
    conn.commit()
    conn.close()
    
    # Email HTML
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Password Reset OTP</h2>
            <p>Your OTP code is: <strong style="font-size:24px;">{otp}</strong></p>
            <p>This code expires in 10 minutes.</p>
        </body>
    </html>
    """
    
    background_tasks.add_task(send_email, email, "Password Reset OTP", html_body)
    
    return {"status": "success", "message": "OTP sent to email", "email": email}


@router.post("/reset-password", summary="Reset Password with OTP", response_model=StatusResponse)
def reset_password(request: ResetPasswordRequest):
    """
    Reset password using OTP verification.
    
    - **email**: User's email address
    - **otp_code**: 6-digit OTP code received via email
    - **new_password**: New password (minimum 6 characters)
    
    Returns success status message.
    """
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()
    
    conn = get_db()
    c = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Verify OTP and check expiration in one query (compare with Vietnam time)
    c.execute("""
        SELECT code, expires_at, 
               CASE WHEN expires_at > (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN TRUE ELSE FALSE END as is_valid
        FROM otp_codes 
        WHERE email = %s AND code = %s AND verified = FALSE
        ORDER BY created_at DESC LIMIT 1
    """, (email, otp_code))
    
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if not result['is_valid']:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Update password
    new_hash = hash_password(request.new_password)
    c.execute("UPDATE users SET password_hash = %s WHERE email = %s", (new_hash, email))
    
    # Mark OTP as verified
    c.execute("UPDATE otp_codes SET verified = TRUE WHERE email = %s AND code = %s", (email, otp_code))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Password reset successfully"}
