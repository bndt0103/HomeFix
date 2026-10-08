import { q, close } from '../backend/src/db.js';

// Kiểm tra cấu trúc dữ liệu cần thiết trước khi mở máy chủ online.
const required = [
  ['ViTriKhachHang', 'orderId', 'db:migrate:customer-location'],
  ['DeXuatChinhSach', 'id', 'db:migrate:policies'],
  ['NguoiDung', 'avatarUrl', 'db:migrate:avatar'],
  ['NguoiDung', 'lockedUntil', 'db:migrate:account-locks'],
  ['DichVu', 'isPopular', 'db:migrate:services'],
  ['AuthOtp', 'id', 'db:migrate:otp'],
  ['ChiTietDonHang', 'paymentMethod', 'db:migrate:payments'],
  ['TaiKhoanNhanTien', 'id', 'db:migrate:payments'],
  ['YeuCauThanhToan', 'id', 'db:migrate:payments'],
  ['ThanhToan', 'bankAccountId', 'db:migrate:payments'],
  ['ThanhToan', 'bankReference', 'db:migrate:payments'],
  ...['profileJson', 'frontDocumentId', 'backDocumentId', 'identityNumber'].map((column) => [
    'HoSoKTV',
    column,
    'db:migrate:technician-ui',
  ]),
  ['PhieuNghiemThu', 'proposedPaymentMethod', 'db:migrate:technician-ui'],
];
try {
  const rows = await q(`
    SELECT
        t.name AS tableName,
        c.name AS columnName
    FROM
        sys.tables t
        JOIN sys.columns c ON c.object_id = t.object_id
    WHERE
        SCHEMA_NAME(t.schema_id) = 'dbo'
  `);
  const columns = new Set(rows.map((row) => `${row.tableName}.${row.columnName}`));
  const missing = required.filter(([table, column]) => !columns.has(`${table}.${column}`));
  if (missing.length) {
    console.error(
      'Cơ sở dữ liệu thiếu cấu trúc cho phiên bản hiện tại: ' +
        missing.map(([t, c]) => `${t}.${c}`).join(', '),
    );
    console.error(
      'Chạy trong SRC, sau đó khởi động lại online:\n' +
        [...new Set(missing.map(([, , migration]) => 'npm.cmd run ' + migration))].join('\n'),
    );
    process.exitCode = 1;
  } else console.log('Cơ sở dữ liệu sẵn sàng cho giao diện, thanh toán và hồ sơ kỹ thuật viên.');
} catch (error) {
  console.error('Không kiểm tra được cơ sở dữ liệu: ' + error.message);
  process.exitCode = 1;
} finally {
  await close();
}
