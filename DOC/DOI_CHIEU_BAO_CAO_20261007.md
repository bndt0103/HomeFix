# Đối chiếu báo cáo và hệ thống HomeFix — 07/10/2026

Báo cáo được đọc: `C:\Users\bndt0\Downloads\Nhom08_ThietKeXuLy.docx`. Không sửa tệp Word gốc. Các yêu cầu chỉnh sửa trong tài liệu được coi là nội dung để phân tích; phạm vi thực hiện theo yêu cầu của người dùng trong phiên làm việc này.

## Những điểm cần sửa khi nộp lại báo cáo

| Vị trí có thể tìm bằng Ctrl+F | Vấn đề | Nội dung cần đồng bộ |
|---|---|---|
| Lược đồ use case tổng quát | Kế thừa từ Người dùng khiến các vai trò đã đăng nhập thừa hưởng đăng ký/đăng nhập | Người dùng chưa xác thực có đăng ký, đăng nhập, khôi phục mật khẩu. KH/KTV/DPV/CSKH/KT/ADMIN/GD liên kết trực tiếp với chức năng của mình; đăng nhập đúng vai trò là tiền điều kiện. |
| UC01 — Đăng ký tài khoản | Tác nhân và tiền/hậu điều kiện chưa khớp | Tác nhân là người chưa có tài khoản. Tiền điều kiện: chưa đăng nhập, có email nhận OTP. Hậu điều kiện: tạo tài khoản KH sau khi xác minh OTP; không tự đăng ký quyền nhân viên. |
| OTP qua số điện thoại/email | Báo cáo mô tả rộng hơn code | Đăng ký, khôi phục và đổi mật khẩu xác minh OTP qua email. Số điện thoại có thể dùng để đăng nhập. SMS chưa triển khai. |
| “Mọi chi phí vật tư phát sinh > 0 VNĐ” và “Xác nhận báo giá vật tư phát sinh” | Đang yêu cầu khách duyệt vật tư trực tuyến | KTV giải thích vật tư, số lượng và giá tại hiện trường; chỉ ghi bảng kê khi khách đã đồng ý trực tiếp. Khách xem bảng kê và xác nhận nghiệm thu sau sửa chữa. Không có tác vụ chờ khách duyệt vật tư online. |
| KTV_BM 1: “Khách hàng đã xác nhận báo giá vật tư lúc” | Dễ hiểu là xác nhận trên ứng dụng | Đổi mô tả thành thời điểm KTV ghi nhận khách đồng ý trực tiếp. Nếu có điều chỉnh, ghi lại toàn bộ bảng kê hiện hành sau lần đồng ý mới; giữ phiên bản cũ để truy xuất. |
| Hình lược đồ logic và mô tả Đặt dịch vụ | Một đơn gắn trực tiếp với một dịch vụ | Thêm `ChiTietDonHang`: KH 1–n DonHang, DonHang 1–n ChiTietDonHang, DichVu 1–n ChiTietDonHang. KTV, báo giá, tiến độ, hủy, nghiệm thu và thanh toán nằm ở cấp chi tiết. |
| Luồng phân công và theo dõi đơn | Một KTV trên đơn chung không xử lý được nhiều chuyên môn | Đơn điện lạnh + điện nước có hai chi tiết, hai báo giá và hai KTV đúng chuyên môn. Chi tiết chưa hoàn tất không ngăn chi tiết khác nghiệm thu/thanh toán. |
| Luồng bổ sung dịch vụ | Chưa thể hiện việc thêm vào đơn đã tạo | Chủ đơn được thêm chi tiết vào cùng địa chỉ; chi tiết mới quay về bước tiếp nhận, có báo giá và phân công riêng. Thêm sau khi các chi tiết cũ đã xong vẫn tạo công việc mới; không sửa chứng từ cũ. |
| “Thù lao KTV = Tổng tiền thu khách...” | Mâu thuẫn với quy tắc không thu hoa hồng vật tư | Tổng thu = phí kiểm tra + tiền công + vật tư. Hoa hồng = tiền công × tỷ lệ đã chốt. Vật tư không chịu hoa hồng. Số tiền KTV giữ trước chi phí tự mua = tổng thu − hoa hồng; không gọi đây là lợi nhuận ròng của KTV. |
| Lợi nhuận ròng/doanh thu sàn | Giá trị dịch vụ khách trả không phải doanh thu nền tảng | Tách tổng giá trị dịch vụ đã thu khỏi hoa hồng đã đối soát. Chưa có sổ chi phí vận hành nên không thể gọi hoa hồng là lợi nhuận ròng. Biểu đồ đã dùng hoa hồng thực tế, không lấy cố định 15% tổng thu. |
| Video, ví khách, ngân hàng online | Một số use case mô tả tính năng chưa có | Đính kèm ảnh lỗi; trao đổi bằng tin nhắn với DPV. Thanh toán COD hoặc chuyển khoản có chứng từ được KT duyệt. Ví dành cho KTV. Không mô tả gọi video, cổng ngân hàng tự động hoặc ví khách như tính năng đã triển khai. |
| Chính sách/bảng giá áp dụng sau 00h | Phê duyệt đề xuất không đồng nghĩa tự đổi bảng giá | Chức năng giám đốc lưu quyết định và mốc áp dụng đề xuất. Bảng giá thực tế do quản trị cập nhật; không khẳng định có tác vụ tự áp dụng đề xuất nếu chưa xây dựng. |

