-- Additive, repeatable migration: no existing account data is changed.
IF OBJECT_ID('dbo.AuthOtp') IS NULL
BEGIN
 CREATE TABLE dbo.AuthOtp (
  id uniqueidentifier NOT NULL PRIMARY KEY,
  purpose nvarchar(20) NOT NULL,
  channel nvarchar(10) NOT NULL,
  destination nvarchar(200) NOT NULL,
  binding nvarchar(64) NOT NULL,
  codeHash nvarchar(64) NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  ready bit NOT NULL DEFAULT 0,
  consumed bit NOT NULL DEFAULT 0,
  createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
  expiresAt datetime2 NOT NULL
 );
 CREATE INDEX IX_AuthOtp_Destination ON dbo.AuthOtp(destination, createdAt);
END;
