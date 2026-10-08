-- Đánh dấu dịch vụ phổ biến trong danh mục.

IF COL_LENGTH('dbo.DichVu', 'isPopular') IS NULL
    ALTER TABLE dbo.DichVu
        ADD isPopular BIT CONSTRAINT DF_Service_IsPopular DEFAULT 0 NOT NULL;
