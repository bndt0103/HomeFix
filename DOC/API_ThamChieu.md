# HomeFix — API theo mã nguồn cuối

Base local: http://localhost:3000/api. Không gửi thông tin SQL đến frontend/APK. Các API ngoài health, services, đăng nhập/đăng ký cần Authorization: Bearer TOKEN. Quyền sở hữu tiếp tục được kiểm tra theo đơn/phiếu; bảng vai trò không thay thế kiểm tra đó.

## Cấu trúc chung

Thành công: `{ "data": ..., "meta": { "serverTime": "UTC ISO-8601", ... } }`.
Lỗi: `{ "error": { "code": "...", "message": "...", "details": ... }, "requestId": "..." }`.
Mã 401: phiên thiếu/hết hạn; 403: sai vai trò; 404: không tìm thấy/không thuộc quyền; 409: sai trạng thái/version hoặc trùng nghiệp vụ; 422: dữ liệu sai; 413/415: ảnh quá lớn/không hợp lệ.

ID là số nguyên. Tiền/quantity gửi dạng chuỗi thập phân không có dấu phân cách, ví dụ "220000.00". Giá và tổng chính thức được tính ở backend/SQL. version là Base64 8 byte rowversion; expectedVersion phải là version đúng đối tượng đang thay đổi. Date gửi ISO UTC, giao diện hiển thị giờ địa phương. Payload lạ bị từ chối, không được tự gửi role khi đăng ký khách.

Idempotency-Key bắt buộc cho tạo đơn, thu COD, đối soát và yêu cầu/quyết định ví (xem common.js). Giữ một UUID cho cùng ý định khi retry; nếu thay nội dung, dùng key mới. Không dùng version của đơn làm version của phiếu. Các danh sách có page/pageSize khi được route hỗ trợ; /orders có thêm status/paymentStatus. Báo cáo nhận from/to theo UTC, to là cận trên không bao gồm.

## Đầu vào các thao tác cốt lõi

| API | JSON body / form |
|---|---|
| POST /auth/login | identifier, password → accessToken, user, expiresIn |
| POST /auth/register | fullName, phone, email tùy chọn/null, password; tự tạo KH |
| POST /uploads | multipart: file, purpose, orderId tùy loại; trả id ảnh |
| POST /orders | serviceId, address chuỗi 10–500 ký tự, description, scheduledAt ISO/null, attachmentIds[] |
| POST /orders/:id/preliminary-quotes | diagnosis, expectedVersion của đơn |
| POST /orders/:id/preliminary-quotes/:qid/decision | decision Approved/Rejected, reason khi từ chối, expectedVersion của báo giá |
| POST /orders/:id/assignments | technicianId, expectedVersion của đơn |
| POST /assignments/:id/decision | decision Accepted/Rejected, reason khi từ chối, expectedVersion của lệnh |
| PATCH /orders/:id/progress | nextStatus, expectedVersion của đơn |
| POST /orders/:id/material-quotes | items[{name,quantity,unitPrice,unit,warrantyMonths}], note, expectedVersion của đơn |
| POST /orders/:id/material-quotes/:qid/decision | decision Approved/Rejected, reason khi từ chối, expectedVersion của phiếu |
| POST /orders/:id/acceptances | cause, solution, photoIds từ 1–5 ảnh, expectedVersion của đơn |
| POST /orders/:id/acceptances/:aid/decision | decision, reason khi từ chối, signatureId nếu cần, expectedVersion của phiếu |
| POST /orders/:id/payments/cod | expectedVersion của đơn; không nhận amount từ client |
| POST /settlements/:id/confirm | expectedVersion của đối soát |
| POST /orders/:id/reviews | rating số nguyên 1–5, comment chuỗi (có thể rỗng) |
| POST /orders/:id/cancel | reason, expectedVersion của đơn |
| POST /wallet-requests | type Deposit/Withdrawal, amount, note, proofId bắt buộc nếu Deposit |
| POST /wallet-requests/:id/decision | decision Approved/Rejected, reason nếu từ chối, expectedVersion của yêu cầu |
| POST /support/tickets | orderId, type Complaint/Warranty, description |
| PATCH /support/tickets/:id | status InProgress/Resolved/Rejected, resolution, expectedVersion |

purpose ảnh: OrderFault (KH), MaterialEvidence/AcceptancePhoto/WalletProof (KTV), CustomerSignature/TechnicianDocument (KH). Ảnh hiện trường và chữ ký phải gắn orderId đúng quyền/trạng thái. Tệp ảnh được kiểm tra nội dung và re-encode; đọc bằng GET /uploads/:id với token. Chứng từ kỹ thuật chưa có biểu mẫu đính kèm trong hồ sơ cộng tác đơn giản của UI, không nhầm khả năng API với một màn đã cài.

