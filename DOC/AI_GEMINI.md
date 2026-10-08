# Chat hỗ trợ với Gemini

Khách hàng bấm **Chat AI** ở góc phải phía dưới trên các màn hình khách hàng, hoặc mở **Hỗ trợ → Chat hỗ trợ**. Khách tự chọn trợ lý AI hoặc gặp nhân viên; CSKH không có chế độ tự trả lời theo ca.

Chat nhân viên đã có hộp thư, tiếp nhận cuộc trò chuyện, trả lời, lưu lịch sử, phân trang tin cũ và thông báo. Khung tin nhắn cuộn riêng, chiều cao cố định. Chat này tách khỏi trao đổi chẩn đoán/báo giá với điều phối viên trong chi tiết dịch vụ.

## Trạng thái kết nối Gemini

**Bộ kết nối Google Gemini đã hoàn tất.** Key mới đã được kiểm tra và đã nhận câu trả lời thật bằng model `gemini-3.5-flash-lite`. Bản chạy được bật bằng `GEMINI_ENABLED=true` trong `.env`; `/api/support-chat/status` trả `available: true` khi key, model và cờ bật được cấu hình hợp lệ.

Phạm vi sử dụng: chỉ gửi nội dung khách nhập trong phiên chat AI và danh mục dịch vụ công khai. Không tự động gửi hồ sơ khách, dữ liệu đơn hàng, lịch sử chat nhân viên, mã tài khoản hay tên khách. Khi chọn AI, khách phải đồng ý với việc gửi nội dung sang Google. Không nên nhập thông tin cá nhân hoặc bí mật vào cuộc chat.

## Cách dùng

1. Đăng nhập khách hàng, bấm **Chat AI → Trợ lý AI** ở góc phải. Nút chat cũng hiện khi đang xem dịch vụ, đơn hàng, hồ sơ hoặc thông báo.
2. Chọn cho phép gửi nội dung AI đến Gemini ngay trong khung chat rồi bấm **Bắt đầu chat AI**. Không có hộp thông báo bật lên.
3. Nhập câu hỏi về dịch vụ, phí tham khảo hoặc cách đặt dịch vụ. AI không thao tác đơn hàng, duyệt thanh toán hay xử lý khiếu nại.
4. Chọn **Gặp nhân viên** bất cứ lúc nào. CSKH mở **Hộp thư hỗ trợ**, tiếp nhận và trả lời. Chuyển được ngay cả khi AI đang trả lời; câu trả lời AI muộn sẽ không được thêm vào cuộc chat.

Cửa sổ chat giữ kích thước cố định; tin dài cuộn bên trong. Đóng/mở lại vẫn giữ lịch sử; nút mở rộng đưa đến trang chat đầy đủ với cùng hội thoại. Trên điện thoại, nút chat nằm phía trên thanh điều hướng. Tin của tài khoản đang xem nằm bên phải, màu xanh; tin nhận được nằm bên trái, màu trắng. Quy tắc này áp dụng cả trao đổi khách hàng–điều phối viên và chat hỗ trợ.

AI được hướng dẫn theo nghiệp vụ hiện tại: chọn giờ hẹn tương lai theo phút, một đơn nhiều dịch vụ và phân công theo từng chi tiết, duyệt báo giá sơ bộ, đồng ý vật tư trực tiếp, nghiệm thu và thanh toán trong ứng dụng. Danh mục và phí tham khảo được lấy từ dịch vụ đang hoạt động. AI không biết trạng thái đơn riêng của khách; cần xử lý đơn thực tế thì chọn **Gặp nhân viên**.

Nếu Google gặp lỗi, hết hạn mức hoặc yêu cầu treo, hệ thống giữ câu hỏi và chuyển cuộc trò chuyện sang nhân viên. Không tạo câu trả lời AI giả. Khi quay lại AI sau khi chat nhân viên, một phiên AI mới bắt đầu và không gửi lịch sử phiên trước.

## API key cần chuẩn bị

1. Tạo API key cho Gemini trong [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Lưu key trực tiếp trên máy trong `SRC/backend/.env`, sau dấu `=` ở dòng `GEMINI_API_KEY=` đã có sẵn. **Không gửi key qua chat hoặc đưa vào Git.** Tệp này được `.gitignore` loại trừ. Nếu key đã xuất hiện trong chat, thu hồi key đó và tạo key mới trước khi điền.
3. Đặt `GEMINI_ENABLED=true`, lưu file rồi khởi động lại backend. Bản hiện tại đã được bật và kiểm tra. File `.env.example` giữ key trống và cờ tắt để máy mới chỉ bật khi đã có key riêng.

Các biến đã được chuẩn bị trong `.env` và `.env.example`:

```dotenv
GEMINI_API_KEY=
GEMINI_ENABLED=true
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_DAILY_LIMIT=100
```

Model có thể đổi theo quyền truy cập và hạn mức thực tế của API key. Không dùng tài khoản Gemini cá nhân thay cho API key.

`GEMINI_DAILY_LIMIT` giới hạn tổng lượt hỏi AI của hệ thống mỗi ngày UTC; mặc định 100. Các lượt đã gọi Google nhưng gặp lỗi vẫn được tính. Mỗi khách gửi tối đa 12 tin/phút; mỗi hội thoại xử lý một yêu cầu AI tại một thời điểm. Google còn có hạn mức riêng theo tài khoản/dự án.

API key chỉ được dùng ở backend và gửi qua header; không nằm trong URL, frontend hoặc APK. Thời gian chờ Google tối đa 20 giây. Nội dung gửi được giới hạn tối đa 24 tin AI của phiên hiện tại và 100 dịch vụ đang hoạt động. Tham khảo [bảo vệ API key](https://ai.google.dev/gemini-api/docs/api-key), [generateContent](https://ai.google.dev/api/generate-content) và [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).

## Cơ sở dữ liệu

`014_support_chat.sql` bổ sung `HoiThoaiHoTro`, `TinNhanHoTro` và `ThongBao.DuongDan`. Không xóa hoặc đổi tên bảng hiện có. Chạy `npm run db:migrate:support-chat` trên database đã nâng cấp đơn nhiều dịch vụ; `npm run db:init` cũng áp dụng migration này cho database mới.

Các trường nhận diện người gửi, chế độ gửi, con trỏ đã đọc và lần đồng ý AI được lưu riêng. Backend gửi yêu cầu Google sau khi commit SQL; không giữ khóa database khi chờ AI. Yêu cầu gửi lại cùng `Idempotency-Key` không tạo tin hoặc gọi AI thêm. Yêu cầu chưa hoàn tất quá 90 giây được khôi phục sang nhân viên khi backend khởi động, quét định kỳ hoặc khách mở hội thoại.

## Kiểm tra kết nối

Khởi động backend sau khi cấu hình key, đăng nhập khách hàng và mở nút **Chat AI**. Khi chọn **Trợ lý AI**, nhập câu hỏi về một dịch vụ trong danh mục để kiểm tra câu trả lời; chuyển **Gặp nhân viên** để kiểm tra CSKH tiếp nhận. Nếu AI chưa sẵn sàng, kiểm tra key, model và `GEMINI_ENABLED` trong `.env` rồi khởi động lại backend.
