# Gửi OTP bằng Gmail SMTP (không cần tên miền riêng)

HomeFix hỗ trợ Gmail SMTP cho đăng ký, quên mật khẩu và đổi mật khẩu. Dùng tài khoản Gmail hiện có để gửi đến email người dùng, không cần mua tên miền hoặc tài khoản Resend.

## 1. Chuẩn bị tài khoản Google
1. Đăng nhập Gmail sẽ dùng làm địa chỉ gửi.
2. Mở https://myaccount.google.com/security và bật **Xác minh 2 bước**.
3. Mở https://myaccount.google.com/apppasswords.
4. Đặt tên ứng dụng **HomeFix**, tạo mật khẩu ứng dụng và sao chép mật khẩu 16 ký tự.
5. Dán trực tiếp vào file local ở bước 2. Không dùng mật khẩu đăng nhập Google, không gửi mật khẩu vào chat hoặc commit Git.

Nếu không thấy Mật khẩu ứng dụng, tài khoản có thể bị giới hạn bởi tổ chức, chế độ Bảo vệ nâng cao hoặc thiết lập xác minh chỉ bằng khóa bảo mật.
Hướng dẫn Google: https://support.google.com/accounts/answer/185833?hl=vi

## 2. Cấu hình SRC/backend/.env
```dotenv
OTP_EMAIL_PROVIDER=gmail
GMAIL_USER=dia-chi-gui@gmail.com
GMAIL_APP_PASSWORD=
```
Thay GMAIL_USER bằng Gmail gửi thật, điền mật khẩu ứng dụng vào GMAIL_APP_PASSWORD. Code tự bỏ các khoảng trắng phân nhóm khi sao chép mật khẩu.
Chỉ backend đọc các biến này. Khi dùng gmail, RESEND_API_KEY và OTP_EMAIL_FROM cũ bị bỏ qua. Địa chỉ người gửi luôn là GMAIL_USER, tên hiển thị HomeFix. Không cần điền email người nhận trong cấu hình: website lấy từ đăng ký hoặc hồ sơ.

## 3. Kiểm tra và chạy
Trong thư mục SRC:
```powershell
npm install
npm run email:check
npm start
```
email:check kiểm tra kết nối và đăng nhập SMTP, không gửi email. Nếu server đang chạy, khởi động lại để nạp .env mới.
- Thiếu cấu hình: điền địa chỉ Gmail và mật khẩu ứng dụng hợp lệ.
- Google từ chối đăng nhập: kiểm tra đúng tài khoản gửi, Xác minh 2 bước và tạo lại mật khẩu ứng dụng.
- Không kết nối: kiểm tra mạng/tường lửa có cho phép smtp.gmail.com cổng 465 không.
- Đổi mật khẩu tài khoản Google có thể thu hồi mật khẩu ứng dụng; cần tạo lại.

Mở http://127.0.0.1:3000, thử đăng ký với một email khác, nhận OTP và nhập mã mới nhất trong 5 phút. Kiểm tra Spam nếu chưa thấy thư.
Gmail có giới hạn gửi và có thể chặn đăng nhập/gửi thư; phù hợp thử nghiệm đồ án ít người dùng. Không bảo đảm mọi thư vào tab Chính.

## Chi tiết thay đổi cho nhóm
- Thêm Nodemailer vào backend và cập nhật package-lock.
- Gửi qua SMTP Gmail cổng 465 với TLS và xác thực chứng chỉ; không bật debug/log chứa thư hoặc mật khẩu.
- Thêm OTP_EMAIL_PROVIDER=gmail; giữ resend làm tùy chọn tương thích cấu hình cũ khi không đặt provider.
- Bản .env.example chọn Gmail. .env local của máy phát triển đã chọn Gmail, mật khẩu ứng dụng cần người dùng tự điền.
- Thêm npm run email:check; lỗi kiểm tra chỉ hiển thị hướng dẫn, không in thông tin xác thực.
- SMTP từ chối người nhận hoặc lỗi đăng nhập không được báo gửi thành công.
- Không đổi giao diện email-only hay các giới hạn OTP. Không cần migration mới.

## Kiểm thử
npm run test:otp kiểm tra nhà cung cấp Gmail/Resend và luồng OTP trên database tạm. SMTP và dịch vụ email được giả lập; không gửi thư thật.
Kiểm thử tự động không xác nhận email đã đến hộp thư. Sau khi điền mật khẩu ứng dụng, chạy email:check và thử website.
