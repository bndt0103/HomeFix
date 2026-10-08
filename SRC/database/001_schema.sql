-- Tạo các bảng và ràng buộc trong cơ sở dữ liệu mới.

SET ANSI_NULLS ON;

SET QUOTED_IDENTIFIER ON;


GO
-- Phiên bản cấu trúc dữ liệu
CREATE TABLE dbo.SchemaVersion
(
    version   INT       NOT NULL PRIMARY KEY,
    appliedAt DATETIME2 DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Thông tin người dùng
CREATE TABLE dbo.NguoiDung
(
    id             INT            IDENTITY PRIMARY KEY,
    fullName       NVARCHAR (120) NOT NULL,
    phone          VARCHAR (15)   NOT NULL UNIQUE,
    email          NVARCHAR (200) NULL,
    cccd           VARCHAR (12)   NULL,
    passwordHash   VARCHAR (100)  NOT NULL,
    role           VARCHAR (10)   NOT NULL CHECK (role IN ('KH', 'KTV', 'DPV', 'CSKH', 'KT', 'ADMIN', 'GD')),
    defaultAddress NVARCHAR (500) NULL,
    isActive       BIT            DEFAULT 1 NOT NULL,
    tokenVersion   INT            DEFAULT 0 NOT NULL,
    createdAt      DATETIME2      DEFAULT SYSUTCDATETIME() NOT NULL,
    version        ROWVERSION
);

CREATE UNIQUE INDEX UX_User_Email
    ON dbo.NguoiDung(email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX UX_User_CCCD
    ON dbo.NguoiDung(cccd) WHERE cccd IS NOT NULL;

-- Thông tin và số dư kỹ thuật viên
CREATE TABLE dbo.KyThuatVien
(
    id                INT             PRIMARY KEY FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    skillGroup        NVARCHAR (60)   NOT NULL,
    serviceArea       NVARCHAR (120)  NOT NULL,
    availability      VARCHAR (15)    DEFAULT 'TamBan' NOT NULL CHECK (availability IN ('SanSang',
        'TamBan', 'DangBan')),
    balance           DECIMAL (18, 2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
    latitude          DECIMAL (10, 7) NULL,
    longitude         DECIMAL (10, 7) NULL,
    accuracyMeters    DECIMAL (12, 2) NULL,
    positionUpdatedAt DATETIME2       NULL,
    version           ROWVERSION     ,
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

-- Danh mục dịch vụ
CREATE TABLE dbo.DichVu
(
    id                    INT             IDENTITY PRIMARY KEY,
    name                  NVARCHAR (150)  NOT NULL,
    groupCode             NVARCHAR (60)   NOT NULL,
    description           NVARCHAR (1500) NOT NULL,
    inspectionFee         DECIMAL (18, 2) NOT NULL CHECK (inspectionFee >= 0),
    laborFee              DECIMAL (18, 2) NOT NULL CHECK (laborFee >= 0),
    commissionRatePercent DECIMAL (5, 2)  NOT NULL CHECK (commissionRatePercent BETWEEN 0 AND 100),
    isPopular             BIT             DEFAULT 0 NOT NULL,
    isActive              BIT             DEFAULT 1 NOT NULL,
    version               ROWVERSION
);

-- Đơn dịch vụ của khách hàng
CREATE TABLE dbo.DonHang
(
    MaDonHang   INT             IDENTITY PRIMARY KEY,
    MaKhachHang INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    DiaChi      NVARCHAR (500)  NOT NULL,
    MoTa        NVARCHAR (2000) NOT NULL,
    NgayHen     DATETIME2       NULL,
    NgayTao     DATETIME2       DEFAULT SysUtcDateTime() NOT NULL
);

-- Từng công việc trong đơn
CREATE TABLE dbo.ChiTietDonHang
(
    MaDonHang                 INT             NOT NULL,
    id                        INT             IDENTITY PRIMARY KEY,
    customerId                INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    serviceId                 INT             NOT NULL FOREIGN KEY REFERENCES dbo.DichVu (id),
    serviceName               NVARCHAR (150)  NOT NULL,
    serviceGroup              NVARCHAR (60)   NOT NULL,
    contactName               NVARCHAR (120)  NOT NULL,
    contactPhone              VARCHAR (15)    NOT NULL,
    address                   NVARCHAR (500)  NOT NULL,
    description               NVARCHAR (2000) NOT NULL,
    scheduledAt               DATETIME2       NULL,
    status                    VARCHAR (30)    DEFAULT 'ChoTiepNhan' NOT NULL CHECK (status IN ('ChoTiepNhan',
        'ChoDuyetSoBo', 'ChoPhanCong', 'ChoNhan', 'DaTiepNhan', 'DangDiChuyen',
        'DaDenNoi', 'DangXuLy', 'ChoNghiemThu', 'HoanThanh', 'Huy')),
    assignedTechnicianId      INT             NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    departedAt                DATETIME2       NULL,
    cancelReason              NVARCHAR (1000) NULL,
    cancellationFee           DECIMAL (18, 2) DEFAULT 0 NOT NULL CHECK (cancellationFee >= 0),
    cancellationPaymentStatus VARCHAR (10)    DEFAULT 'Unpaid' NOT NULL,
    cancelledAt               DATETIME2       NULL,
    createdAt                 DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    updatedAt                 DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    version                   ROWVERSION
);

CREATE INDEX IX_Order_Customer
    ON dbo.ChiTietDonHang(customerId, createdAt DESC);

CREATE INDEX IX_Order_Status
    ON dbo.ChiTietDonHang(status, createdAt);

-- Báo giá trước khi phân công
CREATE TABLE dbo.BaoGiaSoBo
(
    id                    INT             IDENTITY PRIMARY KEY,
    orderId               INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    diagnosis             NVARCHAR (2000) NOT NULL,
    inspectionFee         DECIMAL (18, 2) NOT NULL CHECK (inspectionFee >= 0),
    laborFee              DECIMAL (18, 2) NOT NULL CHECK (laborFee >= 0),
    commissionRatePercent DECIMAL (5, 2)  NOT NULL CHECK (commissionRatePercent BETWEEN 0 AND 100),
    total                 AS              CAST (inspectionFee + laborFee AS DECIMAL (18, 2)),
    status                VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending',
        'Approved', 'Rejected')),
    createdBy             INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    decidedBy             INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    reason                NVARCHAR (1000) NULL,
    createdAt             DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    decidedAt             DATETIME2       NULL,
    version               ROWVERSION
);

-- Lệnh phân công kỹ thuật viên
CREATE TABLE dbo.LenhDieuPhoi
(
    id           INT             IDENTITY PRIMARY KEY,
    orderId      INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    technicianId INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    status       VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending',
        'Accepted', 'Rejected', 'Expired')),
    isActive     BIT             DEFAULT 1 NOT NULL,
    expiresAt    DATETIME2       NOT NULL,
    createdBy    INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    reason       NVARCHAR (1000) NULL,
    createdAt    DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    decidedAt    DATETIME2       NULL,
    version      ROWVERSION
);

