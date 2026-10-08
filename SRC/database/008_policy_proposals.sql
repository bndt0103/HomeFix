If OBJECT_ID('dbo.DeXuatChinhSach') Is Null
Begin
 /*====================================================
DeXuatChinhSach
====================================================*/
/*====================================================
DeXuatChinhSach
====================================================*/
Create Table dbo.DeXuatChinhSach
(
    id Int Identity Primary Key,
    proposalCode Varchar(20) Not Null Unique,
    title Nvarchar(250) Not Null,
    department Nvarchar(120) Not Null,
    submittedAt Datetime2 Not Null Default SYSUTCDATETIME(),
    serviceGroup Nvarchar(120) Not Null,
    currentDiscount Decimal(5,2) Null,
    proposedDiscount Decimal(5,2) Null,
    currentBonus Nvarchar(50) Null,
    proposedBonus Nvarchar(50) Null,
    impact Nvarchar(2000) Not Null,
    reason Nvarchar(2000) Not Null,
    status Varchar(20) Not Null Default 'Pending' Check(status In('Pending','Approved','RevisionRequested','Rejected')),
    directorNote Nvarchar(2000) Null,
    effectiveAt Varchar(20) Null,
    decidedBy Int Null References dbo.NguoiDung(id),
    decidedAt Datetime2 Null,
    version Rowversion
);
End;
GO
If Not Exists(Select 1 From dbo.DeXuatChinhSach)
Begin
 Insert dbo.DeXuatChinhSach(proposalCode,title,department,serviceGroup,currentDiscount,proposedDiscount,currentBonus,proposedBonus,impact,reason)
 Values
 ('CS-10222',N'Điều chỉnh chiết khấu dịch vụ Điện nước từ 18% → 15%',N'Đề xuất: Lê Anh Tuấn',N'Điện nước',18,15,N'2.0% / đơn',N'3.5% / đơn',N'Dự báo tăng trưởng biên lợi nhuận ròng +2.4% cho nhóm dịch vụ kỹ thuật điện nước. Chính sách mới kỳ vọng tăng 12% lượng đơn hoàn thành do thu hút được đội ngũ kỹ thuật viên chất lượng cao.',N'Các hệ số chiết khấu hiện tại đang làm giảm động lực đăng ký mới của đội ngũ KTV, đề xuất giảm mức chiết khấu để tăng thưởng trực tiếp trên mỗi ca hoàn thành xuất sắc.'),
 ('CS-10223',N'Cập nhật bảng giá sản phẩm Vệ sinh thiết bị',N'Người gửi: Đỗ Văn An',N'Vệ sinh & bảo trì',12,10,N'1.5% / đơn',N'2.0% / đơn',N'Điều chỉnh phù hợp với biến động giá vật tư vệ sinh và duy trì mức cạnh tranh.',N'Bảng giá vật tư đã được rà soát theo nhà cung cấp mới.'),
 ('CS-10224',N'Chương trình ưu đãi Khách hàng mới tháng 11',N'Người gửi: Nguyễn Thị Hằng',N'Marketing',0,10,N'—',N'—',N'Dự kiến tăng lượng khách hàng mới và tỷ lệ đặt dịch vụ lần đầu.',N'Áp dụng mã giảm giá cho khách hàng lần đầu sử dụng HomeFix.');
End;
GO
If Not Exists(Select 1 From dbo.SchemaVersion Where version=8)
 Insert dbo.SchemaVersion(version) Values(8);