Các ảnh thay thế nằm trong `REF/SoDo/20261007`. Ảnh xuất trực tiếp bằng phiên EA đang dùng có dấu bản dùng thử; tệp QEA vẫn chứa các phần tử chỉnh sửa được. Không chèn các ảnh vào báo cáo gốc trong phiên này.

## Luồng nghiệp vụ đã thống nhất

1. KH tạo một đơn chung tại một địa chỉ, gồm một hoặc nhiều chi tiết dịch vụ, có thể khác chuyên môn. Mỗi chi tiết có mô tả và ảnh riêng.
2. DPV tiếp nhận từng chi tiết, chẩn đoán và gửi báo giá sơ bộ. KH duyệt trước khi DPV phân công KTV đúng nhóm chuyên môn, đủ điều kiện ví và nhận việc.
3. KTV nhận hoặc từ chối lệnh, cập nhật di chuyển/đến nơi/xử lý. Quyền truy cập được kiểm tra theo chi tiết được giao, không mở toàn bộ công việc của KTV khác trong cùng đơn.
4. Nếu cần vật tư, KTV trao đổi trực tiếp với KH. KH không đồng ý thì không thay vật tư đó. KTV chỉ lưu bảng kê sau khi xác nhận khách đã đồng ý; phiên bản đang dùng được phân biệt với lịch sử.
5. KTV lập nghiệm thu với ảnh và chi phí của chính chi tiết. KH xác nhận hoặc yêu cầu làm lại. Nghiệm thu dùng bảng kê hiện hành đã ghi nhận đồng ý trực tiếp; bảng kê Pending cũ không tự được coi là đã đồng ý.
6. Thanh toán và đối soát theo chi tiết: COD phải có xác nhận đã thu; chuyển khoản phải có chứng từ và duyệt của KT. Hoa hồng dựa trên tiền công và tỷ lệ đã chốt.
7. KH gửi yêu cầu hủy một chi tiết. DPV xử lý theo trạng thái và phí hủy đã chốt; hủy chi tiết này không hủy công việc khác. Khi thợ đã tới/xử lý, chuyển sang hỗ trợ thay vì tự hủy trực tiếp.
8. KH xem tổng hợp đơn và thêm dịch vụ khi cần. Tổng tiền chỉ cộng phiếu nghiệm thu đã được duyệt và khoản thanh toán thực tế. Đơn gồm các chi tiết đã xong và đã hủy được coi là kết thúc; thêm chi tiết mở lại phần công việc cần tiếp nhận.

## Đối chiếu các sơ đồ use case

