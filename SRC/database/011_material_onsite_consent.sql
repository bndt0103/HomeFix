/*====================================================
11. GHI NHẬN KHÁCH ĐỒNG Ý VẬT TƯ TẠI HIỆN TRƯỜNG
Giữ nguyên phiếu cũ. Không tự duyệt vật tư đang chờ.
====================================================*/
If Col_Length('dbo.DeXuatVatTu', 'CachXacNhan') Is Null
    Alter Table dbo.DeXuatVatTu Add CachXacNhan Varchar(20) Null
        Constraint CK_VatTu_CachXacNhan Check (CachXacNhan Is Null Or CachXacNhan = 'TrucTiep');
