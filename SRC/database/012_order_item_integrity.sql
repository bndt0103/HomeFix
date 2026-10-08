-- Ràng buộc công việc thuộc đúng đơn của khách hàng.

IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  object_id = Object_Id('dbo.DonHang')
                      AND name = 'UX_DonHang_KhachHang')
    CREATE UNIQUE INDEX UX_DonHang_KhachHang
        ON dbo.DonHang(MaDonHang, MaKhachHang);


GO
IF NOT EXISTS (SELECT 1
               FROM   sys.foreign_keys
               WHERE  name = 'FK_ChiTietDonHang_ChuDon')
    ALTER TABLE dbo.ChiTietDonHang
        ADD CONSTRAINT FK_ChiTietDonHang_ChuDon FOREIGN KEY (MaDonHang,
            customerId) REFERENCES dbo.DonHang (MaDonHang, MaKhachHang);

IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  object_id = Object_Id('dbo.ChiTietDonHang')
                      AND name = 'IX_ChiTietDonHang_DonHang')
    CREATE INDEX IX_ChiTietDonHang_DonHang
        ON dbo.ChiTietDonHang(MaDonHang, id);
