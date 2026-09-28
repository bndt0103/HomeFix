-- HomeFix Final v1. Execute inside a NEW database. init-db.js never drops a database.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE TABLE dbo.SchemaVersion (version int NOT NULL PRIMARY KEY, appliedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.NguoiDung (
 id int IDENTITY PRIMARY KEY, fullName nvarchar(120) NOT NULL, phone varchar(15) NOT NULL UNIQUE,
 email nvarchar(200) NULL, cccd varchar(12) NULL, passwordHash varchar(100) NOT NULL,
 role varchar(10) NOT NULL CHECK(role IN('KH','KTV','DPV','CSKH','KT','ADMIN','GD')),
 defaultAddress nvarchar(500) NULL, isActive bit NOT NULL DEFAULT 1, tokenVersion int NOT NULL DEFAULT 0,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion
);
CREATE UNIQUE INDEX UX_User_Email ON dbo.NguoiDung(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UX_User_CCCD ON dbo.NguoiDung(cccd) WHERE cccd IS NOT NULL;
CREATE TABLE dbo.KyThuatVien (
 id int PRIMARY KEY REFERENCES dbo.NguoiDung(id), skillGroup nvarchar(60) NOT NULL, serviceArea nvarchar(120) NOT NULL,
 availability varchar(15) NOT NULL DEFAULT 'TamBan' CHECK(availability IN('SanSang','TamBan','DangBan')),
 balance decimal(18,2) NOT NULL DEFAULT 0 CHECK(balance>=0), latitude decimal(10,7) NULL,
 longitude decimal(10,7) NULL, accuracyMeters decimal(12,2) NULL, positionUpdatedAt datetime2 NULL,
 version rowversion,
 CHECK(latitude BETWEEN -90 AND 90), CHECK(longitude BETWEEN -180 AND 180)
);
CREATE TABLE dbo.DichVu (
 id int IDENTITY PRIMARY KEY, name nvarchar(150) NOT NULL, groupCode nvarchar(60) NOT NULL,
 description nvarchar(1500) NOT NULL, inspectionFee decimal(18,2) NOT NULL CHECK(inspectionFee>=0),
 laborFee decimal(18,2) NOT NULL CHECK(laborFee>=0), commissionRatePercent decimal(5,2) NOT NULL CHECK(commissionRatePercent BETWEEN 0 AND 100),
 isPopular bit NOT NULL DEFAULT 0,
 isActive bit NOT NULL DEFAULT 1, version rowversion
);
CREATE TABLE dbo.DonHang (
 id int IDENTITY PRIMARY KEY, customerId int NOT NULL REFERENCES dbo.NguoiDung(id), serviceId int NOT NULL REFERENCES dbo.DichVu(id),
 serviceName nvarchar(150) NOT NULL, serviceGroup nvarchar(60) NOT NULL,
 contactName nvarchar(120) NOT NULL, contactPhone varchar(15) NOT NULL, address nvarchar(500) NOT NULL,
 description nvarchar(2000) NOT NULL, scheduledAt datetime2 NULL,
 status varchar(30) NOT NULL DEFAULT 'ChoTiepNhan' CHECK(status IN('ChoTiepNhan','ChoDuyetSoBo','ChoPhanCong','ChoNhan','DaTiepNhan','DangDiChuyen','DaDenNoi','DangXuLy','ChoNghiemThu','HoanThanh','Huy')),
 assignedTechnicianId int NULL REFERENCES dbo.KyThuatVien(id), departedAt datetime2 NULL,
 cancelReason nvarchar(1000) NULL, cancellationFee decimal(18,2) NOT NULL DEFAULT 0 CHECK(cancellationFee>=0),
 cancellationPaymentStatus varchar(10) NOT NULL DEFAULT 'Unpaid', cancelledAt datetime2 NULL,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), updatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion
);
CREATE INDEX IX_Order_Customer ON dbo.DonHang(customerId,createdAt DESC);
CREATE INDEX IX_Order_Status ON dbo.DonHang(status,createdAt);
CREATE TABLE dbo.BaoGiaSoBo (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL UNIQUE REFERENCES dbo.DonHang(id), diagnosis nvarchar(2000) NOT NULL,
 inspectionFee decimal(18,2) NOT NULL CHECK(inspectionFee>=0), laborFee decimal(18,2) NOT NULL CHECK(laborFee>=0),
 commissionRatePercent decimal(5,2) NOT NULL CHECK(commissionRatePercent BETWEEN 0 AND 100),
 total AS CAST(inspectionFee+laborFee AS decimal(18,2)), status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','Rejected')),
 createdBy int NOT NULL REFERENCES dbo.NguoiDung(id), decidedBy int NULL REFERENCES dbo.NguoiDung(id),
 reason nvarchar(1000) NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), decidedAt datetime2 NULL, version rowversion
);
CREATE TABLE dbo.LenhDieuPhoi (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id),
 status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Accepted','Rejected','Expired')),
 isActive bit NOT NULL DEFAULT 1, expiresAt datetime2 NOT NULL, createdBy int NOT NULL REFERENCES dbo.NguoiDung(id),
 reason nvarchar(1000) NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), decidedAt datetime2 NULL, version rowversion
);
CREATE UNIQUE INDEX UX_Assignment_Order ON dbo.LenhDieuPhoi(orderId) WHERE isActive=1;
-- Deliberately conservative semester project: at most one reserved/working order per technician.
CREATE UNIQUE INDEX UX_Assignment_Technician ON dbo.LenhDieuPhoi(technicianId) WHERE isActive=1;
CREATE TABLE dbo.DeXuatVatTu (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), revision int NOT NULL, isCurrent bit NOT NULL DEFAULT 1,
 note nvarchar(1000) NULL, total decimal(18,2) NOT NULL DEFAULT 0 CHECK(total>=0),
 status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','Rejected')),
 createdBy int NOT NULL REFERENCES dbo.NguoiDung(id), decidedBy int NULL REFERENCES dbo.NguoiDung(id), reason nvarchar(1000) NULL,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), decidedAt datetime2 NULL, version rowversion,
 UNIQUE(orderId,revision)
);
CREATE UNIQUE INDEX UX_Material_Current ON dbo.DeXuatVatTu(orderId) WHERE isCurrent=1;
CREATE TABLE dbo.ChiTietDeXuatVatTu (
 id int IDENTITY PRIMARY KEY, quoteId int NOT NULL REFERENCES dbo.DeXuatVatTu(id), name nvarchar(200) NOT NULL,
 quantity decimal(10,2) NOT NULL CHECK(quantity>0 AND quantity<=999.99), unit nvarchar(30) NOT NULL,
 unitPrice decimal(18,2) NOT NULL CHECK(unitPrice>=0 AND unitPrice<=100000000),
 lineTotal AS CAST(ROUND(quantity*unitPrice,2) AS decimal(18,2)) PERSISTED,
 warrantyMonths int NOT NULL DEFAULT 0 CHECK(warrantyMonths BETWEEN 0 AND 60)
);
CREATE TABLE dbo.PhieuNghiemThu (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id),
 revision int NOT NULL, cause nvarchar(2000) NOT NULL, solution nvarchar(2000) NOT NULL,
 materialQuoteId int NULL REFERENCES dbo.DeXuatVatTu(id), inspectionFee decimal(18,2) NOT NULL CHECK(inspectionFee>=0),
 laborFee decimal(18,2) NOT NULL CHECK(laborFee>=0), materialTotal decimal(18,2) NOT NULL CHECK(materialTotal>=0),
 total AS CAST(inspectionFee+laborFee+materialTotal AS decimal(18,2)),
 status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','Rejected')),
 decidedBy int NULL REFERENCES dbo.NguoiDung(id), reason nvarchar(1000) NULL, signatureId int NULL,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), decidedAt datetime2 NULL, version rowversion,
 UNIQUE(orderId,revision)
);
CREATE UNIQUE INDEX UX_Acceptance_Pending ON dbo.PhieuNghiemThu(orderId) WHERE status='Pending';
CREATE UNIQUE INDEX UX_Acceptance_Approved ON dbo.PhieuNghiemThu(orderId) WHERE status='Approved';
CREATE TABLE dbo.TepDinhKem (
 id int IDENTITY PRIMARY KEY, ownerId int NOT NULL REFERENCES dbo.NguoiDung(id), orderId int NULL REFERENCES dbo.DonHang(id),
 acceptanceId int NULL REFERENCES dbo.PhieuNghiemThu(id), purpose varchar(30) NOT NULL CHECK(purpose IN('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument')),
 storageKey varchar(100) NOT NULL UNIQUE, originalName nvarchar(255) NOT NULL, mimeType varchar(50) NOT NULL,
 size int NOT NULL CHECK(size>0 AND size<=5242880), createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
ALTER TABLE dbo.PhieuNghiemThu ADD CONSTRAINT FK_Acceptance_Signature FOREIGN KEY(signatureId) REFERENCES dbo.TepDinhKem(id);
CREATE TABLE dbo.ThanhToan (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL UNIQUE REFERENCES dbo.DonHang(id), acceptanceId int NOT NULL UNIQUE REFERENCES dbo.PhieuNghiemThu(id),
 amount decimal(18,2) NOT NULL CHECK(amount>=0), method varchar(10) NOT NULL DEFAULT 'COD' CHECK(method='COD'),
 status varchar(10) NOT NULL DEFAULT 'Paid' CHECK(status='Paid'), receivedBy int NOT NULL REFERENCES dbo.KyThuatVien(id),
 paidAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.DoiSoat (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL UNIQUE REFERENCES dbo.DonHang(id), technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id),
 paymentId int NOT NULL UNIQUE REFERENCES dbo.ThanhToan(id), laborFee decimal(18,2) NOT NULL CHECK(laborFee>=0),
 commissionRatePercent decimal(5,2) NOT NULL CHECK(commissionRatePercent BETWEEN 0 AND 100),
 commissionAmount AS CAST(ROUND(laborFee*commissionRatePercent/100,2) AS decimal(18,2)) PERSISTED,
 status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Confirmed')),
 confirmedBy int NULL REFERENCES dbo.NguoiDung(id), confirmedAt datetime2 NULL, version rowversion
);
CREATE TABLE dbo.YeuCauVi (
 id int IDENTITY PRIMARY KEY, technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id),
 type varchar(15) NOT NULL CHECK(type IN('Deposit','Withdrawal')), amount decimal(18,2) NOT NULL CHECK(amount>0),
 note nvarchar(1000) NOT NULL, proofId int NULL REFERENCES dbo.TepDinhKem(id),
 status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','Rejected','Cancelled')),
 reason nvarchar(1000) NULL, decidedBy int NULL REFERENCES dbo.NguoiDung(id), decidedAt datetime2 NULL,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion
);
CREATE TABLE dbo.GiaoDichVi (
 id int IDENTITY PRIMARY KEY, technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id),
 type varchar(20) NOT NULL CHECK(type IN('Opening','Deposit','Withdrawal','Commission','Reversal')),
 amount decimal(18,2) NOT NULL CHECK(amount<>0), referenceType varchar(20) NOT NULL, referenceId int NOT NULL,
 actorId int NULL REFERENCES dbo.NguoiDung(id), note nvarchar(500) NOT NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
 UNIQUE(referenceType,referenceId)
);
CREATE TABLE dbo.DanhGia (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL UNIQUE REFERENCES dbo.DonHang(id), customerId int NOT NULL REFERENCES dbo.NguoiDung(id),
 technicianId int NOT NULL REFERENCES dbo.KyThuatVien(id), rating int NOT NULL CHECK(rating BETWEEN 1 AND 5),
 comment nvarchar(1500) NOT NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.LichSuDonHang (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), fromStatus varchar(30) NULL, toStatus varchar(30) NOT NULL,
 actorId int NULL REFERENCES dbo.NguoiDung(id), reason nvarchar(1000) NOT NULL, happenedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.NhatKy (
 id int IDENTITY PRIMARY KEY, actorId int NULL, action varchar(80) NOT NULL, entity varchar(60) NOT NULL, entityId int NULL,
 detail nvarchar(2000) NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.GhiChuDon (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), authorId int NOT NULL REFERENCES dbo.NguoiDung(id),
 text nvarchar(2000) NOT NULL, visibility varchar(10) NOT NULL CHECK(visibility IN('Customer','Internal')), createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.ThongBao (
 id int IDENTITY PRIMARY KEY, userId int NOT NULL REFERENCES dbo.NguoiDung(id), orderId int NULL REFERENCES dbo.DonHang(id),
 title nvarchar(200) NOT NULL, body nvarchar(1000) NOT NULL, readAt datetime2 NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.YeuCauHoTro (
 id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id), customerId int NOT NULL REFERENCES dbo.NguoiDung(id),
 type varchar(15) NOT NULL CHECK(type IN('Complaint','Warranty')), description nvarchar(2000) NOT NULL,
 status varchar(15) NOT NULL DEFAULT 'Open' CHECK(status IN('Open','InProgress','Resolved','Rejected')),
 assignedTo int NULL REFERENCES dbo.NguoiDung(id), resolution nvarchar(2000) NULL,
 createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), updatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion
);
CREATE TABLE dbo.LichSuHoTro (
 id int IDENTITY PRIMARY KEY, ticketId int NOT NULL REFERENCES dbo.YeuCauHoTro(id), actorId int NOT NULL REFERENCES dbo.NguoiDung(id),
 status varchar(15) NOT NULL, note nvarchar(2000) NOT NULL, createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.HoSoKTV (
 id int IDENTITY PRIMARY KEY, userId int NOT NULL REFERENCES dbo.NguoiDung(id), skillGroup nvarchar(60) NOT NULL, serviceArea nvarchar(120) NOT NULL,
 experience nvarchar(2000) NOT NULL, status varchar(10) NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Approved','Rejected')),
 reason nvarchar(1000) NULL, decidedBy int NULL REFERENCES dbo.NguoiDung(id), createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion
);
CREATE UNIQUE INDEX UX_Application_Pending ON dbo.HoSoKTV(userId) WHERE status='Pending';
CREATE TABLE dbo.CauHinh (
 [key] varchar(80) PRIMARY KEY, value nvarchar(1000) NOT NULL, label nvarchar(200) NOT NULL, version rowversion
);
CREATE TABLE dbo.Idempotency (
 actorId int NOT NULL REFERENCES dbo.NguoiDung(id), route varchar(160) NOT NULL, requestKey varchar(50) NOT NULL,
 payloadHash char(64) NOT NULL, resultJson nvarchar(max) NOT NULL CHECK(ISJSON(resultJson)=1), createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_Idempotency PRIMARY KEY(actorId,route,requestKey)
);
INSERT dbo.SchemaVersion(version) VALUES(1);
GO
