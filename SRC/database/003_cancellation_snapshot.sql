-- Preserve the cancellation policy accepted when an order was placed.
-- Existing v1 classroom orders use the original 50,000 VND policy.
If COL_LENGTH('dbo.ChiTietDonHang','cancellationFeeSnapshot') Is Null
 Alter Table dbo.ChiTietDonHang Add cancellationFeeSnapshot Decimal(18,2) Not Null
 Constraint DF_Order_CancellationSnapshot Default 50000 With Values
 Constraint CK_Order_CancellationSnapshot Check(cancellationFeeSnapshot>=0);
GO
If Not Exists(Select 1 From dbo.SchemaVersion Where version=2)
 Insert dbo.SchemaVersion(version) Values(2);
GO
