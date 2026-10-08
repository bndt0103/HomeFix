# Từ điển dữ liệu HomeFix — 07/10/2026

Nguồn: lược đồ SQL Server thực tế. `DonHang` là đơn chung; `ChiTietDonHang` là công việc theo dịch vụ. Các trường `orderId` cũ luôn trỏ đến chi tiết dịch vụ, không trỏ đến đơn chung.

Tên các cột mới dùng tiếng Việt. Các tên cột đang được backend, ứng dụng Android và API sử dụng được giữ để tránh thay đổi hợp đồng dữ liệu; ý nghĩa tiếng Việt được ghi vào `MS_Description` của từng cột. Không coi các bản chụp tên dịch vụ, địa chỉ, liên hệ và giá tại thời điểm đặt là dữ liệu dư.

## AuthOtp

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | uniqueidentifier | Không |  |
| purpose | Mục đích sử dụng | nvarchar | Không |  |
| channel | Kênh gửi mã xác thực | nvarchar | Không |  |
| destination | Địa chỉ nhận mã xác thực | nvarchar | Không |  |
| binding | Dữ liệu ràng buộc mã xác thực | nvarchar | Không |  |
| codeHash | Giá trị băm mã xác thực | nvarchar | Không |  |
| attempts | Số lần thử | int | Không |  |
| ready | Sẵn sàng | bit | Không |  |
| consumed | Đã sử dụng mã xác thực | bit | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| expiresAt | Thời điểm hết hạn | datetime2 | Không |  |

## BaoGiaSoBo

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| diagnosis | Chẩn đoán sơ bộ | nvarchar | Không |  |
| inspectionFee | Phí kiểm tra | decimal | Không |  |
| laborFee | Tiền công | decimal | Không |  |
| commissionRatePercent | Tỷ lệ hoa hồng phần trăm | decimal | Không |  |
| total | Tổng tiền | decimal | Có |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| createdBy | Mã người tạo | int | Không | NguoiDung.id |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| reason | Lý do | nvarchar | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## CauHinh

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| key | Khóa cấu hình | varchar | Không |  |
| value | Giá trị cấu hình | nvarchar | Không |  |
| label | Nhãn hiển thị | nvarchar | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## ChiTietDeXuatVatTu

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| quoteId | Mã bảng kê vật tư | int | Không | DeXuatVatTu.id |
| name | Tên | nvarchar | Không |  |
| quantity | Số lượng vật tư | decimal | Không |  |
| unit | Đơn vị tính | nvarchar | Không |  |
| unitPrice | Đơn giá vật tư | decimal | Không |  |
| lineTotal | Thành tiền dòng vật tư | decimal | Có |  |
| warrantyMonths | Số tháng bảo hành | int | Không |  |

## ChiTietDonHang

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| MaDonHang | Mã đơn hàng chung | int | Không | DonHang.MaDonHang |
| id | Mã bản ghi | int | Không |  |
| customerId | Mã khách sở hữu chi tiết dịch vụ | int | Không | DonHang.MaKhachHang, NguoiDung.id |
| serviceId | Mã dịch vụ | int | Không | DichVu.id |
| serviceName | Tên dịch vụ tại thời điểm đặt | nvarchar | Không |  |
| serviceGroup | Nhóm chuyên môn tại thời điểm đặt | nvarchar | Không |  |
| contactName | Tên người liên hệ tại thời điểm đặt | nvarchar | Không |  |
| contactPhone | Số điện thoại liên hệ tại thời điểm đặt | varchar | Không |  |
| address | Địa chỉ tại thời điểm tạo chi tiết | nvarchar | Không |  |
| description | Mô tả | nvarchar | Không |  |
| scheduledAt | Thời điểm hẹn theo chi tiết | datetime2 | Có |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| assignedTechnicianId | Mã kỹ thuật viên đang phụ trách chi tiết | int | Có | KyThuatVien.id |
| departedAt | Thời điểm bắt đầu di chuyển | datetime2 | Có |  |
| cancelReason | Lý do yêu cầu hủy | nvarchar | Có |  |
| cancellationFee | Phí hủy đã ghi nhận | decimal | Không |  |
| cancellationPaymentStatus | Trạng thái thanh toán phí hủy | varchar | Không |  |
| cancelledAt | Thời điểm hủy | datetime2 | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| updatedAt | Thời điểm cập nhật | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
| cancellationFeeSnapshot | Phí hủy chốt tại thời điểm đặt dịch vụ | decimal | Không |  |
| paymentMethod | Phương thức thanh toán | varchar | Không |  |
| cancelRequestedBy | Vai trò gửi yêu cầu hủy | varchar | Có |  |
| cancelRequestedAt | Thời điểm yêu cầu hủy | datetime2 | Có |  |

