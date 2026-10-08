# Thanh toán sau nghiệm thu

## Cấu hình một lần

Đăng nhập **ADMIN → Cấu hình nghiệp vụ → Tài khoản ngân hàng nhận tiền → Thêm tài khoản nhận tiền**. Chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản thật, kiểm tra lại rồi lưu. Có thể bật nhiều tài khoản để khách lựa chọn. Số tài khoản giữ nguyên các số 0 đầu.

Danh mục tên ngân hàng được lưu trong ứng dụng, tham khảo [API danh sách ngân hàng VietQR](https://www.vietqr.io/en/danh-sach-api/api-danh-sach-ma-ngan-hang/). Đây là danh mục ngân hàng nhận tiền; khách chuyển từ ứng dụng ngân hàng của mình.

Không có tài khoản ngân hàng giả được thêm vào database chạy demo. Khi chưa cấu hình tài khoản, khách vẫn chọn tiền mặt. Nếu nhập sai tài khoản, ngừng sử dụng tài khoản đó rồi thêm tài khoản đúng. Yêu cầu đã phát hành giữ nguyên thông tin để đối chiếu; ngừng tài khoản chỉ ngăn yêu cầu mới.

## Quy trình giữa các thành viên

1. KTV hoàn thành công việc, lập phiếu nghiệm thu, gửi ảnh và nội dung công việc.
2. KH kiểm tra phiếu, chọn tiền mặt hoặc chuyển khoản rồi xác nhận nghiệm thu. Tổng tiền lấy từ phiếu trên máy chủ; khách không sửa số tiền.
3. **Tiền mặt:** KH giao tiền cho KTV. KTV bấm xác nhận đã thu COD sau khi nhận đủ. Hệ thống tạo biên nhận và khoản chờ đối soát.
4. **Chuyển khoản:** KH chọn tài khoản HomeFix, chuyển đúng số tiền và nội dung riêng của đơn, bấm **Tôi đã chuyển khoản**, gửi ảnh biên lai JPG/PNG cùng mã giao dịch nếu có. Đơn vẫn **chưa thanh toán**, trạng thái **Chờ xác minh tiền**.
5. KT mở **Thanh toán, đối soát & ví → Chuyển khoản chờ xác minh → Xem chứng từ**. Đối chiếu sao kê thực tế, nhập số tiền nhận và mã giao dịch ngân hàng rồi xác nhận. Chỉ khi này đơn mới **Đã thanh toán**; KTV không được thu thêm tiền mặt.
6. KT mở **Đối soát thanh toán** để đối soát phần tiền thuộc KTV. KH có thể đánh giá sau khi đơn có biên nhận thanh toán.

Ảnh chứng từ chỉ khách sở hữu và kế toán được xem. Việc bấm đã chuyển hoặc gửi ảnh không tự tạo khoản thu. Hệ thống kiểm tra quyền, phiên bản dữ liệu, số tiền và mã giao dịch để tránh ghi nhận trùng khi nhiều máy thao tác.

## Các tình huống cần xử lý

- Chưa chuyển: KH có thể đổi phương thức hoặc tài khoản. Yêu cầu cũ hết hiệu lực; dùng thông tin mới.
- Đang chờ KT: khóa đổi phương thức để tránh thu hai lần. KH liên hệ hỗ trợ nếu cần điều chỉnh.
- KT chưa đối chiếu được: chọn kết quả chưa khớp, ghi rõ lý do. KH bấm **Gửi lại chứng từ** trên cùng yêu cầu, giữ nguyên số tiền, tài khoản và nội dung; không cần chuyển lại.
- Đã chuyển nhưng sai nội dung, thiếu/thừa tiền hoặc nhầm tài khoản: liên hệ hỗ trợ/KT để xác minh và xử lý thực tế trước. Ứng dụng chỉ xác nhận khi KT đối chiếu đủ tổng tiền; chưa có luồng hoàn tiền ngân hàng tự động.
- Đã thanh toán: khóa thu thêm và đổi phương thức. Cùng mã giao dịch trên cùng tài khoản nhận không được ghi cho hai khoản thu.
- Nhiều người mở cùng bản ghi: người thao tác với phiên bản cũ phải tải lại trước khi xử lý.

## Đối soát ví KTV

| Phương thức | Người nhận tiền khách | Khi KT đối soát |
| --- | --- | --- |
| Tiền mặt | KTV | Trừ hoa hồng tiền công khỏi ví KTV |
| Ngân hàng | HomeFix | Cộng tổng tiền đã nhận trừ hoa hồng vào ví KTV |

Ví dụ tổng đơn 570.000đ, hoa hồng 45.000đ: tiền mặt trừ ví 45.000đ; ngân hàng cộng ví 525.000đ (bao gồm phần phí kiểm tra/vật tư thuộc KTV). Việc cộng ví là ghi sổ trong ứng dụng. Chuyển tiền thật cho KTV thực hiện qua quy trình rút ví và kiểm tra của kế toán, không phải ngân hàng tự chuyển.

Bản này xác minh chuyển khoản thủ công qua kế toán. Chưa kết nối webhook/ngân hàng để tự động xác nhận tiền hoặc tự động hoàn tiền.

## Cập nhật máy chủ đã cài đặt

Trong thư mục SRC, dừng server cũ rồi chạy:

```powershell
npm.cmd run db:migrate:payments
npm.cmd run build
npm.cmd start
```

Nếu chạy demo online:

```powershell
npm.cmd run online:stop
npm.cmd run db:migrate:payments
npm.cmd run online
```

Lấy link mới trong SRC/online-url.txt. Các thành viên cùng truy cập link đó và dùng chung database máy chủ. Migration chạy trong transaction, kiểm tra giữ nguyên biên nhận và số dư ví; không khởi tạo lại dữ liệu. Máy mới dùng db:init sẽ có sẵn cấu trúc thanh toán.

## Kiểm thử tách khỏi dữ liệu sử dụng

Dùng database riêng có tên chứa Test theo mẫu dưới; không trỏ kiểm thử vào database demo. Hai terminal phải cùng đặt DB_NAME. URL kiểm thử phải là server dùng database này.

Terminal thứ nhất trong SRC:

```powershell
$env:DB_NAME='HomeFix_Payment_Test'
npm.cmd run db:init
$env:PORT='3002'
$env:HOST='127.0.0.1'
npm.cmd start
```

Mở `http://localhost:3002`, thực hiện luồng nghiệm thu và chọn COD hoặc BANK theo hướng dẫn trên. Dùng tài khoản, đơn và chứng từ thử trên database riêng; không chuyển tiền thật để kiểm tra giao diện. Đóng terminal này trước khi chạy bản demo để không giữ biến `DB_NAME` của database thử.
