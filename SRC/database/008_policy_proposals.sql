IF OBJECT_ID('dbo.DeXuatChinhSach') IS NULL
BEGIN
 CREATE TABLE dbo.DeXuatChinhSach(
  id int IDENTITY PRIMARY KEY, proposalCode varchar(20) NOT NULL UNIQUE, title nvarchar(250) NOT NULL,
  department nvarchar(120) NOT NULL, submittedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
  serviceGroup nvarchar(120) NOT NULL, currentDiscount decimal(5,2) NULL, proposedDiscount decimal(5,2) NULL,
  currentBonus nvarchar(50) NULL, proposedBonus nvarchar(50) NULL, impact nvarchar(2000) NOT NULL,
  reason nvarchar(2000) NOT NULL, status varchar(20) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','RevisionRequested','Rejected')),
  directorNote nvarchar(2000) NULL, effectiveAt varchar(20) NULL, decidedBy int NULL REFERENCES dbo.NguoiDung(id), decidedAt datetime2 NULL, version rowversion
 );
END;
GO
IF NOT EXISTS(SELECT 1 FROM dbo.DeXuatChinhSach)
BEGIN
 INSERT dbo.DeXuatChinhSach(proposalCode,title,department,serviceGroup,currentDiscount,proposedDiscount,currentBonus,proposedBonus,impact,reason)
 VALUES
 ('CS-10222',N'Điều chỉnh chiết khấu dịch vụ Điện nước từ 18% → 15%',N'Đề xuất: Lê Anh Tuấn',N'Điện nước',18,15,N'2.0% / đơn',N'3.5% / đơn',N'Dự báo tăng trưởng biên lợi nhuận ròng +2.4% cho nhóm dịch vụ kỹ thuật điện nước. Chính sách mới kỳ vọng tăng 12% lượng đơn hoàn thành do thu hút được đội ngũ kỹ thuật viên chất lượng cao.',N'Các hệ số chiết khấu hiện tại đang làm giảm động lực đăng ký mới của đội ngũ KTV, đề xuất giảm mức chiết khấu để tăng thưởng trực tiếp trên mỗi ca hoàn thành xuất sắc.'),
 ('CS-10223',N'Cập nhật bảng giá sản phẩm Vệ sinh thiết bị',N'Người gửi: Đỗ Văn An',N'Vệ sinh & bảo trì',12,10,N'1.5% / đơn',N'2.0% / đơn',N'Điều chỉnh phù hợp với biến động giá vật tư vệ sinh và duy trì mức cạnh tranh.',N'Bảng giá vật tư đã được rà soát theo nhà cung cấp mới.'),
 ('CS-10224',N'Chương trình ưu đãi Khách hàng mới tháng 11',N'Người gửi: Nguyễn Thị Hằng',N'Marketing',0,10,N'—',N'—',N'Dự kiến tăng lượng khách hàng mới và tỷ lệ đặt dịch vụ lần đầu.',N'Áp dụng mã giảm giá cho khách hàng lần đầu sử dụng HomeFix.');
END;
GO
IF NOT EXISTS(SELECT 1 FROM dbo.SchemaVersion WHERE version=8)
 INSERT dbo.SchemaVersion(version) VALUES(8);
