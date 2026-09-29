ALTER TABLE dbo.NguoiDung ADD avatarUrl nvarchar(500) NULL;
GO
DECLARE @sql nvarchar(max)='';
SELECT @sql=@sql+'ALTER TABLE dbo.TepDinhKem DROP CONSTRAINT '+QUOTENAME(name)+';'
 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.TepDinhKem')
 AND (parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.TepDinhKem'),'purpose','ColumnId') OR name='CK_Upload_Purpose');
EXEC sp_executesql @sql;
GO
ALTER TABLE dbo.TepDinhKem ADD CONSTRAINT CK_Upload_Purpose CHECK(purpose IN('OrderFault','MaterialEvidence','AcceptancePhoto','CustomerSignature','WalletProof','TechnicianDocument','PaymentProof','Avatar'));
GO
