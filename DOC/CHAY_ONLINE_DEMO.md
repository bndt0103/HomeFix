# HomeFix: demo online dùng chung database

Máy đang chạy dự án là máy chủ của cả nhóm. Các thành viên mở cùng một URL HTTPS bằng trình duyệt, có thể ở khác Wi-Fi hoặc dùng 4G/5G. Chỉ máy chủ cần Node.js, SQL Server và mã nguồn.

## Chạy bằng Terminal VS Code

Mở terminal tại `Project_Final/SRC`:

```powershell
npm.cmd run online:setup
npm.cmd run online
```

Lệnh đầu tải cloudflared bản Windows x64 từ kho phát hành chính thức Cloudflare và kiểm tra SHA256; chỉ cần thực hiện khi chưa cài. Lệnh sau build giao diện, chạy backend trên `127.0.0.1:3001`, kết nối database trong `backend/.env`, tạo tunnel và kiểm tra URL HTTPS.

Chờ dòng `HOMEFIX ONLINE: https://...trycloudflare.com`. Sao chép **toàn bộ URL thực tế** cho nhóm. URL cũng được lưu tại `SRC/online-url.txt` khi kiểm tra kết nối thành công. Nếu không có dòng này thì chưa xác nhận được website online.

Hoặc nhấp đúp `CHAY_ONLINE.bat` ở thư mục gốc: file này thực hiện cả hai lệnh.

Nếu phiên online đang chạy nền hoặc ở terminal khác, dừng đúng phiên của dự án bằng `npm.cmd run online:stop` trong `SRC`, rồi chạy `npm.cmd run online` để mở lại. Lệnh dừng không tắt SQL Server hoặc web local cổng 3000.

Giữ terminal chạy; nhấn Ctrl+C để dừng backend online và tunnel. URL sẽ ngừng hoạt động. Chạy lại thường tạo URL mới, cần gửi lại cho nhóm. Nếu tắt máy, sleep hoặc mất Internet, mọi thành viên mất kết nối; dữ liệu đã ghi vẫn còn trong SQL Server. Đây là demo phụ thuộc máy chủ cá nhân, chưa phải dịch vụ cloud chạy liên tục.

Để xem trong VS Code: Ctrl+Shift+P → Simple Browser: Show → dán URL HTTPS thực tế. Nếu trình xem nhúng không mở được, dùng Edge/Chrome. Không gõ URL như một lệnh PowerShell.

## Một database chung

Cấu hình máy chủ hiện tại:

```dotenv
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=HomeFix_Final
DB_AUTH=windows
```

Chế độ online giữ nguyên `.env`, chỉ đặt cổng 3001 và địa chỉ lắng nghe cho tiến trình online. Web local cổng 3000 có thể chạy cùng lúc; nếu vừa sửa `.env`, phải khởi động lại web local để nó nhận database mới. Cả hai chỉ dùng chung dữ liệu khi cùng trỏ đến đúng instance/database.

Trong SSMS, kết nối `localhost\SQLEXPRESS`, mở `HomeFix_Final`. Có thể xem đơn mới bằng:

```sql
USE HomeFix_Final;
SELECT TOP (20) id, status, createdAt
FROM dbo.DonHang
ORDER BY id DESC;
```

Các thành viên không chạy `db:init`, không nhập cấu hình SQL riêng và không truy cập `localhost` trên máy của họ. Họ chỉ mở link HTTPS máy chủ cung cấp. Trên web, API dùng đường dẫn `/api` cùng website. Nếu từng lưu địa chỉ API khác trong Cài đặt kết nối, đổi lại thành URL HTTPS đang dùng cộng `/api`.

## Đặt đơn và điều phối giữa các thành viên

Mỗi người đăng nhập tài khoản tương ứng trên thiết bị của mình. Tài khoản mẫu phục vụ demo:

| Người thử | Tài khoản |
|---|---|
| Khách hàng | `kh@homefix.local` |
| Điều phối viên | `dpv@homefix.local` |
| Kỹ thuật viên | `ktv@homefix.local` |
| Kế toán | `kt@homefix.local` |

