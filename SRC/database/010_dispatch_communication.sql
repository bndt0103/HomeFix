-- Tin nhắn điều phối và ảnh khách gửi.

IF Object_Id('dbo.TinNhanDonHang', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TinNhanDonHang
        (
            id        INT             IDENTITY PRIMARY KEY,
            orderId   INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
            authorId  INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            text      NVARCHAR (2000) NOT NULL,
            createdAt DATETIME2       DEFAULT SysUtcDateTime() NOT NULL
        );
        CREATE INDEX IX_TinNhanDonHang_Don
            ON dbo.TinNhanDonHang(orderId, id);
    END


GO
IF Col_Length('dbo.ChiTietDonHang', 'cancelRequestedBy') IS NULL
    ALTER TABLE dbo.ChiTietDonHang
        ADD cancelRequestedBy VARCHAR (20) NULL;

IF Col_Length('dbo.ChiTietDonHang', 'cancelRequestedAt') IS NULL
    ALTER TABLE dbo.ChiTietDonHang
        ADD cancelRequestedAt DATETIME2 NULL;
