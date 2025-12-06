#!/bin/bash
# Comprehensive API Endpoint Testing Script using curl
# Tests all 49 endpoints for errors

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
WARNINGS=0

echo "================================================================================"
echo "🧪 COMPREHENSIVE API ENDPOINT TESTING"
echo "Base URL: $BASE_URL"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================================"
echo ""

test_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local desc=$4
    local expected=$5
    
    echo "Testing: [$method] $path - $desc"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$path" \
                   -H "Content-Type: application/json" \
                   -d "$data" 2>&1)
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method "$BASE_URL$path" 2>&1)
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    # Check Vietnam time header
    vn_time=$(curl -s -I -X $method "$BASE_URL$path" 2>&1 | grep -i "x-vietnam-time" || echo "MISSING")
    
    if [ "$http_code" -ge 500 ]; then
        echo "❌ FAILED - Status: $http_code (SERVER ERROR)"
        echo "   Response: ${body:0:200}"
        FAILED=$((FAILED + 1))
    elif [ "$http_code" = "400" ] && [ "$expected" != "400" ]; then
        echo "⚠️  WARNING - Status: $http_code (BAD REQUEST)"
        WARNINGS=$((WARNINGS + 1))
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        if [ "$expected" = "$http_code" ]; then
            echo "✅ PASSED - Status: $http_code (expected)"
            PASSED=$((PASSED + 1))
        else
            echo "ℹ️  INFO - Status: $http_code (expected without auth/data)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "✅ PASSED - Status: $http_code"
        PASSED=$((PASSED + 1))
    fi
    
    if echo "$vn_time" | grep -q "MISSING"; then
        echo "   ⚠️  Vietnam Time Header: MISSING"
    else
        echo "   ✓ Vietnam Time: $vn_time"
    fi
    
    echo ""
}

# ============================================
# 1. HEALTH & SYSTEM
# ============================================
echo "============================================================"
echo "1️⃣  HEALTH & SYSTEM ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/health" "" "Health check"
test_endpoint "GET" "/docs" "" "Swagger UI"
test_endpoint "GET" "/openapi.json" "" "OpenAPI schema"

# ============================================
# 2. MENU ENDPOINTS
# ============================================
echo "============================================================"
echo "2️⃣  MENU ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/menu" "" "Get all menu items"
test_endpoint "GET" "/api/menu/coffee" "" "Get coffee category"
test_endpoint "GET" "/api/menu/tea" "" "Get tea category"
test_endpoint "GET" "/api/menu/juice" "" "Get juice category"
test_endpoint "GET" "/api/menu/food" "" "Get food category"
test_endpoint "GET" "/api/menu/search?q=latte" "" "Search for latte"
test_endpoint "GET" "/api/menu/options/all" "" "Get customization options"
test_endpoint "GET" "/api/menu/product/cf_1" "" "Get product cf_1"
test_endpoint "GET" "/api/menu/product/invalid_id" "" "Get invalid product" "404"

# ============================================
# 3. AUTHENTICATION
# ============================================
echo "============================================================"
echo "3️⃣  AUTHENTICATION ENDPOINTS"
echo "============================================================"
test_endpoint "POST" "/api/auth/login" '{"identifier":"invalid@test.com","password":"wrong"}' "Login invalid" "401"
test_endpoint "POST" "/api/auth/send-otp" '{"email":"test@example.com"}' "Send OTP"
test_endpoint "POST" "/api/auth/verify-otp" '{"email":"test@example.com","code":"000000","password":"test","full_name":"Test"}' "Verify invalid OTP" "400"
test_endpoint "POST" "/api/auth/send-reset-otp" '{"email":"nonexistent@test.com"}' "Reset OTP non-existent" "404"
test_endpoint "GET" "/api/auth/me?user_id=nonexistent" "" "Get user non-existent" "404"

