# Đăng ký và khôi phục mật khẩu bằng OTP

## Thay đổi giao diện

- Đăng ký: chọn Email/Gmail hoặc SMS, gửi OTP rồi nhập mã để xác nhận tạo tài khoản. Chưa xác thực thì chưa tạo tài khoản.
- Thêm **Quên mật khẩu?** cạnh **Đăng ký ngay**, dùng email hoặc số điện thoại đã lưu trong tài khoản để nhận OTP và đặt mật khẩu mới.
- Hồ sơ cá nhân: đổi mật khẩu cần mật khẩu hiện tại và OTP qua một trong hai kênh.
- Hiển thị thời gian còn lại, thời gian chờ gửi lại, lỗi và thông báo thành công. Thay thông tin đăng ký/kênh nhận sẽ yêu cầu mã mới.
- Thay email hồ sơ phải nhập mật khẩu hiện tại vì email được dùng để khôi phục tài khoản.

## Thay đổi máy chủ

| API POST | Chức năng |
| --- | --- |
| `/api/auth/register/otp` | Gửi OTP với `fullName`, `phone`, `email`, `password`, `channel` |
| `/api/auth/register` | Tạo tài khoản với thông tin trên (không có `channel`) và `challengeId`, `otp` |
| `/api/auth/forgot-password/otp` | Gửi mã với `identifier`, `channel` |
| `/api/auth/reset-password` | Đặt lại với `identifier`, `channel`, `newPassword`, `challengeId`, `otp` |
| `/api/users/me/password/otp` | Cần đăng nhập; gửi mã với `currentPassword`, `channel` |
| `/api/users/me/password` | Cần đăng nhập; đổi bằng `currentPassword`, `newPassword`, `challengeId`, `otp` |

`channel` là `email` hoặc `sms`; số điện thoại giữ định dạng Việt Nam `0xxxxxxxxx` trên giao diện và được đổi thành `+84...` khi gửi SMS.

- OTP ngẫu nhiên 6 số, hiệu lực 5 phút, tối đa 5 lần nhập sai. Không trả mã về trình duyệt, không ghi mã vào log.
- SQL Server chỉ lưu HMAC của mã; mã gắn với mục đích và thông tin tài khoản. Tạo tài khoản/đổi mật khẩu và đánh dấu mã đã dùng nằm trong cùng transaction.
- Gửi lại sau ít nhất 60 giây, tối đa 5 lần/giờ/địa chỉ nhận; giới hạn thêm 10 yêu cầu gửi/15 phút/IP. Mã cũ cùng địa chỉ và mục đích bị vô hiệu khi yêu cầu mã mới.
- Bảng OTP dùng chung giữa các tiến trình API; dữ liệu trên một ngày được dọn khi có yêu cầu gửi mới. Giới hạn IP nằm trong bộ nhớ từng tiến trình.
- Quên mật khẩu trả cùng dạng thông báo với địa chỉ không tồn tại hoặc tài khoản bị khóa, không gửi mã cho những trường hợp này.
- Đổi/đặt lại mật khẩu tăng `tokenVersion` để thu hồi mọi phiên cũ, có nhật ký thao tác không chứa mật khẩu hoặc OTP.
- Tài khoản do quản trị viên tạo vẫn đi qua API quản trị có phân quyền. Không thêm cơ chế bỏ qua OTP vào đăng ký công khai.

## Cấu hình để gửi mã thật

Khóa bí mật chỉ đặt trong `SRC/backend/.env` (đã được Git bỏ qua), không đặt vào `.env` frontend hay biến `VITE_*`.

### Email/Gmail của người nhận

Triển khai dùng [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email):

```dotenv
RESEND_API_KEY=<khóa API Resend>
OTP_EMAIL_FROM=HomeFix <otp@ten-mien-da-xac-minh.vn>
```

Xác minh tên miền gửi trên Resend và cấu hình địa chỉ From tương ứng. Người nhận có thể dùng Gmail hoặc email khác. Đây là gửi đến Gmail; không cần mật khẩu Gmail của người dùng. Tài khoản thử nghiệm có thể giới hạn người nhận; kiểm tra dashboard nhà cung cấp.

### Số điện thoại

Triển khai dùng [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource):

```dotenv
TWILIO_ACCOUNT_SID=<Account SID>
TWILIO_AUTH_TOKEN=<Auth Token>
TWILIO_SMS_FROM=<số gửi SMS được cấp bởi Twilio>
```

Bật quyền gửi đến Việt Nam và cấu hình người gửi phù hợp trên Twilio. Chế độ thử nghiệm cần xác minh số nhận; SMS có thể phát sinh phí. Nhà cung cấp chấp nhận yêu cầu gửi chưa bảo đảm thư/tin đã tới: kiểm tra log giao nhận của nhà cung cấp nếu không nhận được mã.

Kênh chưa cấu hình hoặc gửi thất bại sẽ báo lỗi, không báo gửi thành công giả. Có thể cấu hình từng kênh, nhưng cần cấu hình cả hai để sử dụng đủ lựa chọn theo yêu cầu.

## Cập nhật máy của thành viên

Tại thư mục `SRC`:

```powershell
npm install
# Với cơ sở dữ liệu đã có dữ liệu:
npm run db:migrate:otp
# Với máy mới, dùng npm run db:init thay cho lệnh migration trên.
npm run build
npm start
```

Migration `004_auth_otp.sql` có thể chạy lại, chỉ thêm bảng/index OTP, không xóa tài khoản hoặc đơn hàng. Khởi động lại API sau khi thay `.env`. Tài khoản demo `@homefix.local` không nhận được email thật; dùng tài khoản có email/số điện thoại thật để thử gửi thực tế.

## Kiểm thử

```powershell
npm run test:otp
npm run test:otp:ui
```

- Test nhà cung cấp kiểm tra payload email, chuyển số SMS sang `+84`, lỗi cấu hình và lỗi gửi.
- Test tích hợp tạo database riêng có tiền tố `HomeFix_OtpTest_`, kiểm tra OTP qua SQL Server thật rồi xóa đúng database tạm. Tài khoản SQL chạy test cần quyền tạo/xóa database. Dịch vụ gửi được giả lập, không gửi email/SMS thật.
- Test trình duyệt dùng Playwright và API giả lập để kiểm tra các thao tác giao diện. Cần Chromium của Playwright (`npx playwright install chromium`).
- Bộ test nghiệp vụ cũ dùng API quản trị để chuẩn bị tài khoản khách hàng; OTP đăng ký công khai được kiểm tra riêng, không cần gửi SMS cho mỗi lần chạy bộ test nghiệp vụ.

Các file chính: `backend/src/auth.js`, `otp.js`, `otp-delivery.js`; `frontend/src/auth-forms.jsx`, `main.jsx`, `pages.jsx`, `style.css`; migration và script khởi tạo; `.env.example`; các bài kiểm thử OTP.

Chưa kiểm chứng giao nhận email/SMS thật nếu chưa cung cấp khóa dịch vụ và người nhận thử nghiệm. Sau cấu hình, nhóm cần thử mỗi kênh với một tài khoản thật.

## Kết quả kiểm tra trên máy phát triển

Build Vite thành công; 16 kiểm thử OTP đạt; 35 tình huống nghiệp vụ API cũ đạt trên database tạm. Playwright đạt các luồng đăng ký bằng email, quên mật khẩu bằng SMS, đổi mật khẩu trong hồ sơ, khóa nút gửi lại trong thời gian chờ; không có lỗi JavaScript hoặc tràn ngang ở kích thước 390 × 844. Chưa cấu hình dịch vụ gửi thật trên máy phát triển.
