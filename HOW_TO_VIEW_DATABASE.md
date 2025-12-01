# 📊 Cách Xem Database cho Thầy

Vì `cafe_orders.db` là file binary nên không thể mở trực tiếp. Dưới đây là các cách để thầy xem dữ liệu database:

## 🔍 Cách 1: Xem qua File .SQL (Dễ nhất) ✅

### File sẵn có:
- **`schema.sql`** - Cấu trúc database (không đổi)
- **`DATABASE_BACKUP.sql`** - Backup đầy đủ (có dữ liệu)
- **`export_*.sql`** - Export database lúc này

### Cách xem:
1. Mở file `.sql` trong VS Code
2. Đọc được trực tiếp vì là text file

**Ưu điểm:**
- ✅ Dễ xem
- ✅ Có comment giải thích
- ✅ Có thể track trong Git

---

## 🎮 Cách 2: Dùng Terminal Commands

### Lệnh đơn giản:
```bash
# Xem tóm tắt
./db_manager.sh status

# Xem users
./db_manager.sh users

# Xem orders
./db_manager.sh orders

# Xem favorites
./db_manager.sh favorites

# Chạy lệnh SQL tùy ý
./db_manager.sh query "SELECT * FROM users"
./db_manager.sh query "SELECT * FROM orders WHERE status='completed'"
```

---

## 💻 Cách 3: Dùng SQLite Shell

```bash
# Vào interactive shell
./db_manager.sh shell

# Hoặc trực tiếp
sqlite3 cafe_orders.db
```

Sau đó gõ lệnh SQL:
```sql
.tables                    -- Xem danh sách bảng
.schema users              -- Xem cấu trúc bảng users
SELECT * FROM users;       -- Xem tất cả users
SELECT * FROM orders;      -- Xem tất cả orders
.quit                      -- Thoát
```

---

## 📱 Cách 4: Extension SQLite cho VS Code

Cài extension "SQLite" để xem trực tiếp trong VS Code:
1. Mở VS Code
2. Đi đến Extensions (Cmd+Shift+X)
3. Tìm "SQLite" by alexcvzz
4. Cài đặt
5. Right-click `cafe_orders.db` → "Open in SQLite Explorer"

---

## 📝 Tóm tắt cho Thầy

**Khi trình bày:**

### 1. Giới thiệu cấu trúc:
```bash
# Mở file để thầy xem cấu trúc
cat schema.sql
```

### 2. Giới thiệu dữ liệu:
```bash
# Chạy các lệnh này để thầy thấy dữ liệu
./db_manager.sh status
./db_manager.sh users
./db_manager.sh orders
./db_manager.sh favorites
```

### 3. Chi tiết hơn:
```bash
# Nếu muốn xem code SQL
cat DATABASE_BACKUP.sql
```

---

## ✅ Khuyến nghị

**Để trình bày chuyên nghiệp:**
1. **Mở terminal** → chạy `./db_manager.sh status`
2. **Mở VS Code** → mở file `schema.sql` để thầy xem cấu trúc
3. **Mở terminal** → chạy `./db_manager.sh query "SELECT * FROM ..."` để demo

Thầy sẽ thấy:
- ✅ Database structure (bảng, cột, kiểu dữ liệu)
- ✅ Dữ liệu thực tế
- ✅ Mối quan hệ giữa các bảng

---

## 🎁 Lợi ích của Thiết kế Này

| Aspect | Lợi ích |
|--------|---------|
| **schema.sql** | Có thể track trong Git, dễ reset DB |
| **cafe_orders.db** | Binary file, nhỏ gọn, lưu trữ hiệu quả |
| **db_manager.sh** | Công cụ quản lý dễ dùng, không cần SQL knowledge |
| **DATABASE_BACKUP.sql** | Backup text-based, dễ xem, dễ chia sẻ |

---

**Kết luận:** Thiết kế này vừa chuyên nghiệp vừa dễ trình bày cho thầy! 🚀
