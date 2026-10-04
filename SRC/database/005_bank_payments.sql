-- Repeatable migration: preserve existing COD receipts and balances.
SET XACT_ABORT ON;
IF COL_LENGTH('dbo.DonHang','paymentMethod') IS NULL
 ALTER TABLE dbo.DonHang ADD paymentMethod varchar(10) NOT NULL CONSTRAINT DF_Order_PaymentMethod DEFAULT 'COD' CONSTRAINT CK_Order_PaymentMethod CHECK(paymentMethod IN('COD','BANK'));
IF OBJECT_ID('dbo.TaiKhoanNhanTien') IS NULL
 CREATE TABLE dbo.TaiKhoanNhanTien(
  id int IDENTITY PRIMARY KEY, bankCode varchar(20) NOT NULL, bankName nvarchar(100) NOT NULL,
  accountNumber varchar(30) NOT NULL, accountHolder nvarchar(120) NOT NULL,
  isActive bit NOT NULL DEFAULT 1, createdBy int NOT NULL REFERENCES dbo.NguoiDung(id),
  createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), version rowversion,
  CONSTRAINT UX_BankAccount UNIQUE(bankCode,accountNumber)
 );
GO
DECLARE @sql nvarchar(max)='';
SELECT @sql=@sql+'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT '+QUOTENAME(name)+';'
 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.ThanhToan')
 AND (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'),'method','ColumnId') OR name='CK_Payment_Method');
EXEC sp_executesql @sql;
ALTER TABLE dbo.ThanhToan ADD CONSTRAINT CK_Payment_Method CHECK(method IN('COD','BANK'));
SET @sql='';
SELECT @sql=@sql+'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT '+QUOTENAME(f.name)+';'
 FROM sys.foreign_keys f JOIN sys.foreign_key_columns c ON c.constraint_object_id=f.object_id
 WHERE f.parent_object_id=OBJECT_ID('dbo.ThanhToan') AND c.parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'),'receivedBy','ColumnId');
EXEC sp_executesql @sql;
ALTER TABLE dbo.ThanhToan ADD CONSTRAINT FK_Payment_Receiver FOREIGN KEY(receivedBy) REFERENCES dbo.NguoiDung(id);
IF COL_LENGTH('dbo.ThanhToan','bankAccountId') IS NULL
 ALTER TABLE dbo.ThanhToan ADD bankAccountId int NULL REFERENCES dbo.TaiKhoanNhanTien(id), bankReference varchar(100) NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='UX_Payment_BankReference' AND object_id=OBJECT_ID('dbo.ThanhToan'))
 CREATE UNIQUE INDEX UX_Payment_BankReference ON dbo.ThanhToan(bankAccountId,bankReference) WHERE bankReference IS NOT NULL;
IF OBJECT_ID('dbo.YeuCauThanhToan') IS NULL
BEGIN
 CREATE TABLE dbo.YeuCauThanhToan(
  id int IDENTITY PRIMARY KEY, orderId int NOT NULL REFERENCES dbo.DonHang(id),
  acceptanceId int NOT NULL REFERENCES dbo.PhieuNghiemThu(id), customerId int NOT NULL REFERENCES dbo.NguoiDung(id),
  bankAccountId int NOT NULL REFERENCES dbo.TaiKhoanNhanTien(id),
  bankCode varchar(20) NOT NULL, bankName nvarchar(100) NOT NULL,
  accountNumber varchar(30) NOT NULL, accountHolder nvarchar(120) NOT NULL,
  amount decimal(18,2) NOT NULL CHECK(amount>0), transferContent varchar(60) NULL,
  status varchar(20) NOT NULL DEFAULT 'AwaitingTransfer' CHECK(status IN('AwaitingTransfer','PendingReview','Confirmed','Rejected','Cancelled')),
  isActive bit NOT NULL DEFAULT 1,
  proofId int NULL REFERENCES dbo.TepDinhKem(id), customerReference nvarchar(100) NULL,
  reason nvarchar(1000) NULL, decidedBy int NULL REFERENCES dbo.NguoiDung(id),
  paymentId int NULL REFERENCES dbo.ThanhToan(id),
  createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(), submittedAt datetime2 NULL, decidedAt datetime2 NULL,
  version rowversion
 );
 CREATE UNIQUE INDEX UX_Transfer_Active ON dbo.YeuCauThanhToan(orderId) WHERE isActive=1;
 CREATE UNIQUE INDEX UX_Transfer_Content ON dbo.YeuCauThanhToan(transferContent) WHERE transferContent IS NOT NULL;
 CREATE UNIQUE INDEX UX_Transfer_Proof ON dbo.YeuCauThanhToan(proofId) WHERE proofId IS NOT NULL;
