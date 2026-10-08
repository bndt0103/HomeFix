-- Tài khoản nhận tiền và xác nhận thanh toán ngân hàng.

SET XACT_ABORT ON;

IF COL_LENGTH('dbo.ChiTietDonHang', 'paymentMethod') IS NULL
    ALTER TABLE dbo.ChiTietDonHang
        ADD paymentMethod VARCHAR (10) CONSTRAINT DF_Order_PaymentMethod DEFAULT 'COD' NOT NULL CONSTRAINT CK_Order_PaymentMethod CHECK (paymentMethod IN ('COD',
            'BANK'));

IF OBJECT_ID('dbo.TaiKhoanNhanTien') IS NULL
    CREATE TABLE dbo.TaiKhoanNhanTien
    (
        id            INT            IDENTITY PRIMARY KEY,
        bankCode      VARCHAR (20)   NOT NULL,
        bankName      NVARCHAR (100) NOT NULL,
        accountNumber VARCHAR (30)   NOT NULL,
        accountHolder NVARCHAR (120) NOT NULL,
        isActive      BIT            DEFAULT 1 NOT NULL,
        createdBy     INT            NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
        createdAt     DATETIME2      DEFAULT SYSUTCDATETIME() NOT NULL,
        version       ROWVERSION    ,
        CONSTRAINT UX_BankAccount UNIQUE (bankCode, accountNumber)
    );


GO
DECLARE @sql AS NVARCHAR (MAX) = '';

SELECT @sql = @sql + 'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM   sys.check_constraints
WHERE  parent_object_id = OBJECT_ID('dbo.ThanhToan')
       AND (parent_column_id = COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'), 'method', 'ColumnId')
            OR name = 'CK_Payment_Method');

EXECUTE sp_executesql @sql;

ALTER TABLE dbo.ThanhToan
    ADD CONSTRAINT CK_Payment_Method CHECK (method IN ('COD', 'BANK'));

SET @sql = '';

SELECT @sql = @sql + 'ALTER TABLE dbo.ThanhToan DROP CONSTRAINT ' + QUOTENAME(f.name) + ';'
FROM   sys.foreign_keys AS f
       INNER JOIN
       sys.foreign_key_columns AS c
       ON c.constraint_object_id = f.object_id
WHERE  f.parent_object_id = OBJECT_ID('dbo.ThanhToan')
       AND c.parent_column_id = COLUMNPROPERTY(OBJECT_ID('dbo.ThanhToan'), 'receivedBy', 'ColumnId');

EXECUTE sp_executesql @sql;

ALTER TABLE dbo.ThanhToan
    ADD CONSTRAINT FK_Payment_Receiver FOREIGN KEY (receivedBy) REFERENCES dbo.NguoiDung (id);

IF COL_LENGTH('dbo.ThanhToan', 'bankAccountId') IS NULL
    ALTER TABLE dbo.ThanhToan
        ADD bankAccountId INT           NULL FOREIGN KEY REFERENCES dbo.TaiKhoanNhanTien (id),
            bankReference VARCHAR (100) NULL;


GO
IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  name = 'UX_Payment_BankReference'
                      AND object_id = OBJECT_ID('dbo.ThanhToan'))
    CREATE UNIQUE INDEX UX_Payment_BankReference
        ON dbo.ThanhToan(bankAccountId, bankReference) WHERE bankReference IS NOT NULL;

IF OBJECT_ID('dbo.YeuCauThanhToan') IS NULL
    BEGIN
        CREATE TABLE dbo.YeuCauThanhToan
        (
            id                INT             IDENTITY PRIMARY KEY,
            orderId           INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
            acceptanceId      INT             NOT NULL FOREIGN KEY REFERENCES dbo.PhieuNghiemThu (id),
            customerId        INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            bankAccountId     INT             NOT NULL FOREIGN KEY REFERENCES dbo.TaiKhoanNhanTien (id),
            bankCode          VARCHAR (20)    NOT NULL,
            bankName          NVARCHAR (100)  NOT NULL,
            accountNumber     VARCHAR (30)    NOT NULL,
            accountHolder     NVARCHAR (120)  NOT NULL,
            amount            DECIMAL (18, 2) NOT NULL CHECK (amount > 0),
            transferContent   VARCHAR (60)    NULL,
            status            VARCHAR (20)    DEFAULT 'AwaitingTransfer' NOT NULL CHECK (status IN ('AwaitingTransfer',
                'PendingReview', 'Confirmed', 'Rejected', 'Cancelled')),
            isActive          BIT             DEFAULT 1 NOT NULL,
            proofId           INT             NULL FOREIGN KEY REFERENCES dbo.TepDinhKem (id),
            customerReference NVARCHAR (100)  NULL,
            reason            NVARCHAR (1000) NULL,
            decidedBy         INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
            paymentId         INT             NULL FOREIGN KEY REFERENCES dbo.ThanhToan (id),
            createdAt         DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
            submittedAt       DATETIME2       NULL,
            decidedAt         DATETIME2       NULL,
            version           ROWVERSION
        );
        CREATE UNIQUE INDEX UX_Transfer_Active
            ON dbo.YeuCauThanhToan(orderId) WHERE isActive = 1;
        CREATE UNIQUE INDEX UX_Transfer_Content
            ON dbo.YeuCauThanhToan(transferContent) WHERE transferContent IS NOT NULL;
        CREATE UNIQUE INDEX UX_Transfer_Proof
            ON dbo.YeuCauThanhToan(proofId) WHERE proofId IS NOT NULL;
    END


GO
DECLARE @sql AS NVARCHAR (MAX) = '';

