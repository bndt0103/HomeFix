# Biên bản bàn giao HomeFix — Nhóm 08

Ngày đóng gói: 2026-09-25. Thư mục gốc: Project_Final. Báo cáo và tài liệu gốc ngoài thư mục này được giữ nguyên.

## Kết quả giao

- Website React chạy desktop và responsive mobile, backend Express, source Android Capacitor.
- SQL Server: 25 bảng, 3 stored procedures, 5 triggers; migration và seed trong SRC/database + scripts/init-db.js.
- APK debug HomeFix trong BIN; đã kiểm tra package vn.edu.nhom08.homefix, min SDK 24, target SDK 36.
- Báo cáo Word/PDF 164 trang, đủ cấu trúc đầu/cuối, mục lục/danh mục, Times New Roman 13, lề 3–3–3–2 cm, header chương/trang, footer đề tài.
- Hướng dẫn cài đặt/sử dụng Word/PDF 9 trang, Markdown, CAI_DAT.bat và CHAY_HOMEFIX.bat.
- 12 sơ đồ tuần tự theo API cuối, use case, trạng thái, kiến trúc và hai hình quan hệ dữ liệu; PNG/SVG/PlantUML.
- Đối chiếu 71 ảnh thiết kế nguồn: 70 ảnh báo cáo + 1 countdown; ảnh ứng dụng thực tế ở REF/KiemThu.
- Danh mục 81 route API và phân công tiếp nhận bốn thành viên.

## Kiểm chứng

35/35 ca API/SQL PASS; 34 trường hợp trang/viewport PASS; luồng UI 15 hành động PASS. Node đếm thêm test cha thành 36, không gọi đó là 36 ca nghiệp vụ. Thời điểm và chi tiết trong các JSON ở REF/KiemThu.

Đã chạy bộ cài/bộ khởi động bằng Windows PowerShell. Database HomeFix_InstallationCheck đã khởi tạo riêng và kiểm tra 7 vai trò, 6 dịch vụ, danh sách KH trống và ví KTV mẫu. Kiểm tra này dùng runtime/thư viện trên máy phát triển, không được gọi là đã thử trên máy Windows vật lý thứ hai.

## Giới hạn cần biết trước khi nộp

Chưa có điện thoại/emulator kết nối để thực thi APK; không có bằng chứng GPS/ảnh/Wi-Fi trên thiết bị thật. Không triển khai Internet. HTTP LAN, tài khoản mẫu và APK debug dành cho đồ án. Bản iOS, SMS/OTP, video call, thanh toán ngân hàng, GPS nền, tự sinh ca bảo hành, tự thu phí hủy chưa cài; hướng phát triển được nêu trong báo cáo.

Giao diện tham khảo toàn bộ ảnh thiết kế đã cung cấp, không nhập trực tiếp layer Figma và không cam kết giống từng pixel. Bảng phân công là trách nhiệm tiếp nhận; nhóm phải xác nhận commit/đóng góp thực tế, không có chữ ký hoặc tỷ lệ đóng góp được tạo thay sinh viên.

## Quy tắc đóng gói

ZIP có source, web build, APK, SQL, DOC/PDF, hướng dẫn và bằng chứng. Không có node_modules, .env thật, uploads đang dùng, SDK, Gradle cache, local.properties hoặc thư mục _work. Các thư viện được tái cài bằng npm ci. Web trong BIN/Web là build tham khảo; chạy qua backend/cài đặt, không mở index.html bằng file:// rồi kỳ vọng API hoạt động.

Database demo hiện tại giữ các bản ghi TEST từ kiểm thử. Máy mới dùng seed sạch của init-db. Dữ liệu thực phát sinh phải sao lưu cả SQL .bak và uploads. Khóa đăng nhập riêng được tạo trên từng máy.
