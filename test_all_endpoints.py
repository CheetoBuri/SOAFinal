#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script
Tests all 49 endpoints for errors, bad requests, and 500 errors
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3000"

# Track results
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def test_endpoint(method, path, data=None, params=None, expected_status=None, description=""):
    """Test a single endpoint and record results"""
    url = f"{BASE_URL}{path}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        else:
            response = requests.request(method, url, json=data, params=params, timeout=5)
        
        # Check for Vietnam time header
        vn_time_header = response.headers.get('X-Vietnam-Time', 'MISSING')
        
        status = response.status_code
        
        # Determine if this is expected behavior
        is_error = status >= 500
        is_bad_request = status == 400
        is_auth_error = status in [401, 403]
        is_not_found = status == 404
        
        result = {
            "method": method,
            "path": path,
            "status": status,
            "description": description,
            "vietnam_time": vn_time_header,
            "response_preview": str(response.text)[:200] if response.text else ""
        }
        
        # Categorize result
        if is_error:
            results["failed"].append({**result, "error": "500 SERVER ERROR"})
            print(f"❌ [{method}] {path} - {description}")
            print(f"   Status: {status} - SERVER ERROR")
            print(f"   Response: {response.text[:200]}")
        elif is_bad_request and expected_status != 400:
            results["warnings"].append({**result, "warning": "400 BAD REQUEST (might be expected)"})
            print(f"⚠️  [{method}] {path} - {description}")
            print(f"   Status: {status} - BAD REQUEST")
        elif is_auth_error or is_not_found:
            if expected_status and status == expected_status:
                results["passed"].append(result)
                print(f"✅ [{method}] {path} - {description} (expected {status})")
            else:
                results["warnings"].append({**result, "warning": f"{status} (might be expected without auth)"})
                print(f"ℹ️  [{method}] {path} - {description}")
                print(f"   Status: {status} - Expected without authentication")
        else:
            results["passed"].append(result)
            print(f"✅ [{method}] {path} - {description}")
            print(f"   Status: {status}")
        
        # Check Vietnam time header
        if vn_time_header == 'MISSING':
            print(f"   ⚠️  Vietnam Time Header: MISSING")
        else:
            print(f"   ✓ Vietnam Time: {vn_time_header}")
        
        print()
        return response
        
    except requests.exceptions.RequestException as e:
        results["failed"].append({
            "method": method,
            "path": path,
            "error": str(e),
            "description": description
        })
        print(f"❌ [{method}] {path} - {description}")
        print(f"   ERROR: {str(e)}")
        print()
        return None

print("="*80)
print("🧪 COMPREHENSIVE API ENDPOINT TESTING")
print(f"Base URL: {BASE_URL}")
print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)
print()

# ============================================
# 1. HEALTH CHECK
# ============================================
print("=" * 60)
print("1️⃣  HEALTH & SYSTEM ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/health", description="Health check")
test_endpoint("GET", "/docs", description="Swagger UI")
test_endpoint("GET", "/openapi.json", description="OpenAPI schema")

# ============================================
# 2. MENU ENDPOINTS
# ============================================
print("=" * 60)
print("2️⃣  MENU ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/menu", description="Get all menu items")
test_endpoint("GET", "/api/menu/coffee", description="Get coffee category")
test_endpoint("GET", "/api/menu/tea", description="Get tea category")
test_endpoint("GET", "/api/menu/juice", description="Get juice category")
test_endpoint("GET", "/api/menu/food", description="Get food category")
test_endpoint("GET", "/api/menu/search", params={"q": "latte"}, description="Search for 'latte'")
test_endpoint("GET", "/api/menu/search", params={"q": "xyz123notfound"}, description="Search with no results")
test_endpoint("GET", "/api/menu/options/all", description="Get all customization options")
test_endpoint("GET", "/api/menu/product/cf_1", description="Get specific product (Espresso)")
test_endpoint("GET", "/api/menu/product/invalid_id", description="Get invalid product", expected_status=404)

# ============================================
# 3. AUTHENTICATION ENDPOINTS
# ============================================
print("=" * 60)
print("3️⃣  AUTHENTICATION ENDPOINTS")
print("=" * 60)