## DanhGia

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| customerId | Mã khách sở hữu chi tiết dịch vụ | int | Không | NguoiDung.id |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| rating | Điểm đánh giá | int | Không |  |
| comment | Lời nhận xét | nvarchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## DeXuatChinhSach

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| proposalCode | Mã đề xuất chính sách | varchar | Không |  |
| title | Tiêu đề | nvarchar | Không |  |
| department | Bộ phận | nvarchar | Không |  |
| submittedAt | Thời điểm gửi hồ sơ | datetime2 | Không |  |
| serviceGroup | Nhóm chuyên môn tại thời điểm đặt | nvarchar | Không |  |
| currentDiscount | Mức giảm đang áp dụng | decimal | Có |  |
| proposedDiscount | Mức giảm đề xuất | decimal | Có |  |
| currentBonus | Mức thưởng đang áp dụng | nvarchar | Có |  |
| proposedBonus | Mức thưởng đề xuất | nvarchar | Có |  |
| impact | Ảnh hưởng của đề xuất | nvarchar | Không |  |
| reason | Lý do | nvarchar | Không |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| directorNote | Ý kiến giám đốc | nvarchar | Có |  |
| effectiveAt | Thời điểm có hiệu lực | varchar | Có |  |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## DeXuatVatTu

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| revision | Số phiên bản bảng kê | int | Không |  |
| isCurrent | Là phiên bản bảng kê hiện hành | bit | Không |  |
| note | Ghi chú | nvarchar | Có |  |
| total | Tổng tiền | decimal | Không |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| createdBy | Mã người tạo | int | Không | NguoiDung.id |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| reason | Lý do | nvarchar | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
| CachXacNhan | Cách xác nhận vật tư: trực tiếp tại hiện trường | varchar | Có |  |

## DichVu

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| name | Tên | nvarchar | Không |  |
| groupCode | Mã nhóm dịch vụ | nvarchar | Không |  |
| description | Mô tả | nvarchar | Không |  |
| inspectionFee | Phí kiểm tra | decimal | Không |  |
| laborFee | Tiền công | decimal | Không |  |
| commissionRatePercent | Tỷ lệ hoa hồng phần trăm | decimal | Không |  |
| isPopular | Là dịch vụ nổi bật | bit | Không |  |
| isActive | Đang hoạt động | bit | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## DoiSoat

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| paymentId | Mã thanh toán | int | Không | ThanhToan.id |
| laborFee | Tiền công | decimal | Không |  |
| commissionRatePercent | Tỷ lệ hoa hồng phần trăm | decimal | Không |  |
| commissionAmount | Số tiền hoa hồng nền tảng | decimal | Có |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| confirmedBy | Mã người xác nhận | int | Có | NguoiDung.id |
| confirmedAt | Thời điểm xác nhận | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## DonHang

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| MaDonHang | Mã đơn hàng chung | int | Không |  |
| MaKhachHang | Mã khách hàng | int | Không | NguoiDung.id |
| DiaChi | Địa chỉ thực hiện | nvarchar | Không |  |
| MoTa | Mô tả chung | nvarchar | Không |  |
| NgayHen | Ngày hẹn | datetime2 | Có |  |
| NgayTao | Ngày tạo | datetime2 | Không |  |

## GhiChuDon

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| authorId | Mã người viết | int | Không | NguoiDung.id |
| text | Nội dung trao đổi | nvarchar | Không |  |
| visibility | Phạm vi hiển thị | varchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## GiaoDichVi

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| type | Loại nghiệp vụ | varchar | Không |  |
| amount | Số tiền | decimal | Không |  |
| referenceType | Loại bản ghi tham chiếu | varchar | Không |  |
| referenceId | Mã bản ghi tham chiếu | int | Không |  |
| actorId | Mã người thực hiện | int | Có | NguoiDung.id |
| note | Ghi chú | nvarchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## HoSoKTV

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| userId | Mã người dùng | int | Không | NguoiDung.id |
| skillGroup | Nhóm chuyên môn kỹ thuật viên | nvarchar | Không |  |
| serviceArea | Khu vực phục vụ | nvarchar | Không |  |
| experience | Kinh nghiệm | nvarchar | Không |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| reason | Lý do | nvarchar | Có |  |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
| profileJson | Nội dung hồ sơ dạng JSON | nvarchar | Có |  |
| frontDocumentId | Mã ảnh mặt trước giấy tờ | int | Có | TepDinhKem.id |
| backDocumentId | Mã ảnh mặt sau giấy tờ | int | Có | TepDinhKem.id |
| identityNumber | Số giấy tờ định danh | varchar | Có |  |

