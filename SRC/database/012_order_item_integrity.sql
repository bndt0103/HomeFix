/*====================================================
12. TOÀN VẸN ĐƠN HÀNG VÀ CHI TIẾT
Không cho gắn công việc của khách khác vào cùng đơn.
====================================================*/
If Not Exists (Select 1 From sys.indexes Where object_id = Object_Id('dbo.DonHang') And name = 'UX_DonHang_KhachHang')
    Create Unique Index UX_DonHang_KhachHang On dbo.DonHang(MaDonHang, MaKhachHang);
GO
If Not Exists (Select 1 From sys.foreign_keys Where name = 'FK_ChiTietDonHang_ChuDon')
    Alter Table dbo.ChiTietDonHang Add Constraint FK_ChiTietDonHang_ChuDon
        Foreign Key(MaDonHang, customerId) References dbo.DonHang(MaDonHang, MaKhachHang);
If Not Exists (Select 1 From sys.indexes Where object_id = Object_Id('dbo.ChiTietDonHang') And name = 'IX_ChiTietDonHang_DonHang')
    Create Index IX_ChiTietDonHang_DonHang On dbo.ChiTietDonHang(MaDonHang, id);
