/*====================================================
10. TRAO ĐỔI THEO ĐƠN VÀ YÊU CẦU HỦY
====================================================*/
If Object_Id('dbo.TinNhanDonHang', 'U') Is Null
Begin
    /*====================================================
TinNhanDonHang
====================================================*/
/*====================================================
TinNhanDonHang
====================================================*/
Create Table dbo.TinNhanDonHang
(
    id Int Identity Primary Key,
    orderId Int Not Null References dbo.ChiTietDonHang(id),
    authorId Int Not Null References dbo.NguoiDung(id),
    text Nvarchar(2000) Not Null,
    createdAt Datetime2 Not Null Default SysUtcDateTime()
);
    Create Index IX_TinNhanDonHang_Don On dbo.TinNhanDonHang(orderId, id);
End;
Go
If Col_Length('dbo.ChiTietDonHang', 'cancelRequestedBy') Is Null
    Alter Table dbo.ChiTietDonHang Add cancelRequestedBy Varchar(20) Null;
If Col_Length('dbo.ChiTietDonHang', 'cancelRequestedAt') Is Null
    Alter Table dbo.ChiTietDonHang Add cancelRequestedAt Datetime2 Null;