# Login with invalid credentials
test_endpoint("POST", "/api/auth/login", 
              data={"identifier": "invalid@test.com", "password": "wrongpass"},
              description="Login with invalid credentials", expected_status=401)

# Send OTP to test email
test_endpoint("POST", "/api/auth/send-otp",
              data={"email": "test@example.com"},
              description="Send registration OTP")

# Verify OTP with invalid code
test_endpoint("POST", "/api/auth/verify-otp",
              data={"email": "test@example.com", "code": "000000", "password": "test123", "full_name": "Test User"},
              description="Verify OTP with invalid code", expected_status=400)

# Send reset OTP
test_endpoint("POST", "/api/auth/send-reset-otp",
              data={"email": "nonexistent@test.com"},
              description="Send reset OTP to non-existent user", expected_status=404)

# Reset password
test_endpoint("POST", "/api/auth/reset-password",
              data={"email": "test@example.com", "code": "000000", "new_password": "newpass123"},
              description="Reset password with invalid OTP", expected_status=400)

# Get current user without auth
test_endpoint("GET", "/api/auth/me",
              params={"user_id": "nonexistent"},
              description="Get user info without valid auth", expected_status=404)

# ============================================
# 4. PROMO CODE ENDPOINT
# ============================================
print("=" * 60)
print("4️⃣  PROMO CODE ENDPOINT")
print("=" * 60)
test_endpoint("POST", "/api/promo/validate",
              data={"code": "INVALID123"},
              description="Validate invalid promo code", expected_status=404)

test_endpoint("POST", "/api/promo/validate",
              data={"code": ""},
              description="Validate empty promo code", expected_status=400)

# ============================================
# 5. LOCATION ENDPOINTS
# ============================================
print("=" * 60)
print("5️⃣  LOCATION ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/locations/districts",
              params={"city": "HCM"},
              description="Get districts for HCM")

test_endpoint("GET", "/api/locations/districts",
              params={"city": "HN"},
              description="Get districts for Hanoi")

test_endpoint("GET", "/api/locations/wards",
              params={"district": "Quan 1"},
              description="Get wards for District 1")

test_endpoint("GET", "/api/locations/wards",
              params={"district": ""},
              description="Get wards with empty district", expected_status=400)

# ============================================
# 6. CART ENDPOINTS (without auth - should fail gracefully)
# ============================================
print("=" * 60)
print("6️⃣  CART ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/cart",
              params={"user_id": "test_user_123"},
              description="Get cart without auth")

test_endpoint("POST", "/api/cart/add",
              data={
                  "user_id": "test_user",
                  "product_id": "cf_1",
                  "quantity": 1,
                  "size": "M",
                  "customization": {}
              },
              description="Add to cart")

test_endpoint("DELETE", "/api/cart/clear",
              params={"user_id": "test_user"},
              description="Clear cart")

# ============================================
# 7. CHECKOUT ENDPOINT
# ============================================
print("=" * 60)
print("7️⃣  CHECKOUT ENDPOINT")
print("=" * 60)
test_endpoint("POST", "/api/checkout",
              data={
                  "user_id": "test_user",
                  "items": [],
                  "total": 0,
                  "payment_method": "cod"
              },
              description="Checkout with empty cart", expected_status=400)

# ============================================
# 8. ORDERS ENDPOINTS
# ============================================
print("=" * 60)
print("8️⃣  ORDERS ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/orders",
              params={"user_id": "nonexistent_user"},
              description="Get orders for non-existent user")

test_endpoint("POST", "/api/orders/fake_order_123/cancel",
              data={"user_id": "test_user"},
              description="Cancel non-existent order", expected_status=404)

test_endpoint("POST", "/api/orders/fake_order_123/received",
              data={"user_id": "test_user"},
              description="Mark non-existent order as received", expected_status=404)

test_endpoint("GET", "/api/frequent-items",
              params={"user_id": "test_user", "limit": 5},
              description="Get frequent items")