## Danh mục endpoint

Danh mục được trích từ các khai báo route cuối cùng. Các route không ghi roles trực tiếp vẫn qua auth và kiểm tra sở hữu trong module; chi tiết xác thực xem mã nguồn. Không có API video, SMS OTP, thanh toán ngân hàng hoặc tự tạo đơn bảo hành.

| Method | Route | Quyền khai báo | Module |
|---|---|---|---|
| GET | /api/admin/services | ADMIN | admin.js |
| GET | /api/app-config | Đã đăng nhập; kiểm tra tài nguyên trong module | admin.js |
| GET | /api/assignments/:id | KTV, DPV | orders.js |
| POST | /api/assignments/:id/decision | KTV | orders.js |
| GET | /api/audit-logs | ADMIN | admin.js |
| POST | /api/auth/login | Công khai | auth.js |
| POST | /api/auth/logout | Đã đăng nhập; kiểm tra tài nguyên trong module | auth.js |
| GET | /api/auth/me | Đã đăng nhập; kiểm tra tài nguyên trong module | auth.js |
| POST | /api/auth/register | Công khai | auth.js |
| GET | /api/health | Công khai | server.js |
| GET | /api/notifications | Đã đăng nhập; kiểm tra tài nguyên trong module | admin.js |
| PATCH | /api/notifications/:id/read | Đã đăng nhập; kiểm tra tài nguyên trong module | admin.js |
| GET | /api/orders | KH, KTV, DPV, CSKH, KT | orders.js |
| POST | /api/orders | KH | orders.js |
| GET | /api/orders/:id | Đã đăng nhập; kiểm tra tài nguyên trong module | orders.js |
| GET | /api/orders/:id/acceptances | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/acceptances | KTV | quotes.js |
| GET | /api/orders/:id/acceptances/:recordId | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/acceptances/:recordId/decision | KH | quotes.js |
| GET | /api/orders/:id/assignments | KTV, DPV | orders.js |
| POST | /api/orders/:id/assignments | DPV | orders.js |
| GET | /api/orders/:id/attachments | Đã đăng nhập; kiểm tra tài nguyên trong module | uploads.js |
| POST | /api/orders/:id/cancel | KH, DPV | orders.js |
| GET | /api/orders/:id/cancellation | Đã đăng nhập; kiểm tra tài nguyên trong module | orders.js |
| GET | /api/orders/:id/history | Đã đăng nhập; kiểm tra tài nguyên trong module | orders.js |
| GET | /api/orders/:id/invoice | KH, KTV, KT | finance.js |
| GET | /api/orders/:id/material-quotes | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/material-quotes | KTV | quotes.js |
| GET | /api/orders/:id/material-quotes/:recordId | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/material-quotes/:recordId/decision | KH | quotes.js |
| GET | /api/orders/:id/notes | Đã đăng nhập; kiểm tra tài nguyên trong module | orders.js |
| POST | /api/orders/:id/notes | DPV | orders.js |
| GET | /api/orders/:id/payments | KH, KTV, KT | finance.js |
| POST | /api/orders/:id/payments/cod | KTV | finance.js |
| GET | /api/orders/:id/preliminary-quotes | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/preliminary-quotes | DPV | quotes.js |
| GET | /api/orders/:id/preliminary-quotes/:recordId | Đã đăng nhập; kiểm tra tài nguyên trong module | quotes.js |
| POST | /api/orders/:id/preliminary-quotes/:recordId/decision | KH | quotes.js |
| PATCH | /api/orders/:id/progress | KTV | orders.js |
| GET | /api/orders/:id/reviews | Đã đăng nhập; kiểm tra tài nguyên trong module | support.js |
| POST | /api/orders/:id/reviews | KH | support.js |
| GET | /api/orders/:id/technician-location | KH, DPV | orders.js |
| GET | /api/reports/finance | GD, KT | admin.js |
| GET | /api/reports/finance.csv | GD, KT | admin.js |
| GET | /api/reports/summary | GD, KT, CSKH, ADMIN, DPV | admin.js |
| GET | /api/reports/technicians | GD, KT, DPV | admin.js |
| GET | /api/services | Công khai | server.js |
| POST | /api/services | ADMIN | admin.js |
| PATCH | /api/services/:id | ADMIN | admin.js |
| GET | /api/settings | ADMIN | admin.js |
| PATCH | /api/settings/:key | ADMIN | admin.js |
| GET | /api/settlements | KT | finance.js |
| POST | /api/settlements/:id/confirm | KT | finance.js |
| GET | /api/support/tickets | KH, CSKH | support.js |
| POST | /api/support/tickets | KH | support.js |
| GET | /api/support/tickets/:id | KH, CSKH | support.js |
| PATCH | /api/support/tickets/:id | CSKH | support.js |
| GET | /api/technician-applications | ADMIN | admin.js |
| POST | /api/technician-applications | KH | admin.js |
| POST | /api/technician-applications/:id/decision | ADMIN | admin.js |
| GET | /api/technician-applications/me | KH, KTV | admin.js |
| GET | /api/technicians | DPV | orders.js |
| GET | /api/technicians/available | DPV | orders.js |
| GET | /api/technicians/me | KTV | orders.js |
| GET | /api/technicians/me/assignments | KTV | orders.js |
| PATCH | /api/technicians/me/availability | KTV | orders.js |
| GET | /api/technicians/me/income | KTV | finance.js |
| PATCH | /api/technicians/me/location | KTV | orders.js |
| GET | /api/technicians/me/wallet | KTV | finance.js |
| POST | /api/uploads | Đã đăng nhập; kiểm tra tài nguyên trong module | uploads.js |
| GET | /api/uploads/:id | Đã đăng nhập; kiểm tra tài nguyên trong module | uploads.js |
| GET | /api/users | ADMIN | auth.js |
| POST | /api/users | ADMIN | auth.js |
| PATCH | /api/users/:id | ADMIN | auth.js |
| GET | /api/users/me | Đã đăng nhập; kiểm tra tài nguyên trong module | auth.js |
| PATCH | /api/users/me | Đã đăng nhập; kiểm tra tài nguyên trong module | auth.js |
| POST | /api/users/me/password | Đã đăng nhập; kiểm tra tài nguyên trong module | auth.js |
| GET | /api/wallet-requests | KTV, KT | finance.js |
| POST | /api/wallet-requests | KTV | finance.js |
| POST | /api/wallet-requests/:id/cancel | KTV | finance.js |
| POST | /api/wallet-requests/:id/decision | KT | finance.js |

