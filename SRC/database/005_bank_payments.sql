-- Repeatable migration: preserve existing COD receipts and balances.
Set Xact_Abort On;
If COL_LENGTH('dbo.ChiTietDonHang','paymentMethod') Is Null
 Alter Table dbo.ChiTietDonHang Add paymentMethod Varchar(10) Not Null Constraint DF_Order_PaymentMethod Default 'COD' Constraint CK_Order_PaymentMethod Check(paymentMethod In('COD','BANK'));
If OBJECT_ID('dbo.TaiKhoanNhanTien') Is Null
 /*====================================================
TaiKhoanNhanTien
====================================================*/
/*====================================================
TaiKhoanNhanTien
====================================================*/
Create Table dbo.TaiKhoanNhanTien
(
    id Int Identity Primary Key,
    bankCode Varchar(20) Not Null,
    bankName Nvarchar(100) Not Null,
    accountNumber Varchar(30) Not Null,
    accountHolder Nvarchar(120) Not Null,
    isActive Bit Not Null Default 1,
    createdBy Int Not Null References dbo.NguoiDung(id),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    version Rowversion,
    Constraint UX_BankAccount Unique(bankCode,accountNumber)
);
GO
Declare @sql Nvarchar(Max)='';
Select @sql=@sql+'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT '+QUOTENAME(name)+';'
 From sys.check_constraints Where parent_object_id=OBJECT_ID('dbo.ThanhToan')
 And (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'),'method','ColumnId') Or name='CK_Payment_Method');
Exec sp_executesql @sql;
Alter Table dbo.ThanhToan Add Constraint CK_Payment_Method Check(method In('COD','BANK'));
Set @sql='';
Select @sql=@sql+'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT '+QUOTENAME(f.name)+';'
 From sys.foreign_keys f Join sys.foreign_key_columns c On c.constraint_object_id=f.object_id
 Where f.parent_object_id=OBJECT_ID('dbo.ThanhToan') And c.parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'),'receivedBy','ColumnId');
Exec sp_executesql @sql;
Alter Table dbo.ThanhToan Add Constraint FK_Payment_Receiver Foreign Key(receivedBy) References dbo.NguoiDung(id);
If COL_LENGTH('dbo.ThanhToan','bankAccountId') Is Null
 Alter Table dbo.ThanhToan Add bankAccountId Int Null References dbo.TaiKhoanNhanTien(id), bankReference Varchar(100) Null;
GO
If Not Exists(Select 1 From sys.indexes Where name='UX_Payment_BankReference' And object_id=OBJECT_ID('dbo.ThanhToan'))
 Create Unique Index UX_Payment_BankReference On dbo.ThanhToan(bankAccountId,bankReference) Where bankReference Is Not Null;
If OBJECT_ID('dbo.YeuCauThanhToan') Is Null
Begin
 /*====================================================
YeuCauThanhToan
====================================================*/
/*====================================================
YeuCauThanhToan
====================================================*/
Create Table dbo.YeuCauThanhToan
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    acceptanceId Int Not Null References dbo.PhieuNghiemThu(id),
    customerId Int Not Null References dbo.NguoiDung(id),
    bankAccountId Int Not Null References dbo.TaiKhoanNhanTien(id),
    bankCode Varchar(20) Not Null,
    bankName Nvarchar(100) Not Null,
    accountNumber Varchar(30) Not Null,
    accountHolder Nvarchar(120) Not Null,
    amount Decimal(18,2) Not Null Check(amount>0),
    transferContent Varchar(60) Null,
    status Varchar(20) Not Null Default 'AwaitingTransfer' Check(status In('AwaitingTransfer','PendingReview','Confirmed','Rejected','Cancelled')),
    isActive Bit Not Null Default 1,
    proofId Int Null References dbo.TepDinhKem(id),
    customerReference Nvarchar(100) Null,
    reason Nvarchar(1000) Null,
    decidedBy Int Null References dbo.NguoiDung(id),
    paymentId Int Null References dbo.ThanhToan(id),
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    submittedAt Datetime2 Null,
    decidedAt Datetime2 Null,
    version Rowversion
);
 Create Unique Index UX_Transfer_Active On dbo.YeuCauThanhToan(orderId) Where isActive=1;
 Create Unique Index UX_Transfer_Content On dbo.YeuCauThanhToan(transferContent) Where transferContent Is Not Null;
 Create Unique Index UX_Transfer_Proof On dbo.YeuCauThanhToan(proofId) Where proofId Is Not Null;
