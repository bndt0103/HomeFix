import '../backend/src/config.js';
import {deliveryConfigured,emailProvider,verifyGmail} from '../backend/src/otp-delivery.js';
if(emailProvider()!=='gmail') {
 console.error('Đặt OTP_EMAIL_PROVIDER=gmail để kiểm tra Gmail SMTP.');process.exitCode=1;
} else if(!deliveryConfigured()) {
 console.error('Điền GMAIL_USER bằng địa chỉ Gmail và GMAIL_APP_PASSWORD bằng mật khẩu ứng dụng 16 ký tự trong backend/.env. Không dùng mật khẩu đăng nhập Google.');process.exitCode=1;
} else {
 try {await verifyGmail();console.log('Gmail SMTP: kết nối và xác thực thành công. Chưa gửi email; hãy thử OTP trên website.');}
 catch(e) {
  console.error(e.code==='EAUTH'?'Google từ chối đăng nhập. Kiểm tra Gmail gửi, Xác minh 2 bước và tạo lại Mật khẩu ứng dụng.':'Không kết nối được Gmail SMTP. Kiểm tra mạng, cổng 465 và thử lại.');
  process.exitCode=1;
 }
}