# ============================================
# 9. PAYMENT ENDPOINTS
# ============================================
print("=" * 60)
print("9️⃣  PAYMENT ENDPOINTS")
print("=" * 60)
test_endpoint("POST", "/api/payment/send-otp",
              data={
                  "user_id": "test_user",
                  "order_id": "fake_order",
                  "amount": 50000
              },
              description="Send payment OTP for non-existent order", expected_status=404)

test_endpoint("POST", "/api/payment/verify-otp",
              data={
                  "user_id": "test_user",
                  "order_id": "fake_order",
                  "otp_code": "000000"
              },
              description="Verify payment OTP with invalid code", expected_status=404)

# ============================================
# 10. FAVORITES ENDPOINTS
# ============================================
print("=" * 60)
print("🔟 FAVORITES ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/favorites/test_user",
              description="Get favorites for test user")

test_endpoint("POST", "/api/favorites/add",
              data={
                  "user_id": "test_user",
                  "product_id": "cf_1"
              },
              description="Add to favorites")

test_endpoint("POST", "/api/favorites/remove",
              data={
                  "user_id": "test_user",
                  "product_id": "cf_1"
              },
              description="Remove from favorites")

test_endpoint("DELETE", "/api/favorites/invalid_product",
              params={"user_id": "test_user"},
              description="Delete favorite with invalid product")

# ============================================
# 11. REVIEWS ENDPOINTS
# ============================================
print("=" * 60)
print("1️⃣1️⃣  REVIEWS ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/reviews/product/cf_1",
              description="Get reviews for Espresso")

test_endpoint("GET", "/api/reviews/user/test_user",
              description="Get reviews by test user")

test_endpoint("GET", "/api/reviews/stats",
              description="Get review statistics")

test_endpoint("POST", "/api/reviews/submit",
              data={
                  "user_id": "test_user",
                  "product_id": "cf_1",
                  "rating": 5,
                  "comment": "Great coffee!"
              },
              description="Submit a review")

test_endpoint("DELETE", "/api/reviews/fake_review_123",
              params={"user_id": "test_user"},
              description="Delete non-existent review", expected_status=404)

# ============================================
# 12. USER PROFILE ENDPOINTS
# ============================================
print("=" * 60)
print("1️⃣2️⃣  USER PROFILE ENDPOINTS")
print("=" * 60)
test_endpoint("GET", "/api/user/balance",
              params={"user_id": "nonexistent_user"},
              description="Get balance for non-existent user", expected_status=404)

test_endpoint("POST", "/api/user/verify-password",
              params={"user_id": "test_user", "current_password": "wrong"},
              description="Verify wrong password", expected_status=404)

test_endpoint("POST", "/api/user/send-change-email-otp",
              data={
                  "user_id": "test_user",
                  "new_email": "newemail@test.com",
                  "password": "test123"
              },
              description="Send change email OTP")

test_endpoint("POST", "/api/user/send-change-password-otp",
              data={"user_id": "nonexistent_user"},
              description="Send change password OTP for non-existent user", expected_status=404)

# ============================================
# 13. TRANSACTIONS ENDPOINT
# ============================================
print("=" * 60)
print("1️⃣3️⃣  TRANSACTIONS ENDPOINT")
print("=" * 60)
test_endpoint("GET", "/api/transactions",
              params={"user_id": "test_user"},
              description="Get transaction history")

# ============================================
# SUMMARY
# ============================================
print("="*80)
print("📊 TEST SUMMARY")
print("="*80)
print(f"✅ Passed: {len(results['passed'])}")
print(f"⚠️  Warnings: {len(results['warnings'])}")
print(f"❌ Failed: {len(results['failed'])}")
print()

if results['failed']:
    print("❌ FAILED TESTS (CRITICAL):")
    for fail in results['failed']:
        print(f"  - [{fail.get('method')}] {fail.get('path')}: {fail.get('error', 'Unknown error')}")
        if 'response_preview' in fail:
            print(f"    Response: {fail['response_preview']}")
    print()

if results['warnings']:
    print("⚠️  WARNINGS (May be expected behavior):")
    for warn in results['warnings']:
        print(f"  - [{warn.get('method')}] {warn.get('path')}: {warn.get('warning')}")
    print()

print("="*80)
print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*80)

# Exit with error code if there are failures
exit(0 if len(results['failed']) == 0 else 1)