End;
GO
Declare @sql Nvarchar(Max)='';
Select @sql=@sql+'ALTER TABLE dbo.TepDinhKem DROP CONSTRAINT '+QUOTENAME(name)+';'
 From sys.check_constraints Where parent_object_id=OBJECT_ID('dbo.TepDinhKem')
 And (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.TepDinhKem'),'purpose','ColumnId') Or name='CK_Upload_Purpose');
Exec sp_executesql @sql;
Alter Table dbo.TepDinhKem Add Constraint CK_Upload_Purpose Check(purpose In('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument','PaymentProof','Avatar'));
Set @sql='';
Select @sql=@sql+'ALTER TABLE dbo.GiaoDichVi DROP CONSTRAINT '+QUOTENAME(name)+';'
 From sys.check_constraints Where parent_object_id=OBJECT_ID('dbo.GiaoDichVi')
 And (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.GiaoDichVi'),'type','ColumnId') Or name='CK_Wallet_Type');
Exec sp_executesql @sql;
Alter Table dbo.GiaoDichVi Add Constraint CK_Wallet_Type Check(type In('Opening','Deposit','Withdrawal','Commission','Reversal','SettlementCredit'));
GO
Create Or Alter Procedure dbo.sp_DoiSoatCOD
 @SettlementId Int, @ActorId Int, @ExpectedVersion Binary(8)
As
Begin
 Set Nocount On; Set Xact_Abort On;
 Declare @KTV Int,@Commission Decimal(18,2),@State Varchar(10),@Version Binary(8),@Method Varchar(10),@Total Decimal(18,2),@Net Decimal(18,2);
 Select @KTV=s.technicianId,@Commission=s.commissionAmount,@State=s.status,@Version=s.version,@Method=p.method,@Total=p.amount
 From dbo.DoiSoat s With(UPDLOCK,HOLDLOCK) Join dbo.ThanhToan p On p.id=s.paymentId Where s.id=@SettlementId;
 If @KTV Is Null Throw 51004,'SETTLEMENT_NOT_FOUND',1;
 If @State<>'Pending' Or @Version<>@ExpectedVersion Throw 51009,'SETTLEMENT_ALREADY_CONFIRMED_OR_STALE',1;
 If Not Exists(Select 1 From dbo.NguoiDung Where id=@ActorId And role='KT' And isActive=1) Throw 51003,'FORBIDDEN',1;
 If @Method='COD'
 Begin
  If (Select balance From dbo.KyThuatVien With(UPDLOCK,HOLDLOCK) Where id=@KTV)<@Commission Throw 51009,'INSUFFICIENT_BALANCE',1;
  If @Commission>0 Insert dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
   Values(@KTV,'Commission',-@Commission,'Settlement',@SettlementId,@ActorId,N'Đối soát hoa hồng tiền mặt');
 End
 Else
 Begin
  Set @Net=@Total-@Commission;
  If @Net<0 Throw 51009,'INVALID_SETTLEMENT_AMOUNT',1;
  If @Net>0 Insert dbo.GiaoDichVi(technicianId,type,amount,referenceType,referenceId,actorId,note)
   Values(@KTV,'SettlementCredit',@Net,'Settlement',@SettlementId,@ActorId,N'Tiền chuyển khoản HomeFix đã nhận: cộng tiền thuộc KTV sau hoa hồng (gồm phí kiểm tra và vật tư)');
 End;
 Update dbo.DoiSoat Set status='Confirmed',confirmedBy=@ActorId,confirmedAt=SYSUTCDATETIME() Where id=@SettlementId;
 Insert dbo.NhatKy(actorId,action,entity,entityId) Values(@ActorId,'ConfirmSettlement','DoiSoat',@SettlementId);
End;
GO
Create Or Alter Trigger dbo.trg_DanhGia_DieuKien On dbo.DanhGia After Insert,Update
As
Begin
 Set Nocount On;
 If Exists(Select 1 From inserted i Join dbo.ChiTietDonHang d On d.id=i.orderId
 Left Join dbo.ThanhToan p On p.orderId=d.id Left Join dbo.PhieuNghiemThu a On a.id=p.acceptanceId
 Where i.customerId<>d.customerId Or d.status<>'HoanThanh' Or p.id Is Null Or i.technicianId<>a.technicianId)
 Throw 51009,'REVIEW_NOT_ELIGIBLE',1;
End;
GO
If Not Exists(Select 1 From dbo.SchemaVersion Where version=5) Insert dbo.SchemaVersion(version) Values(5);