CREATE UNIQUE INDEX UX_Assignment_Order
    ON dbo.LenhDieuPhoi(orderId) WHERE isActive = 1;

CREATE UNIQUE INDEX UX_Assignment_Technician
    ON dbo.LenhDieuPhoi(technicianId) WHERE isActive = 1;

-- Phiếu kê khai vật tư
CREATE TABLE dbo.DeXuatVatTu
(
    id        INT             IDENTITY PRIMARY KEY,
    orderId   INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    revision  INT             NOT NULL,
    isCurrent BIT             DEFAULT 1 NOT NULL,
    note      NVARCHAR (1000) NULL,
    total     DECIMAL (18, 2) DEFAULT 0 NOT NULL CHECK (total >= 0),
    status    VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    createdBy INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    decidedBy INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    reason    NVARCHAR (1000) NULL,
    createdAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    decidedAt DATETIME2       NULL,
    version   ROWVERSION     ,
    UNIQUE (orderId, revision)
);

CREATE UNIQUE INDEX UX_Material_Current
    ON dbo.DeXuatVatTu(orderId) WHERE isCurrent = 1;

-- Từng dòng vật tư
CREATE TABLE dbo.ChiTietDeXuatVatTu
(
    id             INT             IDENTITY PRIMARY KEY,
    quoteId        INT             NOT NULL FOREIGN KEY REFERENCES dbo.DeXuatVatTu (id),
    name           NVARCHAR (200)  NOT NULL,
    quantity       DECIMAL (10, 2) NOT NULL CHECK (quantity > 0
                                                   AND quantity <= 999.99),
    unit           NVARCHAR (30)   NOT NULL,
    unitPrice      DECIMAL (18, 2) NOT NULL CHECK (unitPrice >= 0
                                                   AND unitPrice <= 100000000),
    lineTotal      AS              CAST (Round(quantity * unitPrice, 2) AS DECIMAL (18, 2)) PERSISTED,
    warrantyMonths INT             DEFAULT 0 NOT NULL CHECK (warrantyMonths BETWEEN 0 AND 60)
);

