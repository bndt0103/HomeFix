-- Mô tả ý nghĩa các cột bằng tiếng Việt; chỉ cập nhật chú thích.

DECLARE @TuDien AS NVARCHAR (MAX) = N'[
    {
        "Bang": "AuthOtp",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "purpose",
        "YNghia": "Mục đích sử dụng"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "channel",
        "YNghia": "Kênh gửi mã xác thực"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "destination",
        "YNghia": "Địa chỉ nhận mã xác thực"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "binding",
        "YNghia": "Dữ liệu ràng buộc mã xác thực"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "codeHash",
        "YNghia": "Giá trị băm mã xác thực"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "attempts",
        "YNghia": "Số lần thử"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "ready",
        "YNghia": "Sẵn sàng"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "consumed",
        "YNghia": "Đã sử dụng mã xác thực"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "AuthOtp",
        "Cot": "expiresAt",
        "YNghia": "Thời điểm hết hạn"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "diagnosis",
        "YNghia": "Chẩn đoán sơ bộ"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "inspectionFee",
        "YNghia": "Phí kiểm tra"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "laborFee",
        "YNghia": "Tiền công"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "commissionRatePercent",
        "YNghia": "Tỷ lệ hoa hồng phần trăm"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "total",
        "YNghia": "Tổng tiền"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "createdBy",
        "YNghia": "Mã người tạo"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "BaoGiaSoBo",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "CauHinh",
        "Cot": "key",
        "YNghia": "Khóa cấu hình"
    },
    {
        "Bang": "CauHinh",
        "Cot": "value",
        "YNghia": "Giá trị cấu hình"
    },
    {
        "Bang": "CauHinh",
        "Cot": "label",
        "YNghia": "Nhãn hiển thị"
    },
    {
        "Bang": "CauHinh",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "quoteId",
        "YNghia": "Mã bảng kê vật tư"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "name",
        "YNghia": "Tên"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "quantity",
        "YNghia": "Số lượng vật tư"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "unit",
        "YNghia": "Đơn vị tính"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "unitPrice",
        "YNghia": "Đơn giá vật tư"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "lineTotal",
        "YNghia": "Thành tiền dòng vật tư"
    },
    {
        "Bang": "ChiTietDeXuatVatTu",
        "Cot": "warrantyMonths",
        "YNghia": "Số tháng bảo hành"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "MaDonHang",
        "YNghia": "Mã đơn hàng chung"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "customerId",
        "YNghia": "Mã khách sở hữu chi tiết dịch vụ"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "serviceId",
        "YNghia": "Mã dịch vụ"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "serviceName",
        "YNghia": "Tên dịch vụ tại thời điểm đặt"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "serviceGroup",
        "YNghia": "Nhóm chuyên môn tại thời điểm đặt"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "contactName",
        "YNghia": "Tên người liên hệ tại thời điểm đặt"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "contactPhone",
        "YNghia": "Số điện thoại liên hệ tại thời điểm đặt"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "address",
        "YNghia": "Địa chỉ tại thời điểm tạo chi tiết"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "description",
        "YNghia": "Mô tả"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "scheduledAt",
        "YNghia": "Thời điểm hẹn theo chi tiết"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "assignedTechnicianId",
        "YNghia": "Mã kỹ thuật viên đang phụ trách chi tiết"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "departedAt",
        "YNghia": "Thời điểm bắt đầu di chuyển"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancelReason",
        "YNghia": "Lý do yêu cầu hủy"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancellationFee",
        "YNghia": "Phí hủy đã ghi nhận"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancellationPaymentStatus",
        "YNghia": "Trạng thái thanh toán phí hủy"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancelledAt",
        "YNghia": "Thời điểm hủy"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "updatedAt",
        "YNghia": "Thời điểm cập nhật"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancellationFeeSnapshot",
        "YNghia": "Phí hủy chốt tại thời điểm đặt dịch vụ"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "paymentMethod",
        "YNghia": "Phương thức thanh toán"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancelRequestedBy",
        "YNghia": "Vai trò gửi yêu cầu hủy"
    },
    {
        "Bang": "ChiTietDonHang",
        "Cot": "cancelRequestedAt",
        "YNghia": "Thời điểm yêu cầu hủy"
    },
    {
        "Bang": "DanhGia",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "DanhGia",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "DanhGia",
        "Cot": "customerId",
        "YNghia": "Mã khách sở hữu chi tiết dịch vụ"
    },
    {
        "Bang": "DanhGia",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "DanhGia",
        "Cot": "rating",
        "YNghia": "Điểm đánh giá"
    },
    {
        "Bang": "DanhGia",
        "Cot": "comment",
        "YNghia": "Lời nhận xét"
    },
    {
        "Bang": "DanhGia",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "proposalCode",
        "YNghia": "Mã đề xuất chính sách"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "title",
        "YNghia": "Tiêu đề"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "department",
        "YNghia": "Bộ phận"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "submittedAt",
        "YNghia": "Thời điểm gửi hồ sơ"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "serviceGroup",
        "YNghia": "Nhóm chuyên môn tại thời điểm đặt"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "currentDiscount",
        "YNghia": "Mức giảm đang áp dụng"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "proposedDiscount",
        "YNghia": "Mức giảm đề xuất"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "currentBonus",
        "YNghia": "Mức thưởng đang áp dụng"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "proposedBonus",
        "YNghia": "Mức thưởng đề xuất"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "impact",
        "YNghia": "Ảnh hưởng của đề xuất"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "directorNote",
        "YNghia": "Ý kiến giám đốc"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "effectiveAt",
        "YNghia": "Thời điểm có hiệu lực"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "DeXuatChinhSach",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "revision",
        "YNghia": "Số phiên bản bảng kê"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "isCurrent",
        "YNghia": "Là phiên bản bảng kê hiện hành"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "note",
        "YNghia": "Ghi chú"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "total",
        "YNghia": "Tổng tiền"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "createdBy",
        "YNghia": "Mã người tạo"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "DeXuatVatTu",
        "Cot": "CachXacNhan",
        "YNghia": "Cách xác nhận vật tư: trực tiếp tại hiện trường"
    },
    {
        "Bang": "DichVu",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "DichVu",
        "Cot": "name",
        "YNghia": "Tên"
    },
    {
        "Bang": "DichVu",
        "Cot": "groupCode",
        "YNghia": "Mã nhóm dịch vụ"
    },
    {
        "Bang": "DichVu",
        "Cot": "description",
        "YNghia": "Mô tả"
    },
    {
        "Bang": "DichVu",
        "Cot": "inspectionFee",
        "YNghia": "Phí kiểm tra"
    },
    {
        "Bang": "DichVu",
        "Cot": "laborFee",
        "YNghia": "Tiền công"
    },
    {
        "Bang": "DichVu",
        "Cot": "commissionRatePercent",
        "YNghia": "Tỷ lệ hoa hồng phần trăm"
    },
    {
        "Bang": "DichVu",
        "Cot": "isPopular",
        "YNghia": "Là dịch vụ nổi bật"
    },
    {
        "Bang": "DichVu",
        "Cot": "isActive",
        "YNghia": "Đang hoạt động"
    },
    {
        "Bang": "DichVu",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "paymentId",
        "YNghia": "Mã thanh toán"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "laborFee",
        "YNghia": "Tiền công"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "commissionRatePercent",
        "YNghia": "Tỷ lệ hoa hồng phần trăm"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "commissionAmount",
        "YNghia": "Số tiền hoa hồng nền tảng"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "confirmedBy",
        "YNghia": "Mã người xác nhận"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "confirmedAt",
        "YNghia": "Thời điểm xác nhận"
    },
    {
        "Bang": "DoiSoat",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "DonHang",
        "Cot": "MaDonHang",
        "YNghia": "Mã đơn hàng chung"
    },
    {
        "Bang": "DonHang",
        "Cot": "MaKhachHang",
        "YNghia": "Mã khách hàng"
    },
    {
        "Bang": "DonHang",
        "Cot": "DiaChi",
        "YNghia": "Địa chỉ thực hiện"
    },
    {
        "Bang": "DonHang",
        "Cot": "MoTa",
        "YNghia": "Mô tả chung"
    },
    {
        "Bang": "DonHang",
        "Cot": "NgayHen",
        "YNghia": "Ngày hẹn"
    },
    {
        "Bang": "DonHang",
        "Cot": "NgayTao",
        "YNghia": "Ngày tạo"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "authorId",
        "YNghia": "Mã người viết"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "text",
        "YNghia": "Nội dung trao đổi"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "visibility",
        "YNghia": "Phạm vi hiển thị"
    },
    {
        "Bang": "GhiChuDon",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "type",
        "YNghia": "Loại nghiệp vụ"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "amount",
        "YNghia": "Số tiền"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "referenceType",
        "YNghia": "Loại bản ghi tham chiếu"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "referenceId",
        "YNghia": "Mã bản ghi tham chiếu"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "actorId",
        "YNghia": "Mã người thực hiện"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "note",
        "YNghia": "Ghi chú"
    },
    {
        "Bang": "GiaoDichVi",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "userId",
        "YNghia": "Mã người dùng"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "skillGroup",
        "YNghia": "Nhóm chuyên môn kỹ thuật viên"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "serviceArea",
        "YNghia": "Khu vực phục vụ"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "experience",
        "YNghia": "Kinh nghiệm"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "profileJson",
        "YNghia": "Nội dung hồ sơ dạng JSON"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "frontDocumentId",
        "YNghia": "Mã ảnh mặt trước giấy tờ"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "backDocumentId",
        "YNghia": "Mã ảnh mặt sau giấy tờ"
    },
    {
        "Bang": "HoSoKTV",
        "Cot": "identityNumber",
        "YNghia": "Số giấy tờ định danh"
    },
    {
        "Bang": "Idempotency",
        "Cot": "actorId",
        "YNghia": "Mã người thực hiện"
    },
    {
        "Bang": "Idempotency",
        "Cot": "route",
        "YNghia": "Đường dẫn yêu cầu"
    },
    {
        "Bang": "Idempotency",
        "Cot": "requestKey",
        "YNghia": "Khóa chống xử lý yêu cầu lặp"
    },
    {
        "Bang": "Idempotency",
        "Cot": "payloadHash",
        "YNghia": "Giá trị băm nội dung yêu cầu"
    },
    {
        "Bang": "Idempotency",
        "Cot": "resultJson",
        "YNghia": "Kết quả đã xử lý dạng JSON"
    },
    {
        "Bang": "Idempotency",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "skillGroup",
        "YNghia": "Nhóm chuyên môn kỹ thuật viên"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "serviceArea",
        "YNghia": "Khu vực phục vụ"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "availability",
        "YNghia": "Trạng thái nhận việc"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "balance",
        "YNghia": "Số dư ví"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "latitude",
        "YNghia": "Vĩ độ"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "longitude",
        "YNghia": "Kinh độ"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "accuracyMeters",
        "YNghia": "Độ chính xác vị trí theo mét"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "positionUpdatedAt",
        "YNghia": "Thời điểm cập nhật vị trí"
    },
    {
        "Bang": "KyThuatVien",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "isActive",
        "YNghia": "Đang hoạt động"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "expiresAt",
        "YNghia": "Thời điểm hết hạn"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "createdBy",
        "YNghia": "Mã người tạo"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "LenhDieuPhoi",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "fromStatus",
        "YNghia": "Trạng thái trước"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "toStatus",
        "YNghia": "Trạng thái sau"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "actorId",
        "YNghia": "Mã người thực hiện"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "LichSuDonHang",
        "Cot": "happenedAt",
        "YNghia": "Thời điểm diễn ra"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "ticketId",
        "YNghia": "Mã yêu cầu hỗ trợ"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "actorId",
        "YNghia": "Mã người thực hiện"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "note",
        "YNghia": "Ghi chú"
    },
    {
        "Bang": "LichSuHoTro",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "fullName",
        "YNghia": "Họ và tên"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "phone",
        "YNghia": "Số điện thoại"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "email",
        "YNghia": "Địa chỉ thư điện tử"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "cccd",
        "YNghia": "Số căn cước công dân"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "passwordHash",
        "YNghia": "Giá trị băm mật khẩu"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "role",
        "YNghia": "Vai trò tài khoản"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "defaultAddress",
        "YNghia": "Địa chỉ mặc định"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "isActive",
        "YNghia": "Đang hoạt động"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "tokenVersion",
        "YNghia": "Phiên bản thu hồi phiên đăng nhập"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "avatarUrl",
        "YNghia": "Đường dẫn ảnh đại diện"
    },
    {
        "Bang": "NguoiDung",
        "Cot": "lockedUntil",
        "YNghia": "Thời điểm kết thúc khóa tạm"
    },
    {
        "Bang": "NhatKy",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "NhatKy",
        "Cot": "actorId",
        "YNghia": "Mã người thực hiện"
    },
    {
        "Bang": "NhatKy",
        "Cot": "action",
        "YNghia": "Hành động"
    },
    {
        "Bang": "NhatKy",
        "Cot": "entity",
        "YNghia": "Loại đối tượng nhật ký"
    },
    {
        "Bang": "NhatKy",
        "Cot": "entityId",
        "YNghia": "Mã đối tượng nhật ký"
    },
    {
        "Bang": "NhatKy",
        "Cot": "detail",
        "YNghia": "Nội dung chi tiết"
    },
    {
        "Bang": "NhatKy",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "revision",
        "YNghia": "Số phiên bản bảng kê"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "cause",
        "YNghia": "Nguyên nhân sự cố"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "solution",
        "YNghia": "Cách xử lý sự cố"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "materialQuoteId",
        "YNghia": "Mã bảng kê vật tư"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "inspectionFee",
        "YNghia": "Phí kiểm tra"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "laborFee",
        "YNghia": "Tiền công"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "materialTotal",
        "YNghia": "Tổng chi phí vật tư"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "total",
        "YNghia": "Tổng tiền"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "signatureId",
        "YNghia": "Mã tệp chữ ký nghiệm thu"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "PhieuNghiemThu",
        "Cot": "proposedPaymentMethod",
        "YNghia": "Phương thức thanh toán đề xuất"
    },
    {
        "Bang": "SchemaVersion",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "SchemaVersion",
        "Cot": "appliedAt",
        "YNghia": "Thời điểm áp dụng"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "bankCode",
        "YNghia": "Mã ngân hàng"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "bankName",
        "YNghia": "Tên ngân hàng"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "accountNumber",
        "YNghia": "Số tài khoản"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "accountHolder",
        "YNghia": "Chủ tài khoản"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "isActive",
        "YNghia": "Đang hoạt động"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "createdBy",
        "YNghia": "Mã người tạo"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "TaiKhoanNhanTien",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "ownerId",
        "YNghia": "Mã người sở hữu tệp"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "acceptanceId",
        "YNghia": "Mã phiếu nghiệm thu"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "purpose",
        "YNghia": "Mục đích sử dụng"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "storageKey",
        "YNghia": "Khóa lưu tệp"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "originalName",
        "YNghia": "Tên tệp gốc"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "mimeType",
        "YNghia": "Loại nội dung tệp"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "size",
        "YNghia": "Kích thước tệp"
    },
    {
        "Bang": "TepDinhKem",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "acceptanceId",
        "YNghia": "Mã phiếu nghiệm thu"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "amount",
        "YNghia": "Số tiền"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "method",
        "YNghia": "Phương thức thanh toán"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "receivedBy",
        "YNghia": "Mã người nhận"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "paidAt",
        "YNghia": "Thời điểm thanh toán"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "bankAccountId",
        "YNghia": "Mã tài khoản ngân hàng"
    },
    {
        "Bang": "ThanhToan",
        "Cot": "bankReference",
        "YNghia": "Mã tham chiếu ngân hàng"
    },
    {
        "Bang": "ThongBao",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "ThongBao",
        "Cot": "userId",
        "YNghia": "Mã người dùng"
    },
    {
        "Bang": "ThongBao",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "ThongBao",
        "Cot": "title",
        "YNghia": "Tiêu đề"
    },
    {
        "Bang": "ThongBao",
        "Cot": "body",
        "YNghia": "Nội dung thông báo"
    },
    {
        "Bang": "ThongBao",
        "Cot": "readAt",
        "YNghia": "Thời điểm đọc"
    },
    {
        "Bang": "ThongBao",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "TinNhanDonHang",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "TinNhanDonHang",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "TinNhanDonHang",
        "Cot": "authorId",
        "YNghia": "Mã người viết"
    },
    {
        "Bang": "TinNhanDonHang",
        "Cot": "text",
        "YNghia": "Nội dung trao đổi"
    },
    {
        "Bang": "TinNhanDonHang",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "ViTriKhachHang",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "ViTriKhachHang",
        "Cot": "latitude",
        "YNghia": "Vĩ độ"
    },
    {
        "Bang": "ViTriKhachHang",
        "Cot": "longitude",
        "YNghia": "Kinh độ"
    },
    {
        "Bang": "ViTriKhachHang",
        "Cot": "accuracyMeters",
        "YNghia": "Độ chính xác vị trí theo mét"
    },
    {
        "Bang": "ViTriKhachHang",
        "Cot": "positionUpdatedAt",
        "YNghia": "Thời điểm cập nhật vị trí"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "customerId",
        "YNghia": "Mã khách sở hữu chi tiết dịch vụ"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "type",
        "YNghia": "Loại nghiệp vụ"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "description",
        "YNghia": "Mô tả"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "assignedTo",
        "YNghia": "Mã người được phân công"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "resolution",
        "YNghia": "Nội dung giải quyết"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "updatedAt",
        "YNghia": "Thời điểm cập nhật"
    },
    {
        "Bang": "YeuCauHoTro",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "orderId",
        "YNghia": "Mã chi tiết dịch vụ; tham chiếu ChiTietDonHang.id"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "acceptanceId",
        "YNghia": "Mã phiếu nghiệm thu"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "customerId",
        "YNghia": "Mã khách sở hữu chi tiết dịch vụ"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "bankAccountId",
        "YNghia": "Mã tài khoản ngân hàng"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "bankCode",
        "YNghia": "Mã ngân hàng"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "bankName",
        "YNghia": "Tên ngân hàng"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "accountNumber",
        "YNghia": "Số tài khoản"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "accountHolder",
        "YNghia": "Chủ tài khoản"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "amount",
        "YNghia": "Số tiền"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "transferContent",
        "YNghia": "Nội dung chuyển khoản"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "isActive",
        "YNghia": "Đang hoạt động"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "proofId",
        "YNghia": "Mã tệp chứng từ"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "customerReference",
        "YNghia": "Mã tham chiếu do khách cung cấp"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "paymentId",
        "YNghia": "Mã thanh toán"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "submittedAt",
        "YNghia": "Thời điểm gửi hồ sơ"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "YeuCauThanhToan",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "id",
        "YNghia": "Mã bản ghi"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "technicianId",
        "YNghia": "Mã kỹ thuật viên"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "type",
        "YNghia": "Loại nghiệp vụ"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "amount",
        "YNghia": "Số tiền"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "note",
        "YNghia": "Ghi chú"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "proofId",
        "YNghia": "Mã tệp chứng từ"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "status",
        "YNghia": "Trạng thái nghiệp vụ"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "reason",
        "YNghia": "Lý do"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "decidedBy",
        "YNghia": "Mã người quyết định"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "decidedAt",
        "YNghia": "Thời điểm quyết định"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "createdAt",
        "YNghia": "Thời điểm tạo"
    },
    {
        "Bang": "YeuCauVi",
        "Cot": "version",
        "YNghia": "Phiên bản bản ghi chống ghi đè đồng thời"
    }
]';

