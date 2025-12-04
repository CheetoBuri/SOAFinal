# ☕ Cafe Ordering System - Refactored Architecture

## 📁 Project Structure

```
SOAFinal/
├── app.py                      # Main FastAPI application
├── database.py                 # Database connection & initialization
├── schema.sql                  # Database schema
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
├── .env                        # Environment variables
│
├── models/                     # Data models
│   ├── __init__.py
│   └── schemas.py              # Pydantic request/response models
│
├── routers/                    # API endpoints (modular)
│   ├── __init__.py
│   ├── auth.py                 # Authentication (OTP, login, password reset)
│   ├── menu.py                 # Menu browsing & search
│   ├── profile.py              # User profile management
│   ├── orders.py               # Orders, checkout, promo codes
│   ├── payment.py              # Payment OTP verification
│   ├── favorites.py            # Favorite products
│   └── cart.py                 # Shopping cart
│
└── utils/                      # Helper functions
    ├── __init__.py
    ├── security.py             # Password hashing, OTP, email
    ├── menu_data.py            # Product catalog
    └── timezone.py             # Vietnam timezone handling
```

## 🎯 API Endpoints

### 1️⃣ Authentication (`/api/auth`)
- `POST /send-otp` - Send registration OTP
- `POST /verify-otp` - Verify OTP and create account
- `POST /login` - Email/password login
- `GET /me` - Get user info
- `POST /send-reset-otp` - Send password reset OTP
- `POST /reset-password` - Reset password with OTP

### 2️⃣ Menu (`/api/menu`)
- `GET /` - Get all products
- `GET /search?q=` - Search products
- `GET /{category}` - Filter by category

### 3️⃣ Checkout & Promo (`/api`)
- `POST /promo/validate` - Validate promo code
- `POST /checkout` - Create order

### 4️⃣ Payment (`/api/payment`)
- `POST /request-otp` - Request payment OTP
- `POST /verify-otp` - Verify OTP and process payment

### 5️⃣ Orders (`/api/orders`)
- `GET /orders?user_id=` - Get order history
- `POST /{order_id}/cancel` - Cancel order & refund
- `POST /{order_id}/received` - Mark order as received

### 6️⃣ User Profile (`/api/user`)
- `POST /change-email` - Update email
- `POST /change-phone` - Update phone
- `POST /change-password` - Change password

### 7️⃣ Favorites (`/api/favorites`)
- `POST /add` - Add to favorites
- `GET /` - List favorites
- `DELETE /{product_id}` - Remove favorite

### 8️⃣ Cart (`/api/cart`)
- `POST /add` - Add item to cart
- `GET /` - View cart
- `DELETE /clear` - Clear cart
- `DELETE /{product_id}` - Remove item

## 🚀 Running the Application

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```

### Docker

```bash
# Build image
docker build -t cafe-api .

# Run container
docker run -d -p 3000:3000 --name cafe-api cafe-api
```

## 📚 Documentation

- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc
- **OpenAPI JSON**: http://localhost:3000/openapi.json

## ✨ Features

### Modular Architecture
- **Separation of Concerns**: Each module has a single responsibility
- **Easy Maintenance**: Changes isolated to specific files
- **Scalable**: Easy to add new features without affecting existing code
- **Testable**: Individual components can be tested independently

### Key Functionality
- 🔐 **OTP Authentication** - Email-based registration and login
- 📋 **Menu Management** - Browse, search, and filter products
- 🛒 **Shopping Cart** - Add items with customizations (size, sugar, ice, milk)
- 💰 **Promo Codes** - Discount validation and application
- 💳 **Payment System** - OTP-verified balance deduction
- 📦 **Order Tracking** - View history, cancel, mark received
- ⭐ **Favorites** - Save preferred products
- 👤 **Profile Management** - Update email, phone, password

### Data Customization
- **Size Options**: Small (90%), Medium (100%), Large (110%) pricing
- **Sugar Levels**: 0-200% customization
- **Ice Levels**: 0-200% customization
- **Milk Types**: Multiple selections with 5,000 VND per type

## 🔧 Configuration

### Environment Variables (`.env`)
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### Database
- **Type**: SQLite
- **File**: `cafe_orders.db`
- **Schema**: Auto-initialized from `schema.sql`

## 📊 Database Schema

- `users` - User accounts with balance
- `otp_codes` - Temporary OTP storage
- `orders` - Order history with delivery details
- `promo_codes` - Discount codes with usage limits
- `payment_otps` - Payment verification codes
- `favorites` - User favorite products
- `cart` - Shopping cart items (JSON)

## 🎨 Code Organization Benefits

### Before (Monolithic)
- ❌ 1690+ lines in single file
- ❌ Hard to navigate
- ❌ Difficult to maintain
- ❌ No clear module boundaries

### After (Modular - New Structure)
- ✅ Clear separation of concerns
- ✅ Easy to find specific functionality
- ✅ Simple to add new features
- ✅ Better code reusability
- ✅ Professional structure
- ✅ Teacher-friendly for code review

## 🧪 Testing

```bash
# Test imports
python -c "from app import app; print('✅ Success')"

# Test specific router
python -c "from routers import auth; print('✅ Auth router loaded')"

# Health check
curl http://localhost:3000/

# Test endpoint
curl http://localhost:3000/api/menu
```

## 📝 Migration Notes

### Refactoring Changes
- All functionality preserved
- Routes remain identical
- Database schema unchanged
- Frontend compatibility maintained
- Added proper module structure
- Improved code organization

### Legacy Support
Legacy monolithic files have been removed to avoid confusion. Please use `app.py` and `index.html`.

## 👨‍🏫 For Academic Review

This project demonstrates:
1. **Clean Code Principles** - Single responsibility, DRY
2. **RESTful API Design** - Proper HTTP methods and status codes
3. **Security Best Practices** - Password hashing, OTP verification
4. **Modular Architecture** - Separation into models, routers, utils
5. **Documentation** - Swagger UI with examples
6. **Error Handling** - Proper HTTP exceptions
7. **Database Design** - Normalized schema with relationships

---

**Version**: 2.0 (Refactored)  
**Last Updated**: December 3, 2025  
**Author**: SOA Final Project Team
