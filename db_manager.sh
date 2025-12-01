#!/bin/bash

# ============================================
# Cafe Ordering System - Database Manager
# ============================================

DB_FILE="cafe_orders.db"
SCHEMA_FILE="schema.sql"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "☕ Cafe Ordering System - Database Manager"
echo "=========================================="
echo ""

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

case "${1:-help}" in
    init)
        echo -e "${YELLOW}📝 Initializing database...${NC}"
        sqlite3 "$DB_FILE" < "$SCHEMA_FILE"
        echo -e "${GREEN}✅ Database initialized!${NC}"
        echo "Schema file: $SCHEMA_FILE"
        ;;
    
    reset)
        echo -e "${YELLOW}⚠️  Resetting database...${NC}"
        
        # Backup first
        if [ -f "$DB_FILE" ]; then
            cp "$DB_FILE" "$BACKUP_DIR/backup_before_reset_${TIMESTAMP}.db"
            echo "✅ Backup created: $BACKUP_DIR/backup_before_reset_${TIMESTAMP}.db"
        fi
        
        # Delete and recreate
        rm -f "$DB_FILE"
        sqlite3 "$DB_FILE" < "$SCHEMA_FILE"
        echo -e "${GREEN}✅ Database reset complete!${NC}"
        ;;
    
    backup)
        echo -e "${YELLOW}💾 Backing up database...${NC}"
        BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.db"
        cp "$DB_FILE" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup created:${NC}"
        echo "   $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
        ;;
    
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Please specify backup file${NC}"
            echo "Usage: $0 restore <backup_file>"
            echo ""
            echo "Available backups:"
            ls -lh "$BACKUP_DIR"
            exit 1
        fi
        
        if [ ! -f "$2" ]; then
            echo -e "${RED}❌ Error: Backup file not found: $2${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}📥 Restoring from backup...${NC}"
        cp "$2" "$DB_FILE"
        echo -e "${GREEN}✅ Database restored!${NC}"
        ls -lh "$DB_FILE"
        ;;
    
    status)
        echo -e "${YELLOW}📊 Database Status:${NC}"
        echo ""
        
        if [ ! -f "$DB_FILE" ]; then
            echo -e "${RED}❌ Database not found: $DB_FILE${NC}"
            exit 1
        fi
        
        echo "📁 File: $DB_FILE"
        ls -lh "$DB_FILE"
        echo ""
        
        echo "📋 Tables:"
        sqlite3 "$DB_FILE" ".tables"
        echo ""
        
        echo "📊 Record Count:"
        sqlite3 "$DB_FILE" << EOF
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Orders: ' || COUNT(*) FROM orders;
SELECT 'Favorites: ' || COUNT(*) FROM favorites;
SELECT 'OTP Codes: ' || COUNT(*) FROM otp_codes;
SELECT 'Promo Codes: ' || COUNT(*) FROM promo_codes;
EOF
        ;;
    
    query)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Please specify SQL query${NC}"
            echo "Usage: $0 query \"SELECT * FROM users;\""
            exit 1
        fi
        
        echo -e "${YELLOW}🔍 Executing query...${NC}"
        echo ""
        sqlite3 -header -column "$DB_FILE" "$2"
        echo ""
        ;;
    
    clear)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Specify table (users|orders|favorites|otp_codes|promo_codes)${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}⚠️  Clearing table: $2${NC}"
        sqlite3 "$DB_FILE" "DELETE FROM $2;"
        echo -e "${GREEN}✅ Table cleared!${NC}"
        ;;
    
    users)
        echo -e "${YELLOW}👥 Users in Database:${NC}"
        echo ""
        sqlite3 -header -column "$DB_FILE" "SELECT id, email, full_name, phone, created_at FROM users;"
        echo ""
        ;;
    
    orders)
        echo -e "${YELLOW}📦 Orders in Database:${NC}"
        echo ""
        sqlite3 -header -column "$DB_FILE" "SELECT id, user_id, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"
        echo ""
        ;;
    
    favorites)
        echo -e "${YELLOW}❤️ Favorites in Database:${NC}"
        echo ""
        sqlite3 -header -column "$DB_FILE" "SELECT user_id, product_id, added_at FROM favorites;"
        echo ""
        ;;
    
    shell)
        echo -e "${YELLOW}🐚 Opening SQLite shell...${NC}"
        echo "Tip: Use .help for commands, .quit to exit"
        echo ""
        sqlite3 "$DB_FILE"
        ;;
    
    export)
        if [ -z "$2" ]; then
            EXPORT_FILE="export_${TIMESTAMP}.sql"
        else
            EXPORT_FILE="$2"
        fi
        
        echo -e "${YELLOW}📤 Exporting database...${NC}"
        sqlite3 "$DB_FILE" ".dump" > "$EXPORT_FILE"
        echo -e "${GREEN}✅ Database exported to:${NC}"
        echo "   $EXPORT_FILE"
        ls -lh "$EXPORT_FILE"
        ;;
    
    import)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Error: Please specify SQL file${NC}"
            exit 1
        fi
        
        if [ ! -f "$2" ]; then
            echo -e "${RED}❌ Error: File not found: $2${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}📥 Importing SQL file...${NC}"
        sqlite3 "$DB_FILE" < "$2"
        echo -e "${GREEN}✅ Import complete!${NC}"
        ;;
    
    help)
        cat << EOF
☕ Cafe Ordering Database Manager
Usage: $0 <command> [options]

COMMANDS:
  init              Initialize database from schema.sql
  reset             Reset database (backs up first)
  backup            Create backup of current database
  restore <file>    Restore from backup file
  status            Show database status & record count
  query <sql>       Execute custom SQL query
  clear <table>     Clear all records from table
  
VIEW DATA:
  users             Show all users
  orders            Show latest orders
  favorites         Show all favorites
  
DATABASE OPERATIONS:
  shell             Open SQLite shell
  export [file]     Export database to SQL file
  import <file>     Import from SQL file
  help              Show this help

EXAMPLES:
  $0 init                                    # Initialize new database
  $0 backup                                  # Create backup
  $0 status                                  # Show database info
  $0 query "SELECT * FROM users;"            # Run query
  $0 reset                                   # Reset database
  $0 restore backups/backup_20251201.db      # Restore from backup
  $0 users                                   # List all users
  $0 orders                                  # List recent orders
  $0 export data.sql                         # Export to SQL file
  $0 import data.sql                         # Import from SQL file
  $0 clear orders                            # Delete all orders
  $0 shell                                   # Open interactive shell

BACKUP LOCATION:
  $BACKUP_DIR/

EOF
        ;;
    
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