| Sơ đồ | Điều chỉnh chính và chức năng bổ sung |
|---|---|
| Tổng quát | Bỏ toàn bộ kế thừa tác nhân; thêm đăng ký/khôi phục cho người chưa xác thực và quản lý dịch vụ cho KH. |
| Khách hàng | Đặt đơn nhiều dịch vụ, bổ sung dịch vụ; duyệt báo giá sơ bộ, xác nhận nghiệm thu, COD/chuyển khoản; gửi yêu cầu hủy, tin nhắn DPV, vị trí, hỗ trợ/bảo hành, hồ sơ cá nhân và đăng ký hồ sơ KTV. Bỏ duyệt vật tư online và thanh toán ví khách. |
| Kỹ thuật viên | Nhận việc theo chi tiết, cập nhật tiến độ/vị trí, kê khai vật tư tại hiện trường, nghiệm thu, xác nhận thu tiền mặt, ví và lịch sử. |
| Điều phối | Báo giá và phân công theo chi tiết; tra cứu KTV/công việc, chẩn đoán/hướng dẫn, tin nhắn/ảnh lỗi, xử lý yêu cầu hủy. |
| CSKH | Hỗ trợ/khiếu nại/bảo hành, tra cứu hạn bảo hành, ghi nhận trao đổi/phân công xử lý, theo dõi đánh giá chất lượng. Không gán quyền hoàn tiền tự động khi code chưa có. |
| Kế toán | Duyệt yêu cầu ví, đối soát, kiểm tra phí hủy, duyệt chứng từ chuyển khoản và báo cáo dòng tiền. |
| Quản trị | Người dùng/phân quyền/khóa, danh mục và giá, cấu hình/nhật ký, duyệt hồ sơ KTV và tài khoản nhận tiền. |
| Giám đốc | Giá trị dịch vụ/hoa hồng, chất lượng/KPI/cảnh báo, xem và quyết định đề xuất chính sách. Không thể hiện nút phê duyệt báo cáo tài chính chưa triển khai. |

Giữ hình thức tác nhân, ellipse, boundary và thuộc tính hiển thị sơ đồ gốc. Mở rộng vùng chứa để đủ chức năng. Các quan hệ include/extend gây hiểu sai được bỏ; nghiệp vụ độc lập liên kết trực tiếp với tác nhân.

## Lược đồ logic và dữ liệu

Sơ đồ tổng quan giữ các chiều mũi tên đã được thầy sửa. Các đầu nối gắn với công việc dịch vụ được chuyển từ DonHang sang ChiTietDonHang. Thêm DeXuatVatTu để tách bảng kê phiên bản khỏi các dòng ChiTietDeXuatVatTu. Hai sơ đồ bổ sung thể hiện đủ 32 bảng vật lý và quan hệ tham chiếu theo SQL Server; Notes của từng phần tử lưu danh sách cột và khóa ngoại.

KhachHang/NhanVien trong sơ đồ tổng quan là khái niệm vai trò, lưu thực tế bằng NguoiDung.role. YeuCauBaoHanh lưu trong YeuCauHoTro với type=Warranty. Không tạo thêm bảng trùng nghĩa chỉ để khớp tên hình cũ. SchemaVersion, Idempotency và AuthOtp phục vụ cài đặt, chống gửi lặp và xác thực; không phải bảng dư. Các cột tên dịch vụ, giá, liên hệ và địa chỉ trên chi tiết là bản chụp lịch sử, cần giữ để đổi danh mục/hồ sơ không làm thay đổi chứng từ cũ.

Khóa ngoại kép `(MaDonHang, customerId)` bảo đảm chi tiết thuộc đúng chủ đơn. Loại khai báo khóa ngoại đơn trùng nghĩa trong schema mới; giữ chỉ mục truy vấn các chi tiết theo đơn. Từ điển giải thích tiếng Việt đủ 330 cột: `DOC/TU_DIEN_DU_LIEU_20261007.md` và metadata `MS_Description`. Cột tiếng Anh cũ chưa đổi tên vật lý vì đang ảnh hưởng trực tiếp API/backend/Android; điều này khác với chỉ chuẩn hóa từ khóa SQL.

## Chuyển đổi và quay lui

Database ứng dụng hiện chọn: `HomeFix_Final_20261007`. Database nguồn `HomeFix_Final` được giữ nguyên. Đơn cũ trở thành một đơn chung có một chi tiết, giữ mã chi tiết và chứng từ. Công cụ đã đối chiếu số dòng và nội dung của 30 bảng; các giá trị rowversion được tạo lại theo database mới.

Muốn quay lui cần dùng cả mã nguồn phiên bản trước và `DB_NAME=HomeFix_Final`; chỉ đổi DB_NAME khi đang chạy mã mới sẽ sai schema. Dữ liệu mới phát sinh trong database mới không tự nhập ngược về bản cũ. Hai tệp QEA gốc có bản sao lưu trước khi cập nhật trong thư mục `D:\Subject_K5\CNPM`.

Kết quả kiểm thử cuối và dấu kiểm tra tệp gốc nằm trong `REF/KiemThu/20261007`; kiểm thử trên database riêng để không tạo thêm đơn thử trong dữ liệu ứng dụng.
