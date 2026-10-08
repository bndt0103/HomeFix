# Cập nhật HomeFix cho nhóm

Nhánh bàn giao: **`cap-nhat/homefix-hoan-thien-20261008`**. Bản này có đơn nhiều dịch vụ, phân công theo từng chi tiết, đồng ý vật tư trực tiếp, chat điều phối viên/CSKH/Gemini, sửa lịch hẹn, màn hình kỹ thuật viên và thông báo theo vai trò. Tệp kiểm thử, kết quả, log và bản mẫu cũ đã được loại khỏi nhánh; mã nguồn chạy nằm trong `SRC`.

## Máy đã clone dự án

Trước khi pull, chạy git status. Nếu có code đang sửa, commit công việc đó hoặc tạo nhánh lưu lại trước; không reset --hard hay ghi đè tệp để né xung đột.

Tại thư mục dự án:

```powershell
git fetch origin
git switch --track origin/cap-nhat/homefix-hoan-thien-20261008
cd SRC
npm.cmd ci
```

Nếu máy đã có nhánh này, dùng `git switch cap-nhat/homefix-hoan-thien-20261008` rồi `git pull --ff-only origin cap-nhat/homefix-hoan-thien-20261008`. Máy chưa clone dùng `git clone --branch cap-nhat/homefix-hoan-thien-20261008 --single-branch https://github.com/bndt0103/HomeFix.git` và làm theo [hướng dẫn cài đặt](../HUONG_DAN_CAI_DAT.md).

Dừng server cũ bằng Ctrl+C trước khi migration và khởi động lại. Nếu Git báo xung đột, gộp nội dung của cả hai phía, kiểm thử rồi commit trước khi push. Không force-push nhánh main.

Giữ `SRC/backend/.env`, database và `SRC/backend/uploads` của từng máy. Không chép khóa Gemini hoặc cấu hình SQL Server của người khác. Sao lưu database và thư mục ảnh cùng thời điểm trước khi nâng cấp.

Nếu database đã có `dbo.ChiTietDonHang`, chạy trong `SRC`:

```powershell
npm.cmd run db:migrate
npm.cmd run build
npm.cmd start
```

Nếu đang dùng schema cũ, chưa có `dbo.ChiTietDonHang`, chuyển sang database mới trước:

```powershell
npm.cmd run db:upgrade:orders -- --source HomeFix_Final --target HomeFix_Final_Multi
```

Đổi tên nguồn theo database trên máy; tên đích phải chưa tồn tại. Công cụ giữ nguyên nguồn và từ chối ghi đè đích. Sau khi chuyển thành công, đặt `DB_NAME=HomeFix_Final_Multi` trong `.env`, rồi chạy `db:migrate`, `build` và `start`. Không chạy mã mới trực tiếp với schema đơn cũ. Máy mới chưa có bảng chạy `CAI_DAT.bat` hoặc `db:init` theo hướng dẫn cài đặt.

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

## Kiểm tra sau cập nhật

Mở `http://localhost:3000/api/health`, đăng nhập và kiểm tra màn hình của từng vai trò. Khách mở **Chat AI** ở góc phải; tin của mình bên phải màu xanh, tin nhận bên trái màu trắng. Gemini cần key riêng và `GEMINI_ENABLED=true`; xem [AI_GEMINI.md](AI_GEMINI.md). Database local của mỗi máy không tự đồng bộ với nhau; khi dùng chung dữ liệu, thành viên mở cùng URL demo online của máy chủ.
