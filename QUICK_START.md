# 🚀 QUICK START GUIDE

## ✅ Hệ thống đã sẵn sàng!

### 📱 Truy cập ngay

#### 1️⃣ **Web Interface** (Frontend)
```
http://localhost:3000
```
Giao diện chính để tương tác với hệ thống POS

#### 2️⃣ **Swagger API Documentation** 
```
http://localhost:3000/docs
```
Tài liệu API tương tác - test các endpoint trực tiếp

#### 3️⃣ **ReDoc API Documentation**
```
http://localhost:3000/redoc
```
Tài liệu API thay thế với layout khác

---

## 🛠️ Cách Chạy Server

### **Cách 1: Chạy với Python trực tiếp (Nhanh nhất)**

```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
/Users/hnt_4/GitCloneDestination/SOAFinal/.venv/bin/python app.py
```

Server sẽ chạy tại: `http://localhost:3000`

### **Cách 2: Chạy với start script (Mac/Linux)**

```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
bash start.sh up
```

### **Cách 3: Chạy với Docker**

```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
docker-compose up --build
```

### **Cách 4: Chạy với npm**

```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
npm start
```

---

## 📊 Test API

### **Lấy Menu Có Sẵn**
```bash
curl http://localhost:3000/api/menu/available
```

**Response:**
```json
{
  "available_items": [
    {
      "id": "coffee_black",
      "name": "Cà phê Đen",
      "price": 25000,
      "recipe": {"boiCafe": 2},
      "available": true
    },
    ...
  ]
}
```

### **Lấy Tồn Kho**
```bash
curl http://localhost:3000/api/inventory
```

### **Thêm Một Món Vào Đơn**
```bash
curl -X POST http://localhost:3000/api/order/add \
  -H "Content-Type: application/json" \
  -d '{"menu_id": "coffee_black"}'
```

### **Xem Đơn Hàng Hiện Tại**
```bash
curl http://localhost:3000/api/order
```

### **Thanh Toán**
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"method": "cash"}'
```

---

## 🎯 Các Endpoint API Chính

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| `GET` | `/api/health` | Kiểm tra trạng thái server |
| `GET` | `/api/menu` | Lấy toàn bộ menu |
| `GET` | `/api/menu/available` | Lấy menu có sẵn |
| `GET` | `/api/inventory` | Lấy tồn kho |
| `GET` | `/api/inventory/simulated` | Ước tính kho sau đơn |
| `GET` | `/api/order` | Lấy đơn hàng hiện tại |
| `POST` | `/api/order/add` | Thêm món vào đơn |
| `DELETE` | `/api/order/{menu_id}` | Xóa món khỏi đơn |
| `DELETE` | `/api/order` | Xóa toàn bộ đơn |
| `POST` | `/api/payment` | Xử lý thanh toán |
| `POST` | `/api/inventory/restock` | Nhập thêm nguyên liệu |
| `GET` | `/api/statistics` | Lấy thống kê |

---

## 📁 Cấu Trúc Dự Án

```
SOAFinal/
├── app.py                  # FastAPI backend chính
├── cafe_pos_system.py      # Logic hệ thống POS
├── frontend.html           # Giao diện web
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose
├── requirements.txt        # Python dependencies
├── start.sh               # Start script (Mac/Linux)
├── start.bat              # Start script (Windows)
├── package.json           # npm scripts
├── README.md              # Documentation
└── QUICK_START.md         # File này
```

---

## 🧪 Test Sơ Bộ Workflow

### Scenario: Khách gọi 2 ly Cà phê Đen + 1 ly Latte

**1. Xem menu có sẵn:**
```bash
curl http://localhost:3000/api/menu/available
```

**2. Thêm 1 ly Cà phê Đen:**
```bash
curl -X POST http://localhost:3000/api/order/add \
  -H "Content-Type: application/json" \
  -d '{"menu_id": "coffee_black"}'
```

**3. Thêm 1 ly Cà phê Đen nữa (tăng quantity lên 2):**
```bash
curl -X POST http://localhost:3000/api/order/add \
  -H "Content-Type: application/json" \
  -d '{"menu_id": "coffee_black"}'
```

**4. Thêm 1 ly Latte:**
```bash
curl -X POST http://localhost:3000/api/order/add \
  -H "Content-Type: application/json" \
  -d '{"menu_id": "latte"}'
```

**5. Xem đơn hàng:**
```bash
curl http://localhost:3000/api/order
```

**6. Ước tính kho sau đơn:**
```bash
curl http://localhost:3000/api/inventory/simulated
```

**7. Thanh toán tiền mặt:**
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"method": "cash"}'
```

**8. Kiểm tra kho sau thanh toán:**
```bash
curl http://localhost:3000/api/inventory
```

---

## 🛑 Dừng Server

### Mac/Linux
```bash
pkill -f "python app.py"
```

### Windows
```bash
taskkill /F /IM python.exe
```

Hoặc dùng script:
```bash
bash start.sh down
```

---

## 📋 Các Menu & Công Thức

| Tên Món | Giá | Thành Phần | Số Lượng |
|---------|-----|-----------|---------|
| **Cà phê Đen** | 25,000 VNĐ | Bột Cafe | 2 Shot |
| **Cà phê Sữa** | 30,000 VNĐ | Bột Cafe + Sữa Đặc | 1 Shot + 1 Phần |
| **Bạc Xỉu** | 28,000 VNĐ | Bột Cafe + Sữa Đặc | 0.5 Shot + 1.5 Phần |
| **Latte** | 35,000 VNĐ | Bột Cafe + Sữa Tươi | 1 Shot + 1 Phần |

---

## 📦 Quy Đổi Đơn Vị

| Nguyên Liệu | Đơn Vị Nhập | Tỷ Lệ Quy Đổi |
|------------|-----------|--------------|
| Bột Cafe | Gói (1kg) | = 50 Shot |
| Sữa Đặc | Lon (380g) | = 12 Phần |
| Sữa Tươi | Hộp (1L) | = 5 Phần |

---

## 🎨 Giao Diện Web

Frontend được tạo bằng HTML5, CSS3, JavaScript vanilla với các tính năng:

- ✅ Hiển thị menu động (chỉ món đủ nguyên liệu)
- ✅ Quản lý đơn hàng (thêm/xóa/cập nhật)
- ✅ Hiển thị ước tính kho real-time
- ✅ Cảnh báo 3 màu (🟢 OK, 🟡 Warning, 🔴 Out of Stock)
- ✅ Thanh toán linh hoạt
- ✅ Giao diện responsive

---

## 💡 Tips & Tricks

### 1. **View logs trong real-time**
```bash
bash start.sh logs
```

### 2. **Truy cập shell trong container (nếu dùng Docker)**
```bash
bash start.sh shell
```

### 3. **Reset toàn bộ (nếu có Docker)**
```bash
bash start.sh clean
```

### 4. **Kiểm tra port 3000 có bị chiếm không**
```bash
lsof -i :3000
```

---

## ⚠️ Troubleshooting

### **Port 3000 đang được sử dụng**
```bash
# Tìm process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### **Module import error**
```bash
# Cài lại dependencies
pip install -r requirements.txt
```

### **Permission denied trên start.sh**
```bash
chmod +x start.sh
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra server chạy: `curl http://localhost:3000/api/health`
2. Xem logs: `bash start.sh logs`
3. Restart server: `bash start.sh restart`

---

**✨ Happy Coding! Hệ thống POS Cafe của bạn đã sẵn sàng! ✨**
