#!/usr/bin/env python3
"""
Complete API endpoint testing script
"""
import requests
import json

BASE_URL = "http://localhost:3000"

def test_endpoint(method, path, data=None, params=None, description=""):
    """Test an endpoint and print results"""
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, params=params)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url, params=params)
        
        status = "✅" if response.status_code < 400 else "❌"
        print(f"{status} {method:6} {path:45} [{response.status_code}] {description}")
        return response
    except Exception as e:
        print(f"❌ {method:6} {path:45} [ERROR] {str(e)}")
        return None

print("="*80)
print("🧪 TESTING ALL CAFE API ENDPOINTS")
print("="*80)

# Health & Frontend
print("\n📍 Health & Frontend:")
test_endpoint("GET", "/", description="Root - Frontend")
test_endpoint("GET", "/health", description="Health check")

# Auth endpoints
print("\n🔐 Authentication:")
test_endpoint("POST", "/api/auth/send-otp", {
    "email": "test@example.com",
    "full_name": "Test User"
}, description="Send OTP")

test_endpoint("POST", "/api/auth/verify-otp", {
    "email": "test@example.com",
    "otp": "123456",
    "password": "password123"
}, description="Verify OTP (will fail - wrong code)")

test_endpoint("POST", "/api/auth/login", {
    "email": "test@example.com",
    "password": "password123"
}, description="Login (might fail if user doesn't exist)")

test_endpoint("GET", "/api/auth/me", params={"user_id": "test123"}, description="Get user info")

# Menu endpoints  
print("\n📋 Menu:")
test_endpoint("GET", "/api/menu", description="Get all products")
test_endpoint("GET", "/api/menu/search", params={"q": "latte"}, description="Search products")
test_endpoint("GET", "/api/menu/coffee", description="Get coffee category")

# Cart endpoints
print("\n🛒 Cart:")
test_endpoint("POST", "/api/cart/add", {
    "user_id": "test123",
    "product_id": "cf_1",
    "quantity": 2,
    "size": "M"
}, description="Add to cart")

test_endpoint("GET", "/api/cart", params={"user_id": "test123"}, description="Get cart")

# Favorites
print("\n⭐ Favorites:")
test_endpoint("POST", "/api/favorites/add", {
    "user_id": "test123",
    "product_id": "cf_1"
}, description="Add to favorites")

test_endpoint("GET", "/api/favorites", params={"user_id": "test123"}, description="Get favorites")

# Orders & Checkout
print("\n📦 Orders & Checkout:")
test_endpoint("POST", "/api/promo/validate", {
    "code": "WELCOME10"
}, description="Validate promo code")

test_endpoint("POST", "/api/checkout", {
    "user_id": "test123",
    "items": [{
        "id": "cf_1",
        "name": "Espresso",
        "price": 25000,
        "quantity": 1,
        "size": "M",
        "milks": [],
        "sugar": 100,
        "ice": 100
    }],
    "customer_name": "Test User",
    "customer_phone": "0123456789",
    "customer_email": "test@example.com",
    "payment_method": "balance",
    "delivery_district": "Q1",
    "delivery_ward": "P1",
    "delivery_street": "Street 1"
}, description="Create order")

test_endpoint("GET", "/api/orders", params={"user_id": "test123"}, description="Get orders")

# Profile
print("\n👤 Profile:")
test_endpoint("GET", "/api/user/balance", params={"user_id": "test123"}, description="Get balance")

test_endpoint("POST", "/api/user/change-email", {
    "user_id": "test123",
    "new_email": "newemail@example.com",
    "current_password": "password123"
}, description="Change email")

# Payment
print("\n💳 Payment:")
test_endpoint("POST", "/api/payment/request-otp", {
    "order_id": "TEST1234",
    "user_id": "test123"
}, description="Request payment OTP")

print("\n" + "="*80)
print("✅ Testing complete! Check results above.")
print("="*80)