## Idempotency

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| actorId | Mã người thực hiện | int | Không | NguoiDung.id |
| route | Đường dẫn yêu cầu | varchar | Không |  |
| requestKey | Khóa chống xử lý yêu cầu lặp | varchar | Không |  |
| payloadHash | Giá trị băm nội dung yêu cầu | char | Không |  |
| resultJson | Kết quả đã xử lý dạng JSON | nvarchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## KyThuatVien

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không | NguoiDung.id |
| skillGroup | Nhóm chuyên môn kỹ thuật viên | nvarchar | Không |  |
| serviceArea | Khu vực phục vụ | nvarchar | Không |  |
| availability | Trạng thái nhận việc | varchar | Không |  |
| balance | Số dư ví | decimal | Không |  |
| latitude | Vĩ độ | decimal | Có |  |
| longitude | Kinh độ | decimal | Có |  |
| accuracyMeters | Độ chính xác vị trí theo mét | decimal | Có |  |
| positionUpdatedAt | Thời điểm cập nhật vị trí | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## LenhDieuPhoi

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| isActive | Đang hoạt động | bit | Không |  |
| expiresAt | Thời điểm hết hạn | datetime2 | Không |  |
| createdBy | Mã người tạo | int | Không | NguoiDung.id |
| reason | Lý do | nvarchar | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## LichSuDonHang

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| fromStatus | Trạng thái trước | varchar | Có |  |
| toStatus | Trạng thái sau | varchar | Không |  |
| actorId | Mã người thực hiện | int | Có | NguoiDung.id |
| reason | Lý do | nvarchar | Không |  |
| happenedAt | Thời điểm diễn ra | datetime2 | Không |  |

## LichSuHoTro

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| ticketId | Mã yêu cầu hỗ trợ | int | Không | YeuCauHoTro.id |
| actorId | Mã người thực hiện | int | Không | NguoiDung.id |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| note | Ghi chú | nvarchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## NguoiDung

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| fullName | Họ và tên | nvarchar | Không |  |
| phone | Số điện thoại | varchar | Không |  |
| email | Địa chỉ thư điện tử | nvarchar | Có |  |
| cccd | Số căn cước công dân | varchar | Có |  |
| passwordHash | Giá trị băm mật khẩu | varchar | Không |  |
| role | Vai trò tài khoản | varchar | Không |  |
| defaultAddress | Địa chỉ mặc định | nvarchar | Có |  |
| isActive | Đang hoạt động | bit | Không |  |
| tokenVersion | Phiên bản thu hồi phiên đăng nhập | int | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
| avatarUrl | Đường dẫn ảnh đại diện | nvarchar | Có |  |
| lockedUntil | Thời điểm kết thúc khóa tạm | datetime2 | Có |  |

## NhatKy

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| actorId | Mã người thực hiện | int | Có |  |
| action | Hành động | varchar | Không |  |
| entity | Loại đối tượng nhật ký | varchar | Không |  |
| entityId | Mã đối tượng nhật ký | int | Có |  |
| detail | Nội dung chi tiết | nvarchar | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## PhieuNghiemThu

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| revision | Số phiên bản bảng kê | int | Không |  |
| cause | Nguyên nhân sự cố | nvarchar | Không |  |
| solution | Cách xử lý sự cố | nvarchar | Không |  |
| materialQuoteId | Mã bảng kê vật tư | int | Có | DeXuatVatTu.id |
| inspectionFee | Phí kiểm tra | decimal | Không |  |
| laborFee | Tiền công | decimal | Không |  |
| materialTotal | Tổng chi phí vật tư | decimal | Không |  |
| total | Tổng tiền | decimal | Có |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| reason | Lý do | nvarchar | Có |  |
| signatureId | Mã tệp chữ ký nghiệm thu | int | Có | TepDinhKem.id |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
| proposedPaymentMethod | Phương thức thanh toán đề xuất | varchar | Có |  |

## SchemaVersion

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| version | Phiên bản bản ghi chống ghi đè đồng thời | int | Không |  |
| appliedAt | Thời điểm áp dụng | datetime2 | Không |  |

