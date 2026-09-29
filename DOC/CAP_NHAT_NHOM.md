# Cập nhật bản đã gộp cho nhóm

Bản này gộp danh mục mở rộng/tìm kiếm/dịch vụ phổ biến của nhóm với thanh toán tiền mặt hoặc ngân hàng, đối soát, sửa lỗi focus ô nhập và chạy demo online. Đã bỏ dự án native iOS, lệnh build iOS và dependency riêng của iOS; giữ web và Android. iPhone vẫn có thể truy cập website bằng trình duyệt.

## Máy đã clone dự án

Trước khi pull, chạy git status. Nếu có code đang sửa, commit công việc đó hoặc tạo nhánh lưu lại trước; không reset --hard hay ghi đè tệp để né xung đột.

Tại thư mục dự án:

```powershell
git pull --no-rebase origin main
cd SRC
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run build
npm.cmd start
```

Dừng server cũ bằng Ctrl+C trước khi migration và khởi động lại. Nếu Git báo xung đột, gộp nội dung của cả hai phía, kiểm thử rồi commit trước khi push. Không force-push nhánh main.

Giữ SRC/backend/.env của từng máy; không chép cấu hình SQL Server của máy khác và không commit file này. db:migrate cập nhật OTP, thanh toán và danh mục trên database đã cài. Máy mới chưa có bảng chạy db:init theo hướng dẫn cài đặt.

Migration danh mục thêm isPopular và các dịch vụ còn thiếu đúng một lần. Giữ ID, giá, mô tả, nhóm, trạng thái và thiết lập phổ biến đã có; không xóa hai dịch vụ cũ hoặc dịch vụ do quản trị tự thêm. Danh mục chuẩn có 29 dịch vụ mới của nhóm cộng 2 dịch vụ tổng quát trước đó. Khi cài mới, danh mục dùng giá chuẩn của nhóm. Quản trị có thể ẩn dịch vụ không cần và điều chỉnh dịch vụ phổ biến.

## Dùng chung website/database để demo

Chỉ máy chủ chạy:

```powershell
npm.cmd run online:stop
npm.cmd run db:migrate
npm.cmd run online
```

Nếu chưa có phiên online thì bỏ qua thông báo không tìm thấy phiên. Lấy link mới trong SRC/online-url.txt gửi các thành viên. Các thành viên mở cùng link bằng trình duyệt, không cần cài SQL Server để dùng website của máy chủ. Khi mỗi người chạy server local với database riêng, dữ liệu giữa các máy không tự đồng bộ.

Xem [chạy online](CHAY_ONLINE_DEMO.md), [cấu hình thanh toán](THANH_TOAN.md) và [tham chiếu API](API_ThamChieu.md).

## OTP qua Gmail

OTP được gửi từ Gmail bằng App Password, không dùng mật khẩu đăng nhập Gmail. Mỗi địa chỉ nhận chỉ được tạo tối đa 3 mã trong một giờ và phải chờ 90 giây trước khi gửi lại. Mã có hiệu lực 5 phút và chỉ dùng một lần. Các yêu cầu gửi được xếp hàng trong backend để tránh mở nhiều kết nối SMTP cùng lúc.

Kiểm tra cấu hình mà không gửi email:

    powershell
    cd SRC
    npm.cmd run email:check

Nếu lệnh kiểm tra thành công nhưng không thấy email, kiểm tra thư Spam/Promotions và chờ hết cooldown. Không bấm gửi lại liên tục; sau khi đổi Gmail App Password cần khởi động lại backend. Nếu Gmail vẫn chặn gửi, dùng một nhà cung cấp email transactional đã cấu hình trong OTP_EMAIL_PROVIDER và không đưa khóa API lên GitHub.

## Kiểm chứng bản gộp

Kiểm thử trên database riêng: migration danh mục bảo toàn dữ liệu và chạy lặp; cài mới; nghiệp vụ COD/ngân hàng; URL web/Android; giao diện tìm kiếm, sửa dịch vụ phổ biến, thanh toán và giữ focus qua lần tự cập nhật. Cách tạo môi trường kiểm thử ở hướng dẫn thanh toán. Không chạy kiểm thử tạo đơn vào database dùng chung của nhóm.
