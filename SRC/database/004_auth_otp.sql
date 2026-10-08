-- Additive, repeatable migration: no existing account data is changed.
If OBJECT_ID('dbo.AuthOtp') Is Null
Begin
 /*====================================================
AuthOtp
====================================================*/
/*====================================================
AuthOtp
====================================================*/
Create Table dbo.AuthOtp
(
    id uniqueidentifier Not Null Primary Key,
    purpose Nvarchar(20) Not Null,
    channel Nvarchar(10) Not Null,
    destination Nvarchar(200) Not Null,
    binding Nvarchar(64) Not Null,
    codeHash Nvarchar(64) Not Null,
    attempts Int Not Null Default 0,
    ready Bit Not Null Default 0,
    consumed Bit Not Null Default 0,
    createdAt Datetime2 Not Null Default SYSUTCDATETIME(),
    expiresAt Datetime2 Not Null
);
 Create Index IX_AuthOtp_Destination On dbo.AuthOtp(destination, createdAt);
End;
