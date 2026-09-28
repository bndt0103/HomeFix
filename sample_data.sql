USE HomeFix_Final;
GO

-- 1. THÊM DỊCH VỤ MẪU (Nếu chưa có)
INSERT INTO dbo.DichVu (name, groupCode, description, inspectionFee, laborFee, commissionRatePercent, isActive)
VALUES 
(N'Sửa máy lạnh chảy nước', 'DienLanh', N'Khắc phục tình trạng máy lạnh bị chảy nước cục lạnh', 50000, 150000, 15, 1),
(N'Thay ống nước bị vỡ', 'OngNuoc', N'Thay thế đường ống nước nhựa bị nứt vỡ trong tường hoặc nổi', 30000, 100000, 10, 1),
(N'Sửa quạt trần không quay', 'DienDanDung', N'Kiểm tra tụ điện, động cơ quạt trần', 30000, 120000, 10, 1);
GO

-- 2. LẤY ID CỦA KHÁCH HÀNG VÀ KỸ THUẬT VIÊN CÓ SẴN 
-- (File seed từ CAI_DAT.bat đã tạo sẵn một số user mặc định)
DECLARE @KhachHangId INT = (SELECT TOP 1 id FROM dbo.NguoiDung WHERE role = 'KH');
DECLARE @KTVId INT = (SELECT TOP 1 id FROM dbo.KyThuatVien);
DECLARE @DichVuId1 INT = (SELECT TOP 1 id FROM dbo.DichVu WHERE groupCode = 'DienLanh');
DECLARE @DichVuId2 INT = (SELECT TOP 1 id FROM dbo.DichVu WHERE groupCode = 'OngNuoc');

IF @KhachHangId IS NOT NULL AND @KTVId IS NOT NULL
BEGIN
    -- 3. TẠO CÁC ĐƠN HÀNG MẪU VỚI NHIỀU TRẠNG THÁI KHÁC NHAU

    -- Đơn hàng 1: Chờ tiếp nhận (Mới tạo)
    INSERT INTO dbo.DonHang (customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status)
    VALUES 
    (@KhachHangId, @DichVuId1, N'Sửa máy lạnh', 'DienLanh', N'Nguyễn Văn A', '0901234567', N'123 Lê Lợi, Q1, TP.HCM', N'Máy lạnh không lạnh, có tiếng ồn', 'ChoTiepNhan');

    -- Đơn hàng 2: Đã phân công kỹ thuật viên (Đang chờ KTV xác nhận)
    INSERT INTO dbo.DonHang (customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
    VALUES 
    (@KhachHangId, @DichVuId2, N'Sửa ống nước', 'OngNuoc', N'Trần Thị B', '0912345678', N'456 Nguyễn Huệ, Q1, TP.HCM', N'Nước rò rỉ dưới bồn rửa chén', 'ChoNhan', @KTVId);
    
    -- Tạo lệnh điều phối cho đơn hàng 2
    DECLARE @OrderId2 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.LenhDieuPhoi (orderId, technicianId, status, expiresAt, createdBy, reason)
    VALUES (@OrderId2, @KTVId, 'Pending', DATEADD(minute, 30, SYSUTCDATETIME()), (SELECT TOP 1 id FROM dbo.NguoiDung WHERE role = 'DPV'), N'Phân công KTV gần nhất');

    -- Đơn hàng 3: Đang xử lý (KTV đã đến nơi và đang sửa chữa)
    INSERT INTO dbo.DonHang (customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
    VALUES 
    (@KhachHangId, @DichVuId1, N'Bảo trì máy lạnh', 'DienLanh', N'Lê Văn C', '0987654321', N'789 Trần Hưng Đạo, Q5, TP.HCM', N'Vệ sinh máy lạnh định kỳ', 'DangXuLy', @KTVId);

    -- Đơn hàng 4: Đã hoàn thành
    INSERT INTO dbo.DonHang (customerId, serviceId, serviceName, serviceGroup, contactName, contactPhone, address, description, status, assignedTechnicianId)
    VALUES 
    (@KhachHangId, @DichVuId2, N'Lắp vòi nước mới', 'OngNuoc', N'Phạm Thị D', '0977111222', N'321 Võ Văn Kiệt, Q1, TP.HCM', N'Thay vòi nước bồn rửa mặt', 'HoanThanh', @KTVId);

    PRINT N'Thêm dữ liệu mẫu thành công!';
END
ELSE
BEGIN
    PRINT N'Không tìm thấy Khách Hàng hoặc Kỹ Thuật Viên nào trong hệ thống. Vui lòng tạo User trước.';
END
GO
