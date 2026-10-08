Set Ansi_Nulls On;
Set Quoted_Identifier On;
GO
Create Or Alter Procedure dbo.sp_ChuyenTrangThaiDon
 @OrderId Int, @ActorId Int, @ExpectedVersion Binary(8), @NextStatus Varchar(30), @Reason Nvarchar(1000)
As
Begin
 Set Nocount On; Set Xact_Abort On;
 Declare @Previous Varchar(30), @CurrentVersion Binary(8);
 Select @Previous=status,@CurrentVersion=version From dbo.ChiTietDonHang With(UPDLOCK,HOLDLOCK) Where id=@OrderId;
 If @Previous Is Null Throw 51004,'ORDER_NOT_FOUND',1;
 If @ExpectedVersion Is Not Null And @ExpectedVersion<>@CurrentVersion Throw 51009,'VERSION_CONFLICT',1;
 If Not (
  (@Previous='ChoTiepNhan' And @NextStatus In('ChoDuyetSoBo','Huy')) Or
  (@Previous='ChoDuyetSoBo' And @NextStatus In('ChoPhanCong','Huy')) Or
  (@Previous='ChoPhanCong' And @NextStatus In('ChoNhan','Huy')) Or
  (@Previous='ChoNhan' And @NextStatus In('DaTiepNhan','ChoPhanCong','Huy')) Or
  (@Previous='DaTiepNhan' And @NextStatus In('DangDiChuyen','Huy')) Or
  (@Previous='DangDiChuyen' And @NextStatus In('DaDenNoi','Huy')) Or
  (@Previous='DaDenNoi' And @NextStatus='DangXuLy') Or
  (@Previous='DangXuLy' And @NextStatus='ChoNghiemThu') Or
  (@Previous='ChoNghiemThu' And @NextStatus In('HoanThanh','DangXuLy'))
 ) Throw 51009,'INVALID_TRANSITION',1;
 Update dbo.ChiTietDonHang Set status=@NextStatus, updatedAt=SYSUTCDATETIME(),
  departedAt=Case When @NextStatus='DangDiChuyen' Then SYSUTCDATETIME() Else departedAt End Where id=@OrderId;
 Insert dbo.LichSuDonHang(orderId,fromStatus,toStatus,actorId,reason) Values(@OrderId,@Previous,@NextStatus,@ActorId,@Reason);
End;
GO
Create Or Alter Procedure dbo.sp_DoiSoatCOD
 @SettlementId Int, @ActorId Int, @ExpectedVersion Binary(8)
As
Begin
 Set Nocount On; Set Xact_Abort On;
 Declare @KTV Int,@Amount Decimal(18,2),@State Varchar(10),@Version Binary(8);
 Select @KTV=technicianId,@Amount=commissionAmount,@State=status,@Version=version From dbo.DoiSoat With(UPDLOCK,HOLDLOCK) Where id=@SettlementId;
 If @KTV Is Null Throw 51004,'SETTLEMENT_NOT_FOUND',1;
 If @State<>'Pending' Or @Version<>@ExpectedVersion Throw 51009,'SETTLEMENT_ALREADY_CONFIRMED_OR_STALE',1;
 If Not Exists(Select 1 From dbo.NguoiDung Where id=@ActorId And role='KT' And isActive=1) Throw 51003,'FORBIDDEN',1;
 If (Select balance From dbo.KyThuatVien With(UPDLOCK,HOLDLOCK) Where id=@KTV)<@Amount Throw 51009,'INSUFFICIENT_BALANCE',1;
 -- Called inside the command transaction; trigger maintains the cached balance from immutable ledger.
 If @Amount>0 Insert dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
 Values(@KTV,'Commission',-@Amount,'Settlement',@SettlementId,@ActorId,N'Đối soát hoa hồng công sửa chữa COD');
 Update dbo.DoiSoat Set status='Confirmed',confirmedBy=@ActorId,confirmedAt=SYSUTCDATETIME() Where id=@SettlementId;
 Insert dbo.NhatKy(actorId,action,entity,entityId) Values(@ActorId,'ConfirmSettlement','DoiSoat',@SettlementId);
End;
GO
Create Or Alter Procedure dbo.sp_DonHangCuaKhach @CustomerId Int
As
Begin
 Set Nocount On;
 Select d.*, Case When t.id Is Null Then 'Unpaid' Else 'Paid' End paymentStatus
 From dbo.ChiTietDonHang d Left Join dbo.ThanhToan t On t.orderId=d.id Where customerId=@CustomerId Order By d.id Desc;
End;
GO
Create Or Alter Trigger dbo.trg_Vi_GhiSo On dbo.GiaoDichVi After Insert
As
Begin
 Set Nocount On;
 ;With Delta As(Select technicianId,Sum(amount) amount From inserted Group By technicianId)
 Update k Set balance=k.balance+d.amount From dbo.KyThuatVien k Join Delta d On d.technicianId=k.id;
End;
GO
Create Or Alter Trigger dbo.trg_Vi_BatBien On dbo.GiaoDichVi INSTEAD OF Update,Delete
As Begin Set Nocount On; Throw 51009,'LEDGER_IMMUTABLE',1; End;
GO
Create Or Alter Trigger dbo.trg_ThanhToan_BatBien On dbo.ThanhToan INSTEAD OF Update,Delete
As Begin Set Nocount On; Throw 51009,'PAYMENT_IMMUTABLE',1; End;
GO
Create Or Alter Trigger dbo.trg_DonHang_Audit On dbo.ChiTietDonHang After Update
As
Begin
 Set Nocount On;
 Insert dbo.NhatKy(action,entity,entityId,detail)
 Select 'OrderStatus','DonHang',i.id,CONCAT(d.status,' -> ',i.status) From inserted i Join deleted d On d.id=i.id Where i.status<>d.status;
End;
GO
Create Or Alter Trigger dbo.trg_DanhGia_DieuKien On dbo.DanhGia After Insert,Update
As
Begin
 Set Nocount On;
 If Exists(Select 1 From inserted i Join dbo.ChiTietDonHang d On d.id=i.orderId
 Left Join dbo.ThanhToan p On p.orderId=d.id
 Where i.customerId<>d.customerId Or d.status<>'HoanThanh' Or p.id Is Null Or i.technicianId<>p.receivedBy)
 Throw 51009,'REVIEW_NOT_ELIGIBLE',1;
End;
GO