-- Kết quả thực hiện công việc
CREATE TABLE dbo.PhieuNghiemThu
(
    id              INT             IDENTITY PRIMARY KEY,
    orderId         INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    technicianId    INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    revision        INT             NOT NULL,
    cause           NVARCHAR (2000) NOT NULL,
    solution        NVARCHAR (2000) NOT NULL,
    materialQuoteId INT             NULL FOREIGN KEY REFERENCES dbo.DeXuatVatTu (id),
    inspectionFee   DECIMAL (18, 2) NOT NULL CHECK (inspectionFee >= 0),
    laborFee        DECIMAL (18, 2) NOT NULL CHECK (laborFee >= 0),
    materialTotal   DECIMAL (18, 2) NOT NULL CHECK (materialTotal >= 0),
    total           AS              CAST (inspectionFee + laborFee + materialTotal AS DECIMAL (18, 2)),
    status          VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    decidedBy       INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    reason          NVARCHAR (1000) NULL,
    signatureId     INT             NULL,
    createdAt       DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    decidedAt       DATETIME2       NULL,
    version         ROWVERSION     ,
    UNIQUE (orderId, revision)
);

CREATE UNIQUE INDEX UX_Acceptance_Pending
    ON dbo.PhieuNghiemThu(orderId) WHERE status = 'Pending';

CREATE UNIQUE INDEX UX_Acceptance_Approved
    ON dbo.PhieuNghiemThu(orderId) WHERE status = 'Approved';

-- Ảnh và tệp của công việc
CREATE TABLE dbo.TepDinhKem
(
    id           INT            IDENTITY PRIMARY KEY,
    ownerId      INT            NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    orderId      INT            NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    acceptanceId INT            NULL FOREIGN KEY REFERENCES dbo.PhieuNghiemThu (id),
    purpose      VARCHAR (30)   NOT NULL CHECK (purpose IN ('OrderFault',
        'MaterialEvidence', 'AcceptancePhoto', 'CustomerSignature', 'WalletProof',
        'TechnicianDocument')),
    storageKey   VARCHAR (100)  NOT NULL UNIQUE,
    originalName NVARCHAR (255) NOT NULL,
    mimeType     VARCHAR (50)   NOT NULL,
    size         INT            NOT NULL CHECK (size > 0
                                                AND size <= 5242880),
    createdAt    DATETIME2      DEFAULT SYSUTCDATETIME() NOT NULL
);

ALTER TABLE dbo.PhieuNghiemThu
    ADD CONSTRAINT FK_Acceptance_Signature FOREIGN KEY (signatureId) REFERENCES dbo.TepDinhKem (id);