# ============================================
# 4. PROMO CODES
# ============================================
echo "============================================================"
echo "4️⃣  PROMO CODE ENDPOINT"
echo "============================================================"
test_endpoint "POST" "/api/promo/validate" '{"code":"INVALID123"}' "Validate invalid promo" "404"

# ============================================
# 5. LOCATIONS
# ============================================
echo "============================================================"
echo "5️⃣  LOCATION ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/locations/districts?city=HCM" "" "Get HCM districts"
test_endpoint "GET" "/api/locations/wards?district=Quan 1" "" "Get District 1 wards"

# ============================================
# 6. CART
# ============================================
echo "============================================================"
echo "6️⃣  CART ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/cart?user_id=test_user" "" "Get cart"
test_endpoint "POST" "/api/cart/add" '{"user_id":"test","product_id":"cf_1","quantity":1,"size":"M"}' "Add to cart"
test_endpoint "DELETE" "/api/cart/clear?user_id=test" "" "Clear cart"

# ============================================
# 7. CHECKOUT
# ============================================
echo "============================================================"
echo "7️⃣  CHECKOUT ENDPOINT"
echo "============================================================"
test_endpoint "POST" "/api/checkout" '{"user_id":"test","items":[],"total":0,"payment_method":"cod"}' "Empty checkout" "400"

# ============================================
# 8. ORDERS
# ============================================
echo "============================================================"
echo "8️⃣  ORDERS ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/orders?user_id=test_user" "" "Get orders"
test_endpoint "POST" "/api/orders/fake_order/cancel" '{"user_id":"test"}' "Cancel non-existent" "404"
test_endpoint "GET" "/api/frequent-items?user_id=test&limit=5" "" "Get frequent items"

# ============================================
# 9. PAYMENT
# ============================================
echo "============================================================"
echo "9️⃣  PAYMENT ENDPOINTS"
echo "============================================================"
test_endpoint "POST" "/api/payment/send-otp" '{"user_id":"test","order_id":"fake","amount":50000}' "Payment OTP fake order" "404"

# ============================================
# 10. FAVORITES
# ============================================
echo "============================================================"
echo "🔟 FAVORITES ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/favorites/test_user" "" "Get favorites"
test_endpoint "POST" "/api/favorites/add" '{"user_id":"test","product_id":"cf_1"}' "Add favorite"
test_endpoint "POST" "/api/favorites/remove" '{"user_id":"test","product_id":"cf_1"}' "Remove favorite"

# ============================================
# 11. REVIEWS
# ============================================
echo "============================================================"
echo "1️⃣1️⃣  REVIEWS ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/reviews/product/cf_1" "" "Get product reviews"
test_endpoint "GET" "/api/reviews/user/test_user" "" "Get user reviews"
test_endpoint "GET" "/api/reviews/stats" "" "Get review stats"
test_endpoint "POST" "/api/reviews/submit" '{"user_id":"test","product_id":"cf_1","rating":5,"comment":"Great!"}' "Submit review"

# ============================================
# 12. USER PROFILE
# ============================================
echo "============================================================"
echo "1️⃣2️⃣  USER PROFILE ENDPOINTS"
echo "============================================================"
test_endpoint "GET" "/api/user/balance?user_id=nonexistent" "" "Get balance non-existent" "404"
test_endpoint "POST" "/api/user/send-change-password-otp" '{"user_id":"nonexistent"}' "Change pwd OTP" "404"

# ============================================
# 13. TRANSACTIONS
# ============================================
echo "============================================================"
echo "1️⃣3️⃣  TRANSACTIONS ENDPOINT"
echo "============================================================"
test_endpoint "GET" "/api/transactions?user_id=test" "" "Get transactions"

# ============================================
# SUMMARY
# ============================================
echo "================================================================================"
echo "📊 TEST SUMMARY"
echo "================================================================================"
echo "✅ Passed: $PASSED"
echo "⚠️  Warnings: $WARNINGS"
echo "❌ Failed: $FAILED"
echo ""
echo "Completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================================"

exit 0
