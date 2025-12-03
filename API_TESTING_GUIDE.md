# 🧪 API Testing Guide với Swagger UI

## 📋 Tổng quan

API đã được cập nhật đầy đủ với:
- ✅ **Response Models** cho tất cả endpoints
- ✅ **Request Examples** cho mỗi endpoint  
- ✅ **Detailed Documentation** với mô tả tham số
- ✅ **Interactive Swagger UI** để test trực tiếp

## 🚀 Truy cập Swagger UI

1. Khởi động server:
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
.venv/bin/uvicorn app:app --reload --port 8000
```

2. Mở trình duyệt và truy cập:
```
http://localhost:8000/docs
```

## 📊 Danh sách Endpoints (31 endpoints)

### 1️⃣ Authentication (6 endpoints)

#### POST `/api/auth/send-otp` - Send OTP for Registration
**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe"
}
```
**Response:** `OTPSentResponse`

#### POST `/api/auth/verify-otp` - Verify OTP and Complete Registration
**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "full_name": "John Doe",
  "phone": "0123456789",
  "username": "johndoe",
  "password": "password123"
}
```
**Response:** `UserResponse`

#### POST `/api/auth/login` - Login
**Request:**
```json
{
  "identifier": "johndoe",
  "password": "password123"
}
```
**Response:** `UserResponse`

#### GET `/api/auth/me` - Get Current User Info
**Query Params:** `user_id=1`
**Response:** `UserDetailResponse` (includes balance, phone, username)

#### POST `/api/auth/send-reset-otp` - Send OTP for Password Reset
**Request:**
```json
{
  "email": "user@example.com"
}
```
**Response:** `OTPSentResponse`

#### POST `/api/auth/reset-password` - Reset Password
**Request:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "new_password": "newpassword123"
}
```
**Response:** `StatusResponse`

---

### 2️⃣ Menu (3 endpoints)

#### GET `/api/menu` - Get All Menu Items
**Response:** `MenuResponse` (array of products)

#### GET `/api/menu/search?q=coffee` - Search Menu Items
**Query Params:** `q=coffee`
**Response:** `SearchResponse` (items + count)

#### GET `/api/menu/{category}` - Get Menu by Category
**Path Params:** `category=coffee` (coffee, tea, juice, food)
**Response:** `MenuResponse`

---

### 3️⃣ Checkout & Promo (2 endpoints)

#### POST `/api/promo/validate` - Validate Promo Code
**Request:**
```json
{
  "code": "COFFEE20"
}
```
**Response:** `PromoValidationResponse`

#### POST `/api/checkout` - Create Order
**Request:**
```json
{
  "user_id": "1",
  "items": [
    {
      "id": "cf_1",
      "name": "Espresso",
      "price": 25000,
      "quantity": 2,
      "size": "L",
      "milks": ["nut"],
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
```
**Response:** `CheckoutResponse` (order_id, total, final_amount)

---

### 4️⃣ Payment (2 endpoints)

#### POST `/api/payment/send-otp` - Send Payment OTP
**Request:**
```json
{
  "user_id": "1",
  "order_id": "ORD20231203001",
  "amount": 50000
}
```
**Response:** `PaymentOTPResponse`

#### POST `/api/payment/verify-otp` - Verify Payment OTP
**Request:**
```json
{
  "user_id": "1",
  "order_id": "ORD20231203001",
  "otp_code": "123456"
}
```
**Response:** `PaymentVerificationResponse` (includes new_balance)

---

### 5️⃣ Orders & History (3 endpoints)

#### GET `/api/orders` - Get User's Order History
**Query Params:** `user_id=1`
**Response:** `OrderHistoryResponse` (array of orders)

#### POST `/api/orders/{order_id}/cancel` - Cancel Order
**Path Params:** `order_id=ORD20231203001`
**Request:**
```json
{
  "user_id": "1"
}
```
**Response:** `StatusResponse` (with refund confirmation)

#### POST `/api/orders/{order_id}/received` - Mark Order as Received
**Path Params:** `order_id=ORD20231203001`
**Request:**
```json
{
  "user_id": "1"
}
```
**Response:** `StatusResponse`

---

### 6️⃣ User Profile (4 endpoints)

#### POST `/api/user/change-email` - Change Email
**Request:**
```json
{
  "user_id": "1",
  "new_email": "newemail@example.com",
  "password": "password123"
}
```
**Response:** `StatusResponse`

#### POST `/api/user/change-phone` - Change Phone
**Request:**
```json
{
  "user_id": "1",
  "new_phone": "0987654321",
  "password": "password123"
}
```
**Response:** `StatusResponse`

