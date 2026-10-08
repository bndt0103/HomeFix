-- Ghi nhận sự đồng ý vật tư trực tiếp tại hiện trường.

IF Col_Length('dbo.DeXuatVatTu', 'CachXacNhan') IS NULL
    ALTER TABLE dbo.DeXuatVatTu
        ADD CachXacNhan VARCHAR (20) NULL CONSTRAINT CK_VatTu_CachXacNhan CHECK (CachXacNhan IS NULL
                                                                                 OR CachXacNhan = 'TrucTiep');