-- Khoản thanh toán đã ghi nhận
CREATE TABLE dbo.ThanhToan
(
    id           INT             IDENTITY PRIMARY KEY,
    orderId      INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    acceptanceId INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.PhieuNghiemThu (id),
    amount       DECIMAL (18, 2) NOT NULL CHECK (amount >= 0),
    method       VARCHAR (10)    DEFAULT 'COD' NOT NULL CHECK (method = 'COD'),
    status       VARCHAR (10)    DEFAULT 'Paid' NOT NULL CHECK (status = 'Paid'),
    receivedBy   INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    paidAt       DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Đối soát doanh thu và hoa hồng
CREATE TABLE dbo.DoiSoat
(
    id                    INT             IDENTITY PRIMARY KEY,
    orderId               INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    technicianId          INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    paymentId             INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.ThanhToan (id),
    laborFee              DECIMAL (18, 2) NOT NULL CHECK (laborFee >= 0),
    commissionRatePercent DECIMAL (5, 2)  NOT NULL CHECK (commissionRatePercent BETWEEN 0 AND 100),
    commissionAmount      AS              CAST (Round(laborFee * commissionRatePercent / 100,
        2) AS DECIMAL (18, 2)) PERSISTED,
    status                VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Confirmed')),
    confirmedBy           INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    confirmedAt           DATETIME2       NULL,
    version               ROWVERSION
);

-- Yêu cầu nạp hoặc rút ví
CREATE TABLE dbo.YeuCauVi
(
    id           INT             IDENTITY PRIMARY KEY,
    technicianId INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    type         VARCHAR (15)    NOT NULL CHECK (type IN ('Deposit', 'Withdrawal')),
    amount       DECIMAL (18, 2) NOT NULL CHECK (amount > 0),
    note         NVARCHAR (1000) NOT NULL,
    proofId      INT             NULL FOREIGN KEY REFERENCES dbo.TepDinhKem (id),
    status       VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending',
        'Approved', 'Rejected', 'Cancelled')),
    reason       NVARCHAR (1000) NULL,
    decidedBy    INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    decidedAt    DATETIME2       NULL,
    createdAt    DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    version      ROWVERSION
);

-- Lịch sử biến động số dư ví
CREATE TABLE dbo.GiaoDichVi
(
    id            INT             IDENTITY PRIMARY KEY,
    technicianId  INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    type          VARCHAR (20)    NOT NULL CHECK (type IN ('Opening', 'Deposit',
        'Withdrawal', 'Commission', 'Reversal')),
    amount        DECIMAL (18, 2) NOT NULL CHECK (amount <> 0),
    referenceType VARCHAR (20)    NOT NULL,
    referenceId   INT             NOT NULL,
    actorId       INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    note          NVARCHAR (500)  NOT NULL,
    createdAt     DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    UNIQUE (referenceType, referenceId)
);

