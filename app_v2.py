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
from datetime import datetime, timedelta
import uuid
from typing import List, Optional
import re
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ============= CONFIGURATION =============
load_dotenv()  # Load from .env file if it exists

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

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    full_name: str
    phone: str
    password: str = None  # Optional - for registration

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

class CheckoutRequest(BaseModel):
    items: List[dict]
    customer_name: str
    customer_phone: str
    payment_method: str
    special_notes: Optional[str] = ""
    promo_code: Optional[str] = ""

class PromoCodeRequest(BaseModel):
    code: str

class FavoriteRequest(BaseModel):
    product_id: str

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
app = FastAPI(title="Cafe Ordering System v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= HEALTH CHECK =============
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Server running v2"}

# ============= AUTHENTICATION ENDPOINTS =============
@app.post("/api/auth/send-otp")
def send_otp(request: OTPRequest, background_tasks: BackgroundTasks):
    """Send OTP to email"""
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

@app.post("/api/auth/verify-otp")
def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and register user"""
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
        # Create new user
        user_id = str(uuid.uuid4())[:8].upper()
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

@app.post("/api/auth/login")
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

@app.post("/api/auth/send-reset-otp")
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

@app.post("/api/auth/reset-password")
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
@app.get("/api/menu")
def get_menu():
    """Get all menu items"""
    all_items = []
    for category_items in MENU_PRODUCTS.values():
        all_items.extend(category_items)
    return {"items": all_items}

@app.get("/api/menu/search")
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

@app.get("/api/menu/{category}")
def get_category(category: str):
    """Get items by category"""
    category_lower = category.lower()
    if category_lower not in MENU_PRODUCTS:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"category": category, "items": MENU_PRODUCTS[category_lower]}

# ============= PROMO CODE ENDPOINTS =============
@app.post("/api/promo/validate")
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
@app.post("/api/favorites/add")
def add_favorite(request: FavoriteRequest, user_id: str):
    """Add product to favorites"""
    if not user_id:
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
        """, (user_id, request.product_id))
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # Already favorited
    
    conn.close()
    
    return {"status": "success", "message": "Added to favorites"}

@app.delete("/api/favorites/{product_id}")
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

@app.get("/api/favorites")
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

# ============= ORDER ENDPOINTS =============
@app.post("/api/checkout")
def checkout(request: CheckoutRequest, user_id: Optional[str] = None):
    """Create new order"""
    if not request.items or len(request.items) == 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total = 0
    for item in request.items:
        price = item.get("price", 0)
        quantity = item.get("quantity", 1)
        size = item.get("size", "M")
        
        # Size multiplier
        size_multiplier = {"S": 0.9, "M": 1.0, "L": 1.1}.get(size, 1.0)
        total += price * quantity * size_multiplier
    
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
    
    c.execute("""
        INSERT INTO orders
        (id, user_id, items, total, special_notes, promo_code, discount, payment_method, customer_name, customer_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        "pending"
    ))
    
    conn.commit()
    conn.close()
    
    # Send confirmation email
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-inline-size: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #006241;">Order Confirmation</h2>
                <p>Hi <strong>{request.customer_name}</strong>,</p>
                <p>Your order has been received!</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order ID:</strong> {order_id}</p>
                    <p><strong>Total:</strong> ₫{final_total:,.0f}</p>
                    <p><strong>Payment Method:</strong> {request.payment_method}</p>
                    {f'<p><strong>Notes:</strong> {request.special_notes}</p>' if request.special_notes else ''}
                </div>
                
                <p style="color: #666; font-size: 14px;">We'll prepare your order and notify you when it's ready!</p>
                <p style="color: #999; font-size: 12px;">Estimated time: 15-20 minutes</p>
            </div>
        </body>
    </html>
    """
    
    send_email(request.customer_email if hasattr(request, 'customer_email') else request.customer_phone, 
               "Order Confirmation", html_body)
    
    return {
        "status": "success",
        "order_id": order_id,
        "total": final_total,
        "discount": discount,
        "message": "Order created successfully"
    }

@app.get("/api/orders")
def get_orders(user_id: str):
    """Get user's order history"""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT id, items, total, status, special_notes, promo_code, discount, payment_method, customer_name, created_at
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
            "created_at": order[9]
        })
    
    return {"orders": result}

@app.get("/api/orders/{order_id}")
def get_order_detail(order_id: str, user_id: Optional[str] = None):
    """Get order details"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute("""
        SELECT id, user_id, items, total, status, special_notes, promo_code, discount, payment_method, customer_name, created_at
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
        "created_at": order[10]
    }

@app.put("/api/orders/{order_id}/status")
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

# ============= STATIC FILES =============
@app.get("/")
def serve_home():
    """Serve home page"""
    return FileResponse("order_frontend_v2.html", media_type="text/html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
