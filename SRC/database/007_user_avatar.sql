If COL_LENGTH('dbo.NguoiDung','avatarUrl') Is Null
 Alter Table dbo.NguoiDung Add avatarUrl Nvarchar(500) Null;
GO
Declare @sql Nvarchar(Max)='';
Select @sql=@sql+'ALTER TABLE dbo.TepDinhKem DROP CONSTRAINT '+QUOTENAME(name)+';'
 From sys.check_constraints Where parent_object_id=OBJECT_ID('dbo.TepDinhKem')
 And (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.TepDinhKem'),'purpose','ColumnId') Or name='CK_Upload_Purpose');
Exec sp_executesql @sql;
GO
Alter Table dbo.TepDinhKem Add Constraint CK_Upload_Purpose Check(purpose In('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument','PaymentProof','Avatar'));
GO
