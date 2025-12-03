# 🧪 Testing Guide - Frontend Refactored

## Cách test ứng dụng sau khi refactor

### 1️⃣ Start Backend Server

```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal

# Activate virtual environment
source .venv/bin/activate

# Start backend (port 8000)
uvicorn app:app --reload --port 8000
```

hoặc sử dụng script:

```bash
./start.sh
```

### 2️⃣ Start Frontend Server

Mở terminal mới và chạy HTTP server:

**Option 1: Python**
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
python3 -m http.server 8080
```

**Option 2: PHP**
```bash
cd /Users/hnt_4/GitCloneDestination/SOAFinal
php -S localhost:8080
```

**Option 3: VS Code Live Server**
- Cài extension "Live Server"
- Right-click vào `index.html`
- Chọn "Open with Live Server"

### 3️⃣ Truy cập ứng dụng

Mở browser và truy cập:
```
http://localhost:8080/index.html
```

### 4️⃣ Test Checklist

#### ✅ Authentication
- [ ] Login với tài khoản có sẵn
- [ ] Register tài khoản mới (nhận OTP qua email)
- [ ] Forgot password (reset qua OTP)
- [ ] Toggle password visibility
- [ ] Auto-clear error messages khi typing

#### ✅ Menu & Products
- [ ] Load menu items khi login thành công
- [ ] Filter theo categories (All, Coffee, Tea, Juice, Food)
- [ ] Search products
- [ ] Click search result scroll to product
- [ ] View product icons và giá

#### ✅ Favorites
- [ ] Add product to favorites (click ❤️)
- [ ] Remove from favorites
- [ ] View favorites page
- [ ] Filter favorites theo category

#### ✅ Shopping Cart
- [ ] Add to cart với size selection (S/M/L)
- [ ] Chọn milk options (Sữa hạt, Sữa đặc)
- [ ] Chọn sugar level (0%-150%)
- [ ] Increase/decrease quantity
- [ ] Remove item khỏi cart
- [ ] View subtotal và total

#### ✅ Checkout
- [ ] Open checkout modal
- [ ] Fill delivery information
- [ ] Select district và ward
- [ ] Add special notes
- [ ] Apply promo code
- [ ] Select payment method
- [ ] Place order

#### ✅ Orders
- [ ] View order history
- [ ] View order status (active orders)
- [ ] Cancel order
- [ ] Mark as received
- [ ] View order details (items, address, notes)

#### ✅ Profile
- [ ] View profile information
- [ ] Change email (with password confirmation)
- [ ] Change phone (with password confirmation)
- [ ] Change password
- [ ] View balance
- [ ] Logout

#### ✅ Responsive
- [ ] Desktop view (> 1024px)
- [ ] Tablet view (768px - 1024px)
- [ ] Mobile view (< 768px)
- [ ] Touch interactions on mobile

### 5️⃣ Console Check

Mở Developer Tools (F12) và kiểm tra:

#### Console Messages
Không có errors. Chỉ có log messages:
```
Cafe Ordering System - Refactored Version
```

#### Network Requests
- ✅ CSS files load thành công
- ✅ JS modules load thành công
- ✅ API calls đến backend (port 8000)

#### Application Storage
- ✅ LocalStorage có user data sau khi login:
  - userId
  - userEmail
  - userName
  - userPhone
  - userUsername

### 6️⃣ Compare với Version Cũ

Test song song:

**Version mới** (Refactored):
```
http://localhost:8080/index.html
```

**Version cũ** (Monolithic):
```
http://localhost:8080/order_frontend_v2.html
```

Verify rằng tất cả functionality giống nhau.

### 7️⃣ Performance Check

#### File Size Comparison

**Old version:**
- 1 file HTML: ~3190 dòng (~150KB)

**New version:**
- `index.html`: ~400 dòng (~15KB)
- CSS files: 10 files (~30KB total)
- JS files: 13 modules (~40KB total)
- **Total**: ~85KB (nhẹ hơn 43%)

#### Load Time
- CSS: Parallel loading (faster)
- JS: Modular loading (cached better)
- Maintainability: ⭐⭐⭐⭐⭐

### 8️⃣ Common Issues & Solutions

#### ❌ "Failed to load module"
**Cause**: Không chạy qua HTTP server
**Solution**: Phải chạy qua HTTP server, không dùng file:// protocol

#### ❌ "CORS error"
**Cause**: Backend không cho phép origin
**Solution**: Check backend CORS settings trong `app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    ...
)
```

#### ❌ "API_URL connection refused"
**Cause**: Backend chưa chạy
**Solution**: Start backend server ở port 8000

#### ❌ Styles không load
**Cause**: Sai đường dẫn CSS
**Solution**: Check đường dẫn trong `index.html`:
```html
<link rel="stylesheet" href="frontend/css/base.css">
```

### 9️⃣ Browser DevTools Testing

#### Sources Tab
Check file structure:
```
localhost:8080/
├── index.html
├── frontend/
│   ├── css/
│   │   ├── base.css ✓
│   │   ├── header.css ✓
│   │   └── ... ✓
│   └── js/
│       ├── main.js ✓
│       ├── components/ ✓
│       └── utils/ ✓
```

#### Application Tab > Local Storage
After login:
```
userId: "3"
userEmail: "user@example.com"
userName: "User Name"
userPhone: "0999999999"
userUsername: "username"
```

#### Network Tab
Filter XHR/Fetch:
- GET `/api/menu` ✓
- POST `/api/auth/login` ✓
- GET `/api/favorites?user_id=3` ✓
- etc.

### 🔟 Automated Testing (Future)

Có thể thêm tests sau này:

```javascript
// Jest unit tests
test('formatCurrency formats correctly', () => {
    expect(formatCurrency(1000)).toBe('1,000 ₫');
});

// Cypress E2E tests
it('should login successfully', () => {
    cy.visit('http://localhost:8080/index.html');
    cy.get('#loginEmail').type('test@example.com');
    cy.get('#loginPassword').type('password');
    cy.get('.auth-submit').click();
    cy.url().should('include', 'appScreen');
});
```

---

## ✅ Test Success Criteria

Application được coi là pass khi:
1. ✅ Tất cả features hoạt động giống version cũ
2. ✅ Không có console errors
3. ✅ All API calls thành công
4. ✅ Responsive works trên mobile/tablet/desktop
5. ✅ LocalStorage được lưu đúng
6. ✅ Modular structure rõ ràng

## 📞 Support

Nếu có vấn đề:
1. Check backend logs
2. Check browser console
3. Check network tab
4. Compare với version cũ

**Happy Testing! 🎉**
