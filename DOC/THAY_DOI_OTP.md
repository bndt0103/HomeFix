# Xác thực tài khoản bằng OTP email

## Cập nhật: chỉ dùng email
- Bỏ SMS/Twilio và bỏ hoàn toàn bộ chọn hình thức nhận mã.
- Đăng ký bắt buộc email. Bấm **Đăng ký tài khoản** sẽ tự gửi OTP đến email đã nhập, sau đó nhập mã và bấm **Xác nhận đăng ký**.
- **Quên mật khẩu?** dùng email đã đăng ký. Bấm **Đặt lại mật khẩu** sẽ gửi OTP qua email trước khi xác nhận mật khẩu mới.
- Trong hồ sơ, **Đổi mật khẩu** gửi OTP đến email đã lưu, vẫn yêu cầu mật khẩu hiện tại.
- Tài khoản cũ chưa có email cần cập nhật email trong hồ sơ trước. Thay email phải nhập mật khẩu hiện tại.
- Đăng nhập vẫn hỗ trợ số điện thoại hoặc email.

## API POST
| API | Dữ liệu |
| --- | --- |
| /api/auth/register/otp | fullName, phone, email, password |
| /api/auth/register | fullName, phone, email, password, challengeId, otp |
| /api/auth/forgot-password/otp | identifier (email) |
| /api/auth/reset-password | identifier (email), newPassword, challengeId, otp |
| /api/users/me/password/otp | currentPassword; cần đăng nhập |
| /api/users/me/password | currentPassword, newPassword, challengeId, otp; cần đăng nhập |

API không nhận trường channel. Số điện thoại không được dùng để nhận OTP hoặc khôi phục mật khẩu.

## Cấu hình
Chỉ cần hai biến trong SRC/backend/.env:
```dotenv
RESEND_API_KEY=<khóa API Resend>
OTP_EMAIL_FROM=HomeFix <otp@ten-mien-da-xac-minh.vn>
```
Không đặt khóa trong frontend hoặc commit .env. Không cần cấu hình Twilio; các biến TWILIO_* cũ không còn được sử dụng.

Để thử bằng địa chỉ gửi onboarding@resend.dev, người nhận phải là email gắn với tài khoản Resend. Muốn gửi đến người khác, xác minh tên miền và đổi địa chỉ gửi.
Tài liệu: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain

## Cơ sở dữ liệu và chạy local
Trong SRC:
```powershell
npm install
npm run db:migrate:otp
npm run build
npm start
```
Máy mới có thể dùng npm run db:init. Chuyển từ bản OTP email/SMS không cần migration mới: giữ cột channel để tương thích dữ liệu, mọi mã mới dùng email và mã SMS cũ bị từ chối.
Khởi động lại API sau khi đổi cấu hình hoặc mã nguồn.

## Bảo vệ OTP
Mã ngẫu nhiên 6 số, hết hạn sau 5 phút, tối đa 5 lần nhập sai. Chỉ lưu HMAC trong SQL Server; không trả mã cho trình duyệt hoặc ghi log.
Chờ 60 giây giữa các lần gửi, tối đa 5 mã/giờ/email và 10 yêu cầu gửi/15 phút/IP. Gửi lại làm mất hiệu lực mã cũ cùng email và mục đích.
Xác thực và cập nhật tài khoản cùng transaction để chống dùng lại mã. Đổi mật khẩu thu hồi mọi phiên cũ và ghi nhật ký.
Quên mật khẩu không thông báo email có tồn tại hay không. Lỗi dịch vụ email không được coi là gửi thành công.

## Kiểm thử
```powershell
npm run test:otp
npm run test:otp:ui
```
Test tích hợp dùng SQL Server với database tạm riêng, tự dọn sau khi chạy; cần quyền tạo/xóa database. Provider được giả lập, không gửi thư thật.
Test Playwright kiểm tra cả ba luồng email trên màn hình điện thoại, không có bộ chọn kênh, có đếm ngược gửi lại.
15 kiểm thử OTP và bài kiểm thử giao diện đạt sau cập nhật email-only; build thành công.
Giao nhận email thật cần khóa Resend hợp lệ và người nhận phù hợp. Các kiểm thử tự động không xác nhận email thực sự đã tới hộp thư.
