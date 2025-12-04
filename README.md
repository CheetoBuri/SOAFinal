# ☕ Cafe Ordering System v2

A modern web-based cafe ordering system built with FastAPI (Python) and vanilla JavaScript. Features user authentication with OTP, order management, favorites, promo codes, and email notifications.

## ✨ Features

- **User Authentication**: OTP-based registration and login via Gmail
- **Menu Management**: Browse products by category with search functionality
- **Shopping Cart**: Add items with size selection and quantity controls
- **Order Management**: Create orders with special notes and payment method selection
- **Order History**: Track all orders with real-time status updates
- **Favorites**: Save and manage favorite items
- **Promo Codes**: Apply discount codes to orders
- **Email Notifications**: Automated order confirmations via Gmail SMTP
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pip (Python package manager)

### Installation

1. **Setup virtual environment:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment (optional - for email notifications):**
```bash
cp .env.example .env
# Edit .env with your Gmail credentials
```

4. **Start the server:**
```bash
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
# hoặc dùng script có sẵn
./run.sh
```

5. **Open in browser:**
```
http://localhost:3000
```

## 📂 Project Structure

```
SOAFinal/
├── app.py                 # Main FastAPI application
├── index.html             # Refactored frontend served at '/'
├── frontend/              # CSS/JS assets (modular)
├── models/                # Pydantic models
├── routers/               # API routers (auth, menu, orders, ...)
├── utils/                 # Helpers (email, timezone, menu data)
├── database.py            # DB init helpers
├── schema.sql             # Database schema
├── requirements.txt       # Python dependencies
├── docker-compose.yml     # Docker compose config
└── Dockerfile             # Container image definition
```

## 🛠️ Database Management

The project includes a professional database management tool:

```bash
# Check database status
./db_manager.sh status

# View users, orders, favorites
./db_manager.sh users
./db_manager.sh orders
./db_manager.sh favorites

# Create backup
./db_manager.sh backup

# Reset database (auto-backs up first)
./db_manager.sh reset

# Open interactive SQL shell
./db_manager.sh shell

# Execute custom SQL query
./db_manager.sh query "SELECT * FROM users"

# Show all commands
./db_manager.sh help
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and register user
- `POST /api/auth/login` - Login with email and password

### Menu
- `GET /api/menu` - Get all products
- `GET /api/menu/category/{category}` - Get products by category
- `GET /api/menu/search` - Search products

### Orders
- `POST /api/orders/checkout` - Create new order
- `GET /api/orders/history` - Get user's order history
- `GET /api/orders/{order_id}` - Get order details
- `PUT /api/orders/{order_id}/status` - Update order status

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add item to favorites
- `DELETE /api/favorites/{product_id}` - Remove from favorites

### Promo
- `POST /api/promo/validate` - Validate promo code

### Health
- `GET /health` - Check server status

## 🗄️ Database Schema

### Tables
- **users**: User accounts with email, password hash, phone, name
- **otp_codes**: One-time passwords for registration
- **orders**: Order records with items, status, total, payment method
- **favorites**: User's favorite products
- **promo_codes**: Available discount codes with usage tracking

## 🧪 Testing

Run the comprehensive test suite:

```bash
python3 test_features.py
```

This tests:
- User registration and login
- Product browsing and search
- Shopping cart functionality
- Order creation and status updates
- Favorites management
- Promo code validation
- Email notifications

## ⚙️ Configuration

### Environment Variables (.env)

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
GMAIL_SMTP_SERVER=smtp.gmail.com
GMAIL_SMTP_PORT=587
```

**Note:** Use Gmail App Password, not your regular password. [Generate one here](https://myaccount.google.com/apppasswords)

## 📦 Dependencies

- **FastAPI** 0.123.0 - Web framework
- **Uvicorn** 0.28.0 - ASGI server
- **Pydantic** 2.4.2 - Data validation
- **python-dotenv** 1.0.1 - Environment configuration

Install all: `pip install -r requirements.txt`

## 🐳 Deployment

### Docker (Optional)

The project is Docker-ready. Customize `docker-compose.yml` as needed.

### Production Checklist

- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure environment variables for production
- [ ] Enable HTTPS/SSL
- [ ] Set up proper error logging
- [ ] Configure backup strategy
- [ ] Set up monitoring

See `DEPLOYMENT_CHECKLIST.txt` for detailed steps.

## 📖 Documentation

- **README_V2_COMPLETE.md** - Full feature documentation
- **DATABASE_GUIDE.md** - Database operations and management
- **QUICK_START_V2.txt** - Quick reference for developers
- **IMPLEMENTATION_SUMMARY.txt** - Technical architecture details

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -i :3000 | xargs kill -9
```

### Database issues
```bash
# Reset database (creates backup first)
./db_manager.sh reset

# Check database status
./db_manager.sh status
```

### Email not sending
- Verify Gmail credentials in `.env`
- Use Gmail App Password (not regular password)
- Check `GMAIL_USER` and `GMAIL_PASSWORD` are set correctly
- Email logging is available in console if not configured

## 📝 License

This project is part of SOA course assignment.

## 👨‍💻 Support

For issues or questions, refer to:
1. `DATABASE_GUIDE.md` - Database operations
2. `README_V2_COMPLETE.md` - Feature documentation
3. `QUICK_START_V2.txt` - Common tasks

---

**Version:** 2.0  
**Last Updated:** December 1, 2025  
**Status:** Production Ready ✅
