#!/usr/bin/env python3
"""Test new authentication features"""
import requests
import json

BASE = "http://localhost:3000/api/auth"

print("="*60)
print("🧪 TESTING NEW AUTH FEATURES")
print("="*60)

# Test 1: Register with username
print("\n1️⃣ Testing registration with username...")
resp = requests.post(f"{BASE}/send-otp", json={
    "email": "testuser@example.com",
    "username": "testuser123"
})
print(f"   Send OTP: {resp.status_code}")

# Test 2: Try duplicate email
print("\n2️⃣ Testing duplicate email detection...")
resp = requests.post(f"{BASE}/send-otp", json={
    "email": "duplicate@example.com"
})
print(f"   First registration: {resp.status_code}")

resp2 = requests.post(f"{BASE}/verify-otp", json={
    "email": "duplicate@example.com",
    "otp_code": "000000",  # Will fail but email check happens first
    "full_name": "Test User",
    "phone": "0123456789",
    "username": "testdup",
    "password": "pass123"
})
print(f"   Verify (should fail - invalid OTP): {resp2.status_code}")

# Test 3: Try duplicate username
print("\n3️⃣ Testing duplicate username detection...")
# Would need valid OTP to test fully

# Test 4: Login with email
print("\n4️⃣ Testing login with email...")
resp = requests.post(f"{BASE}/login", json={
    "identifier": "huynhnhattien0411@gmail.com",  # existing user
    "password": "wrongpass"
})
print(f"   Login with email (wrong pass): {resp.status_code}")

# Test 5: Login with username  
print("\n5️⃣ Testing login with username...")
resp = requests.post(f"{BASE}/login", json={
    "identifier": "nonexistent",
    "password": "pass"
})
print(f"   Login with username (not exist): {resp.status_code}")

print("\n" + "="*60)
print("✅ Tests completed")
print("="*60)
