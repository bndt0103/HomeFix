# HomeFix — Project_Final

**Demo online nhiều máy, dùng chung database:** xem [hướng dẫn chạy online](DOC/CHAY_ONLINE_DEMO.md). Chạy `CHAY_ONLINE.bat` hoặc `npm.cmd run online:setup` rồi `npm.cmd run online` trong `SRC`. Máy chủ phải luôn bật; link HTTPS được in trong terminal.

**Nhánh bàn giao:** `cap-nhat/homefix-hoan-thien-20261008`. Xem [cách lấy nhánh và cập nhật database](DOC/CAP_NHAT_NHOM.md).

Website desktop + giao diện mobile + APK Android + Express API + SQL Server, đồ án nhóm 08.

**Bắt đầu:** đọc [hướng dẫn cài đặt và sử dụng](HUONG_DAN_CAI_DAT.md). Máy hiện tại: chạy `CHAY_HOMEFIX.bat`, mở http://localhost:3000. Máy mới: cài Node 24 LTS, SQL Server và ODBC rồi chạy `CAI_DAT.bat`.

Tài khoản thử khách: `kh@homefix.local` / `HomeFix@123`. Đủ bảy vai trò và kịch bản demo nằm trong hướng dẫn.

- `DOC/Nhom08_BaoCao_HomeFix_Final.docx`: báo cáo đã viết lại và bổ sung phần xử lý/cài đặt/kiểm thử.
- `PDF/Nhom08_BaoCao_HomeFix_Final.pdf`: bản đọc/in.
- `BIN/HomeFix-Android.apk`: ứng dụng Android để demo trong Wi-Fi cùng máy chủ.
- `SRC/database`: schema, stored procedures, triggers và migration; khởi tạo bằng `npm run db:init`.
- `REF/SoDo`: 12 lược đồ tuần tự theo mã nguồn và các sơ đồ kiến trúc/dữ liệu.

Bản gốc của báo cáo được giữ nguyên. Source đã loại tệp kiểm thử, kết quả, log và bản mẫu cũ. Giữ các SQL migration và `.env.example` để cài máy mới; khóa riêng, ảnh người dùng, `node_modules` và `_work` không được đưa lên GitHub. Cần nhóm kiểm tra APK trên thiết bị thật trước buổi bảo vệ.

Khách dùng nút **Chat AI** ở góc phải để chọn Gemini hoặc nhân viên. Gemini cần API key riêng trong `SRC/backend/.env`; xem [cấu hình AI](DOC/AI_GEMINI.md). Đơn nhiều dịch vụ cần database đã nâng cấp theo hướng dẫn cho nhóm.

### Cấu hình OTP

Đăng ký, quên mật khẩu và đổi mật khẩu xác thực OTP qua email, không cần chọn hình thức gửi. Xem [hướng dẫn thay đổi, cấu hình dịch vụ và migration](DOC/THAY_DOI_OTP.md). Máy đã có dữ liệu chạy npm run db:migrate:otp trong SRC, cấu hình Gmail SMTP (GMAIL_USER, GMAIL_APP_PASSWORD) trong backend/.env, sau đó build và khởi động lại API.
