SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_ChuyenTrangThaiDon
 @OrderId int, @ActorId int, @ExpectedVersion binary(8), @NextStatus varchar(30), @Reason nvarchar(1000)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @Previous varchar(30), @CurrentVersion binary(8);
 SELECT @Previous=status,@CurrentVersion=version FROM dbo.DonHang WITH(UPDLOCK,HOLDLOCK) WHERE id=@OrderId;
 IF @Previous IS NULL THROW 51004,'ORDER_NOT_FOUND',1;
 IF @ExpectedVersion IS NOT NULL AND @ExpectedVersion<>@CurrentVersion THROW 51009,'VERSION_CONFLICT',1;
 IF NOT (
  (@Previous='ChoTiepNhan' AND @NextStatus IN('ChoDuyetSoBo','Huy')) OR
  (@Previous='ChoDuyetSoBo' AND @NextStatus IN('ChoPhanCong','Huy')) OR
  (@Previous='ChoPhanCong' AND @NextStatus IN('ChoNhan','Huy')) OR
  (@Previous='ChoNhan' AND @NextStatus IN('DaTiepNhan','ChoPhanCong','Huy')) OR
  (@Previous='DaTiepNhan' AND @NextStatus IN('DangDiChuyen','Huy')) OR
  (@Previous='DangDiChuyen' AND @NextStatus IN('DaDenNoi','Huy')) OR
  (@Previous='DaDenNoi' AND @NextStatus='DangXuLy') OR
  (@Previous='DangXuLy' AND @NextStatus='ChoNghiemThu') OR
  (@Previous='ChoNghiemThu' AND @NextStatus IN('HoanThanh','DangXuLy'))
 ) THROW 51009,'INVALID_TRANSITION',1;
 UPDATE dbo.DonHang SET status=@NextStatus, updatedAt=SYSUTCDATETIME(),
  departedAt=CASE WHEN @NextStatus='DangDiChuyen' THEN SYSUTCDATETIME() ELSE departedAt END WHERE id=@OrderId;
 INSERT dbo.LichSuDonHang(orderId,fromStatus,toStatus,actorId,reason) VALUES(@OrderId,@Previous,@NextStatus,@ActorId,@Reason);
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_DoiSoatCOD
 @SettlementId int, @ActorId int, @ExpectedVersion binary(8)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @KTV int,@Amount decimal(18,2),@State varchar(10),@Version binary(8);
 SELECT @KTV=technicianId,@Amount=commissionAmount,@State=status,@Version=version FROM dbo.DoiSoat WITH(UPDLOCK,HOLDLOCK) WHERE id=@SettlementId;
 IF @KTV IS NULL THROW 51004,'SETTLEMENT_NOT_FOUND',1;
 IF @State<>'Pending' OR @Version<>@ExpectedVersion THROW 51009,'SETTLEMENT_ALREADY_CONFIRMED_OR_STALE',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.NguoiDung WHERE id=@ActorId AND role='KT' AND isActive=1) THROW 51003,'FORBIDDEN',1;
 IF (SELECT balance FROM dbo.KyThuatVien WITH(UPDLOCK,HOLDLOCK) WHERE id=@KTV)<@Amount THROW 51009,'INSUFFICIENT_BALANCE',1;
 -- Called inside the command transaction; trigger maintains the cached balance from immutable ledger.
 IF @Amount>0 INSERT dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
 VALUES(@KTV,'Commission',-@Amount,'Settlement',@SettlementId,@ActorId,N'Đối soát hoa hồng công sửa chữa COD');
 UPDATE dbo.DoiSoat SET status='Confirmed',confirmedBy=@ActorId,confirmedAt=SYSUTCDATETIME() WHERE id=@SettlementId;
 INSERT dbo.NhatKy(actorId,action,entity,entityId) VALUES(@ActorId,'ConfirmSettlement','DoiSoat',@SettlementId);
END;
GO
CREATE OR ALTER PROCEDURE dbo.sp_DonHangCuaKhach @CustomerId int
AS
BEGIN
 SET NOCOUNT ON;
 SELECT d.*, CASE WHEN t.id IS NULL THEN 'Unpaid' ELSE 'Paid' END paymentStatus
 FROM dbo.DonHang d LEFT JOIN dbo.ThanhToan t ON t.orderId=d.id WHERE customerId=@CustomerId ORDER BY d.id DESC;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_Vi_GhiSo ON dbo.GiaoDichVi AFTER INSERT
AS
BEGIN
 SET NOCOUNT ON;
 ;WITH Delta AS(SELECT technicianId,SUM(amount) amount FROM inserted GROUP BY technicianId)
 UPDATE k SET balance=k.balance+d.amount FROM dbo.KyThuatVien k JOIN Delta d ON d.technicianId=k.id;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_Vi_BatBien ON dbo.GiaoDichVi INSTEAD OF UPDATE,DELETE
AS BEGIN SET NOCOUNT ON; THROW 51009,'LEDGER_IMMUTABLE',1; END;
GO
CREATE OR ALTER TRIGGER dbo.trg_ThanhToan_BatBien ON dbo.ThanhToan INSTEAD OF UPDATE,DELETE
AS BEGIN SET NOCOUNT ON; THROW 51009,'PAYMENT_IMMUTABLE',1; END;
GO
CREATE OR ALTER TRIGGER dbo.trg_DonHang_Audit ON dbo.DonHang AFTER UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 INSERT dbo.NhatKy(action,entity,entityId,detail)
 SELECT 'OrderStatus','DonHang',i.id,CONCAT(d.status,' -> ',i.status) FROM inserted i JOIN deleted d ON d.id=i.id WHERE i.status<>d.status;
END;
GO
CREATE OR ALTER TRIGGER dbo.trg_DanhGia_DieuKien ON dbo.DanhGia AFTER INSERT,UPDATE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.DonHang d ON d.id=i.orderId
 LEFT JOIN dbo.ThanhToan p ON p.orderId=d.id
 WHERE i.customerId<>d.customerId OR d.status<>'HoanThanh' OR p.id IS NULL OR i.technicianId<>p.receivedBy)
 THROW 51009,'REVIEW_NOT_ELIGIBLE',1;
END;
GO
