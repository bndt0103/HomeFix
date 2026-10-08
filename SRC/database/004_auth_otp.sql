-- Lưu mã xác thực đã băm và giới hạn số lần nhập.

IF OBJECT_ID('dbo.AuthOtp') IS NULL
    BEGIN
        CREATE TABLE dbo.AuthOtp
        (
            id          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
            purpose     NVARCHAR (20)    NOT NULL,
            channel     NVARCHAR (10)    NOT NULL,
            destination NVARCHAR (200)   NOT NULL,
            binding     NVARCHAR (64)    NOT NULL,
            codeHash    NVARCHAR (64)    NOT NULL,
            attempts    INT              DEFAULT 0 NOT NULL,
            ready       BIT              DEFAULT 0 NOT NULL,
            consumed    BIT              DEFAULT 0 NOT NULL,
            createdAt   DATETIME2        DEFAULT SYSUTCDATETIME() NOT NULL,
            expiresAt   DATETIME2        NOT NULL
        );
        CREATE INDEX IX_AuthOtp_Destination
            ON dbo.AuthOtp(destination, createdAt);
    END
