-- Hội thoại hỗ trợ khách hàng với nhân viên và AI.

IF COL_LENGTH('dbo.ThongBao', 'DuongDan') IS NULL
    ALTER TABLE dbo.ThongBao
        ADD DuongDan NVARCHAR (200) NULL;


GO
IF OBJECT_ID('dbo.HoiThoaiHoTro', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.HoiThoaiHoTro
        (
            MaHoiThoai           INT          IDENTITY (1, 1) PRIMARY KEY,
            MaKhachHang          INT          NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            MaNhanVien           INT          NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            CheDo                VARCHAR (12) DEFAULT 'NhanVien' NOT NULL CHECK (CheDo IN ('NhanVien', 'AI')),
            DongYGuiAI           BIT          DEFAULT 0 NOT NULL,
            NgayDongYAI          DATETIME2    NULL,
            TinCuoiKhachDaDoc    INT          DEFAULT 0 NOT NULL,
            TinCuoiNhanVienDaDoc INT          DEFAULT 0 NOT NULL,
            MaTinNhanDangXuLy    INT          NULL,
            NgayBatDauAI         DATETIME2    NULL,
            NgayTao              DATETIME2    DEFAULT SysUtcDateTime() NOT NULL,
            NgayCapNhat          DATETIME2    DEFAULT SysUtcDateTime() NOT NULL
        );
        CREATE INDEX IX_HoiThoaiHoTro_HopThu
            ON dbo.HoiThoaiHoTro(CheDo, NgayCapNhat DESC);
    END


GO
IF OBJECT_ID('dbo.TinNhanHoTro', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TinNhanHoTro
        (
            MaTinNhan      INT             IDENTITY (1, 1) PRIMARY KEY,
            MaHoiThoai     INT             NOT NULL FOREIGN KEY REFERENCES dbo.HoiThoaiHoTro (MaHoiThoai),
            MaNguoiGui     INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            VaiTroNguoiGui VARCHAR (10)    NOT NULL CHECK (VaiTroNguoiGui IN ('KH', 'CSKH', 'AI', 'HeThong')),
            CheDoGui       VARCHAR (12)    NOT NULL CHECK (CheDoGui IN ('NhanVien', 'AI')),
            NoiDung        NVARCHAR (4000) NOT NULL,
            MoHinhAI       VARCHAR (80)    NULL,
            NgayGui        DATETIME2       DEFAULT SysUtcDateTime() NOT NULL
        );
        CREATE INDEX IX_TinNhanHoTro_HoiThoai
            ON dbo.TinNhanHoTro(MaHoiThoai, MaTinNhan DESC);
        CREATE INDEX IX_TinNhanHoTro_GioiHanAI
            ON dbo.TinNhanHoTro(NgayGui)
            INCLUDE(VaiTroNguoiGui, MoHinhAI);
    END


GO
IF NOT EXISTS (SELECT 1
               FROM   dbo.SchemaVersion
               WHERE  version = 14)
    INSERT  dbo.SchemaVersion (version)
    VALUES                   (14);