DECLARE @Bang AS Sysname, @Cot AS Sysname, @YNghia AS NVARCHAR (4000);

DECLARE TuDienCursor CURSOR LOCAL FAST_FORWARD
    FOR SELECT Bang,
               Cot,
               YNghia
        FROM   OPENJSON (@TuDien) WITH (Bang NVARCHAR (128), Cot NVARCHAR (128), YNghia NVARCHAR (4000));

OPEN TuDienCursor;

FETCH NEXT FROM TuDienCursor INTO @Bang, @Cot, @YNghia;

WHILE @@Fetch_Status = 0
    BEGIN
        IF EXISTS (SELECT 1
                   FROM   sys.extended_properties AS p
                          INNER JOIN
                          sys.tables AS t
                          ON t.object_id = p.major_id
                          INNER JOIN
                          sys.columns AS c
                          ON c.object_id = t.object_id
                             AND c.column_id = p.minor_id
                   WHERE  t.name = @Bang
                          AND c.name = @Cot
                          AND p.name = 'MS_Description'
                          AND p.class = 1
                          AND Schema_Name(t.schema_id) = 'dbo')
            EXECUTE sys.sp_updateextendedproperty @name = N'MS_Description',
                @value = @YNghia, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE',
                @level1name = @Bang, @level2type = N'COLUMN', @level2name = @Cot;
        ELSE
            EXECUTE sys.sp_addextendedproperty @name = N'MS_Description',
                @value = @YNghia, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE',
                @level1name = @Bang, @level2type = N'COLUMN', @level2name = @Cot;
        FETCH NEXT FROM TuDienCursor INTO @Bang, @Cot, @YNghia;
    END

CLOSE TuDienCursor;

DEALLOCATE TuDienCursor;
