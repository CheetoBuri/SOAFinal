# ☕ Hệ Thống Quản Lý Quán Cafe - POS System

Một hệ thống Point of Sale (POS) đầy đủ cho quán cafe, với khả năng kiểm tra kho real-time, trừ kho tự động, và thanh toán linh hoạt.

## 🛠️ Công Nghệ

- **Backend**: FastAPI (Python 3.13)
- **Frontend**: HTML5, CSS3, JavaScript
- **API**: RESTful API với Swagger UI
- **Container**: Docker & Docker Compose
- **Port**: 3000

## 🚀 Cách Chạy Nhanh

### Với Docker (Khuyến nghị)

```bash
# Mac/Linux
bash start.sh up

# Windows
start.bat up
```

**Xong!** Truy cập http://localhost:3000

### Hoặc dùng npm

```bash
npm start
```

### Hoặc Python trực tiếp

```bash
pip install -r requirements.txt
python app.py
```

## 🌐 Truy Cập

- **Web**: http://localhost:3000
- **Swagger API**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## 🎯 Tính Năng Chính

### 1. ✅ Quản Lý Menu Động
- Hiển thị chỉ những món **đủ nguyên liệu** để làm
- Các món hết nguyên liệu sẽ **bị khóa** (không thể chọn)
- Tự động cập nhật khi nguyên liệu thay đổi

### 2. 📊 Kiểm Tra Kho Real-Time
- **Cơ chế 3 màu**:
  - 🟢 **Xanh**: Tồn kho đủ (> 2 phần)
  - 🟡 **Vàng**: Cảnh báo (≤ 2 phần)
  - 🔴 **Đỏ**: Hết hàng (= 0)
- Ước tính nguyên liệu còn lại **sau khi hoàn tất đơn**

### 3. 🛒 Quản Lý Đơn Hàng
- Thêm/xóa món khỏi đơn
- Tính tổng tiền tự động
- **Kiểm tra kho trước khi order** - chặn nếu không đủ

### 4. 💳 Thanh Toán
- 2 phương thức: **Tiền Mặt** & **Chuyển Khoản**
- **Trừ kho tự động** sau thanh toán
- Thống kê doanh thu theo ngày

### 5. 📈 Nguyên Liệu & Quy Đổi
- **Bột Cafe**: 1 Gói (1kg) = 50 Shot
- **Sữa Đặc**: 1 Lon (380g) = 12 Phần
- **Sữa Tươi**: 1 Hộp (1L) = 5 Phần

### 6. 🍽️ Menu Mẫu
- ☕ **Cà phê Đen** (25k): 2 Shot Cafe
- ☕ **Cà phê Sữa** (30k): 1 Shot + 1 Phần Sữa Đặc
- ☕ **Bạc Xỉu** (28k): 0.5 Shot + 1.5 Phần Sữa Đặc
- ☕ **Latte** (35k): 1 Shot + 1 Phần Sữa Tươi

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu
- Python 3.8+
- pip

### Bước 1: Cài đặt Dependencies
```bash
pip install -r requirements.txt
```

### Bước 2: Chạy Backend Server
```bash
python app.py
```

Server sẽ chạy trên **http://localhost:3000**

### Bước 3: Mở Frontend
1. Mở trình duyệt
2. Truy cập: **http://localhost:3000/frontend.html**
3. Hoặc xem **API Documentation**: **http://localhost:3000/docs**

## 📚 API Documentation

Tất cả API endpoint được tài liệu hóa bằng **Swagger/OpenAPI**.

### Truy cập Swagger UI
```
http://localhost:3000/docs
```

### Các Endpoint Chính

#### Menu
- `GET /api/menu` - Lấy danh sách menu
  - Query: `simulated=true` - Menu sau khi ước tính kho đơn hiện tại

#### Kho Hàng
- `GET /api/inventory` - Lấy tồn kho hiện tại
- `POST /api/restock` - Nhập thêm nguyên liệu

