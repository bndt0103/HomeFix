-- Preserve the cancellation policy accepted when an order was placed.
-- Existing v1 classroom orders use the original 50,000 VND policy.
IF COL_LENGTH('dbo.DonHang','cancellationFeeSnapshot') IS NULL
 ALTER TABLE dbo.DonHang ADD cancellationFeeSnapshot decimal(18,2) NOT NULL
 CONSTRAINT DF_Order_CancellationSnapshot DEFAULT 50000 WITH VALUES
 CONSTRAINT CK_Order_CancellationSnapshot CHECK(cancellationFeeSnapshot>=0);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.SchemaVersion WHERE version=2)
 INSERT dbo.SchemaVersion(version) VALUES(2);
GO
