from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import sqlite3
import os
import secrets
import hashlib
import requests
import random
import threading
from datetime import datetime, timedelta
import pytz
import uuid
from typing import List, Optional
import re
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ============= CONFIGURATION =============
load_dotenv()  # Load from .env file if it exists

# Timezone configuration
VIETNAM_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

def get_vietnam_time():
    """Get current time in Vietnam timezone"""
    return datetime.now(VIETNAM_TZ)

# Simple SMTP-based email configuration (no domain auth required)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))  # 587 for TLS, 465 for SSL
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER or "")

DATABASE = "cafe_orders.db"

# ============= DATABASE SETUP =============
def init_db():
    """Initialize SQLite database from schema.sql"""
    conn = sqlite3.connect(DATABASE)
    
    try:
        # Load and execute schema.sql
        with open("schema.sql", "r") as f:
            schema = f.read()
        conn.executescript(schema)
        conn.commit()
        print(f"✅ Database initialized from schema.sql")
    except FileNotFoundError:
        print("⚠️  schema.sql not found, creating tables manually...")
        # Fallback to manual table creation
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            verified BOOLEAN DEFAULT 0
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            special_notes TEXT,
            promo_code TEXT,
            discount REAL DEFAULT 0,
            payment_method TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS promo_codes (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            discount_percent REAL NOT NULL,
            max_uses INTEGER,
            used_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        conn.commit()
    finally:
        conn.close()

init_db()

# ============= MODELS =============
class OTPRequest(BaseModel):
    email: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    full_name: str
    phone: str
    password: str = None  # Optional - for registration
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456",
                "full_name": "John Doe",
                "phone": "0123456789",
                "password": "password123"
            }
        }

class LoginRequest(BaseModel):
    email: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "otp_code": "123456",
                "new_password": "newpassword123"
            }
        }

class CheckoutRequest(BaseModel):
    user_id: str
    items: List[dict]
    customer_name: str
    customer_phone: str
    customer_email: str
    payment_method: str
    delivery_district: Optional[str] = ""
    delivery_ward: Optional[str] = ""
    delivery_street: Optional[str] = ""
    special_notes: Optional[str] = ""
    promo_code: Optional[str] = ""
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "items": [
                    {
                        "id": "cf_1",
                        "name": "Espresso",
                        "price": 25000,
                        "quantity": 2,
                        "size": "L",
                        "milks": ["nut", "condensed"],
                        "sugar": "75"
                    }
                ],
                "customer_name": "John Doe",
                "customer_phone": "0123456789",
                "customer_email": "john@example.com",
                "payment_method": "balance",
                "delivery_district": "Quận 1",
                "delivery_ward": "Phường Bến Nghé",
                "delivery_street": "123 Nguyễn Huệ",
                "special_notes": "Less sugar",
                "promo_code": "COFFEE20"
            }
        }

class PromoCodeRequest(BaseModel):
    code: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "COFFEE20"
            }
        }

class FavoriteRequest(BaseModel):
    user_id: str
    product_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "product_id": "cf_1"
            }
        }

class PaymentOTPRequest(BaseModel):
    user_id: str
    order_id: str
    amount: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "order_id": "ORD12345",
                "amount": 50000
            }
        }

class VerifyPaymentOTPRequest(BaseModel):
    user_id: str
    order_id: str
    otp_code: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "order_id": "ORD12345",
                "otp_code": "123456"
            }
        }

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    size: str = "M"
    milks: Optional[List[str]] = []
    sugar: Optional[str] = "100"
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "cf_1",
                "name": "Espresso",
                "price": 25000,
                "quantity": 2,
                "size": "L",
                "milks": ["nut"],
                "sugar": "75"
            }
        }

class AddToCartRequest(BaseModel):
    user_id: str
    item: CartItem

class ChangeEmailRequest(BaseModel):
    user_id: str
    new_email: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "new_email": "newemail@example.com",
                "password": "password123"
            }
        }

class ChangePhoneRequest(BaseModel):
    user_id: str
    new_phone: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "new_phone": "0987654321",
                "password": "password123"
            }
        }

class ChangePasswordRequest(BaseModel):
    user_id: str
    current_password: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1",
                "current_password": "oldpassword123",
                "new_password": "newpassword123"
            }
        }

class OrderActionRequest(BaseModel):
    user_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "1"
            }
        }

