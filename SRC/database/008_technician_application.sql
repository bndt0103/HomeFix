-- Bổ sung thông tin hồ sơ đăng ký kỹ thuật viên.

IF COL_LENGTH('dbo.HoSoKTV', 'profileJson') IS NULL
    ALTER TABLE dbo.HoSoKTV
        ADD profileJson NVARCHAR (2000) NULL;

IF COL_LENGTH('dbo.HoSoKTV', 'frontDocumentId') IS NULL
    ALTER TABLE dbo.HoSoKTV
        ADD frontDocumentId INT NULL FOREIGN KEY REFERENCES dbo.TepDinhKem (id);

IF COL_LENGTH('dbo.HoSoKTV', 'backDocumentId') IS NULL
    ALTER TABLE dbo.HoSoKTV
        ADD backDocumentId INT NULL FOREIGN KEY REFERENCES dbo.TepDinhKem (id);

IF COL_LENGTH('dbo.HoSoKTV', 'identityNumber') IS NULL
    ALTER TABLE dbo.HoSoKTV
        ADD identityNumber VARCHAR (12) NULL;

IF COL_LENGTH('dbo.PhieuNghiemThu', 'proposedPaymentMethod') IS NULL
    ALTER TABLE dbo.PhieuNghiemThu
        ADD proposedPaymentMethod VARCHAR (10) NULL CHECK (proposedPaymentMethod IN ('COD', 'BANK'));
