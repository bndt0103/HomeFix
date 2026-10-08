const fields = {
  fullName: 'Họ và tên',
  phone: 'Số điện thoại',
  email: 'Email',
  password: 'Mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  identifier: 'Tài khoản đăng nhập',
  otp: 'Mã OTP',
  role: 'Vai trò',
  isActive: 'Trạng thái hoạt động',
  skillGroup: 'Chuyên môn',
  serviceArea: 'Khu vực phục vụ',
  serviceId: 'Dịch vụ',
  address: 'Địa chỉ',
  description: 'Mô tả',
  scheduledAt: 'Lịch hẹn',
  attachmentIds: 'Ảnh đính kèm',
  inspectionFee: 'Phí kiểm tra',
  laborFee: 'Tiền công',
  commissionRatePercent: 'Hoa hồng',
  amount: 'Số tiền',
  type: 'Loại yêu cầu',
  note: 'Ghi chú',
  text: 'Tin nhắn',
  reason: 'Lý do',
  decision: 'Lựa chọn xác nhận',
  expectedVersion: 'Dữ liệu đang xem',
  rating: 'Số sao đánh giá',
  comment: 'Nội dung đánh giá',
  cause: 'Nguyên nhân',
  solution: 'Cách xử lý',
  photoIds: 'Ảnh nghiệm thu',
  signatureId: 'Chữ ký',
  customerAgreed: 'Khách đồng ý vật tư',
  items: 'Chi tiết',
  name: 'Tên',
  quantity: 'Số lượng',
  unitPrice: 'Đơn giá',
  warrantyMonths: 'Số tháng bảo hành',
  page: 'Trang',
  pageSize: 'Số dòng',
  from: 'Ngày bắt đầu',
  to: 'Ngày kết thúc',
  duration: 'Thời hạn',
  unit: 'Đơn vị',
  mode: 'Chế độ trò chuyện',
  identityNumber: 'Số CCCD',
  proofId: 'Chứng từ',
  bankAccountId: 'Tài khoản nhận tiền',
  bankReference: 'Mã giao dịch',
  paymentMethod: 'Phương thức thanh toán',
  resolution: 'Kết quả xử lý',
  value: 'Giá trị',
  groupCode: 'Nhóm dịch vụ',
};
export function validationLabel(path) {
  return path === '_form'
    ? 'Nội dung gửi'
    : path
        .split('.')
        .map((key) => (/^\d+$/.test(key) ? Number(key) + 1 : fields[key] || 'Thông tin'))
        .join(' · ');
}
export function validationMessage(message) {
  const text = String(message || '');
  if (/[À-ỹ]/.test(text)) return text;
  if (/datetime|date|time/i.test(text)) return 'Vui lòng chọn ngày và giờ hợp lệ.';
  if (/option|enum/i.test(text)) return 'Vui lòng chọn một giá trị hợp lệ.';
  return 'Vui lòng kiểm tra và nhập đầy đủ thông tin hợp lệ.';
}
