-- HomeFix Final v1. Execute inside a NEW database. init-db.js never drops a database.
Set Ansi_Nulls On;
Set Quoted_Identifier On;
GO
/*====================================================
SchemaVersion
====================================================*/
/*====================================================
SchemaVersion
====================================================*/
Create Table dbo.SchemaVersion
(
    version Int Not Null Primary Key,
    appliedAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
NguoiDung
====================================================*/
/*====================================================
NguoiDung
====================================================*/
Create Table dbo.NguoiDung
(
    id Int Identity Primary Key,
    fullName Nvarchar(120) Not Null,
    phone Varchar(15) Not Null Unique,
    email Nvarchar(200) Null,
    cccd Varchar(12) Null,
    passwordHash Varchar(100) Not Null,
    role Varchar(10) Not Null Check(role In('KH','KTV','DPV','CSKH','KT','ADMIN','GD')),
    defaultAddress Nvarchar(500) Null,
    isActive Bit Not Null Default 1,
    tokenVersion Int Not Null Default 0,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion
);
Create Unique Index UX_User_Email On dbo.NguoiDung(email) Where email Is Not Null;
Create Unique Index UX_User_CCCD On dbo.NguoiDung(cccd) Where cccd Is Not Null;
/*====================================================
KyThuatVien
====================================================*/
/*====================================================
KyThuatVien
====================================================*/
Create Table dbo.KyThuatVien
(
    id Int Primary Key References dbo.NguoiDung(id),
    skillGroup Nvarchar(60) Not Null,
    serviceArea Nvarchar(120) Not Null,
    availability Varchar(15) Not Null Default 'TamBan' Check(availability In('SanSang','TamBan','DangBan')),
    balance Decimal(18,2) Not Null Default 0 Check(balance>=0),
    latitude Decimal(10,7) Null,
    longitude Decimal(10,7) Null,
    accuracyMeters Decimal(12,2) Null,
    positionUpdatedAt Datetime2 Null,
    version Rowversion,
    Check(latitude Between -90 And 90),
    Check(longitude Between -180 And 180)
);
/*====================================================
DichVu
====================================================*/
/*====================================================
DichVu
====================================================*/
Create Table dbo.DichVu
(
    id Int Identity Primary Key,
    name Nvarchar(150) Not Null,
    groupCode Nvarchar(60) Not Null,
    description Nvarchar(1500) Not Null,
    inspectionFee Decimal(18,2) Not Null Check(inspectionFee>=0),
    laborFee Decimal(18,2) Not Null Check(laborFee>=0),
    commissionRatePercent Decimal(5,2) Not Null Check(commissionRatePercent Between 0 And 100),
    isPopular Bit Not Null Default 0,
    isActive Bit Not Null Default 1,
    version Rowversion
);
/* Đơn chung: mỗi khách có thể đặt nhiều đơn, mỗi đơn có nhiều chi tiết. */
/*====================================================
DonHang
====================================================*/
/*====================================================
DonHang
====================================================*/
Create Table dbo.DonHang
(
    MaDonHang Int Identity Primary Key,
    MaKhachHang Int Not Null References dbo.NguoiDung(id),
    DiaChi Nvarchar(500) Not Null,
    MoTa Nvarchar(2000) Not Null,
    NgayHen Datetime2 Null,
    NgayTao Datetime2 Not Null Default SysUtcDateTime()
);
/*====================================================
ChiTietDonHang
====================================================*/
/*====================================================
ChiTietDonHang
====================================================*/
Create Table dbo.ChiTietDonHang
(
    MaDonHang Int Not Null,
    id Int Identity Primary Key,
    customerId Int Not Null References dbo.NguoiDung(id),
    serviceId Int Not Null References dbo.DichVu(id),
    serviceName Nvarchar(150) Not Null,
    serviceGroup Nvarchar(60) Not Null,
    contactName Nvarchar(120) Not Null,
    contactPhone Varchar(15) Not Null,
    address Nvarchar(500) Not Null,
    description Nvarchar(2000) Not Null,
    scheduledAt Datetime2 Null,
    status Varchar(30) Not Null Default 'ChoTiepNhan' Check(status In('ChoTiepNhan','ChoDuyetSoBo','ChoPhanCong','ChoNhan','DaTiepNhan','DangDiChuyen','DaDenNoi','DangXuLy','ChoNghiemThu','HoanThanh','Huy')),
    assignedTechnicianId Int Null References dbo.KyThuatVien(id),
    departedAt Datetime2 Null,
    cancelReason Nvarchar(1000) Null,
    cancellationFee Decimal(18,2) Not Null Default 0 Check(cancellationFee>=0),
    cancellationPaymentStatus Varchar(10) Not Null Default 'Unpaid',
    cancelledAt Datetime2 Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    updatedAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion
);
Create Index IX_Order_Customer On dbo.ChiTietDonHang(customerId,createdAt Desc);
Create Index IX_Order_Status On dbo.ChiTietDonHang(status,createdAt);
/*====================================================
BaoGiaSoBo
====================================================*/
/*====================================================
BaoGiaSoBo
====================================================*/
Create Table dbo.BaoGiaSoBo
(
    id Int Identity Primary Key,
    orderId Int Not Null Unique References dbo.ChiTietDonHang(id),
    diagnosis Nvarchar(2000) Not Null,
    inspectionFee Decimal(18,2) Not Null Check(inspectionFee>=0),
    laborFee Decimal(18,2) Not Null Check(laborFee>=0),
    commissionRatePercent Decimal(5,2) Not Null Check(commissionRatePercent Between 0 And 100),
    total As Cast(inspectionFee+laborFee As Decimal(18,2)),
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Approved','Rejected')),
    createdBy Int Not Null References dbo.NguoiDung(id),
    decidedBy Int Null References dbo.NguoiDung(id),
    reason Nvarchar(1000) Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    decidedAt Datetime2 Null,
    version Rowversion
);
/*====================================================
LenhDieuPhoi
====================================================*/
/*====================================================
LenhDieuPhoi
====================================================*/
Create Table dbo.LenhDieuPhoi
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    technicianId Int Not Null References dbo.KyThuatVien(id),
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Accepted','Rejected','Expired')),
    isActive Bit Not Null Default 1,
    expiresAt Datetime2 Not Null,
    createdBy Int Not Null References dbo.NguoiDung(id),
    reason Nvarchar(1000) Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    decidedAt Datetime2 Null,
    version Rowversion
);
Create Unique Index UX_Assignment_Order On dbo.LenhDieuPhoi(orderId) Where isActive=1;
-- Deliberately conservative semester project: at most one reserved/working order per technician.
Create Unique Index UX_Assignment_Technician On dbo.LenhDieuPhoi(technicianId) Where isActive=1;
/*====================================================
DeXuatVatTu
====================================================*/
/*====================================================
DeXuatVatTu
====================================================*/
Create Table dbo.DeXuatVatTu
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    revision Int Not Null,
    isCurrent Bit Not Null Default 1,
    note Nvarchar(1000) Null,
    total Decimal(18,2) Not Null Default 0 Check(total>=0),
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Approved','Rejected')),
    createdBy Int Not Null References dbo.NguoiDung(id),
    decidedBy Int Null References dbo.NguoiDung(id),
    reason Nvarchar(1000) Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    decidedAt Datetime2 Null,
    version Rowversion,
    Unique(orderId,revision)
);
Create Unique Index UX_Material_Current On dbo.DeXuatVatTu(orderId) Where isCurrent=1;
/*====================================================
ChiTietDeXuatVatTu
====================================================*/
/*====================================================
ChiTietDeXuatVatTu
====================================================*/
Create Table dbo.ChiTietDeXuatVatTu
(
    id Int Identity Primary Key,
    quoteId Int Not Null References dbo.DeXuatVatTu(id),
    name Nvarchar(200) Not Null,
    quantity Decimal(10,2) Not Null Check(quantity>0 And quantity<=999.99),
    unit Nvarchar(30) Not Null,
    unitPrice Decimal(18,2) Not Null Check(unitPrice>=0 And unitPrice<=100000000),
    lineTotal As Cast(Round(quantity*unitPrice,2) As Decimal(18,2)) Persisted,
    warrantyMonths Int Not Null Default 0 Check(warrantyMonths Between 0 And 60)
);
/*====================================================
PhieuNghiemThu
====================================================*/
/*====================================================
PhieuNghiemThu
====================================================*/
Create Table dbo.PhieuNghiemThu
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    technicianId Int Not Null References dbo.KyThuatVien(id),
    revision Int Not Null,
    cause Nvarchar(2000) Not Null,
    solution Nvarchar(2000) Not Null,
    materialQuoteId Int Null References dbo.DeXuatVatTu(id),
    inspectionFee Decimal(18,2) Not Null Check(inspectionFee>=0),
    laborFee Decimal(18,2) Not Null Check(laborFee>=0),
    materialTotal Decimal(18,2) Not Null Check(materialTotal>=0),
    total As Cast(inspectionFee+laborFee+materialTotal As Decimal(18,2)),
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Approved','Rejected')),
    decidedBy Int Null References dbo.NguoiDung(id),
    reason Nvarchar(1000) Null,
    signatureId Int Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    decidedAt Datetime2 Null,
    version Rowversion,
    Unique(orderId,revision)
);
Create Unique Index UX_Acceptance_Pending On dbo.PhieuNghiemThu(orderId) Where status='Pending';
Create Unique Index UX_Acceptance_Approved On dbo.PhieuNghiemThu(orderId) Where status='Approved';
/*====================================================
TepDinhKem
====================================================*/
/*====================================================
TepDinhKem
====================================================*/
Create Table dbo.TepDinhKem
(
    id Int Identity Primary Key,
    ownerId Int Not Null References dbo.NguoiDung(id),
    orderId Int Null References dbo.ChiTietDonHang(id),
    acceptanceId Int Null References dbo.PhieuNghiemThu(id),
    purpose Varchar(30) Not Null Check(purpose In('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument')),
    storageKey Varchar(100) Not Null Unique,
    originalName Nvarchar(255) Not Null,
    mimeType Varchar(50) Not Null,
    size Int Not Null Check(size>0 And size<=5242880),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
Alter Table dbo.PhieuNghiemThu Add Constraint FK_Acceptance_Signature Foreign Key(signatureId) References dbo.TepDinhKem(id);
/*====================================================
ThanhToan
====================================================*/
/*====================================================
ThanhToan
====================================================*/
Create Table dbo.ThanhToan
(
    id Int Identity Primary Key,
    orderId Int Not Null Unique References dbo.ChiTietDonHang(id),
    acceptanceId Int Not Null Unique References dbo.PhieuNghiemThu(id),
    amount Decimal(18,2) Not Null Check(amount>=0),
    method Varchar(10) Not Null Default 'COD' Check(method='COD'),
    status Varchar(10) Not Null Default 'Paid' Check(status='Paid'),
    receivedBy Int Not Null References dbo.KyThuatVien(id),
    paidAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
DoiSoat
====================================================*/
/*====================================================
DoiSoat
====================================================*/
Create Table dbo.DoiSoat
(
    id Int Identity Primary Key,
    orderId Int Not Null Unique References dbo.ChiTietDonHang(id),
    technicianId Int Not Null References dbo.KyThuatVien(id),
    paymentId Int Not Null Unique References dbo.ThanhToan(id),
    laborFee Decimal(18,2) Not Null Check(laborFee>=0),
    commissionRatePercent Decimal(5,2) Not Null Check(commissionRatePercent Between 0 And 100),
    commissionAmount As Cast(Round(laborFee*commissionRatePercent/100,2) As Decimal(18,2)) Persisted,
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Confirmed')),
    confirmedBy Int Null References dbo.NguoiDung(id),
    confirmedAt Datetime2 Null,
    version Rowversion
);
/*====================================================
YeuCauVi
====================================================*/
/*====================================================
YeuCauVi
====================================================*/
Create Table dbo.YeuCauVi
(
    id Int Identity Primary Key,
    technicianId Int Not Null References dbo.KyThuatVien(id),
    type Varchar(15) Not Null Check(type In('Deposit','Withdrawal')),
    amount Decimal(18,2) Not Null Check(amount>0),
    note Nvarchar(1000) Not Null,
    proofId Int Null References dbo.TepDinhKem(id),
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Approved','Rejected','Cancelled')),
    reason Nvarchar(1000) Null,
    decidedBy Int Null References dbo.NguoiDung(id),
    decidedAt Datetime2 Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion
);
/*====================================================
GiaoDichVi
====================================================*/
/*====================================================
GiaoDichVi
====================================================*/
Create Table dbo.GiaoDichVi
(
    id Int Identity Primary Key,
    technicianId Int Not Null References dbo.KyThuatVien(id),
    type Varchar(20) Not Null Check(type In('Opening','Deposit','Withdrawal','Commission','Reversal')),
    amount Decimal(18,2) Not Null Check(amount<>0),
    referenceType Varchar(20) Not Null,
    referenceId Int Not Null,
    actorId Int Null References dbo.NguoiDung(id),
    note Nvarchar(500) Not Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    Unique(referenceType,referenceId)
);
/*====================================================
DanhGia
====================================================*/
/*====================================================
DanhGia
====================================================*/
Create Table dbo.DanhGia
(
    id Int Identity Primary Key,
    orderId Int Not Null Unique References dbo.ChiTietDonHang(id),
    customerId Int Not Null References dbo.NguoiDung(id),
    technicianId Int Not Null References dbo.KyThuatVien(id),
    rating Int Not Null Check(rating Between 1 And 5),
    comment Nvarchar(1500) Not Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
LichSuDonHang
====================================================*/
/*====================================================
LichSuDonHang
====================================================*/
Create Table dbo.LichSuDonHang
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    fromStatus Varchar(30) Null,
    toStatus Varchar(30) Not Null,
    actorId Int Null References dbo.NguoiDung(id),
    reason Nvarchar(1000) Not Null,
    happenedAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
NhatKy
====================================================*/
/*====================================================
NhatKy
====================================================*/
Create Table dbo.NhatKy
(
    id Int Identity Primary Key,
    actorId Int Null,
    action Varchar(80) Not Null,
    entity Varchar(60) Not Null,
    entityId Int Null,
    detail Nvarchar(2000) Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
GhiChuDon
====================================================*/
/*====================================================
GhiChuDon
====================================================*/
Create Table dbo.GhiChuDon
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    authorId Int Not Null References dbo.NguoiDung(id),
    text Nvarchar(2000) Not Null,
    visibility Varchar(10) Not Null Check(visibility In('Customer','Internal')),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
ThongBao
====================================================*/
/*====================================================
ThongBao
====================================================*/
Create Table dbo.ThongBao
(
    id Int Identity Primary Key,
    userId Int Not Null References dbo.NguoiDung(id),
    orderId Int Null References dbo.ChiTietDonHang(id),
    title Nvarchar(200) Not Null,
    body Nvarchar(1000) Not Null,
    readAt Datetime2 Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
YeuCauHoTro
====================================================*/
/*====================================================
YeuCauHoTro
====================================================*/
Create Table dbo.YeuCauHoTro
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    customerId Int Not Null References dbo.NguoiDung(id),
    type Varchar(15) Not Null Check(type In('Complaint','Warranty')),
    description Nvarchar(2000) Not Null,
    status Varchar(15) Not Null Default 'Open' Check(status In('Open','InProgress','Resolved','Rejected')),
    assignedTo Int Null References dbo.NguoiDung(id),
    resolution Nvarchar(2000) Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    updatedAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion
);
/*====================================================
LichSuHoTro
====================================================*/
/*====================================================
LichSuHoTro
====================================================*/
Create Table dbo.LichSuHoTro
(
    id Int Identity Primary Key,
    ticketId Int Not Null References dbo.YeuCauHoTro(id),
    actorId Int Not Null References dbo.NguoiDung(id),
    status Varchar(15) Not Null,
    note Nvarchar(2000) Not Null,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME()
);
/*====================================================
HoSoKTV
====================================================*/
/*====================================================
HoSoKTV
====================================================*/
Create Table dbo.HoSoKTV
(
    id Int Identity Primary Key,
    userId Int Not Null References dbo.NguoiDung(id),
    skillGroup Nvarchar(60) Not Null,
    serviceArea Nvarchar(120) Not Null,
    experience Nvarchar(2000) Not Null,
    status Varchar(10) Not Null Default 'Pending' Check(status In('Pending','Approved','Rejected')),
    reason Nvarchar(1000) Null,
    decidedBy Int Null References dbo.NguoiDung(id),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion
);
Create Unique Index UX_Application_Pending On dbo.HoSoKTV(userId) Where status='Pending';
/*====================================================
CauHinh
====================================================*/
/*====================================================
CauHinh
====================================================*/
Create Table dbo.CauHinh
(
    [key] Varchar(80) Primary Key,
    value Nvarchar(1000) Not Null,
    label Nvarchar(200) Not Null,
    version Rowversion
);
/*====================================================
Idempotency
====================================================*/
/*====================================================
Idempotency
====================================================*/
Create Table dbo.Idempotency
(
    actorId Int Not Null References dbo.NguoiDung(id),
    route Varchar(160) Not Null,
    requestKey Varchar(50) Not Null,
    payloadHash Char(64) Not Null,
    resultJson Nvarchar(Max) Not Null Check(ISJSON(resultJson)=1),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    Constraint PK_Idempotency Primary Key(actorId,route,requestKey)
);
Insert dbo.SchemaVersion(version) Values(1);
GO
