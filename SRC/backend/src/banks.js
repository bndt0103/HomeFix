// Tên và mã ngân hàng được đối chiếu với danh mục VietQR.
// Quản trị viên cấu hình tài khoản ngân hàng nhận tiền.
export const banks = [
  ['VCB', 'Vietcombank'],
  ['ICB', 'VietinBank'],
  ['BIDV', 'BIDV'],
  ['VBA', 'Agribank'],
  ['TCB', 'Techcombank'],
  ['MB', 'MBBank'],
  ['ACB', 'ACB'],
  ['VPB', 'VPBank'],
  ['TPB', 'TPBank'],
  ['STB', 'Sacombank'],
  ['HDB', 'HDBank'],
  ['VIB', 'VIB'],
  ['OCB', 'OCB'],
  ['MSB', 'MSB'],
  ['SHB', 'SHB'],
].map(([code, name]) => ({ code, name }));
