-- Lưu vị trí khách hàng cung cấp cho công việc.

IF OBJECT_ID('dbo.ViTriKhachHang', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ViTriKhachHang
        (
            orderId           INT             NOT NULL PRIMARY KEY FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
            latitude          DECIMAL (10, 7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
            longitude         DECIMAL (10, 7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
            accuracyMeters    DECIMAL (12, 2) NOT NULL CHECK (accuracyMeters BETWEEN 0 AND 100000),
            positionUpdatedAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
        );
    END