-- Đánh giá của khách hàng
CREATE TABLE dbo.DanhGia
(
    id           INT             IDENTITY PRIMARY KEY,
    orderId      INT             NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    customerId   INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    technicianId INT             NOT NULL FOREIGN KEY REFERENCES dbo.KyThuatVien (id),
    rating       INT             NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      NVARCHAR (1500) NOT NULL,
    createdAt    DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Lịch sử trạng thái công việc
CREATE TABLE dbo.LichSuDonHang
(
    id         INT             IDENTITY PRIMARY KEY,
    orderId    INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    fromStatus VARCHAR (30)    NULL,
    toStatus   VARCHAR (30)    NOT NULL,
    actorId    INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    reason     NVARCHAR (1000) NOT NULL,
    happenedAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Nhật ký thao tác hệ thống
CREATE TABLE dbo.NhatKy
(
    id        INT             IDENTITY PRIMARY KEY,
    actorId   INT             NULL,
    action    VARCHAR (80)    NOT NULL,
    entity    VARCHAR (60)    NOT NULL,
    entityId  INT             NULL,
    detail    NVARCHAR (2000) NULL,
    createdAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Ghi chú điều phối
CREATE TABLE dbo.GhiChuDon
(
    id         INT             IDENTITY PRIMARY KEY,
    orderId    INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    authorId   INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    text       NVARCHAR (2000) NOT NULL,
    visibility VARCHAR (10)    NOT NULL CHECK (visibility IN ('Customer', 'Internal')),
    createdAt  DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Thông báo cho người dùng
CREATE TABLE dbo.ThongBao
(
    id        INT             IDENTITY PRIMARY KEY,
    userId    INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    orderId   INT             NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    title     NVARCHAR (200)  NOT NULL,
    body      NVARCHAR (1000) NOT NULL,
    readAt    DATETIME2       NULL,
    createdAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Phiếu khiếu nại và bảo hành
CREATE TABLE dbo.YeuCauHoTro
(
    id          INT             IDENTITY PRIMARY KEY,
    orderId     INT             NOT NULL FOREIGN KEY REFERENCES dbo.ChiTietDonHang (id),
    customerId  INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    type        VARCHAR (15)    NOT NULL CHECK (type IN ('Complaint', 'Warranty')),
    description NVARCHAR (2000) NOT NULL,
    status      VARCHAR (15)    DEFAULT 'Open' NOT NULL CHECK (status IN ('Open',
        'InProgress', 'Resolved', 'Rejected')),
    assignedTo  INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    resolution  NVARCHAR (2000) NULL,
    createdAt   DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    updatedAt   DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    version     ROWVERSION
);

-- Lịch sử xử lý hỗ trợ
CREATE TABLE dbo.LichSuHoTro
(
    id        INT             IDENTITY PRIMARY KEY,
    ticketId  INT             NOT NULL FOREIGN KEY REFERENCES dbo.YeuCauHoTro (id),
    actorId   INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    status    VARCHAR (15)    NOT NULL,
    note      NVARCHAR (2000) NOT NULL,
    createdAt DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL
);

-- Hồ sơ đăng ký cộng tác
CREATE TABLE dbo.HoSoKTV
(
    id          INT             IDENTITY PRIMARY KEY,
    userId      INT             NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    skillGroup  NVARCHAR (60)   NOT NULL,
    serviceArea NVARCHAR (120)  NOT NULL,
    experience  NVARCHAR (2000) NOT NULL,
    status      VARCHAR (10)    DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reason      NVARCHAR (1000) NULL,
    decidedBy   INT             NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    createdAt   DATETIME2       DEFAULT SYSUTCDATETIME() NOT NULL,
    version     ROWVERSION
);

CREATE UNIQUE INDEX UX_Application_Pending
    ON dbo.HoSoKTV(userId) WHERE status = 'Pending';

-- Chính sách và cấu hình
CREATE TABLE dbo.CauHinh
(
    [key]   VARCHAR (80)    PRIMARY KEY,
    value   NVARCHAR (1000) NOT NULL,
    label   NVARCHAR (200)  NOT NULL,
    version ROWVERSION
);

-- Ngăn ghi nhận lặp cùng thao tác
CREATE TABLE dbo.Idempotency
(
    actorId     INT            NOT NULL FOREIGN KEY REFERENCES dbo.NguoiDung (id),
    route       VARCHAR (160)  NOT NULL,
    requestKey  VARCHAR (50)   NOT NULL,
    payloadHash CHAR (64)      NOT NULL,
    resultJson  NVARCHAR (MAX) NOT NULL CHECK (ISJSON(resultJson) = 1),
    createdAt   DATETIME2      DEFAULT SYSUTCDATETIME() NOT NULL,
    CONSTRAINT PK_Idempotency PRIMARY KEY (actorId, route, requestKey)
);

INSERT  dbo.SchemaVersion (version)
VALUES                   (1);