# ============= MENU DATA =============
MENU_PRODUCTS = {
    "coffee": [
        {"id": "cf_1", "name": "Espresso", "category": "Coffee", "price": 25000, "icon": "☕"},
        {"id": "cf_2", "name": "Americano", "category": "Coffee", "price": 30000, "icon": "☕"},
        {"id": "cf_3", "name": "Cappuccino", "category": "Coffee", "price": 40000, "icon": "☕"},
        {"id": "cf_4", "name": "Latte", "category": "Coffee", "price": 40000, "icon": "☕"},
        {"id": "cf_5", "name": "Cold Brew", "category": "Coffee", "price": 35000, "icon": "☕"},
    ],
    "tea": [
        {"id": "t_1", "name": "Green Tea", "category": "Tea", "price": 25000, "icon": "🍵"},
        {"id": "t_2", "name": "Black Tea", "category": "Tea", "price": 25000, "icon": "🍵"},
        {"id": "t_3", "name": "Oolong Tea", "category": "Tea", "price": 30000, "icon": "🍵"},
    ],
    "juice": [
        {"id": "j_1", "name": "Orange Juice", "category": "Juice", "price": 30000, "icon": "🧃"},
        {"id": "j_2", "name": "Apple Juice", "category": "Juice", "price": 30000, "icon": "🧃"},
        {"id": "j_3", "name": "Mango Smoothie", "category": "Juice", "price": 35000, "icon": "🧃"},
    ],
    "food": [
        {"id": "f_1", "name": "Croissant", "category": "Food", "price": 25000, "icon": "🥐"},
        {"id": "f_2", "name": "Chocolate Cake", "category": "Food", "price": 40000, "icon": "🍰"},
        {"id": "f_3", "name": "Sandwich", "category": "Food", "price": 35000, "icon": "🥪"},
    ],
}