## Cách thử

Chạy máy chủ, dùng npm test để thực hiện 35 ca đã viết. Xem tests/api.test.js để có chuỗi request, dữ liệu và cách lấy phiên bản thực từ phản hồi. Không lấy token/ID/expectedVersion cũ trong ví dụ rồi dùng lại cho dữ liệu khác. Tài liệu thiết kế 14 ngày là bản đề xuất trước triển khai; bảng này và mã nguồn cuối là nguồn đối chiếu khi sửa client.

## Bổ sung sau merge: danh mục và thanh toán

Dịch vụ có thêm isPopular (boolean); ADMIN có thể đặt khi POST /api/services hoặc PATCH /api/services/:id. PATCH vẫn cần expectedVersion. Trang danh mục lọc tên và nhóm trên danh sách dịch vụ hoạt động. Cập nhật database cũ bằng npm.cmd run db:migrate trước khi chạy server mới.

| Method | Endpoint | Quyền | Nội dung |
| --- | --- | --- | --- |
| GET | /api/payment-options | Đã đăng nhập | Danh mục ngân hàng và tài khoản nhận đang bật |
| GET, POST | /api/bank-accounts | ADMIN | Xem/thêm tài khoản nhận tiền |
| PATCH | /api/bank-accounts/:id | ADMIN | isActive, expectedVersion |
| GET | /api/orders/:id/payment-details | Có quyền xem đơn | Phương thức, biên nhận, yêu cầu chuyển khoản |
| POST | /api/orders/:id/payment-method | KH sở hữu đơn | method COD/BANK, bankAccountId khi BANK, expectedVersion |
| POST | /api/payment-requests/:id/submit | KH sở hữu yêu cầu | proofId, customerReference tùy chọn, expectedVersion |
| GET | /api/bank-payment-requests | KT | Hàng đợi và kết quả xác minh |
| POST | /api/payment-requests/:id/decision | KT | decision Approved/Rejected, expectedVersion; duyệt cần receivedAmount + bankReference, từ chối cần reason |

Các POST chọn phương thức, gửi chứng từ và quyết định kế toán cần Idempotency-Key UUID. Gửi lại đúng request dùng cùng key; thao tác mới dùng key mới. Khi KH duyệt nghiệm thu, gửi paymentMethod COD/BANK và bankAccountId nếu BANK. Ảnh chuyển khoản dùng purpose PaymentProof tại /api/uploads, có orderId; chỉ KH sở hữu ảnh và KT xem được ảnh. Gửi chứng từ không tự đánh dấu đã thanh toán. Xem [quy trình thanh toán](THANH_TOAN.md).

OTP gửi qua Gmail được giới hạn ở mức 3 mã/giờ cho mỗi địa chỉ, cooldown 90 giây và tối đa 10 yêu cầu/15 phút cho một địa chỉ IP. Mã hết hạn sau 5 phút, dùng một lần và bị khóa sau 5 lần nhập sai.
