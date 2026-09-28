# HomeFix — Project_Final

**Demo online nhiều máy, dùng chung database:** xem [hướng dẫn chạy online](DOC/CHAY_ONLINE_DEMO.md). Chạy `CHAY_ONLINE.bat` hoặc `npm.cmd run online:setup` rồi `npm.cmd run online` trong `SRC`. Máy chủ phải luôn bật; link HTTPS được in trong terminal.

Website desktop + giao diện mobile + APK Android + Express API + SQL Server, đồ án nhóm 08.

**Bắt đầu:** đọc [hướng dẫn cài đặt và sử dụng](HUONG_DAN_CAI_DAT.md). Máy hiện tại: chạy `CHAY_HOMEFIX.bat`, mở http://localhost:3000. Máy mới: cài Node 24 LTS, SQL Server và ODBC rồi chạy `CAI_DAT.bat`.

Tài khoản thử khách: `kh@homefix.local` / `HomeFix@123`. Đủ bảy vai trò và kịch bản demo nằm trong hướng dẫn.

- `DOC/Nhom08_BaoCao_HomeFix_Final.docx`: báo cáo đã viết lại và bổ sung phần xử lý/cài đặt/kiểm thử.
- `PDF/Nhom08_BaoCao_HomeFix_Final.pdf`: bản đọc/in.
- `BIN/HomeFix-Android.apk`: ứng dụng Android để demo trong Wi-Fi cùng máy chủ.
- `SRC/database`: schema, stored procedures, triggers và migration; khởi tạo bằng `npm run db:init`.
- `REF/SoDo`: 12 lược đồ tuần tự theo mã nguồn và các sơ đồ kiến trúc/dữ liệu.
- `REF/KiemThu`: kết quả và ảnh kiểm thử thực tế.

Bản gốc của báo cáo và bộ bàn giao 14 ngày được giữ nguyên ngoài thư mục này. Không gửi `SRC/backend/.env`, `node_modules` hoặc `_work` lên GitHub. Đã kiểm thử local; cần nhóm kiểm tra APK trên thiết bị thật trước buổi bảo vệ. Các chức năng dự kiến chưa cài được ghi rõ trong báo cáo và hướng dẫn.

### Cấu hình OTP

Đăng ký, quên mật khẩu và đổi mật khẩu xác thực OTP qua email, không cần chọn hình thức gửi. Xem [hướng dẫn thay đổi, cấu hình dịch vụ và migration](DOC/THAY_DOI_OTP.md). Máy đã có dữ liệu chạy npm run db:migrate:otp trong SRC, cấu hình Gmail SMTP (GMAIL_USER, GMAIL_APP_PASSWORD) trong backend/.env, sau đó build và khởi động lại API.
