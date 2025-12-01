## ✨ Database Management Update

Anh yêu cầu dùng file `.sql` thay vì tạo table trong code, mình đã hoàn thành:

### 📁 New Files

1. **schema.sql** (SQL schema file)
   - Complete database schema with 5 tables
   - Indexes for performance
   - Constraints and relationships
   - Ready for production use

2. **db_manager.sh** (Database management script)
   - Init, reset, backup, restore
   - View users, orders, favorites
   - Run custom queries
   - Export/import data
   - Interactive shell

3. **DATABASE_GUIDE.md** (Complete guide)
   - How to use db_manager.sh
   - Common tasks
   - Troubleshooting
   - Workflow examples

### ✅ Integration

**app_v2.py now:**
- Loads `schema.sql` on startup
- Automatically creates all tables
- Falls back to manual creation if .sql not found
- Initializes database on first run

### 🚀 Quick Usage

```bash
# View database status
./db_manager.sh status

# Backup
./db_manager.sh backup

# Reset database (fresh start)
./db_manager.sh reset

# View data
./db_manager.sh users
./db_manager.sh orders
./db_manager.sh favorites

# Run query
./db_manager.sh query "SELECT * FROM users;"

# Interactive shell
./db_manager.sh shell

# Get help
./db_manager.sh help
```

### 🎯 Benefits

✓ Schema as code (track changes in git)
✓ Easy to reset anytime
✓ Professional database management
✓ Easy to share & deploy
✓ Backup & restore support
✓ Query tools for debugging
✓ Automated app integration

### 📊 Current Status

- Database: `cafe_orders.db` (88 KB)
- Tables: 5 (initialized from schema.sql)
- Records: Fresh/empty
- Server: Running on port 3000

---

**Everything is ready!** The database now uses proper `.sql` file management! ☕
