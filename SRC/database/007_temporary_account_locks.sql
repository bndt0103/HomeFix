If COL_LENGTH('dbo.NguoiDung','lockedUntil') Is Null
 Alter Table dbo.NguoiDung Add lockedUntil Datetime2 Null;
GO
If Not Exists(Select 1 From dbo.SchemaVersion Where version=7)
 Insert dbo.SchemaVersion(version) Values(7);