## TaiKhoanNhanTien

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| bankCode | Mã ngân hàng | varchar | Không |  |
| bankName | Tên ngân hàng | nvarchar | Không |  |
| accountNumber | Số tài khoản | varchar | Không |  |
| accountHolder | Chủ tài khoản | nvarchar | Không |  |
| isActive | Đang hoạt động | bit | Không |  |
| createdBy | Mã người tạo | int | Không | NguoiDung.id |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## TepDinhKem

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| ownerId | Mã người sở hữu tệp | int | Không | NguoiDung.id |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Có | ChiTietDonHang.id |
| acceptanceId | Mã phiếu nghiệm thu | int | Có | PhieuNghiemThu.id |
| purpose | Mục đích sử dụng | varchar | Không |  |
| storageKey | Khóa lưu tệp | varchar | Không |  |
| originalName | Tên tệp gốc | nvarchar | Không |  |
| mimeType | Loại nội dung tệp | varchar | Không |  |
| size | Kích thước tệp | int | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## ThanhToan

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| acceptanceId | Mã phiếu nghiệm thu | int | Không | PhieuNghiemThu.id |
| amount | Số tiền | decimal | Không |  |
| method | Phương thức thanh toán | varchar | Không |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| receivedBy | Mã người nhận | int | Không | NguoiDung.id |
| paidAt | Thời điểm thanh toán | datetime2 | Không |  |
| bankAccountId | Mã tài khoản ngân hàng | int | Có | TaiKhoanNhanTien.id |
| bankReference | Mã tham chiếu ngân hàng | varchar | Có |  |

## ThongBao

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| userId | Mã người dùng | int | Không | NguoiDung.id |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Có | ChiTietDonHang.id |
| title | Tiêu đề | nvarchar | Không |  |
| body | Nội dung thông báo | nvarchar | Không |  |
| readAt | Thời điểm đọc | datetime2 | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## TinNhanDonHang

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| authorId | Mã người viết | int | Không | NguoiDung.id |
| text | Nội dung trao đổi | nvarchar | Không |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |

## ViTriKhachHang

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| latitude | Vĩ độ | decimal | Không |  |
| longitude | Kinh độ | decimal | Không |  |
| accuracyMeters | Độ chính xác vị trí theo mét | decimal | Không |  |
| positionUpdatedAt | Thời điểm cập nhật vị trí | datetime2 | Không |  |

## YeuCauHoTro

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| customerId | Mã khách sở hữu chi tiết dịch vụ | int | Không | NguoiDung.id |
| type | Loại nghiệp vụ | varchar | Không |  |
| description | Mô tả | nvarchar | Không |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| assignedTo | Mã người được phân công | int | Có | NguoiDung.id |
| resolution | Nội dung giải quyết | nvarchar | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| updatedAt | Thời điểm cập nhật | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## YeuCauThanhToan

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| orderId | Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id | int | Không | ChiTietDonHang.id |
| acceptanceId | Mã phiếu nghiệm thu | int | Không | PhieuNghiemThu.id |
| customerId | Mã khách sở hữu chi tiết dịch vụ | int | Không | NguoiDung.id |
| bankAccountId | Mã tài khoản ngân hàng | int | Không | TaiKhoanNhanTien.id |
| bankCode | Mã ngân hàng | varchar | Không |  |
| bankName | Tên ngân hàng | nvarchar | Không |  |
| accountNumber | Số tài khoản | varchar | Không |  |
| accountHolder | Chủ tài khoản | nvarchar | Không |  |
| amount | Số tiền | decimal | Không |  |
| transferContent | Nội dung chuyển khoản | varchar | Có |  |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| isActive | Đang hoạt động | bit | Không |  |
| proofId | Mã tệp chứng từ | int | Có | TepDinhKem.id |
| customerReference | Mã tham chiếu do khách cung cấp | nvarchar | Có |  |
| reason | Lý do | nvarchar | Có |  |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| paymentId | Mã thanh toán | int | Có | ThanhToan.id |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| submittedAt | Thời điểm gửi hồ sơ | datetime2 | Có |  |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |

## YeuCauVi

| Cột | Ý nghĩa | Kiểu | Cho phép rỗng | Tham chiếu |
|---|---|---|---|---|
| id | Mã bản ghi | int | Không |  |
| technicianId | Mã kỹ thuật viên | int | Không | KyThuatVien.id |
| type | Loại nghiệp vụ | varchar | Không |  |
| amount | Số tiền | decimal | Không |  |
| note | Ghi chú | nvarchar | Không |  |
| proofId | Mã tệp chứng từ | int | Có | TepDinhKem.id |
| status | Trạng thái nghiệp vụ | varchar | Không |  |
| reason | Lý do | nvarchar | Có |  |
| decidedBy | Mã người quyết định | int | Có | NguoiDung.id |
| decidedAt | Thời điểm quyết định | datetime2 | Có |  |
| createdAt | Thời điểm tạo | datetime2 | Không |  |
| version | Phiên bản bản ghi chống ghi đè đồng thời | timestamp | Không |  |
