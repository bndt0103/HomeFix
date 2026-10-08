-- Lưu thời hạn khóa tạm thời tài khoản.

IF COL_LENGTH('dbo.NguoiDung', 'lockedUntil') IS NULL
    ALTER TABLE dbo.NguoiDung
        ADD lockedUntil DATETIME2 NULL;


GO
IF NOT EXISTS (SELECT 1
               FROM   dbo.SchemaVersion
               WHERE  version = 7)
    INSERT  dbo.SchemaVersion (version)
    VALUES                   (7);
