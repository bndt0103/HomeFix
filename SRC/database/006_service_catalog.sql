IF COL_LENGTH('dbo.DichVu','isPopular') IS NULL
 ALTER TABLE dbo.DichVu ADD isPopular bit NOT NULL CONSTRAINT DF_Service_IsPopular DEFAULT 0;
