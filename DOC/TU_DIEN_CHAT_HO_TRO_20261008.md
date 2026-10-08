# Bổ sung từ điển dữ liệu chat hỗ trợ

Migration `014_support_chat.sql` bổ sung hai bảng và một cột thông báo, giữ nguyên dữ liệu cũ. Khách có một hội thoại hỗ trợ dùng lại giữa các lần truy cập; hội thoại này độc lập với đơn dịch vụ và chat điều phối.

| Bảng / trường | Ý nghĩa |
|---|---|
| HoiThoaiHoTro.MaHoiThoai | Mã hội thoại hỗ trợ |
| MaKhachHang | Khách sở hữu hội thoại; duy nhất, tham chiếu NguoiDung.id |
| MaNhanVien | Nhân viên CSKH tiếp nhận; có thể để trống |
| CheDo | NhanVien hoặc AI; hiện chỉ NhanVien hoạt động |
| DongYGuiAI, NgayDongYAI | Đồng ý gửi chat đến Gemini và thời điểm bắt đầu phiên AI hiện tại; chuyển nhân viên đặt DongYGuiAI về 0 |
| TinCuoiKhachDaDoc | Con trỏ tin cuối khách đã đọc |
| TinCuoiNhanVienDaDoc | Con trỏ tin cuối bộ phận CSKH đã đọc |
| MaTinNhanDangXuLy, NgayBatDauAI | Tin khách đang chờ AI và thời điểm bắt đầu; ngăn xử lý đồng thời, khôi phục nếu treo quá 90 giây |
| NgayTao, NgayCapNhat | Thời điểm tạo và cập nhật hội thoại |
| TinNhanHoTro.MaTinNhan | Mã tin nhắn, tăng dần để phân trang và đánh dấu đã đọc |
| MaHoiThoai | Hội thoại chứa tin nhắn |
| MaNguoiGui | Tài khoản gửi; để trống cho AI hoặc thông báo hệ thống |
| VaiTroNguoiGui | KH, CSKH, AI, HeThong |
| CheDoGui | Chế độ tại lúc gửi; tách lịch sử nhân viên và AI |
| NoiDung | Nội dung tin nhắn, tối đa 4000 ký tự; người dùng nhập tối đa 2000 |
| MoHinhAI | Model dùng để xử lý tin; ghi trên tin hỏi khi giữ một lượt hạn mức và trên câu trả lời AI |
| NgayGui | Thời điểm gửi |
| ThongBao.DuongDan | Liên kết nội bộ do backend tạo cho thông báo chat hỗ trợ |

Con trỏ đã đọc chỉ tăng. Tin đến sau con trỏ vẫn là tin chưa đọc. `Idempotency` hiện có được dùng để tránh tạo tin và thông báo trùng khi gửi lại cùng yêu cầu.
