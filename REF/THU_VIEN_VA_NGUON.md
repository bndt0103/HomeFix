# Nguồn và thư viện

Nguồn nghiệp vụ: báo cáo và thiết kế HomeFix nhóm 08; kế hoạch code/test; BanGiao_14Ngay đã duyệt. Nguồn quy cách báo cáo: Trình bày báo cáo (new).PPT của giảng viên Nguyễn Trần Thi Văn. Bản gốc được giữ trong thư mục dự án ban đầu; các tài liệu đối chiếu chọn lọc nằm trong REF/Nguon.

71 ảnh REF/GiaoDienGoc gồm 70 ảnh giao diện trích từ báo cáo và một countdown bổ sung. Tên file/mục nguồn giữ trong danh_muc.json. Các ảnh này là thiết kế gốc, không phải ảnh chứng minh chạy phần mềm. Ảnh tại REF/KiemThu được chụp từ ứng dụng đang chạy bằng Playwright/Edge; ảnh chứng từ kiểm thử do mã nguồn tạo, không là chứng từ tài chính thật.

Frontend: React/React DOM, React Router, Vite, Lucide React, Capacitor. Backend: Express, mssql, msnodesqlv8, bcryptjs, jsonwebtoken, Zod, dotenv, cors, helmet, express-rate-limit, multer, sharp. Kiểm thử: Node test runner, Playwright. Tên và phiên bản khóa trong SRC/package-lock.json; giấy phép gốc đi cùng từng thư viện khi npm ci. Biểu tượng HomeFix là SVG được viết cho dự án, biểu tượng giao diện thuộc Lucide (ISC).

Sơ đồ Project_Final/REF/SoDo được viết bằng PlantUML theo mã nguồn cuối. Bộ sơ đồ 14 ngày là kế hoạch ban đầu, có tên lớp/thủ tục đề xuất khác triển khai, không dùng thay bộ sơ đồ cuối.

Skill đã cài cho công cụ hỗ trợ:

- token-efficient-workflow: https://github.com/luziyezz/codex-skills/tree/main/token-efficient-workflow
- token-efficiency: https://github.com/prangishviliAbe/codexskills/tree/main/token-efficiency

Các skill hướng dẫn đọc có trọng tâm, lưu trạng thái và tránh đầu ra dư thừa. Không có phép đo chứng minh giảm quota theo một tỷ lệ cụ thể. Chúng không là phụ thuộc của HomeFix và thành viên không cần cài để chạy hệ thống.

Bản code/tài liệu hoàn thiện có AI hỗ trợ. Các thành viên cần tiếp nhận, chỉnh và kiểm chứng phần được giao; không xem bảng phân công là chứng nhận đã tự viết mã hoặc kết quả chấm điểm của giảng viên.