#### Đơn Hàng
- `GET /api/order` - Lấy đơn hàng hiện tại
- `POST /api/order/add?menu_id=...` - Thêm mon vào đơn
- `POST /api/order/remove?menu_id=...` - Xóa mon khỏi đơn
- `POST /api/order/clear` - Hủy đơn hàng

#### Thanh Toán
- `POST /api/payment` - Xử lý thanh toán
  - Body: `{"method": "cash"}` hoặc `{"method": "bank"}`

#### Thống Kê
- `GET /api/statistics` - Lấy thống kê hôm nay

## 🏗️ Cấu Trúc Dự Án

```
SOAFinal/
├── app.py                 # Backend FastAPI
├── frontend.html          # Frontend HTML/JS
├── cafe_pos_system.py     # CLI version (Python thuần)
├── requirements.txt       # Dependencies
├── index.html            # HTML demo không backend
└── README.md             # Tài liệu này
```

## 💡 Ví Dụ Sử Dụng

### 1. Lấy Menu Hiện Có
```bash
curl http://localhost:3000/api/menu?simulated=false
```

**Response:**
```json
[
  {
    "id": "coffee_black",
    "name": "Cà phê Đen",
    "price": 25000,
    "recipe": {"boiCafe": 2},
    "available": true
  },
  ...
]
```

### 2. Thêm Món vào Đơn
```bash
curl -X POST http://localhost:3000/api/order/add?menu_id=coffee_black
```

### 3. Thanh Toán Tiền Mặt
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"method": "cash"}'
```

## 🔍 Kiểm Tra Hệ Thống

### Test Thêm Đơn
1. Mở Frontend
2. Click vào "Cà phê Đen" → Thêm vào đơn
3. Click lại "Cà phê Đen" → Tăng lên 2 ly
4. Nhìn phần "TỒN KHO" → Cập nhật ước tính

### Test Hết Nguyên Liệu
1. Thêm nhiều đơn cho đến khi hết Sữa Tươi
2. Khi đó "Latte" sẽ chuyển thành **❌ HẾT** (không thể chọn)
3. Menu sẽ tự động cập nhật

### Test Thanh Toán
1. Thêm một số món vào đơn
2. Click "💳 THANH TOÁN"
3. Chọn "💰 Tiền Mặt" hoặc "🏦 Chuyển Khoản"
4. Kho sẽ **tự động trừ** theo công thức
5. Thống kê doanh thu sẽ **cập nhật**

## 🎨 Giao Diện

- **3 khu vực chính**: Menu (trái), Đơn hàng (giữa), Tồn kho (phải)
- **Responsive design**: Tự động responsive trên mobile
- **Dark mode sidebar** + Light POS area
- **Real-time updates**: Cập nhật 5 giây một lần

## 🔧 Phát Triển Thêm

### Thêm Nguyên Liệu Mới
Sửa trong `app.py`, hàm `CafePOSBackend.__init__()`:
```python
self.ingredients['newId'] = Ingredient(
    name='Tên',
    unit='Đơn vị',
    conversion_rate=số,
    purchase_unit='Đơn vị nhập',
    quantity=100
)
```

### Thêm Món Mới
Sửa trong `app.py`:
```python
self.menu['menu_id'] = {
    'name': 'Tên Món',
    'price': 30000,
    'recipe': {'boiCafe': 1, 'suaDac': 1},
    'description': '...'
}
```

## 📝 Ghi Chú

- Mỗi lần thanh toán, kho sẽ **trừ ngay lập tức**
- Menu **tự động cập nhật** khi có thay đổi kho
- Thống kê lưu trong **memory** (sẽ reset khi restart server)

## 👨‍💼 Yêu Cầu Của Giảng Viên

✅ Backend Python (FastAPI)
✅ Frontend HTML
✅ Port 3000
✅ API Swagger tự động (`/docs`)
✅ Kiểm tra kho trước order
✅ Trừ kho tự động
✅ Cảnh báo 3 màu (🟢🟡🔴)
✅ Ước tính nguyên liệu
✅ Thanh toán 2 cách

---

**Tác Giả**: Your Name
**Ngày Tạo**: 2025-12-01
**Phiên Bản**: 1.0.0