Mật khẩu mẫu ban đầu: `HomeFix@123` (nếu chưa đổi).

1. KTV bật sẵn sàng nhận việc.
2. KH đặt dịch vụ, ghi lại mã đơn.
3. DPV mở Danh sách đơn, lập báo giá sơ bộ cho đúng mã đơn.
4. KH đồng ý báo giá.
5. DPV phân công KTV; KTV phản hồi nhận việc.
6. KTV cập nhật tiến độ; KH theo dõi và duyệt các bước phát sinh/nghiệm thu.

Danh sách và chi tiết đơn tự kiểm tra dữ liệu khoảng 10 giây/lần; bấm Cập nhật để xem ngay. Đây là cập nhật định kỳ, không phải đẩy thông báo tức thì. Mỗi vai trò chỉ thấy dữ liệu được cấp quyền. Phiên đăng nhập hết hạn sau 15 phút.

App Android: ở Cài đặt kết nối nhập `https://<URL-thực-tế>/api`. Trình duyệt không cần cài app.

Link tunnel công khai trên Internet; giao diện vẫn chứa tài khoản demo. Chỉ dùng dữ liệu thử nghiệm và gửi link trong nhóm. Muốn sử dụng dữ liệu thật cần bỏ tài khoản/mật khẩu demo, giới hạn người truy cập và triển khai máy chủ lâu dài. Không mở cổng SQL ra Internet; tunnel này chỉ chuyển tiếp HTTP đến ứng dụng.

## Xử lý lỗi

- `running scripts is disabled`: dùng `npm.cmd`, hoặc `CHAY_ONLINE.bat`.
- Thiếu package: trong `SRC` chạy `npm.cmd ci`, rồi chạy lại.
- Cổng 3001 bận: dừng phiên online cũ bằng Ctrl+C; hoặc đặt `$env:ONLINE_PORT='3002'` trước khi chạy.
- Lỗi SQL: kiểm tra SQL Server đang chạy, `.env` đúng instance và tài khoản Windows có quyền truy cập. Chế độ online không tự tạo/xóa database.
- Không tạo được tunnel: kiểm tra Internet, log cloudflared và khả năng kết nối ra ngoài tới Cloudflare. Không tắt toàn bộ firewall.
- Link hết hạn: lấy link mới từ terminal của máy chủ. Các thành viên không thể dùng link cũ sau khi tunnel đã dừng.
- `DNS_PROBE_FINISHED_NXDOMAIN` hoặc không tìm thấy tên miền: DNS của mạng có thể chưa nhận link mới. Chờ một lúc, thử mạng 4G/5G hoặc bật Secure DNS trong trình duyệt với Cloudflare/Google. Script kiểm tra link có cơ chế thử DNS Cloudflare khi DNS hệ thống thất bại; không thay đổi DNS Windows.

Kiểm thử luồng nhiều tài khoản (tạo một đơn thử và thực hiện nghiệp vụ, có ghi database):

```powershell
$env:HOMEFIX_TEST_URL=(Get-Content .\online-url.txt -Raw).Trim()
node tests/ui-workflow.mjs
```

Script kiểm thử hiện dùng Microsoft Edge trên Windows và tài khoản mẫu chưa đổi mật khẩu.

Tài liệu chính thức: [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/), [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/). Quick Tunnel dành cho thử nghiệm, không có cam kết uptime.

## Thanh to?n sau nghi?m thu

B?n c?p nh?t h? tr? ti?n m?t v? chuy?n kho?n qua t?i kho?n HomeFix do qu?n tr? vi?n c?u h?nh. Xem [h??ng d?n thanh to?n, x?c minh v? ??i so?t](THANH_TOAN.md). M?y ch? ?? c?i tr??c b?n n?y c?n ch?y `npm.cmd run db:migrate:payments` r?i kh?i ??ng l?i server.