# ============= UTILITY FUNCTIONS =============
def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password"""
    return hash_password(password) == password_hash

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send email via generic SMTP server.

    This uses simple username/password SMTP (e.g. Gmail SMTP with App Password,
    Mailtrap, Outlook, or any other provider) and does NOT require
    domain authentication like SendGrid.

    Required .env variables:
      - SMTP_HOST
      - SMTP_PORT (default 587)
      - SMTP_USER
      - SMTP_PASSWORD
      - SMTP_FROM_EMAIL (optional, falls back to SMTP_USER)
    """
    # If SMTP is not configured, just log to console so you can still test OTP.
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP not configured. Would send email:")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        # For testing, also print a short version of the body (OTP will be inside)
        preview = html_body.replace("\n", " ")
        if len(preview) > 200:
            preview = preview[:200] + "..."
        print(f"   Body preview: {preview}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email

        # Only HTML part (you can add plain text if needed)
        part_html = MIMEText(html_body, "html")
        msg.attach(part_html)

        # Use SSL for Gmail (port 465) or TLS for others (port 587)
        if SMTP_PORT == 465:
            # Gmail with SSL
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        else:
            # Other SMTP with STARTTLS
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error (SMTP): {e}")
        import traceback
        traceback.print_exc()
        return False

def get_user_from_token(token: str) -> Optional[dict]:
    """Get user from JWT token (simplified - just user_id)"""
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("SELECT id, email, full_name FROM users WHERE id = ?", (token,))
        user = c.fetchone()
        conn.close()
        if user:
            return {"id": user[0], "email": user[1], "name": user[2]}
        return None
    except:
        return None

# ============= FASTAPI APP =============
app = FastAPI(
    title="Cafe Ordering System API",
    version="2.0.0",
    description="""
    ## Highlands Coffee Ordering System
    
    Complete API for cafe ordering with features:
    * **Authentication** - OTP-based registration and login
    * **Menu Management** - Browse products and categories
    * **Favorites** - Save favorite items
    * **Cart & Checkout** - Place orders with multiple payment methods
    * **Payment System** - Wallet balance with OTP verification
    * **Promo Codes** - Apply discounts to orders
    * **Order Management** - Track and update order status
    
    ### 🔄 Complete Order Flow (Step by Step)
    
    #### 1️⃣ Register New Account
    - **POST** `/api/auth/send-otp`
      - Body: `{"email": "user@example.com"}`
      - Response: OTP sent to email
    
    - **POST** `/api/auth/verify-otp`
      - Body: `{"email": "user@example.com", "otp_code": "123456", "full_name": "John Doe", "phone": "0123456789", "password": "yourpassword"}`
      - Response: Get `user_id` (save this!)
    
    #### 2️⃣ Login Existing User
    - **POST** `/api/auth/login`
      - Body: `{"email": "user@example.com", "password": "yourpassword"}`
      - Response: Get `user_id`
    
    #### 3️⃣ Get User Info (Check Balance)
    - **GET** `/api/auth/me?user_id={user_id}`
      - Response: User details + current balance
    
    #### 4️⃣ Browse Menu
    - **GET** `/api/menu` → Get all products
    - **GET** `/api/menu/search?q=coffee` → Search products
    - **GET** `/api/menu/{category}` → Get by category
    
    #### 5️⃣ Add Items to Cart
    - **POST** `/api/cart/add`
      - Body: `{"user_id": "ABC12345", "item": {"id": "cf_1", "name": "Espresso", "price": 25000, "quantity": 1, "size": "M"}}`
      - Repeat for each item you want
    
    - **GET** `/api/cart?user_id={user_id}` → View cart items
    
    #### 6️⃣ Checkout (Create Order)
    - **POST** `/api/checkout`
      - Body: Include `user_id`, `items` array, customer details, payment method
      - Response: Get `order_id` and `total` amount
    
    #### 7️⃣ Payment with OTP
    - **POST** `/api/payment/send-otp`
      - Body: `{"user_id": "ABC12345", "order_id": "E050F91B", "amount": 50000}`
      - Check your email for 6-digit OTP
    
    - **POST** `/api/payment/verify-otp`
      - Body: `{"user_id": "ABC12345", "order_id": "E050F91B", "otp_code": "123456"}`
      - Payment completed! Balance deducted
    
    #### 8️⃣ View Orders
    - **GET** `/api/orders?user_id={user_id}` → Order history
    - **GET** `/api/orders/{order_id}` → Order details
    
    7. **View Orders**
       - GET `/api/orders?user_id={user_id}` → Order history
    
    ### ⚠️ Important Notes
    - Cart management is handled by frontend (localStorage)
    - Always use `user_id` from login/register response
    - Payment requires wallet balance (default: ₫1,000,000)
    - OTP expires in 10 minutes
    
    ### 📧 Email Configuration
    - SMTP Host: Gmail (smtp.gmail.com:465)
    - Default Balance: ₫1,000,000
    """,
    contact={
        "name": "Cafe Ordering System",
        "email": "huynhnhattien0411@gmail.com",
    },
    license_info={
        "name": "MIT",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= HEALTH CHECK =============
@app.get("/api/health", tags=["Health"], summary="Health Check")
def health_check():
    """Check if the API server is running"""
    return {"status": "ok", "message": "Server running v2"}

# ============= AUTHENTICATION ENDPOINTS =============
@app.post("/api/auth/send-otp", tags=["1️⃣ Authentication"], summary="Send OTP for Registration")
def send_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """
    **Step 1: Send OTP to email for registration**
    
    Example Request:
    ```json
    {
        "email": "user@example.com"
    }
    ```
    
    Response: OTP sent to email (check inbox, valid for 10 minutes)
    """
    email = request.email.lower().strip()
    
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check if user exists
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = c.fetchone()
    
    # Generate OTP
    otp = generate_otp()
    expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
    
    # Save OTP
    c.execute("""
        INSERT INTO otp_codes (email, code, expires_at)
        VALUES (?, ?, ?)
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
    
    # Send email in background (non-blocking)
    background_tasks.add_task(send_email, email, "Your Cafe Ordering OTP Code", html_body)
    
    return {
        "status": "success",
        "message": "OTP sent to email",
        "email": email,
        "note": "For demo: OTP is shown in console logs"
    }

@app.post("/api/auth/verify-otp", tags=["1️⃣ Authentication"], summary="Verify OTP and Complete Registration")
def verify_otp(request: VerifyOTPRequest):
    """
    **Step 2: Verify OTP and complete registration**
    
    Example Request:
    ```json
    {
        "email": "user@example.com",
        "otp_code": "123456",
        "full_name": "John Doe",
        "phone": "0123456789",
        "password": "your_secure_password"
    }
    ```
    
    Response: Returns `user_id` - **SAVE THIS** for all subsequent API calls!
    """
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check OTP validity
    c.execute("""
        SELECT code, expires_at FROM otp_codes 
        WHERE email = ? AND code = ? AND verified = 0
        ORDER BY created_at DESC LIMIT 1
    """, (email, otp_code))
    
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    expires_at = datetime.fromisoformat(result[1])
    if datetime.now() > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Check if user exists
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = c.fetchone()
    
    if existing:
        user_id = existing[0]
    else:
        # Create new user with auto-increment ID
        # Get max user_id and increment
        c.execute("SELECT MAX(CAST(id AS INTEGER)) FROM users WHERE id GLOB '[0-9]*'")
        max_id = c.fetchone()[0]
        user_id = str((max_id or 0) + 1)
        
        # Use provided password or generate random one
        password_hash = hash_password(request.password) if request.password else hash_password(secrets.token_hex(16))
        c.execute("""
            INSERT INTO users (id, email, full_name, phone, password_hash)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, email, request.full_name, request.phone, password_hash))
    
    # Mark OTP as verified
    c.execute("UPDATE otp_codes SET verified = 1 WHERE email = ? AND code = ?", (email, otp_code))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "User registered/verified",
        "user_id": user_id,
        "email": email,
        "name": request.full_name
    }

@app.post("/api/auth/login", tags=["1️⃣ Authentication"], summary="Login with Email and Password")
def login(request: LoginRequest):
    """Login with email and password"""
    email = request.email.lower().strip()
    password = request.password.strip()  # Add strip to password too
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("SELECT id, full_name, password_hash FROM users WHERE email = ?", (email,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Debug logging
    provided_hash = hash_password(password)
    stored_hash = result[2]
    print(f"🔐 Login attempt for {email}")
    print(f"   Provided password hash: {provided_hash}")
    print(f"   Stored password hash:   {stored_hash}")
    print(f"   Match: {provided_hash == stored_hash}")
    
    if not verify_password(password, result[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "status": "success",
        "user_id": result[0],
        "email": email,
        "name": result[1]
    }

@app.get("/api/auth/me", tags=["1️⃣ Authentication"], summary="Get Current User Info")
def get_current_user(user_id: str):
    """Get current user information by user_id"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("SELECT id, email, full_name, phone, balance FROM users WHERE id = ?", (user_id,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": result[0],
        "email": result[1],
        "name": result[2],
        "phone": result[3],
        "balance": result[4]
    }

@app.post("/api/user/change-email", tags=["6️⃣ User Profile"], summary="Change User Email")
def change_email(request: ChangeEmailRequest):
    """Change user email address with password verification"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Verify current password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_hash = result[0]
    provided_hash = hashlib.sha256(request.password.encode()).hexdigest()
    if provided_hash != stored_hash:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Check if new email already exists
    new_email = request.new_email.lower().strip()
    c.execute("SELECT id FROM users WHERE email = ? AND id != ?", (new_email, request.user_id))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update email
    c.execute("UPDATE users SET email = ? WHERE id = ?", (new_email, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Email updated successfully", "new_email": new_email}

@app.post("/api/user/change-phone", tags=["6️⃣ User Profile"], summary="Change User Phone")
def change_phone(request: ChangePhoneRequest):
    """Change user phone number with password verification"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Verify current password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_hash = result[0]
    provided_hash = hashlib.sha256(request.password.encode()).hexdigest()
    if provided_hash != stored_hash:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid password")
    
    # Update phone
    c.execute("UPDATE users SET phone = ? WHERE id = ?", (request.new_phone, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Phone number updated successfully", "new_phone": request.new_phone}

@app.post("/api/user/change-password", tags=["6️⃣ User Profile"], summary="Change User Password")
def change_password(request: ChangePasswordRequest):
    """Change user password with current password verification"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Verify current password
    c.execute("SELECT password_hash FROM users WHERE id = ?", (request.user_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    stored_hash = result[0]
    provided_hash = hashlib.sha256(request.current_password.encode()).hexdigest()
    if provided_hash != stored_hash:
        conn.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash new password
    new_hash = hashlib.sha256(request.new_password.encode()).hexdigest()
    
    # Update password
    c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, request.user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Password changed successfully"}

@app.post("/api/auth/send-reset-otp", tags=["1️⃣ Authentication"], summary="Send OTP for Password Reset")
def send_reset_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """Send OTP for password reset"""
    email = request.email.lower().strip()
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check if user exists
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing = c.fetchone()
    
    if not existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email not found")
    
    # Generate OTP
    otp = generate_otp()
    expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()
    
    # Save OTP (reuse otp_codes table)
    c.execute("""
        INSERT INTO otp_codes (email, code, expires_at)
        VALUES (?, ?, ?)
    """, (email, otp, expires_at))
    
    conn.commit()
    conn.close()
    
    # Prepare email HTML
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-inline-size: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #006241; text-align: center;">Password Reset</h2>
                <p style="color: #333; font-size: 16px;">Your OTP code for password reset is:</p>
                <h1 style="color: #006241; text-align: center; font-size: 48px; letter-spacing: 10px; margin: 30px 0;">{otp}</h1>
                <p style="color: #999; font-size: 14px; text-align: center;">This code expires in 10 minutes.</p>
            </div>
        </body>
    </html>
    """
    
    # Send email in background (non-blocking)
    background_tasks.add_task(send_email, email, "Password Reset OTP Code", html_body)
    
    return {
        "status": "success",
        "message": "OTP sent to email",
        "email": email
    }

@app.post("/api/auth/reset-password", tags=["1️⃣ Authentication"], summary="Reset Password with OTP")
def reset_password(request: ResetPasswordRequest):
    """Reset password using OTP"""
    email = request.email.lower().strip()
    otp_code = request.otp_code.strip()
    new_password = request.new_password
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check OTP validity
    c.execute("""
        SELECT code, expires_at FROM otp_codes 
        WHERE email = ? AND code = ? AND verified = 0
        ORDER BY created_at DESC LIMIT 1
    """, (email, otp_code))
    
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    expires_at = datetime.fromisoformat(result[1])
    if datetime.now() > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Update password
    password_hash = hash_password(new_password)
    c.execute("""
        UPDATE users SET password_hash = ? WHERE email = ?
    """, (password_hash, email))
    
    # Mark OTP as verified
    c.execute("UPDATE otp_codes SET verified = 1 WHERE email = ? AND code = ?", (email, otp_code))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Password reset successfully"
    }

# ============= MENU ENDPOINTS =============
@app.get("/api/menu", tags=["2️⃣ Menu"], summary="Get All Menu Items")
def get_menu():
    """Get all menu items"""
    all_items = []
    for category_items in MENU_PRODUCTS.values():
        all_items.extend(category_items)
    return {"items": all_items}

@app.get("/api/menu/search", tags=["2️⃣ Menu"], summary="Search Menu Items")
def search_menu(q: str):
    """Search menu items by name"""
    query = q.lower().strip()
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")
    
    results = []
    for category_items in MENU_PRODUCTS.values():
        for item in category_items:
            if query in item["name"].lower():
                results.append(item)
    
    return {"query": q, "results": results}

@app.get("/api/menu/{category}", tags=["2️⃣ Menu"], summary="Get Menu Items by Category")
def get_category(category: str):
    """Get items by category"""
    category_lower = category.lower()
    if category_lower not in MENU_PRODUCTS:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"category": category, "items": MENU_PRODUCTS[category_lower]}

# ============= PROMO CODE ENDPOINTS =============
@app.post("/api/promo/validate", tags=["3️⃣ Checkout & Promo"], summary="Validate Promo Code")
def validate_promo(request: PromoCodeRequest, user_id: Optional[str] = None):
    """Validate promo code"""
    code = request.code.upper().strip()
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT id, discount_percent, max_uses, used_count, expires_at
        FROM promo_codes
        WHERE code = ?
    """, (code,))
    
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Promo code not found")
    
    promo_id, discount, max_uses, used_count, expires_at = result
    
    # Check if expired
    if expires_at:
        if datetime.fromisoformat(expires_at) < datetime.now():
            raise HTTPException(status_code=400, detail="Promo code expired")
    
    # Check if max uses exceeded
    if max_uses and used_count >= max_uses:
        raise HTTPException(status_code=400, detail="Promo code max uses exceeded")
    
    return {
        "status": "valid",
        "code": code,
        "discount_percent": discount,
        "message": f"{discount}% discount applied"
    }

# ============= FAVORITES ENDPOINTS =============
@app.post("/api/favorites/add", tags=["7️⃣ Favorites"], summary="Add Item to Favorites")
def add_favorite(request: FavoriteRequest):
    """Add product to favorites"""
    if not request.user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify product exists
    product_found = False
    for category_items in MENU_PRODUCTS.values():
        if any(item["id"] == request.product_id for item in category_items):
            product_found = True
            break
    
    if not product_found:
        raise HTTPException(status_code=404, detail="Product not found")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    try:
        c.execute("""
            INSERT INTO favorites (user_id, product_id)
            VALUES (?, ?)
        """, (request.user_id, request.product_id))
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # Already favorited
    
    conn.close()
    
    return {"status": "success", "message": "Added to favorites"}

@app.delete("/api/favorites/{product_id}", tags=["7️⃣ Favorites"], summary="Remove Item from Favorites")
def remove_favorite(product_id: str, user_id: str):
    """Remove product from favorites"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", (user_id, product_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Removed from favorites"}

@app.get("/api/favorites", tags=["7️⃣ Favorites"], summary="Get User's Favorite Items")
def get_favorites(user_id: str):
    """Get user's favorite products"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT product_id FROM favorites WHERE user_id = ? ORDER BY added_at DESC", (user_id,))
    favorites = c.fetchall()
    conn.close()
    
    # Get product details
    favorite_items = []
    for fav in favorites:
        product_id = fav[0]
        for category_items in MENU_PRODUCTS.values():
            for item in category_items:
                if item["id"] == product_id:
                    favorite_items.append(item)
                    break
    
    return {"favorites": favorite_items}

# ============= CART ENDPOINTS =============
@app.post("/api/cart/add", tags=["8️⃣ Cart (Optional)"], summary="Add Item to Cart")
def add_to_cart(request: AddToCartRequest):
    """
    Add item to cart (for API testing)
    
    **Example Request:**
    ```json
    {
        "user_id": "ABC12345",
        "item": {
            "id": "cf_1",
            "name": "Espresso",
            "price": 25000,
            "quantity": 1,
            "size": "M"
        }
    }
    ```
    """
    if not request.user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check if item already in cart
    c.execute("""
        SELECT id, quantity FROM cart 
        WHERE user_id = ? AND product_id = ? AND size = ?
    """, (request.user_id, request.item.id, request.item.size))
    
    existing = c.fetchone()
    
    if existing:
        # Update quantity
        new_quantity = existing[1] + request.item.quantity
        c.execute("UPDATE cart SET quantity = ? WHERE id = ?", (new_quantity, existing[0]))
    else:
        # Insert new item
        c.execute("""
            INSERT INTO cart (user_id, product_id, product_name, price, quantity, size)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (request.user_id, request.item.id, request.item.name, 
              request.item.price, request.item.quantity, request.item.size))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Item added to cart"}

@app.get("/api/cart", tags=["8️⃣ Cart (Optional)"], summary="Get Cart Items")
def get_cart(user_id: str):
    """Get all items in user's cart"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT product_id, product_name, price, quantity, size
        FROM cart
        WHERE user_id = ?
        ORDER BY added_at DESC
    """, (user_id,))
    
    items = c.fetchall()
    conn.close()
    
    cart_items = []
    for item in items:
        cart_items.append({
            "id": item[0],
            "name": item[1],
            "price": item[2],
            "quantity": item[3],
            "size": item[4]
        })
    
    return {"cart": cart_items}

@app.delete("/api/cart/clear", tags=["8️⃣ Cart (Optional)"], summary="Clear Cart")
def clear_cart(user_id: str):
    """Clear all items from cart"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM cart WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Cart cleared"}

@app.delete("/api/cart/{product_id}", tags=["8️⃣ Cart (Optional)"], summary="Remove Item from Cart")
def remove_from_cart(product_id: str, user_id: str, size: str = "M"):
    """Remove specific item from cart"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM cart WHERE user_id = ? AND product_id = ? AND size = ?", 
              (user_id, product_id, size))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Item removed from cart"}

# ============= ORDER ENDPOINTS =============
@app.post("/api/checkout", tags=["3️⃣ Checkout & Promo"], summary="Create Order (Checkout)")
def checkout(request: CheckoutRequest):
    """
    Create new order from cart items
    
    **Example Request:**
    ```json
    {
        "user_id": "ABC12345",
        "items": [
            {
                "id": "cf_1",
                "name": "Espresso",
                "price": 25000,
                "quantity": 2,
                "size": "M"
            },
            {
                "id": "cf_2",
                "name": "Americano",
                "price": 30000,
                "quantity": 1,
                "size": "L"
            }
        ],
        "customer_name": "John Doe",
        "customer_phone": "0123456789",
        "customer_email": "john@example.com",
        "payment_method": "balance",
        "special_notes": "Less sugar",
        "promo_code": ""
    }
    ```
    
    **Response:** Returns `order_id` and `total` for payment
    """
    if not request.items or len(request.items) == 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    user_id = request.user_id
    
    # Calculate total
    total = 0
    for item in request.items:
        price = item.get("price", 0)
        quantity = item.get("quantity", 1)
        size = item.get("size", "M")
        milks = item.get("milks", [])
        
        # Size multiplier
        size_multiplier = {"S": 0.9, "M": 1.0, "L": 1.1}.get(size, 1.0)
        
        # Milk price (5000 per milk type)
        milk_price = len(milks) * 5000 if isinstance(milks, list) else 0
        
        total += (price * size_multiplier + milk_price) * quantity
    
    discount = 0
    promo_code = request.promo_code.upper().strip() if request.promo_code else None
    
    # Validate and apply promo code
    if promo_code:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute("""
            SELECT id, discount_percent, max_uses, used_count, expires_at
            FROM promo_codes
            WHERE code = ?
        """, (promo_code,))
        
        result = c.fetchone()
        
        if result:
            promo_id, discount_percent, max_uses, used_count, expires_at = result
            
            # Check validity
            valid = True
            if expires_at and datetime.fromisoformat(expires_at) < datetime.now():
                valid = False
            if max_uses and used_count >= max_uses:
                valid = False
            
            if valid:
                discount = total * (discount_percent / 100)
                # Update promo code usage
                c.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?", (promo_id,))
        
        conn.commit()
        conn.close()
    
    final_total = total - discount
    
    # Create order
    order_id = str(uuid.uuid4())[:8].upper()
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    import json
    items_json = json.dumps(request.items)
    created_at = get_vietnam_time().isoformat()
    
    c.execute("""
        INSERT INTO orders
        (id, user_id, items, total, special_notes, promo_code, discount, payment_method, customer_name, customer_phone, delivery_district, delivery_ward, delivery_street, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        user_id,
        items_json,
        final_total,
        request.special_notes,
        promo_code,
        discount,
        request.payment_method,
        request.customer_name,
        request.customer_phone,
        request.delivery_district,
        request.delivery_ward,
        request.delivery_street,
        "pending_payment",  # Change to pending_payment instead of pending
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

@app.get("/api/orders", tags=["5️⃣ Orders & History"], summary="Get User's Order History")
def get_orders(user_id: str):
    """Get user's order history"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT id, items, total, status, special_notes, promo_code, discount, payment_method, customer_name, created_at, payment_time, delivery_district, delivery_ward, delivery_street
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    orders = c.fetchall()
    conn.close()
    
    import json
    result = []
    for order in orders:
        result.append({
            "id": order[0],
            "items": json.loads(order[1]),
            "total": order[2],
            "status": order[3],
            "special_notes": order[4],
            "promo_code": order[5],
            "discount": order[6],
            "payment_method": order[7],
            "customer_name": order[8],
            "created_at": order[9],
            "payment_time": order[10],
            "delivery_district": order[11],
            "delivery_ward": order[12],
            "delivery_street": order[13]
        })
    
    return {"orders": result}

@app.get("/api/orders/{order_id}", tags=["Orders"], summary="Get Order Details by ID")
def get_order_detail(order_id: str, user_id: Optional[str] = None):
    """Get order details"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT id, user_id, items, total, status, special_notes, promo_code, discount, payment_method, customer_name, created_at, payment_time
        FROM orders
        WHERE id = ?
    """, (order_id,))
    
    order = c.fetchone()
    conn.close()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    import json
    return {
        "id": order[0],
        "user_id": order[1],
        "items": json.loads(order[2]),
        "total": order[3],
        "status": order[4],
        "special_notes": order[5],
        "promo_code": order[6],
        "discount": order[7],
        "payment_method": order[8],
        "customer_name": order[9],
        "created_at": order[10],
        "payment_time": order[11]
    }

@app.post("/api/orders/{order_id}/cancel", tags=["5️⃣ Orders & History"], summary="Cancel Order and Refund")
def cancel_order(order_id: str, request: OrderActionRequest):
    """Cancel order and refund to user balance"""
    user_id = request.user_id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Get order details
    c.execute("SELECT user_id, total, status FROM orders WHERE id = ?", (order_id,))
    order = c.fetchone()
    
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order[0] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    if order[2] in ['completed', 'cancelled']:
        conn.close()
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    # Refund to balance
    refund_amount = order[1]
    c.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (refund_amount, user_id))
    
    # Update order status
    c.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (order_id,))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Order cancelled and refunded",
        "refund_amount": refund_amount
    }

@app.post("/api/orders/{order_id}/received", tags=["5️⃣ Orders & History"], summary="Mark Order as Received")
def mark_order_received(order_id: str, request: OrderActionRequest):
    """Mark order as completed/received by customer"""
    user_id = request.user_id
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Get order details
    c.execute("SELECT user_id, status FROM orders WHERE id = ?", (order_id,))
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
    
    # Update order status to completed
    c.execute("UPDATE orders SET status = 'completed' WHERE id = ?", (order_id,))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Order marked as completed"
    }

@app.put("/api/orders/{order_id}/status", tags=["Orders"], summary="Update Order Status")
def update_order_status(order_id: str, status: str = None):
    """Update order status (for admin)"""
    # Accept both query parameter and path parameter
    if status is None:
        status = status or "pending"
    
    valid_statuses = ["pending", "preparing", "ready", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "order_id": order_id, "new_status": status}

# ============= PAYMENT WITH OTP =============
@app.post("/api/payment/send-otp", tags=["Payment"], summary="Send OTP for Payment Confirmation")
def send_payment_otp(request: PaymentOTPRequest):
    """Send OTP for payment confirmation"""
    # Get user email
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT email, balance FROM users WHERE id = ?", (request.user_id,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    email, balance = user
    
    # Check if user has enough balance
    if balance < request.amount:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Current balance: ₫{balance:,.0f}")
    
    # Generate OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=10)
    
    # Save OTP to database
    c.execute("""
        INSERT INTO payment_otp (user_id, order_id, code, amount, expires_at)
        VALUES (?, ?, ?, ?, ?)
    """, (request.user_id, request.order_id, otp_code, request.amount, expires_at))
    
    conn.commit()
    conn.close()
    
    # Send OTP email
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #c41e3a;">Payment Confirmation</h2>
                <p>Your OTP code for payment confirmation:</p>
                
                <div style="background: linear-gradient(135deg, #c41e3a 0%, #a01729 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                    <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px;">{otp_code}</h1>
                </div>
                
                <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #c41e3a; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> {request.order_id}</p>
                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₫{request.amount:,.0f}</p>
                    <p style="margin: 5px 0;"><strong>Current Balance:</strong> ₫{balance:,.0f}</p>
                    <p style="margin: 5px 0;"><strong>Balance After:</strong> ₫{(balance - request.amount):,.0f}</p>
                </div>
                
                <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
        </body>
    </html>
    """
    
    # Send email asynchronously
    email_thread = threading.Thread(
        target=send_email,
        args=(email, f"Payment OTP: {otp_code}", html_body)
    )
    email_thread.start()
    
    return {"status": "success", "message": "OTP sent to your email"}

@app.post("/api/payment/verify-otp", tags=["Payment"], summary="Verify OTP and Complete Payment")
def verify_payment_otp(request: VerifyPaymentOTPRequest):
    """Verify OTP and complete payment"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Check OTP
    c.execute("""
        SELECT id, amount, expires_at, verified
        FROM payment_otp
        WHERE user_id = ? AND order_id = ? AND code = ?
        ORDER BY created_at DESC
        LIMIT 1
    """, (request.user_id, request.order_id, request.otp_code))
    
    otp_record = c.fetchone()
    
    if not otp_record:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    otp_id, amount, expires_at_str, verified = otp_record
    
    if verified:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP already used")
    
    expires_at = datetime.fromisoformat(expires_at_str)
    if datetime.now() > expires_at:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Get user balance
    c.execute("SELECT balance, email, full_name FROM users WHERE id = ?", (request.user_id,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    balance, email, full_name = user
    
    if balance < amount:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Deduct balance
    new_balance = balance - amount
    c.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, request.user_id))
    
    # Mark OTP as verified
    c.execute("UPDATE payment_otp SET verified = 1 WHERE id = ?", (otp_id,))
    
    # Update order status and payment time (Vietnam timezone)
    payment_time = get_vietnam_time().isoformat()
    c.execute("UPDATE orders SET status = 'confirmed', payment_time = ? WHERE id = ?", (payment_time, request.order_id,))
    
    # Get order details for confirmation email
    c.execute("SELECT total, special_notes FROM orders WHERE id = ?", (request.order_id,))
    order = c.fetchone()
    total, special_notes = order if order else (amount, "")
    
    conn.commit()
    conn.close()
    
    # Send confirmation email
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #c41e3a;">✅ Payment Successful!</h2>
                <p>Hi <strong>{full_name}</strong>,</p>
                <p>Your payment has been confirmed and your order is being prepared!</p>
                
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Order ID:</strong> {request.order_id}</p>
                    <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ₫{amount:,.0f}</p>
                    <p style="margin: 8px 0;"><strong>Remaining Balance:</strong> ₫{new_balance:,.0f}</p>
                    {f'<p style="margin: 8px 0;"><strong>Notes:</strong> {special_notes}</p>' if special_notes else ''}
                </div>
                
                <p style="color: #666; font-size: 14px;">We'll prepare your order and notify you when it's ready!</p>
                <p style="color: #999; font-size: 12px;">Estimated time: 15-20 minutes</p>
            </div>
        </body>
    </html>
    """
    
    send_email(email, "Payment Confirmed - Order in Progress", html_body)
    
    return {
        "status": "success",
        "message": "Payment successful",
        "new_balance": new_balance,
        "order_id": request.order_id
    }

@app.get("/api/user/balance", tags=["User"], summary="Get User Balance")
def get_user_balance(user_id: str):
    """Get user's current balance"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"balance": result[0]}

# ============= STATIC FILES =============
@app.get("/")
def serve_home():
    """Serve home page"""
    return FileResponse("order_frontend_v2.html", media_type="text/html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
