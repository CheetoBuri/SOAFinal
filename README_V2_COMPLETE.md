# ☕ Cafe Ordering System v2 - Complete Guide

Welcome to the enhanced **Cafe Ordering System v2** with user accounts, order history, favorites, promo codes, and email notifications!

---

## 🎯 Features Overview

### ✅ Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| **User Authentication** | ✅ Complete | OTP-based registration via email |
| **Order History** | ✅ Complete | View all past orders with status tracking |
| **Special Notes** | ✅ Complete | Add custom requests to your order (no sugar, extra hot, etc.) |
| **Promo Codes** | ✅ Complete | Apply discount codes at checkout |
| **Favorites** | ✅ Complete | Save favorite items for quick ordering |
| **Product Search** | ✅ Complete | Search menu by product name |
| **Email Notifications** | ✅ Configured | Order confirmation emails (requires Gmail setup) |
| **Order Status Tracking** | ✅ Complete | Monitor order progress (pending → preparing → ready → completed) |
| **Size Pricing** | ✅ Complete | Small (90%), Medium (100%), Large (110%) |
| **Multiple Payment Methods** | ✅ Complete | Cash, Card, Bank Transfer |

---

## 🚀 Quick Start

### 1. **Start the Server**

#### Option A: Direct Python
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
source .venv/bin/activate
python3 app_v2.py
```

#### Option B: Using npm
```bash
npm start
```

#### Option C: Using bash script
```bash
./start.sh
```

Server will start on **http://localhost:3000**

### 2. **Access the Application**

Open browser: **http://localhost:3000**

---

## 🔐 Authentication Flow

### 1. **Register with Email & OTP**

```
┌─────────────────────────────────────┐
│ User enters email                    │
│            ↓                         │
│ OTP code sent to email              │
│            ↓                         │
│ User enters OTP code                │
│            ↓                         │
│ Enter name and phone                │
│            ↓                         │
│ Account created! ✅                  │
└─────────────────────────────────────┘
```

**To test:**
1. Click "Register" tab
2. Enter your email
3. Click "Send OTP Code"
4. Check your email for the 6-digit code
5. Enter code, name, and phone
6. Click "Create Account"

**⚠️ Note:** Email notifications require Gmail setup (see below)

### 2. **Login**

Once registered, click "Login" and enter your email + password

---

## 📧 Email Configuration (Optional but Recommended)

### Setup Gmail for Email Notifications

1. Go to **https://myaccount.google.com/security**
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App passwords** → https://myaccount.google.com/apppasswords
4. Select: **Mail** and **Windows Computer** (or your device)
5. Copy the generated **16-character password**
6. Create `.env` file in project folder:

```
GMAIL_ADDRESS=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-here
```

Example:
```
GMAIL_ADDRESS=cafe.order@gmail.com
GMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Without Gmail setup:** The app works fine, but emails won't be sent (you'll see messages in console instead)

---

## 🛒 Shopping & Ordering

### 1. **Browse Menu**

- View all items or filter by category
- Search for specific products
- See price and size options

### 2. **Add to Favorites**

- Click ❤️ on any product
- Access favorites anytime from "❤️ Favorites" tab
- Quick add to cart from favorites

### 3. **Add to Cart**

- Click "Add" button
- Select size (S/M/L)
- Choose quantity in cart
- Prices adjust automatically by size

### 4. **Apply Promo Code**

At checkout:
- Enter promo code (e.g., "TEST10")
- Click "Apply"
- Discount applied to total

**Sample Promo Codes:**
- `TEST10` - 10% discount
- `WELCOME20` - 20% discount (for new users)

*(You can add promo codes by inserting directly into SQLite database)*

### 5. **Checkout**

1. Click "Checkout" button
2. Fill in details:
   - Full Name
   - Phone Number
   - Special Notes (optional - e.g., "No sugar", "Extra hot")
   - Promo Code (if applicable)
   - Payment Method (Cash/Card/Bank Transfer)
3. Review order summary
4. Click "Place Order"
5. Get order ID for tracking

---

## 📱 Order History

View all your orders:
- Order ID and creation date
- Order status (Pending/Preparing/Ready/Completed)
- Items list with quantities
- Total amount paid
- Special notes
- Payment method

---

## 🗄️ Database

### Location
```
/Users/hnt_4/GitCloneDestination/SOAFinal/cafe_orders.db
```

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password hash, name, phone) |
| `otp_codes` | OTP codes for registration |
| `orders` | All orders with status, items, total |
| `favorites` | User's favorite products |
| `promo_codes` | Discount codes |

### Reset Database

To start fresh:
```bash
rm cafe_orders.db
python3 app_v2.py
```

---

