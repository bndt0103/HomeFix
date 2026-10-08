If OBJECT_ID('dbo.ViTriKhachHang','U') Is Null
Begin
 /*====================================================
ViTriKhachHang
====================================================*/
/*====================================================
ViTriKhachHang
====================================================*/
Create Table dbo.ViTriKhachHang
(
    orderId Int Not Null Primary Key References dbo.ChiTietDonHang(id),
    latitude Decimal(10,7) Not Null Check(latitude Between -90 And 90),
    longitude Decimal(10,7) Not Null Check(longitude Between -180 And 180),
    accuracyMeters Decimal(12,2) Not Null Check(accuracyMeters Between 0 And 100000),
    positionUpdatedAt Datetime2 Not Null Default SYSUTCDATETIME()
);
End;