END;
GO
DECLARE @sql nvarchar(max)='';
SELECT @sql=@sql+'ALTER TABLE dbo.TepDinhKem DROP CONSTRAINT '+QUOTENAME(name)+';'
 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.TepDinhKem')
 AND (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.TepDinhKem'),'purpose','ColumnId') OR name='CK_Upload_Purpose');
EXEC sp_executesql @sql;
ALTER TABLE dbo.TepDinhKem ADD CONSTRAINT CK_Upload_Purpose CHECK(purpose IN('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument','PaymentProof','Avatar'));
SET @sql='';
SELECT @sql=@sql+'ALTER TABLE dbo.GiaoDichVi DROP CONSTRAINT '+QUOTENAME(name)+';'
 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.GiaoDichVi')
 AND (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.GiaoDichVi'),'type','ColumnId') OR name='CK_Wallet_Type');
EXEC sp_executesql @sql;
ALTER TABLE dbo.GiaoDichVi ADD CONSTRAINT CK_Wallet_Type CHECK(type IN('Opening','Deposit','Withdrawal','Commission','Reversal','SettlementCredit'));
GO
CREATE OR ALTER PROCEDURE dbo.sp_DoiSoatCOD
 @SettlementId int, @ActorId int, @ExpectedVersion binary(8)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @KTV int,@Commission decimal(18,2),@State varchar(10),@Version binary(8),@Method varchar(10),@Total decimal(18,2),@Net decimal(18,2);
 SELECT @KTV=s.technicianId,@Commission=s.commissionAmount,@State=s.status,@Version=s.version,@Method=p.method,@Total=p.amount
 FROM dbo.DoiSoat s WITH(UPDLOCK,HOLDLOCK) JOIN dbo.ThanhToan p ON p.id=s.paymentId WHERE s.id=@SettlementId;
 IF @KTV IS NULL THROW 51004,'SETTLEMENT_NOT_FOUND',1;
 IF @State<>'Pending' OR @Version<>@ExpectedVersion THROW 51009,'SETTLEMENT_ALREADY_CONFIRMED_OR_STALE',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.NguoiDung WHERE id=@ActorId AND role='KT' AND isActive=1) THROW 51003,'FORBIDDEN',1;
 IF @Method='COD'
 BEGIN
  IF (SELECT balance FROM dbo.KyThuatVien WITH(UPDLOCK,HOLDLOCK) WHERE id=@KTV)<@Commission THROW 51009,'INSUFFICIENT_BALANCE',1;
  IF @Commission>0 INSERT dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
   VALUES(@KTV,'Commission',-@Commission,'Settlement',@SettlementId,@ActorId,N'Đối soát hoa hồng tiền mặt');
 END
 ELSE
 BEGIN
  SET @Net=@Total-@Commission;
  IF @Net<0 THROW 51009,'INVALID_SETTLEMENT_AMOUNT',1;
  IF @Net>0 INSERT dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
   VALUES(@KTV,'SettlementCredit',@Net,'Settlement',@SettlementId,@ActorId,N'Tiền chuyển khoản HomeFix đã nhận: cộng tiền thuộc KTV sau hoa hồng (gồm phí kiểm tra và vật tư)');
 END;
 UPDATE dbo.DoiSoat SET status='Confirmed',confirmedBy=@ActorId,confirmedAt=SYSUTCDATETIME() WHERE id=@SettlementId;
 INSERT dbo.NhatKy(actorId,action,entity,entityId) VALUES(@ActorId,'ConfirmSettlement','DoiSoat',@SettlementId);
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_DanhGia_DieuKien ON dbo.DanhGia AFTER INSERT,UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.DonHang d ON d.id=i.orderId
 LEFT JOIN dbo.ThanhToan p ON p.orderId=d.id LEFT JOIN dbo.PhieuNghiemThu a ON a.id=p.acceptanceId
 WHERE i.customerId<>d.customerId OR d.status<>'HoanThanh' OR p.id IS NULL OR i.technicianId<>a.technicianId)
 THROW 51009,'REVIEW_NOT_ELIGIBLE',1;
END;
GO
IF NOT EXISTS(SELECT 1 FROM dbo.SchemaVersion WHERE version=5) INSERT dbo.SchemaVersion(version) VALUES(5);
