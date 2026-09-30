IF OBJECT_ID('dbo.ViTriKhachHang','U') IS NULL
BEGIN
 CREATE TABLE dbo.ViTriKhachHang(
  orderId int NOT NULL PRIMARY KEY REFERENCES dbo.DonHang(id),
  latitude decimal(10,7) NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude decimal(10,7) NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  accuracyMeters decimal(12,2) NOT NULL CHECK(accuracyMeters BETWEEN 0 AND 100000),
  positionUpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
END;
