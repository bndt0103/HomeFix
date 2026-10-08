If COL_LENGTH('dbo.HoSoKTV','profileJson') Is Null
 Alter Table dbo.HoSoKTV Add profileJson Nvarchar(2000) Null;
If COL_LENGTH('dbo.HoSoKTV','frontDocumentId') Is Null
 Alter Table dbo.HoSoKTV Add frontDocumentId Int Null References dbo.TepDinhKem(id);
If COL_LENGTH('dbo.HoSoKTV','backDocumentId') Is Null
 Alter Table dbo.HoSoKTV Add backDocumentId Int Null References dbo.TepDinhKem(id);
If COL_LENGTH('dbo.HoSoKTV','identityNumber') Is Null
 Alter Table dbo.HoSoKTV Add identityNumber Varchar(12) Null;

If COL_LENGTH('dbo.PhieuNghiemThu','proposedPaymentMethod') Is Null
 Alter Table dbo.PhieuNghiemThu Add proposedPaymentMethod Varchar(10) Null Check(proposedPaymentMethod In('COD','BANK'));
