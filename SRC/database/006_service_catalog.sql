If COL_LENGTH('dbo.DichVu','isPopular') Is Null
 Alter Table dbo.DichVu Add isPopular Bit Not Null Constraint DF_Service_IsPopular Default 0;
