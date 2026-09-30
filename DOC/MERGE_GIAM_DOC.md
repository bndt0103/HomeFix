# Gộp giao diện giám đốc — 30/09/2026

Đã lấy commit `8e4bb88` từ `origin/main` của HomeFix. Giữ nguyên mã `ExecutiveDashboard` (Tổng quan điều hành) và `PolicyApproval` (Phê duyệt chính sách) của thành viên nhóm. Giữ sidebar, màu sắc, thẻ, các màn hình và luồng nghiệp vụ hiện có; bổ sung ba mục báo cáo.

| Mục sidebar | Nội dung bổ sung |
|---|---|
| Khách hàng & chất lượng | Khách phục vụ, đơn hoàn tất, bảng chỉ số và so kỳ trước; phân bố đánh giá, khách cần chăm sóc, liên hệ khách, chi tiết khiếu nại; lọc ngày, CSV, cài đặt giám sát |
| Báo cáo tài chính | Biểu đồ thu/chi, bảng dòng tiền, tổng quan và cài đặt giám sát; giữ phân bổ vật tư/tiền công/hoa hồng, khoản thu, CSV hiện có; bổ sung xuất dòng tiền |
| Hiệu suất KTV | 8 thẻ thống kê, biểu đồ đơn nhận/hoàn thành, xếp hạng và xem chi tiết; lọc chuyên môn/xếp loại/tên/kỳ, CSV, giám sát |

## Quy ước số liệu

- Khách phục vụ và đơn hoàn tất: tính từ biên nhận thanh toán trong kỳ. Khách mới/khách hoạt động vẫn được giữ ở bảng chất lượng.
- Tỷ lệ khiếu nại: số đơn tạo trong kỳ có khiếu nại / số đơn tạo trong kỳ. Không so với đơn hoàn tất thuộc kỳ khác.
- So sánh chất lượng: kỳ trước liền kề có cùng số ngày; điểm đánh giá và tỷ lệ khiếu nại so chênh lệch tuyệt đối. Chưa có mốc so sánh được ghi rõ.
- Hiệu suất: đơn KTV đã nhận trong kỳ; tỷ lệ hoàn thành/hủy/khiếu nại/bảo hành tính trên cùng tập đơn. Bảo hành là yêu cầu bảo hành, không khẳng định đã tái khám.
- Đúng giờ: chỉ đơn có lịch hẹn và lịch sử đến nơi; thời gian xử lý từ bắt đầu sửa đến lần đầu gửi nghiệm thu, có đủ hai mốc. Thiếu dữ liệu hiển thị “Chưa có”.
- Dòng tiền vào: thanh toán ngân hàng đã xác minh + nạp ví được duyệt. Dòng tiền ra: rút ví được duyệt. Không tính lại COD do KTV giữ hoặc bút toán đối soát nội bộ.
- Hệ thống chưa có sổ chi phí vận hành nên chưa tính lợi nhuận ròng. Giữ rõ giá trị đơn đã thu và hoa hồng HomeFix; không dùng số minh họa từ ảnh.
- Mỗi báo cáo có cài đặt cá nhân riêng, lưu vào database, kiểm soát phiên bản. Báo cáo tuần/cảnh báo gửi vào Thông báo trong ứng dụng; cần máy chủ hoạt động.

## Cập nhật và kiểm tra

Trong `SRC`: chạy `npm.cmd run db:migrate:policies` nếu máy chưa có bảng chính sách; `npm.cmd run db:migrate:technician-ui` nếu thiếu cấu trúc ScreenTV2. Không chạy lại `db:init` trên database đang dùng.

Kiểm thử API: `npm.cmd run test:director` (`TEST_BASE_URL` là URL kết thúc bằng `/api`). Kiểm thử giao diện: `npm.cmd run test:director:ui` (`TEST_BASE_URL` là URL web).

Bản dự phòng trước merge còn trong Git stash với nhãn `homefix-before-director-merge-2026-09-30`. Chưa push thay đổi lên GitHub.

## Kết quả xác minh

- 46/46 kiểm thử API đạt, gồm hồi quy luồng đơn/KTV và kiểm tra số liệu, quyền, cài đặt báo cáo mới.
- 34 màn hình smoke test đạt; 5 nhóm kiểm thử ScreenTV2 đạt.
- Kiểm thử riêng 5 mục sidebar và 3 báo cáo: CSV, bộ lọc, lưu công tắc và bố cục 390px/1440px đạt.
- Đã kiểm tra bổ sung so sánh kỳ trước, chặn ngày đảo ngược và CSV dòng tiền.
- Build web và APK debug thành công. Chưa kiểm thử cài APK trên điện thoại thật.

## Khôi phục thông báo và lối vào duyệt báo giá

Đã nối lại AttentionProvider vào layout, phục hồi dấu nhắc việc trên chuông/menu/thẻ đơn và CSS chấm đỏ. Bổ sung khối việc cần xử lý cho các bộ phận, ánh xạ đúng các mục kế toán hiện tại. KH có nhãn dẫn tới duyệt báo giá ngay trên thẻ đơn. Trang chủ tự cập nhật 10 giây/lần; dữ liệu cũng làm mới khi trở lại tab hoặc có thao tác thay đổi. Thông báo đã đọc vẫn giữ nhắc việc nếu đơn chưa được xử lý.

Đã kiểm thử hai phiên KH–điều phối không tải lại trang: KH tự thấy báo giá và chấp nhận được; điều phối tự nhận bước phân công. Kiểm thử nhắc việc 4 vai trò, luồng đầy đủ 15 thao tác và 34 màn hình đều đạt. APK đã đóng gói lại; chưa thử cài trên điện thoại thật.

## GPS khách hàng theo từng đơn

Khách chỉ có nút “Cập nhật GPS của tôi” trong bản đồ; không còn nút mở chỉ đường hay thao tác xem vị trí thợ thủ công ở phía khách. Nút lấy GPS mới (không dùng vị trí cache), lưu riêng theo đơn và giữ nguyên địa chỉ đặt dịch vụ. KTV tự nhận điểm đến GPS mới khoảng 10 giây/lần và vẫn có nút mở chỉ đường. Nếu chưa có GPS khách thì dùng địa chỉ đặt dịch vụ. GPS chỉ được lấy khi khách bấm nút; từ chối quyền không xóa vị trí cũ.

Máy nhận bản cập nhật cần chạy `npm.cmd run db:migrate:customer-location` trong SRC. Migration bổ sung bảng ViTriKhachHang, không thay đổi dữ liệu đơn cũ. GPS lưu riêng để không làm thay đổi phiên bản đơn đang thao tác. API GET/PATCH `/api/orders/:id/customer-location`: chỉ chủ đơn được cập nhật, KTV được cấp quyền đơn và điều phối được đọc; đơn đã kết thúc không nhận cập nhật.

Đã kiểm thử quyền, dữ liệu không hợp lệ, đơn đã kết thúc và cập nhật hai vị trí khác nhau giữa phiên KH/KTV. Luồng đầy đủ 16 bước gồm kiểm thử GPS đạt.
