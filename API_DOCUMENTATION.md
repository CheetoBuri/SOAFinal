# ☕ Cafe Ordering System API Documentation

## 🚀 Quick Start

### Start Server
```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate  # Windows

# Run server
python -m uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```

### Access Points
- **Frontend**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/docs
- **API Docs (ReDoc)**: http://localhost:3000/redoc
- **OpenAPI Schema**: http://localhost:3000/openapi.json

---

## 📚 API Overview

Total Endpoints: **31**

### Endpoint Categories

#### 1️⃣ Authentication (`/api/auth`)
- `POST /api/auth/send-otp` - Send OTP for registration
- `POST /api/auth/verify-otp` - Verify OTP and create account
- `POST /api/auth/login` - Login with email/username and password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/send-reset-otp` - Send OTP for password reset
- `POST /api/auth/reset-password` - Reset password with OTP

#### 2️⃣ Menu (`/api/menu`)
- `GET /api/menu` - Get all menu items
- `GET /api/menu/{category}` - Get items by category (coffee, tea, juice, food)
- `GET /api/menu/search` - Search menu items

#### 3️⃣ Cart (`/api/cart`)
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - Get cart items
- `DELETE /api/cart/{product_id}` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

#### 4️⃣ Favorites (`/api/favorites`)
- `POST /api/favorites/add` - Add item to favorites
- `GET /api/favorites` - Get user's favorites
- `DELETE /api/favorites/{product_id}` - Remove from favorites

#### 5️⃣ Orders (`/api/orders`)
- `POST /api/checkout` - Create order
- `GET /api/orders` - Get user's orders
- `POST /api/orders/{order_id}/cancel` - Cancel order
- `POST /api/orders/{order_id}/received` - Mark order as received

#### 6️⃣ Payment (`/api/payment`)
- `POST /api/payment/send-otp` - Send OTP for payment confirmation
- `POST /api/payment/verify-otp` - Verify OTP and complete payment

#### 7️⃣ Profile (`/api/user`)
- `GET /api/user/balance` - Get user balance
- `POST /api/user/change-email` - Change email
- `POST /api/user/change-password` - Change password
- `POST /api/user/change-phone` - Change phone number

#### 8️⃣ Promo Codes (`/api/promo`)
- `POST /api/promo/validate` - Validate promo code

---

## 🔐 Authentication Flow

### Registration
```
1. POST /api/auth/send-otp
   Body: { "email": "user@example.com" }
   
2. POST /api/auth/verify-otp
   Body: {
     "email": "user@example.com",
     "otp_code": "123456",
     "full_name": "John Doe",
     "phone": "0123456789",
     "username": "johndoe",  // Optional
     "password": "securepass"
   }
```

### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",  // or "identifier": "username"
  "password": "securepass"
}

Response: {
  "status": "success",
  "user_id": "1",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 🛒 Order Flow

### 1. Browse Menu
```
GET /api/menu
Response: {
  "items": [
    {
      "id": "cf_1",
      "name": "Espresso",
      "category": "coffee",
      "price": 25000,
      "icon": "☕"
    }
  ]
}
```

### 2. Create Order
```
POST /api/checkout
Body: {
  "user_id": "1",
  "items": [
    {
      "id": "cf_1",
      "name": "Espresso",
      "price": 25000,
      "quantity": 1,
      "size": "M"
    }
  ],
  "customer_name": "John Doe",
  "customer_phone": "0123456789",
  "customer_email": "user@example.com",
  "payment_method": "Wallet Balance",
  "delivery_district": "Quận 1",
  "delivery_ward": "Phường 1",
  "delivery_street": "123 Main St"
}

Response: {
  "status": "success",
  "order_id": "ORD123",
  "total": 25000
}
```

### 3. Payment Confirmation
```
1. POST /api/payment/send-otp
   Body: {
     "user_id": "1",
     "order_id": "ORD123",
     "amount": 25000
   }
   
2. POST /api/payment/verify-otp
   Body: {
     "user_id": "1",
     "order_id": "ORD123",
     "otp_code": "123456"
   }
   
   Response: {
     "status": "success",
     "order_id": "ORD123",
     "amount_paid": 25000,
     "new_balance": 975000
   }
```

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (e.g., invalid OTP, email already exists) |
| 401 | Unauthorized (invalid credentials) |
| 404 | Not Found (resource doesn't exist) |
| 422 | Validation Error (missing/invalid fields) |
| 500 | Internal Server Error |

---

## 🧪 Testing with Swagger UI

1. Open http://localhost:3000/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"
6. View the response

### Example: Test Registration
1. Navigate to **POST /api/auth/send-otp**
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "test@example.com"
   }
   ```
4. Click "Execute"
5. Check your email or database for OTP code
6. Use the OTP in **POST /api/auth/verify-otp**

---

## 🔧 Environment Configuration

Create `.env` file:
```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

---

## 📁 Project Structure

```
SOAFinal/
├── app.py                 # Main FastAPI application
├── database.py            # Database connection and initialization
├── schema.sql             # Database schema
├── .env                   # Environment variables
├── models/
│   └── schemas.py         # Pydantic models
├── routers/
│   ├── auth.py           # Authentication endpoints
│   ├── menu.py           # Menu endpoints
│   ├── cart.py           # Cart endpoints
│   ├── favorites.py      # Favorites endpoints
│   ├── orders.py         # Orders endpoints
│   ├── payment.py        # Payment endpoints
│   └── profile.py        # User profile endpoints
└── utils/
    ├── security.py       # Security utilities (OTP, email)
    ├── menu_data.py      # Menu data
    └── timezone.py       # Timezone utilities
```

---

## 🎯 Key Features

✅ **OTP-based Registration** - Secure email verification  
✅ **Flexible Login** - Email or username  
✅ **Email/Phone/Username Uniqueness** - Prevents duplicates  
✅ **Cart Management** - Add, remove, clear  
✅ **Favorites System** - Save favorite items  
✅ **Order Tracking** - Real-time order status  
✅ **Payment OTP** - Secure payment confirmation  
✅ **Promo Codes** - Discount validation  
✅ **Profile Management** - Update email, phone, password  
✅ **Search & Filter** - Menu search and category filtering  
✅ **Background Email** - Non-blocking email sending  

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Email not sending
- Check `.env` configuration
- Verify SMTP credentials
- Check spam folder
- OTP is saved in database for testing

### Database issues
```bash
# Reset database
rm cafe_orders.db
python -m uvicorn app:app --reload
```

---

## 📞 Support

For issues or questions:
- Check Swagger UI: http://localhost:3000/docs
- Review logs: `/tmp/server.log`
- Check database: `sqlite3 cafe_orders.db`
