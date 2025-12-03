# Frontend Refactoring - Cafe Ordering System

## 📁 Cấu trúc mới (Refactored Structure)

```
SOAFinal/
├── frontend/
│   ├── css/                    # CSS Modules
│   │   ├── base.css           # Base styles & layout
│   │   ├── header.css         # Header component styles
│   │   ├── sidebar.css        # Sidebar & categories
│   │   ├── products.css       # Product cards & grid
│   │   ├── cart.css           # Shopping cart sidebar
│   │   ├── modal.css          # Modal dialogs
│   │   ├── auth.css           # Authentication screens
│   │   ├── orders.css         # Order history & status
│   │   ├── profile.css        # User profile
│   │   └── responsive.css     # Responsive breakpoints
│   │
│   └── js/                     # JavaScript Modules
│       ├── main.js            # Main app entry point
│       ├── components/        # Feature components
│       │   ├── auth.js        # Authentication logic
│       │   ├── menu.js        # Menu & products
│       │   ├── cart.js        # Shopping cart
│       │   ├── orders.js      # Order management
│       │   ├── profile.js     # User profile
│       │   └── navigation.js  # View switching
│       │
│       └── utils/             # Utility modules
│           ├── state.js       # Global state management
│           ├── api.js         # API calls wrapper
│           ├── ui.js          # UI helper functions
│           └── storage.js     # LocalStorage utilities
│
├── index.html                 # Main HTML (Refactored)
└── order_frontend_v2.html     # Old monolithic file (backup)
```

## 🎯 Lợi ích của refactoring

### 1. **Separation of Concerns**
- **CSS**: Mỗi component có file CSS riêng
- **JavaScript**: Logic được tách thành modules độc lập
- **HTML**: Chỉ chứa cấu trúc, không có inline styles/scripts

### 2. **Maintainability**
- Dễ tìm và sửa bugs
- Thay đổi một component không ảnh hưởng đến components khác
- Code rõ ràng, dễ đọc hơn

### 3. **Reusability**
- Các utility functions có thể dùng lại
- Components độc lập, dễ test
- API calls được centralize

### 4. **Scalability**
- Dễ thêm features mới
- Có thể thêm nhiều developers cùng làm việc
- Structure rõ ràng cho dự án lớn

## 🔧 Chi tiết các modules

### **CSS Modules**

#### `base.css`
- Reset styles
- Container & layout
- Common button styles
- View management

#### `header.css`
- Header navigation
- User info display
- Header buttons

#### `sidebar.css`
- Sidebar layout
- Category buttons
- Search box
- Favorites list

#### `products.css`
- Product grid
- Product cards
- Product buttons
- Hover effects

#### `cart.css`
- Cart sidebar
- Cart items
- Cart summary
- Checkout button

#### `modal.css`
- Modal overlay
- Modal content
- Form groups
- Modal buttons

#### `auth.css`
- Auth container
- Login/Register/Forgot forms
- Auth tabs
- Password toggle

#### `orders.css`
- Order cards
- Order status badges
- Order actions
- Order history

#### `profile.css`
- Profile sections
- Profile info cards
- Transaction list

#### `responsive.css`
- Mobile breakpoints
- Tablet layouts
- Desktop optimizations

### **JavaScript Modules**

#### `utils/state.js`
- Global state object
- State getters/setters
- Cart management
- User management

#### `utils/api.js`
- API base URL
- Generic API caller
- All endpoint functions
- Error handling

#### `utils/ui.js`
- Show/hide elements
- Alert messages
- Format currency/date
- Modal controls

#### `utils/storage.js`
- LocalStorage wrapper
- Save/load user data
- Cart persistence
- Clear storage

#### `components/auth.js`
- Login logic
- Register with OTP
- Forgot password
- Session management

#### `components/menu.js`
- Load menu items
- Display products
- Search functionality
- Category filtering
- Favorites management

#### `components/cart.js`
- Add to cart
- Update quantities
- Remove items
- Cart calculations

#### `components/orders.js`
- Order history
- Order status
- Cancel order
- Confirm received

#### `components/profile.js`
- Load profile data
- Update email/phone
- Change password
- Balance display

#### `components/navigation.js`
- Switch between views
- Show/hide sidebars
- View state management

#### `main.js`
- App initialization
- Expose functions to window
- Setup event listeners
- DOMContentLoaded handler

## 🚀 Cách sử dụng

### 1. **Development**
Mở file `index.html` trong browser với Live Server hoặc local server:

```bash
# Với Python
python -m http.server 8080

# Với PHP
php -S localhost:8080

# Hoặc dùng VS Code Live Server extension
```

### 2. **Chỉnh sửa CSS**
Mở file CSS tương ứng trong thư mục `frontend/css/` và edit:

```css
/* Ví dụ: Thay đổi màu header */
/* File: frontend/css/header.css */
header {
    background: linear-gradient(135deg, #your-color 0%, #your-color2 100%);
}
```

### 3. **Thêm feature mới**
Tạo component mới trong `frontend/js/components/`:

```javascript
// File: frontend/js/components/newfeature.js
import * as api from '../utils/api.js';
import * as ui from '../utils/ui.js';

export async function loadNewFeature() {
    // Your code here
}
```

Sau đó import vào `main.js`:

```javascript
import { loadNewFeature } from './components/newfeature.js';
window.loadNewFeature = loadNewFeature;
```

### 4. **Thêm API endpoint mới**
Thêm vào `frontend/js/utils/api.js`:

```javascript
export async function getNewData(params) {
    return await apiCall('/new-endpoint', 'POST', params);
}
```

## 📝 So sánh với version cũ

| Aspect | Old (3190 dòng) | New (Refactored) |
|--------|----------------|-------------------|
| **CSS** | Inline trong HTML | 10 files riêng biệt |
| **JavaScript** | 1 file lớn | 13 modules nhỏ |
| **Maintainability** | ⭐ | ⭐⭐⭐⭐⭐ |
| **Reusability** | ⭐ | ⭐⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Team Work** | Khó | Dễ dàng |

## ⚠️ Lưu ý

1. **File cũ vẫn được giữ lại**: `order_frontend_v2.html` là backup
2. **ES6 Modules**: Cần chạy qua HTTP server, không chạy trực tiếp file://
3. **Browser Support**: Cần browser hỗ trợ ES6 modules (Chrome, Firefox, Safari, Edge hiện đại)
4. **API URL**: Có thể cần thay đổi `API_URL` trong `frontend/js/utils/state.js` nếu backend chạy ở port khác

## 🎨 Customization

### Thay đổi theme colors
Edit các file CSS tương ứng:
- Primary color: Search `#c41e3a` và thay thế
- Secondary color: Search `#a01729` và thay thế
- Success color: Search `#006241` và thay thế

### Thay đổi layout
- Desktop: Edit `base.css` và các component CSS
- Mobile: Edit `responsive.css`

## 🔄 Migration từ file cũ

File `index.html` mới đã được refactor hoàn toàn từ `order_frontend_v2.html`. Tất cả functionality được giữ nguyên, chỉ có cấu trúc code được tổ chức lại tốt hơn.

## ✅ Testing

Test các chức năng chính:
1. ✓ Login/Register/Forgot Password
2. ✓ Browse menu & categories
3. ✓ Add to cart & checkout
4. ✓ View orders & order status
5. ✓ Manage favorites
6. ✓ Update profile
7. ✓ Responsive trên mobile

---

**Refactored by**: GitHub Copilot
**Date**: December 2024
**Purpose**: Improve code maintainability and scalability