SELECT @sql = @sql + 'ALTER TABLE dbo.TepDinhKem DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM   sys.check_constraints
WHERE  parent_object_id = OBJECT_ID('dbo.TepDinhKem')
       AND (parent_column_id = COLUMNPROPERTY(OBJECT_ID('dbo.TepDinhKem'), 'purpose', 'ColumnId')
            OR name = 'CK_Upload_Purpose');

EXECUTE sp_executesql @sql;

ALTER TABLE dbo.TepDinhKem
    ADD CONSTRAINT CK_Upload_Purpose CHECK (purpose IN ('OrderFault', 'MaterialEvidence',
        'AcceptancePhoto', 'CustomerSignature', 'WalletProof', 'TechnicianDocument',
        'PaymentProof', 'Avatar'));

SET @sql = '';

SELECT @sql = @sql + 'ALTER TABLE dbo.GiaoDichVi DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM   sys.check_constraints
WHERE  parent_object_id = OBJECT_ID('dbo.GiaoDichVi')
       AND (parent_column_id = COLUMNPROPERTY(OBJECT_ID('dbo.GiaoDichVi'), 'type', 'ColumnId')
            OR name = 'CK_Wallet_Type');

EXECUTE sp_executesql @sql;

ALTER TABLE dbo.GiaoDichVi
    ADD CONSTRAINT CK_Wallet_Type CHECK (type IN ('Opening', 'Deposit',
        'Withdrawal', 'Commission', 'Reversal', 'SettlementCredit'));


GO
CREATE OR ALTER PROCEDURE dbo.sp_DoiSoatCOD
@SettlementId INT, @ActorId INT, @ExpectedVersion BINARY (8)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @KTV AS INT, @Commission AS DECIMAL (18, 2), @State AS VARCHAR (10),
        @Version AS BINARY (8), @Method AS VARCHAR (10), @Total AS DECIMAL (18,
        2), @Net AS DECIMAL (18, 2);
    SELECT @KTV = s.technicianId,
           @Commission = s.commissionAmount,
           @State = s.status,
           @Version = s.version,
           @Method = p.method,
           @Total = p.amount
    FROM   dbo.DoiSoat AS s WITH (UPDLOCK, HOLDLOCK)
           INNER JOIN
           dbo.ThanhToan AS p
           ON p.id = s.paymentId
    WHERE  s.id = @SettlementId;
    IF @KTV IS NULL
        THROW 51004, 'SETTLEMENT_NOT_FOUND', 1;
    IF @State <> 'Pending'
       OR @Version <> @ExpectedVersion
        THROW 51009, 'SETTLEMENT_ALREADY_CONFIRMED_OR_STALE', 1;
    IF NOT EXISTS (SELECT 1
                   FROM   dbo.NguoiDung
                   WHERE  id = @ActorId
                          AND role = 'KT'
                          AND isActive = 1)
        THROW 51003, 'FORBIDDEN', 1;
    IF @Method = 'COD'
        BEGIN
            IF (SELECT balance
                FROM   dbo.KyThuatVien WITH (UPDLOCK, HOLDLOCK)
                WHERE  id = @KTV) < @Commission
                THROW 51009, 'INSUFFICIENT_BALANCE', 1;
            IF @Commission > 0
                INSERT  dbo.GiaoDichVi (technicianId, type, amount, referenceType, referenceId, actorId, note)
                VALUES                (@KTV, 'Commission', -@Commission,
                    'Settlement', @SettlementId, @ActorId, N'Đối soát hoa hồng tiền mặt');
        END
    ELSE
        BEGIN
            SET @Net = @Total - @Commission;
            IF @Net < 0
                THROW 51009, 'INVALID_SETTLEMENT_AMOUNT', 1;
            IF @Net > 0
                INSERT  dbo.GiaoDichVi (technicianId, type, amount, referenceType, referenceId, actorId, note)
                VALUES                (@KTV, 'SettlementCredit', @Net,
                    'Settlement', @SettlementId, @ActorId, N'Tiền chuyển khoản HomeFix đã nhận: cộng tiền thuộc KTV sau hoa hồng (gồm phí kiểm tra và vật tư)');
        END
    UPDATE dbo.DoiSoat
    SET    status      = 'Confirmed',
           confirmedBy = @ActorId,
           confirmedAt = SYSUTCDATETIME()
    WHERE  id = @SettlementId;
    INSERT  dbo.NhatKy (actorId, action, entity, entityId)
    VALUES            (@ActorId, 'ConfirmSettlement', 'DoiSoat', @SettlementId);
END


GO
CREATE OR ALTER TRIGGER dbo.trg_DanhGia_DieuKien
    ON dbo.DanhGia
    AFTER INSERT, UPDATE
    AS BEGIN
           SET NOCOUNT ON;
           IF EXISTS (SELECT 1
                      FROM   inserted AS i
                             INNER JOIN
                             dbo.ChiTietDonHang AS d
                             ON d.id = i.orderId
                             LEFT OUTER JOIN
                             dbo.ThanhToan AS p
                             ON p.orderId = d.id
                             LEFT OUTER JOIN
                             dbo.PhieuNghiemThu AS a
                             ON a.id = p.acceptanceId
                      WHERE  i.customerId <> d.customerId
                             OR d.status <> 'HoanThanh'
                             OR p.id IS NULL
                             OR i.technicianId <> a.technicianId)
               THROW 51009, 'REVIEW_NOT_ELIGIBLE', 1;
       END


GO
IF NOT EXISTS (SELECT 1
               FROM   dbo.SchemaVersion
               WHERE  version = 5)
    INSERT  dbo.SchemaVersion (version)
    VALUES                   (5);