#### POST `/api/user/change-password` - Change Password
**Request:**
```json
{
  "user_id": "1",
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```
**Response:** `StatusResponse`

#### GET `/api/user/balance` - Get User Balance
**Query Params:** `user_id=1`
**Response:** `BalanceResponse` (balance amount)

---

### 7️⃣ Favorites (3 endpoints)

#### POST `/api/favorites/add` - Add to Favorites
**Request:**
```json
{
  "user_id": "1",
  "product_id": "cf_1"
}
```
**Response:** `StatusResponse`

#### DELETE `/api/favorites/{product_id}` - Remove from Favorites
**Path Params:** `product_id=cf_1`
**Query Params:** `user_id=1`
**Response:** `StatusResponse`

#### GET `/api/favorites` - Get User's Favorites
**Query Params:** `user_id=1`
**Response:** `FavoritesResponse` (array of favorite products)

---

### 8️⃣ Cart (4 endpoints)

#### POST `/api/cart/add` - Add to Cart
**Request:**
```json
{
  "user_id": "1",
  "item": {
    "id": "cf_1",
    "name": "Espresso",
    "price": 25000,
    "quantity": 2,
    "size": "L",
    "milks": ["nut"],
    "sugar": "75"
  }
}
```
**Response:** `StatusResponse`

#### GET `/api/cart` - Get User's Cart
**Query Params:** `user_id=1`
**Response:** `CartResponse` (array of cart items)

#### DELETE `/api/cart/clear` - Clear Cart
**Query Params:** `user_id=1`
**Response:** `StatusResponse`

#### DELETE `/api/cart/{product_id}` - Remove from Cart
**Path Params:** `product_id=cf_1`
**Query Params:** `user_id=1`
**Response:** `StatusResponse`

---

## 🧪 Testing Flow (Recommended Order)

### Basic Flow:
1. **Register**: `POST /api/auth/send-otp` → `POST /api/auth/verify-otp`
2. **Login**: `POST /api/auth/login` (get user_id)
3. **Browse Menu**: `GET /api/menu` or `GET /api/menu/coffee`
4. **Search**: `GET /api/menu/search?q=espresso`
5. **Add to Favorites**: `POST /api/favorites/add`
6. **View Profile**: `GET /api/auth/me?user_id=1`
7. **View Balance**: `GET /api/user/balance?user_id=1`

### Order Flow:
1. **Add to Cart**: `POST /api/cart/add`
2. **View Cart**: `GET /api/cart?user_id=1`
3. **Validate Promo**: `POST /api/promo/validate` (optional)
4. **Checkout**: `POST /api/checkout`
5. **Send Payment OTP**: `POST /api/payment/send-otp`
6. **Verify Payment**: `POST /api/payment/verify-otp`
7. **View Orders**: `GET /api/orders?user_id=1`
8. **Mark Received**: `POST /api/orders/{order_id}/received`

### Profile Management:
1. **Change Email**: `POST /api/user/change-email`
2. **Change Phone**: `POST /api/user/change-phone`
3. **Change Password**: `POST /api/user/change-password`

---

## 💡 Tips for Testing

1. **Try It Out**: Click "Try it out" button trong Swagger UI
2. **View Examples**: Mỗi endpoint có example request/response
3. **Error Handling**: Test với invalid data để xem error messages
4. **Order Status**: pending_payment → confirmed → completed
5. **Balance**: Mặc định user mới có balance = 500,000 VND

## 📝 Notes

- Phone number là **optional** khi đăng ký
- Username tự động generate nếu không cung cấp
- OTP code sẽ hiển thị trong console logs (development mode)
- Promo codes có sẵn: `COFFEE20` (20% off)
- Tất cả endpoints có detailed error messages

## ✅ Response Models Summary

- `OTPSentResponse` - OTP confirmation
- `UserResponse` - User info (id, email, name, username)
- `UserDetailResponse` - Full user info + balance + phone
- `StatusResponse` - Generic success/error response
- `MenuResponse` - Array of products
- `SearchResponse` - Search results + count
- `PromoValidationResponse` - Promo validation result
- `CheckoutResponse` - Order creation confirmation
- `OrderHistoryResponse` - User's orders
- `PaymentOTPResponse` - Payment OTP sent
- `PaymentVerificationResponse` - Payment confirmation + new balance
- `FavoritesResponse` - User's favorite products
- `CartResponse` - User's cart items
- `BalanceResponse` - User balance

---

Enjoy testing! 🎉
