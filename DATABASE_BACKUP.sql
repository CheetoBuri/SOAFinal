-- ============================================
-- CAFE ORDERING SYSTEM v2 - DATABASE BACKUP
-- ============================================
-- This file contains the complete database structure
-- Generated: December 1, 2025
-- 
-- 📌 NOTE: This file can be opened and read in any text editor
-- ============================================

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- ============================================
-- TABLE: users
-- ============================================
-- Stores user account information
-- Fields:
--   - id: Unique identifier
--   - email: User email (unique)
--   - password_hash: SHA256 hashed password
--   - full_name: User's full name
--   - phone: User's phone number
--   - created_at: Account creation timestamp

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: otp_codes
-- ============================================
-- Stores One-Time Passwords for authentication
-- Fields:
--   - id: Auto-incremented ID
--   - email: Email to send OTP to
--   - code: 6-digit OTP code
--   - expires_at: When OTP expires
--   - verified: Whether OTP was verified
--   - created_at: When OTP was created

CREATE TABLE otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT 0
);

-- ============================================
-- TABLE: promo_codes
-- ============================================
-- Stores discount promo codes
-- Fields:
--   - id: Unique identifier
--   - code: Promo code string (e.g., "SAVE10")
--   - discount_percent: Discount percentage (0-100)
--   - max_uses: Maximum number of uses (NULL = unlimited)
--   - used_count: Current number of times used
--   - expires_at: When promo code expires
--   - created_at: When code was created

CREATE TABLE promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent REAL NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: orders
-- ============================================
-- Stores customer orders
-- Fields:
--   - id: Unique order ID
--   - user_id: Reference to users table
--   - items: JSON array of order items with details
--   - total: Total order amount
--   - status: Current status (pending/preparing/ready/completed)
--   - special_notes: Customer's special requests/notes
--   - promo_code: Applied promo code
--   - discount: Discount amount applied
--   - payment_method: Payment method (cash/card/bank transfer)
--   - customer_name: Name on order
--   - customer_phone: Contact phone number
--   - created_at: When order was placed

CREATE TABLE orders (
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
);

-- ============================================
-- TABLE: favorites
-- ============================================
-- Stores user's favorite products
-- Fields:
--   - id: Auto-incremented ID
--   - user_id: Reference to users table
--   - product_id: ID of favorite product
--   - added_at: When product was added to favorites

CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- ============================================
-- INDEXES (For Performance Optimization)
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- EXAMPLE DATA (Commented Out)
-- ============================================
-- You can uncomment these to add sample data

-- Sample User
-- INSERT INTO users VALUES (
--     'user_001',
--     'customer@example.com',
--     'hashed_password_here',
--     'John Doe',
--     '+84912345678',
--     '2025-12-01 10:00:00'
-- );

-- Sample Order
-- INSERT INTO orders VALUES (
--     'ORDER_001',
--     'user_001',
--     '[{"name": "Cappuccino", "size": "M", "quantity": 2, "price": 45000}]',
--     90000.0,
--     'completed',
--     'Extra hot please',
--     'SAVE10',
--     9000.0,
--     'cash',
--     'John Doe',
--     '+84912345678',
--     '2025-12-01 10:15:00'
-- );

-- Sample Promo Code
-- INSERT INTO promo_codes VALUES (
--     'promo_001',
--     'SAVE10',
--     10.0,
--     100,
--     25,
--     '2025-12-31',
--     '2025-12-01 09:00:00'
-- );

COMMIT;

-- ============================================
-- DATABASE INFORMATION
-- ============================================
-- Total Tables: 5
-- Total Relationships: Foreign keys linking:
--   - orders.user_id → users.id
--   - favorites.user_id → users.id
--
-- Key Features:
-- ✓ User authentication with OTP
-- ✓ Order management with status tracking
-- ✓ Favorites/wishlist system
-- ✓ Promo code system
-- ✓ Performance indexes on frequently queried fields
-- ✓ Referential integrity with foreign keys
-- ✓ Timestamps for all records
--
-- ============================================
