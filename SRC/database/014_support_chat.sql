/* Chat hỗ trợ khách hàng, tách khỏi trao đổi với điều phối viên. */
If COL_LENGTH('dbo.ThongBao','DuongDan') Is Null
    Alter Table dbo.ThongBao Add DuongDan Nvarchar(200) Null;
Go
If OBJECT_ID('dbo.HoiThoaiHoTro','U') Is Null
Begin
    Create Table dbo.HoiThoaiHoTro
    (
        MaHoiThoai Int Identity(1,1) Primary Key,
        MaKhachHang Int Not Null Unique References dbo.NguoiDung(id),
        MaNhanVien Int Null References dbo.NguoiDung(id),
        CheDo Varchar(12) Not Null Default 'NhanVien' Check (CheDo In ('NhanVien','AI')),
        DongYGuiAI Bit Not Null Default 0,
        NgayDongYAI Datetime2 Null,
        TinCuoiKhachDaDoc Int Not Null Default 0,
        TinCuoiNhanVienDaDoc Int Not Null Default 0,
        MaTinNhanDangXuLy Int Null,
        NgayBatDauAI Datetime2 Null,
        NgayTao Datetime2 Not Null Default SysUtcDateTime(),
        NgayCapNhat Datetime2 Not Null Default SysUtcDateTime()
    );
    Create Index IX_HoiThoaiHoTro_HopThu On dbo.HoiThoaiHoTro(CheDo,NgayCapNhat Desc);
End;
Go
If OBJECT_ID('dbo.TinNhanHoTro','U') Is Null
Begin
    Create Table dbo.TinNhanHoTro
    (
        MaTinNhan Int Identity(1,1) Primary Key,
        MaHoiThoai Int Not Null References dbo.HoiThoaiHoTro(MaHoiThoai),
        MaNguoiGui Int Null References dbo.NguoiDung(id),
        VaiTroNguoiGui Varchar(10) Not Null Check (VaiTroNguoiGui In ('KH','CSKH','AI','HeThong')),
        CheDoGui Varchar(12) Not Null Check (CheDoGui In ('NhanVien','AI')),
        NoiDung Nvarchar(4000) Not Null,
        MoHinhAI Varchar(80) Null,
        NgayGui Datetime2 Not Null Default SysUtcDateTime()
    );
    Create Index IX_TinNhanHoTro_HoiThoai On dbo.TinNhanHoTro(MaHoiThoai,MaTinNhan Desc);
    Create Index IX_TinNhanHoTro_GioiHanAI On dbo.TinNhanHoTro(NgayGui) Include (VaiTroNguoiGui,MoHinhAI);
End;
Go
If Not Exists (Select 1 From dbo.SchemaVersion Where version=14)
    Insert dbo.SchemaVersion(version) Values(14);
Go
