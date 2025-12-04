> Note (Dec 2025): Một số tham chiếu đến phiên bản monolithic cũ đã bị loại bỏ. Vui lòng dùng `app.py` + `index.html` (serve tại `/`), health: `/health`.

# 📊 Database Management Guide

This guide explains how to manage the Cafe Ordering System database using the provided tools.

## Files

- **`schema.sql`** - Database schema definition (tables, indexes, constraints)
- **`db_manager.sh`** - Database management script (backup, restore, query, etc.)
- **`cafe_orders.db`** - Actual SQLite database file

## Quick Start

### View Database Status
```bash
./db_manager.sh status
```

Shows:
- Database file info
- All tables
- Record count for each table

### View Data

**Show all users:**
```bash
./db_manager.sh users
```

**Show recent orders:**
```bash
./db_manager.sh orders
```

**Show all favorites:**
```bash
./db_manager.sh favorites
```

## Database Operations

### Initialize Database

Create a fresh database from schema:
```bash
./db_manager.sh init
```

### Reset Database

Delete all data and start fresh (backs up first):
```bash
./db_manager.sh reset
```

This will:
1. Create backup in `backups/` folder
2. Delete current database
3. Create fresh database from `schema.sql`

### Backup & Restore

**Create a backup:**
```bash
./db_manager.sh backup
```

Creates file like: `backups/backup_20251201_103045.db`

**Restore from backup:**
```bash
./db_manager.sh restore backups/backup_20251201_103045.db
```

## Advanced Operations

### Run Custom SQL Query

```bash
./db_manager.sh query "SELECT * FROM users WHERE email LIKE '%@gmail.com';"
```

### Clear a Table

Delete all records from a table:
```bash
./db_manager.sh clear orders      # Clear all orders
./db_manager.sh clear users       # Clear all users
./db_manager.sh clear favorites   # Clear all favorites
```

### Interactive SQLite Shell

Open SQLite shell for advanced queries:
```bash
./db_manager.sh shell
```

Commands:
- `.tables` - Show all tables
- `.schema` - Show schema
- `.help` - Show help
- `.quit` - Exit

Examples in shell:
```sql
SELECT * FROM users;
SELECT COUNT(*) FROM orders;
DELETE FROM orders WHERE status = 'completed';
.mode column
.headers on
SELECT * FROM orders;
```

### Export Database

Export to SQL file (for backup or sharing):
```bash
./db_manager.sh export              # Creates export_TIMESTAMP.sql
./db_manager.sh export backup.sql   # Creates backup.sql
```

### Import Database

Import from SQL file:
```bash
./db_manager.sh import backup.sql
```

## Schema Details

### Tables

#### `users`
```sql
id              TEXT PRIMARY KEY
email           TEXT UNIQUE NOT NULL
password_hash   TEXT NOT NULL
full_name       TEXT
phone           TEXT
created_at      TIMESTAMP
```

#### `otp_codes`
```sql
id              INTEGER PRIMARY KEY
email           TEXT NOT NULL
code            TEXT NOT NULL
expires_at      TIMESTAMP NOT NULL
verified        BOOLEAN (0 or 1)
created_at      TIMESTAMP
```

#### `orders`
```sql
id              TEXT PRIMARY KEY (e.g., "A6969695")
user_id         TEXT (FOREIGN KEY)
items           TEXT (JSON format)
total           REAL (amount in VND)
status          TEXT (pending, preparing, ready, completed, cancelled)
special_notes   TEXT
promo_code      TEXT
discount        REAL (discount amount)
payment_method  TEXT (cash, card, bank_transfer)
customer_name   TEXT
customer_phone  TEXT
created_at      TIMESTAMP
```

#### `favorites`
```sql
id              INTEGER PRIMARY KEY
user_id         TEXT (FOREIGN KEY)
product_id      TEXT (e.g., "cf_1")
added_at        TIMESTAMP
```

#### `promo_codes`
```sql
id              TEXT PRIMARY KEY
code            TEXT UNIQUE (e.g., "TEST10")
discount_percent REAL (e.g., 10.0)
max_uses        INTEGER (total allowed uses)
used_count      INTEGER (times used so far)
expires_at      TIMESTAMP
created_at      TIMESTAMP
```

## Common Tasks

### Add Promo Code

Open shell:
```bash
./db_manager.sh shell
```

Then insert:
```sql
INSERT INTO promo_codes (id, code, discount_percent, max_uses)
VALUES ('promo_1', 'WELCOME20', 20.0, 100);
```

### Check User's Orders

```bash
./db_manager.sh query "SELECT * FROM orders WHERE user_id = 'USER_ID_HERE';"
```

### Get Order Statistics

```bash
./db_manager.sh query "
SELECT 
  status,
  COUNT(*) as count,
  AVG(total) as avg_total,
  SUM(total) as total_revenue
FROM orders
GROUP BY status;
"
```

### Find Top Customers

```bash
./db_manager.sh query "
SELECT 
  customer_name,
  COUNT(*) as order_count,
  SUM(total) as total_spent
FROM orders
GROUP BY customer_name
ORDER BY total_spent DESC
LIMIT 10;
"
```

## Troubleshooting

### Database is locked

If you get "database is locked" error:
1. Make sure app is not running
2. Kill any SQLite processes: `pkill sqlite3`
3. Try again

### Can't find schema.sql

Make sure you're in the project directory:
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
./db_manager.sh status
```

### Backup folder not found

Creates automatically:
```bash
mkdir -p backups
./db_manager.sh backup
```

## Application Integration

The app automatically:
1. Loads `schema.sql` on startup
2. Creates tables if they don't exist
3. Uses `cafe_orders.db` for all data

When starting the app:
```bash
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```

It will:
- Check if `cafe_orders.db` exists
- Load `schema.sql` if needed
- Initialize all tables
- Start serving on port 3000

## Workflow Example

**Day 1: Setup**
```bash
./db_manager.sh init          # Create fresh database
uvicorn app:app --host 0.0.0.0 --port 3000 --reload   # Start server
```

**Day 5: Backup**
```bash
./db_manager.sh backup        # Create backup
```

**Day 10: Need to reset**
```bash
./db_manager.sh reset         # Resets (keeps backup from day 5)
```

**Day 15: Restore old data**
```bash
./db_manager.sh restore backups/backup_20251205.db
```

## Tips

1. **Always backup before reset:**
   ```bash
   ./db_manager.sh backup
   ./db_manager.sh reset
   ```

2. **Check status before changes:**
   ```bash
   ./db_manager.sh status
   ```

3. **Export important data:**
   ```bash
   ./db_manager.sh export production_backup.sql
   ```

4. **Use queries to verify:**
   ```bash
   ./db_manager.sh query "SELECT COUNT(*) FROM orders;"
   ```

## Help

For full command list:
```bash
./db_manager.sh help
```

Or:
```bash
./db_manager.sh     # Shows help
```

---

**Happy database management!** 🗄️