## 📝 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Send OTP
```
POST /auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify OTP & Register
```
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp_code": "123456",
  "full_name": "John Doe",
  "phone": "0901234567"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Menu Endpoints

#### Get All Items
```
GET /menu
```

#### Get by Category
```
GET /menu/coffee
GET /menu/tea
GET /menu/juice
GET /menu/food
```

#### Search
```
GET /menu/search?q=latte
```

### Favorites Endpoints

#### Add to Favorites
```
POST /favorites/add
{
  "product_id": "cf_1"
}
```

#### Get Favorites
```
GET /favorites?user_id=USER_ID
```

#### Remove from Favorites
```
DELETE /favorites/PRODUCT_ID?user_id=USER_ID
```

### Promo Code Endpoints

#### Validate Promo Code
```
POST /promo/validate
{
  "code": "TEST10"
}
```

### Order Endpoints

#### Create Order
```
POST /checkout
{
  "items": [
    {
      "id": "cf_1",
      "name": "Espresso",
      "price": 25000,
      "size": "M",
      "quantity": 1
    }
  ],
  "customer_name": "John Doe",
  "customer_phone": "0901234567",
  "customer_email": "john@example.com",
  "payment_method": "cash",
  "special_notes": "No sugar",
  "promo_code": "TEST10"
}
```

#### Get Order History
```
GET /orders?user_id=USER_ID
```

#### Get Order Details
```
GET /orders/ORDER_ID
```

#### Update Order Status
```
PUT /orders/ORDER_ID/status?status=preparing
```

---

## 🧪 Testing

### Run Feature Tests

```bash
source .venv/bin/activate
python3 test_features.py
```

This will test:
- ✅ Menu browsing & search
- ✅ User authentication
- ✅ Promo code validation
- ✅ Favorites management
- ✅ Order creation
- ✅ Order status updates

---

## 📊 Project Structure

```
SOAFinal/
├── app_v2.py                 # Main FastAPI backend
├── order_frontend_v2.html    # Frontend UI
├── order_frontend.html       # Symlink to v2
├── cafe_orders.db            # SQLite database
├── requirements.txt          # Python dependencies
├── .env.example              # Gmail configuration template
├── test_features.py          # Feature test suite
├── docker-compose.yml        # Docker configuration
├── Dockerfile                # Docker image
├── start.sh                  # Mac/Linux start script
├── start.bat                 # Windows start script
├── package.json              # npm configuration
├── .venv/                    # Python virtual environment
└── README_v2.md              # This file!
```

---

## 🐳 Docker (Optional)

### Build Image
```bash
docker build -t cafe-ordering:v2 .
```

### Run Container
```bash
docker-compose up
```

Accessible at: **http://localhost:3000**

---

## 🌐 Environment Variables

Create `.env` file:

```
# Gmail Configuration (Optional)
GMAIL_ADDRESS=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Database (Optional - defaults to cafe_orders.db)
DATABASE=cafe_orders.db
```

---

## 🐛 Troubleshooting

### Issue: Server won't start
```bash
# Kill any existing process on port 3000
lsof -i :3000 | tail -n +2 | awk '{print $2}' | xargs -r kill -9

# Then start again
python3 app_v2.py
```

### Issue: Email not sending
- Check `.env` file has correct Gmail credentials
- Make sure 2-Step Verification is enabled on Gmail account
- Use **App Password** (not regular password)
- Check app logs for errors

### Issue: OTP code doesn't work
- OTP expires after 10 minutes
- Request a new OTP if it expires
- Check email spam folder
- Without Gmail setup, OTP is not actually sent (demo mode)

### Issue: Database corrupted
```bash
# Delete database and restart
rm cafe_orders.db
python3 app_v2.py
```

---

## 📈 Demo Checklist

- [ ] Start server: `python3 app_v2.py`
- [ ] Open browser: http://localhost:3000
- [ ] Register with email & OTP
- [ ] Browse menu and search
- [ ] Add items to favorites
- [ ] Add items to cart with different sizes
- [ ] Apply promo code
- [ ] Place order with special notes
- [ ] View order in history
- [ ] Check email for order confirmation

---

## 🎓 Student Project Notes

This system is perfect for demonstrating:
- ✅ Full-stack web development (Frontend + Backend)
- ✅ User authentication & authorization
- ✅ Database design & management
- ✅ RESTful API design
- ✅ Email integration
- ✅ Real-time inventory management
- ✅ Payment integration concepts
- ✅ Business logic implementation

**Complexity Level:** Medium (appropriate for 2nd/3rd year students)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the test script: `python3 test_features.py`
3. Check server logs in console
4. View database directly: `sqlite3 cafe_orders.db`

---

## 📄 License

Educational Use Only

---

**Happy Ordering! ☕🎉**
