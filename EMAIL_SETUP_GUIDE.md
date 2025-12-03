# 📧 Email Notification Setup Guide

## Tính năng Email Tự động

Khi user **cancel order**, hệ thống sẽ tự động:
1. ✅ Hoàn tiền vào balance wallet
2. 📧 Gửi email xác nhận về Gmail đã đăng ký

---

## Email đã được cấu hình sẵn! ✅

File `.env` đã có thông tin:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=huynhnhattien0411@gmail.com
SENDER_PASSWORD=xbnzcensraqmgnhv
SENDER_NAME=Cafe Ordering System
```

**Gmail App Password** đã được cấu hình và hoạt động!

---

## Cách test tính năng Email

### 1️⃣ Đăng ký user với email thật
```
Email: your-real-email@gmail.com
Password: anything
Name: Your Name
```

### 2️⃣ Đặt order và thanh toán
- Chọn món → Add to Cart
- Checkout → Nhập OTP → Confirm Payment

### 3️⃣ Cancel order
- Vào **Orders** tab
- Click **Cancel** trên order vừa tạo
- Xác nhận cancel

### 4️⃣ Kiểm tra email
Mở Gmail của bạn → Tìm email từ **Cafe Ordering System**

Email sẽ có:
- ☕ Logo và header đẹp
- 📋 Thông tin order (Order ID, ngày cancel)
- 💰 Số tiền được hoàn lại (màu xanh lá)
- ✅ Xác nhận refund đã vào wallet

---

## Email Template Features

### Giao diện email bao gồm:
- **Header gradient** (màu đỏ cafe)
- **Order information box** (Order ID, Date, Status)
- **Refund amount highlight** (màu xanh, font lớn)
- **Balance update notice** (màu vàng warning box)
- **Professional footer** với contact info

### Responsive design:
- Hiển thị đẹp trên mọi thiết bị
- Compatible với Gmail, Outlook, Apple Mail
- HTML email chuẩn

---

## Troubleshooting

### Không nhận được email?

1. **Kiểm tra Spam/Junk folder**
   - Gmail đôi khi đưa email tự động vào Spam

2. **Kiểm tra server logs**
   ```bash
   # Xem terminal output
   ✅ Refund email sent to your-email@gmail.com
   ```

3. **Test SMTP connection**
   ```python
   # File: test_email.py (tạo file này để test)
   from utils.email_service import send_refund_email
   
   send_refund_email(
       recipient_email="your-email@gmail.com",
       recipient_name="Test User",
       order_id="TEST123",
       refund_amount=50000
   )
   ```

4. **Kiểm tra .env file**
   - Đảm bảo `SENDER_EMAIL` và `SENDER_PASSWORD` đúng
   - App Password phải có 16 ký tự (không có dấu cách)

### Email bị reject?

- **Gmail App Password** có thể hết hạn → Tạo lại
- **2FA** phải được bật trên Gmail account
- **"Less secure app access"** không cần nữa (dùng App Password)

---

## Code Flow

### Backend (routers/orders.py)
```python
# Cancel order endpoint
1. Verify user authorization
2. Update order status → 'cancelled'
3. Refund amount → user balance
4. 📧 Send email notification
5. Return success response
```

### Email Service (utils/email_service.py)
```python
# send_refund_email() function
1. Create HTML email template
2. Format currency (₫)
3. Connect to Gmail SMTP (port 587)
4. Send email via TLS
5. Log success/error
```

---

## Production Notes

### Security:
- ✅ `.env` trong `.gitignore` (không commit lên Git)
- ✅ App Password thay vì real password
- ✅ Email sending không block API response (fast)

### Scalability:
- Gmail SMTP: ~500 emails/day limit
- Để scale lên: dùng SendGrid, AWS SES, hoặc Mailgun
- Current setup: Đủ cho demo và small production

### Error Handling:
- Email fail → Không ảnh hưởng refund
- Refund luôn thành công trước
- Email là bonus notification

---

## Future Enhancements

Có thể thêm email cho:
- ✅ Order confirmation (khi đặt order)
- ✅ OTP verification (đã có)
- 📧 Password reset
- 📧 Order status updates
- 📧 Promotional campaigns

---

## Testing Checklist

- [ ] Register user với email thật
- [ ] Place order và payment
- [ ] Cancel order
- [ ] Check Gmail inbox
- [ ] Verify refund amount trong email
- [ ] Check balance updated trong app
- [ ] Click links trong email (nếu có)

---

**Tính năng đã sẵn sàng sử dụng! 🎉**

Server đang chạy với email service enabled. 
Thử cancel một order để test ngay!
