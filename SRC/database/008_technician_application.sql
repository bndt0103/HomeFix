IF COL_LENGTH('dbo.HoSoKTV','profileJson') IS NULL
 ALTER TABLE dbo.HoSoKTV ADD profileJson nvarchar(2000) NULL;
IF COL_LENGTH('dbo.HoSoKTV','frontDocumentId') IS NULL
 ALTER TABLE dbo.HoSoKTV ADD frontDocumentId int NULL REFERENCES dbo.TepDinhKem(id);
IF COL_LENGTH('dbo.HoSoKTV','backDocumentId') IS NULL
 ALTER TABLE dbo.HoSoKTV ADD backDocumentId int NULL REFERENCES dbo.TepDinhKem(id);
IF COL_LENGTH('dbo.HoSoKTV','identityNumber') IS NULL
 ALTER TABLE dbo.HoSoKTV ADD identityNumber varchar(12) NULL;

IF COL_LENGTH('dbo.PhieuNghiemThu','proposedPaymentMethod') IS NULL
 ALTER TABLE dbo.PhieuNghiemThu ADD proposedPaymentMethod varchar(10) NULL CHECK(proposedPaymentMethod IN('COD','BANK'));
