-- Lưu mức phí hủy áp dụng tại thời điểm xử lý.

IF COL_LENGTH('dbo.ChiTietDonHang', 'cancellationFeeSnapshot') IS NULL
    ALTER TABLE dbo.ChiTietDonHang
        ADD cancellationFeeSnapshot DECIMAL (18, 2) CONSTRAINT DF_Order_CancellationSnapshot DEFAULT 50000 WITH VALUES NOT NULL CONSTRAINT CK_Order_CancellationSnapshot CHECK (cancellationFeeSnapshot >= 0);


GO
IF NOT EXISTS (SELECT 1
               FROM   dbo.SchemaVersion
               WHERE  version = 2)
    INSERT  dbo.SchemaVersion (version)
    VALUES                   (2);
