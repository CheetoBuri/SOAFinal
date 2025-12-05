"""
Database connection and initialization
"""
import sqlite3

DATABASE = "cafe_orders.db"


def get_db():
    """Get database connection with timeout"""
    conn = sqlite3.connect(DATABASE, timeout=30.0, check_same_thread=False)
    return conn


def init_db():
    """Initialize SQLite database from schema.sql"""
    conn = sqlite3.connect(DATABASE)
    
    try:
        # Load and execute schema.sql
        with open("schema.sql", "r") as f:
            schema = f.read()
        conn.executescript(schema)
        conn.commit()
        print(f"✅ Database initialized from schema.sql")
    except FileNotFoundError:
        print("⚠️  schema.sql not found, creating tables manually...")
        # Fallback to manual table creation
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            phone TEXT UNIQUE,
            balance REAL DEFAULT 1000000,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            verified BOOLEAN DEFAULT 0
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS orders (
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
            delivery_district TEXT,
            delivery_ward TEXT,
            delivery_street TEXT,
            payment_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS promo_codes (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            discount_percent REAL NOT NULL,
            max_uses INTEGER,
            used_count INTEGER DEFAULT 0,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS payment_otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            order_id TEXT NOT NULL,
            amount REAL NOT NULL,
            otp_code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            verified BOOLEAN DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            items TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )''')
        conn.commit()
    finally:
        conn.close()


def migrate_add_delivered_at():
    """Add delivered_at column to orders table if it doesn't exist"""
    conn = get_db()
    c = conn.cursor()
    
    try:
        # Check if column exists
        c.execute("PRAGMA table_info(orders)")
        columns = [col[1] for col in c.fetchall()]
        
        if 'delivered_at' not in columns:
            c.execute("ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP")
            conn.commit()
            print("✅ Added 'delivered_at' column to orders table")
        else:
            print("ℹ️  Column 'delivered_at' already exists")
    except Exception as e:
        print(f"⚠️  Migration error: {e}")
    finally:
        conn.close()
