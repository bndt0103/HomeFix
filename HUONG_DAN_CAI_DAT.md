# HomeFix — hướng dẫn cài đặt và sử dụng

Bản đồ án nhóm 08, ngày 25/09/2026. Đọc tài liệu này từ đầu khi cài trên máy mới. Website và ứng dụng Android dùng chung máy chủ và cơ sở dữ liệu; điện thoại không cài SQL Server.

## 1. Mở ngay trên máy đang làm đồ án

1. Mở thư mục `Project_Final` trong `D:\Subject_K5\CNPM\ProjectCK`.
2. Nhấp đúp `CHAY_HOMEFIX.bat`. Nếu báo HomeFix đã chạy thì dùng cửa sổ máy chủ đang có.
3. Mở Edge/Chrome, nhập `http://localhost:3000`.
4. Nhập `kh@homefix.local`, mật khẩu `HomeFix@123`. Hoặc mở “Tài khoản dùng thử cho đồ án”, chọn vai trò rồi bấm Đăng nhập.
5. Giữ máy chủ hoạt động trong suốt buổi thực hành. Khi dùng cửa sổ chạy do bạn mở, nhấn Ctrl+C để dừng.

Nếu chưa có thư viện/cấu hình, chạy `CAI_DAT.bat` trước. Cài đặt lại không xóa dữ liệu và không đặt lại mật khẩu đã thay đổi. Dữ liệu kiểm thử hiện có trên máy này được ghi nhãn TEST; máy mới chỉ có tài khoản và danh mục mẫu.

## 2. Chuẩn bị một máy Windows mới

Khuyến nghị Windows 10/11 x64, RAM 8 GB trở lên, còn khoảng 5 GB cho Node, SQL và mã nguồn; nếu tự build Android nên có 16 GB RAM và thêm dung lượng SDK. Đây là cấu hình thực hành gợi ý, không phải kết quả đo tải.

| Cần cài | Cách chọn | Liên kết chính thức |
|---|---|---|
| Node.js | Bản 24 LTS, Windows x64 Installer; giữ npm và Add to PATH | https://nodejs.org/en/download |
| SQL Server | SQL Server 2022 Express hoặc Developer, Database Engine; Windows Authentication; thêm tài khoản Windows hiện tại làm quản trị SQL khi cài | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |
| ODBC | ODBC Driver 17 hoặc 18 for SQL Server, x64 | https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server |
| SSMS | Dùng xem bảng, quan hệ, truy vấn và sao lưu; không bắt buộc để mở web | https://learn.microsoft.com/en-us/ssms/install/install |
| VS Code | Dành cho thành viên đọc/sửa mã nguồn | https://code.visualstudio.com/download |

Không cần cài Android Studio nếu chỉ cài APK có sẵn. Không cần IIS, XAMPP, MySQL hay một backend khác.

### 2.1. Kiểm tra SQL Server

Mở SSMS → Server type: Database Engine → Authentication: Windows Authentication. Server name thường là `localhost` nếu cài instance mặc định; nếu chọn Express có thể là `localhost\SQLEXPRESS`. Tên đúng chính là tên kết nối SSMS thành công, không phải tên database. Ghi lại để dùng bên dưới.

Nếu có thông báo chứng chỉ trong SSMS khi kết nối máy local, chọn Trust server certificate. Nếu không thấy instance chạy, mở Services của Windows và Start dịch vụ `SQL Server (...)` tương ứng. Chỉ máy chạy backend cần SQL Server; không mở cổng SQL ra mạng cho điện thoại.

### 2.2. Cài HomeFix

1. Giải nén gói bàn giao vào thư mục có quyền ghi, ví dụ `D:\HomeFix\Project_Final`. Không chạy trực tiếp bên trong ZIP.
2. Nhấp đúp `CAI_DAT.bat`. Lần đầu cần Internet để tải thư viện npm. Script kiểm tra Node, driver ODBC, tạo khóa đăng nhập ngẫu nhiên, tạo database, bảng, trigger, procedure, tài khoản mẫu và build giao diện.
3. Nếu kết nối SQL thất bại, mở `SRC/backend/.env` bằng Notepad. Sửa `DB_SERVER` đúng tên đã dùng trong SSMS, giữ `DB_NAME=HomeFix_Final` và `DB_AUTH=windows`. Lưu rồi chạy `CAI_DAT.bat` lại.
4. Nếu chỉ cài ODBC 18, đặt `DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server`. Script tự chọn khi tạo `.env` lần đầu; cấu hình có sẵn được giữ nguyên.
5. Khi thấy `CAI DAT THANH CONG`, chạy `CHAY_HOMEFIX.bat` và mở địa chỉ web được in ra.

Database mới được tạo riêng, không xóa database khác. Nếu tên đã chứa bảng không thuộc HomeFix, chương trình dừng để bảo vệ dữ liệu; hãy đổi `DB_NAME` sang tên mới. Không tự xóa bảng để vượt qua kiểm tra này.

### 2.3. Cách chạy bằng Terminal trong VS Code

Mở VS Code → File → Open Folder → chọn `Project_Final/SRC`. Chọn Terminal → New Terminal, chạy từng dòng:

```powershell
npm ci
npm run db:init
npm run build
npm start
```

`npm ci` dùng đúng phiên bản đã khóa trong `package-lock.json`. Nếu gặp yêu cầu biên dịch thư viện native, dùng Node 24 LTS x64; cài Microsoft Visual C++ Redistributable x64 theo hướng dẫn ODBC. Không bỏ qua lỗi rồi tiếp tục.

Khi lập trình, chạy `npm run dev`: web ở `http://localhost:5173`, API ở cổng 3000. Dừng cửa sổ `npm start` trước để tránh trùng cổng. Bản chạy nộp đồ án dùng `npm run build` rồi `npm start`, cả web và API ở cổng 3000.

## 3. Tài khoản và quyền sử dụng

Mật khẩu dữ liệu mẫu: `HomeFix@123`. Đây là tài khoản phục vụ trình diễn trong mạng riêng. Mật khẩu được băm trong SQL; không lưu mật khẩu rõ trong bảng người dùng.

| Email | Vai trò | Việc cần thử |
|---|---|---|
| kh@homefix.local | Khách hàng | Đặt đơn, duyệt giá/vật tư/nghiệm thu, đánh giá, hỗ trợ |
| ktv@homefix.local | Kỹ thuật viên | Bật sẵn sàng, nhận ca, cập nhật, nghiệm thu, thu COD, ví |
| dpv@homefix.local | Điều phối | Lập báo giá, chọn thợ, ghi chú, theo dõi đơn |
| cskh@homefix.local | Chăm sóc KH | Xem và giải quyết phiếu hỗ trợ |
| kt@homefix.local | Kế toán | Đối soát hoa hồng, duyệt nạp/rút, xuất báo cáo |
| admin@homefix.local | Quản trị | Người dùng, dịch vụ, cấu hình, duyệt hồ sơ thợ |
| gd@homefix.local | Giám đốc | Báo cáo hoạt động và khoản thu |
| kh2@homefix.local | Khách thứ hai | Kiểm tra không nhìn thấy đơn của KH khác |
| ktv2@homefix.local | Thợ thứ hai | Kiểm tra không nhận được lệnh của thợ khác |

Phiên đăng nhập có thời hạn 15 phút. Tải lại toàn trang hoặc đóng ứng dụng cần đăng nhập lại; nút “Cập nhật” trong trang giữ phiên hiện tại. Hệ thống chủ động chỉ giữ token trong bộ nhớ. Các tab trình duyệt có thể đăng nhập vai trò khác nhau; không dùng nút Reload khi đang trình diễn một bước dở.

Tài khoản KTV mẫu được cấp ví mở đầu 1.000.000 đồng để thử. KTV mới do quản trị tạo/duyệt hồ sơ bắt đầu ví 0 đồng, cần gửi chứng từ nạp và được kế toán duyệt trước khi nhận việc. Các con số này là dữ liệu đồ án, không phải tiền đã chuyển qua ngân hàng.

## 4. Cài ứng dụng Android và kết nối

1. Trên máy tính, chạy `CHAY_HOMEFIX.bat`. Đọc dòng API có tên Wi-Fi, ví dụ `http://192.168.1.10:3000/api`. Chọn IP mạng Wi-Fi thật, không chọn địa chỉ adapter ảo/VMware/VPN.
2. Cho điện thoại kết nối cùng Wi-Fi. Trên điện thoại, mở trình duyệt tới `http://192.168.1.10:3000/api/health`. Nếu hiện dữ liệu `status: ok`, kết nối mạng đã thông.
3. Chuyển `BIN/HomeFix-Android.apk` sang điện thoại. Mở APK và cho phép cài từ ứng dụng quản lý file đang dùng khi Android hỏi. APK dành cho Android 7 trở lên; thiết bị cần Android System WebView/Chrome được cập nhật. Bản này là debug dùng cho lớp học, không phải bản phát hành Google Play.
4. Mở HomeFix → “Cài đặt kết nối” ở màn đăng nhập → nhập địa chỉ API bước 1 → “Lưu và kiểm tra kết nối”. Khi báo thành công, đóng hộp thoại và đăng nhập.
5. Dùng khách hàng trên web và kỹ thuật viên trên điện thoại để thực hiện cùng một đơn. Cả hai cùng dùng dữ liệu SQL trên máy chủ.

`localhost` trên điện thoại là chính điện thoại, không phải máy tính. Địa chỉ `10.0.2.2` chỉ dùng cho Android Emulator trên cùng máy. Khi máy tính đổi IP Wi-Fi, cập nhật địa chỉ API trong ứng dụng. Không cần biên dịch lại APK chỉ để đổi IP.

Nếu Windows Firewall hỏi cho phép Node, chỉ cho phép mạng Private đang dùng. Nếu mạng lớp học chặn thiết bị nhìn nhau, dùng Wi-Fi riêng/hotspot có kết nối giữa hai thiết bị hoặc trình diễn bằng web responsive. Không tắt toàn bộ tường lửa. Máy chủ cần mở cổng 3000 trong mạng riêng; SQL không cần mở ra LAN.

Website có thể dùng trực tiếp trên trình duyệt điện thoại tại địa chỉ IP máy chủ. Bản Android dùng chung giao diện responsive với web; chưa tạo bản iOS. Không có chế độ nghiệp vụ offline và không dùng service worker để giả lập dữ liệu khi mất mạng.

### 4.1. Vị trí và ảnh

Nút cập nhật vị trí chỉ lấy vị trí khi người dùng bấm và cho phép; không theo dõi nền. Trình duyệt trên địa chỉ HTTP LAN có thể không cấp vị trí vì yêu cầu secure context. Không lấy được vị trí vẫn tiếp tục xử lý ca; tính năng cốt lõi không phụ thuộc GPS. Ảnh chọn từ file/thư viện JPG/PNG, mỗi ảnh tối đa 5 MB. Không dùng PDF cho trường ảnh.

### 4.2. Tự build Android khi sửa giao diện

Chỉ Trung cần thực hiện quy trình này. Cài Android Studio có Android SDK 36 và JDK 21. Mở `SRC/frontend/android` trong Android Studio và để IDE tạo cấu hình đường dẫn SDK cho máy mới.

```powershell
# Đứng tại Project_Final/SRC
npm run mobile:sync
# Mở Android Studio và chọn Build APK(s), hoặc dùng Terminal:
cd frontend/android
.\gradlew.bat assembleDebug
```

APK nằm ở `SRC/frontend/android/app/build/outputs/apk/debug/app-debug.apk`. Copy sang `BIN/HomeFix-Android.apk`. Không gửi `local.properties` của máy mình cho thành viên khác. Nếu APK cũ khác chữ ký debug nên không cập nhật được, gỡ bản thử cũ rồi cài bản mới; dữ liệu trên SQL vẫn còn, riêng địa chỉ API lưu trên điện thoại cần nhập lại.

## 5. Kịch bản trình diễn đầy đủ khoảng 10–15 phút

Mở bốn tab hoặc bốn cửa sổ để KH, ĐPV, KTV, KT cùng đăng nhập. Khi đổi vai trò đang xem cùng đơn, dùng nút “Tải lại đơn” để cập nhật ngay, không phải chờ chu kỳ 10 giây.

1. KTV → Tổng quan → Bật sẵn sàng. Chuyên môn mẫu là Điện lạnh; chọn dịch vụ Sửa máy lạnh cho đúng nhóm. Một thợ chỉ giữ một lệnh/ca đang hoạt động.
2. KH → Dịch vụ → Sửa máy lạnh → điền địa chỉ, mô tả lỗi và ảnh nếu có → Gửi yêu cầu. Để trống lịch hẹn khi cần sớm nhất; nếu đặt lịch, chọn 08:00–17:30, đúng khung 30 phút.
3. ĐPV → Điều phối đơn → mở đúng mã HF → Lập báo giá sơ bộ → nhập chẩn đoán. Giá mẫu: kiểm tra 50.000 + tiền công 300.000 = 350.000 đồng.
4. KH → Đơn của tôi → mở đơn → Đồng ý báo giá. Không điều phối khi KH chưa duyệt.
5. ĐPV → Phân công kỹ thuật viên → chọn thợ Minh → Xác nhận. KTV có 10 phút theo cấu hình để trả lời; quá hạn đơn trở lại chờ phân công và thợ về tạm nghỉ.
6. KTV → Công việc → mở đơn → Phản hồi lệnh nhận việc → Chấp nhận. Lần lượt bấm Bắt đầu di chuyển → Xác nhận đã đến nơi → Bắt đầu xử lý.
7. KTV → Đề xuất vật tư → nhập Van máy lạnh, số lượng 1, đơn giá 220000, đơn vị cái, bảo hành 6 tháng. KH → Đồng ý thay vật tư.
8. KTV → Lập phiếu nghiệm thu → nhập nguyên nhân, biện pháp và ít nhất một ảnh sau sửa → Xác nhận. Tổng hiện 570.000 đồng.
9. KH → Xác nhận nghiệm thu → đánh dấu đã kiểm tra thiết bị. Nếu chưa đạt thì Yêu cầu xử lý lại, hệ thống giữ lịch sử và cho tạo phiếu phiên bản mới.
10. KTV nhận tiền mặt trong kịch bản thực tế rồi bấm Xác nhận đã thu COD. Trong buổi demo hãy nói rõ đây là thao tác giả lập, không có tiền được chuyển qua cổng thanh toán.
11. KT → Đối soát & ví → đúng đơn → Đối soát → xác nhận 45.000 đồng, bằng 15% của 300.000 tiền công. Ví thợ từ 1.000.000 còn 955.000 đồng nếu chưa có giao dịch khác.
12. KH → Đánh giá dịch vụ. GD → Báo cáo để xem giá trị đã thu 570.000 và hoa hồng 45.000 được tách riêng. Không gọi 570.000 là doanh thu hoa hồng của HomeFix.

Khi đã demo trước đó, số dư/tổng báo cáo có thể khác ví dụ; kiểm tra biến động của đúng đơn thay vì so tổng toàn hệ thống. Sau nghiệm thu KTV về tạm nghỉ, phải bật sẵn sàng trước ca mới.

## 6. Các màn hình phụ cần trình bày

- KH → Hồ sơ: cập nhật thông tin, đổi mật khẩu, đăng ký cộng tác kỹ thuật viên. Đổi mật khẩu buộc đăng nhập lại.
- KH → chi tiết đơn → Gửi yêu cầu hỗ trợ. CSKH mở phiếu, chuyển Đang xử lý/Đã giải quyết/Từ chối và ghi nội dung. Bảo hành xét vật tư còn hạn; chưa tự sinh ca sửa bảo hành mới.
- KTV → Ví & thu nhập → Nạp ví, tải ảnh chứng từ → KT xét duyệt. Rút tiền cũng phải được KT duyệt; kiểm tra số dư và không duyệt rút khi thợ giữ ca. Không có tích hợp chuyển khoản tự động.
- ADMIN → Dịch vụ: sửa giá áp dụng cho báo giá tạo sau đó. Báo giá đã lập/duyệt được giữ nguyên. Cấu hình phí hủy được chụp lại lúc đặt đơn.
- ADMIN → Tài khoản: tạo người dùng theo vai trò, khóa/mở tài khoản. Không khóa quản trị cuối cùng hoặc thợ đang giữ ca.
- ADMIN → Duyệt hồ sơ: xét KH thành KTV khi không còn đơn KH đang mở; sau duyệt người đó cần đăng nhập lại.
- GD/KT → Báo cáo: lọc ngày và xuất CSV. File có UTF-8 BOM để mở tiếng Việt bằng Excel; chỉ số hiệu suất KTV hiện tổng hợp toàn bộ thời gian và ghi rõ trên màn hình.

## 7. Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Không nhận lệnh node/npm | Cài Node 24 LTS, đóng Terminal và mở lại; không đổi tên thư mục npm |
| Login failed hoặc lỗi SSPI | Chạy bằng tài khoản Windows kết nối được SSMS; sửa đúng DB_SERVER; backend phải chạy trên máy có quyền SQL |
| ODBC Driver not found | Cài driver x64, sửa DB_ODBC_DRIVER đúng 17 hoặc 18 |
| EADDRINUSE cổng 3000 | Có máy chủ đang chạy. Dùng máy chủ đó hoặc dừng đúng cửa sổ cũ trước khi chạy mới |
| Điện thoại không kết nối | Kiểm tra IP Wi-Fi, cùng mạng, máy chủ còn mở, firewall Private; thử /api/health trên điện thoại |
| Không có thợ để chọn | Đúng chuyên môn, bật sẵn sàng, ví đủ tối thiểu 200.000; không giữ ca khác |
| Dữ liệu vừa thay đổi (409) | Đóng hộp thoại, bấm tải lại đơn/danh sách, kiểm tra rồi làm tiếp |
| Hết phiên đăng nhập | Đăng nhập lại; token giữ trong bộ nhớ, không tự lưu mật khẩu |
| Không gửi được ảnh | JPG/PNG thật, ≤5 MB và tối đa 5 ảnh mỗi nhóm chưa gắn phiếu |
| Đơn đã đến nơi không hủy được | Gửi hỗ trợ; không sửa trực tiếp trạng thái trong SQL để ép hủy |
| Mở APK báo không cài được | Android ≥7 và WebView cập nhật; gỡ APK thử khác chữ ký; cài đúng file trong BIN |
| Mục lục Word chưa cập nhật | Mở Word, Ctrl+A → F9 → Update entire table; bản PDF đã được xuất sẵn |

## 8. Kiểm thử, lưu dữ liệu và giới hạn

Trong `SRC`, chạy `npm test` khi máy chủ đã chạy và SQL dùng cấu hình đúng. Bộ test tạo dữ liệu thử riêng, có truy cập SQL kiểm tra trigger; không dùng trên database có dữ liệu thật. `npm run test:e2e` dùng Edge đã cài, kiểm thử 34 trang và luồng 15 thao tác. Có thể đặt `EDGE_PATH` cho đường dẫn Edge khác trong smoke test; workflow test đang dùng đường dẫn Edge chuẩn Windows.

Kết quả JSON và ảnh thực tế nằm ở `SRC/test-results`; bản bằng chứng bàn giao nằm trong `REF/KiemThu`. Các ca này kiểm tra tính đúng đắn trong môi trường local, không chứng minh chịu tải lớn hoặc thay cho việc thử trên điện thoại thật.

Sao lưu bằng SSMS: nhấp phải `HomeFix_Final` → Tasks → Back Up → Full → chọn file `.bak` mới. Copy thêm `SRC/backend/uploads` để giữ ảnh. Giữ hai phần cùng thời điểm; không chỉ copy mã nguồn rồi cho rằng đã sao lưu dữ liệu. Khi phục hồi trên máy mới, restore vào tên database mới, sửa DB_NAME và chạy `npm run db:init` để áp dụng migration còn thiếu; không ghi đè database khác. File `.env` chứa khóa riêng của từng máy, không đưa lên GitHub hoặc gửi trong nhóm chat.

Bản này dùng HTTP trong mạng riêng để dễ demo. Khi triển khai Internet cần HTTPS, cấu hình CORS theo domain, thay mật khẩu mẫu, quản lý secret, tài khoản SQL giới hạn quyền, lưu ảnh bền vững và quy trình sao lưu. Chưa triển khai SMS/OTP quên mật khẩu, video call, thanh toán online, GPS nền, tự ghép thợ, tự tạo đơn bảo hành hoặc tự thu phí hủy. Không bấm giao diện thiết kế gốc trong báo cáo rồi hiểu rằng những phần này đã được cài đặt.

## 9. Bốn thành viên tiếp nhận mã nguồn như thế nào

| Thành viên | Phần phải hiểu và tự chỉnh sửa thử | Tệp chính | Bài kiểm tra khi tiếp nhận |
|---|---|---|---|
| Nguyễn Quốc Việt — 24110381 | API, SQL, giao dịch, phân quyền | backend/src, database, scripts/init-db.js | Tự giải thích 409, rowversion, idempotency; thêm một kiểm tra đầu vào; chạy 35 ca |
| Đỗ Anh Tuấn — 24110369 | Website khách và điều phối | frontend/src/main.jsx, pages.jsx, order-detail.jsx, style.css | Tự chỉnh một màn theo Figma; demo đặt → duyệt → giao thợ, kiểm tra không gọi SQL trực tiếp |
| Bùi Nguyễn Duy Trung — 24110363 | Giao diện mobile KTV, build Android | frontend/src/order-detail.jsx, management.jsx, android | Sửa một lỗi hiển thị 390 px; build APK; thử Wi-Fi và chụp ảnh nghiệm thu trên điện thoại thật |
| Lê Tấn Tài — 24110319 | Ví, hỗ trợ, báo cáo, kiểm thử và tài liệu | backend/src/finance.js, support.js, admin.js; frontend/src/management.jsx; tests | Sửa một chức năng nhỏ ở báo cáo/hỗ trợ; giải thích 570.000/45.000/955.000; đối chiếu DOC/PDF |

Mã nguồn hiện tại được xây dựng với AI hỗ trợ. Bảng này là trách nhiệm tiếp nhận và kiểm chứng; không khẳng định từng sinh viên đã tự viết các tệp được liệt kê. Mỗi người cần đọc, chạy, chỉnh và giải thích phần của mình, lưu commit thực tế để điền bảng đóng góp trước khi nộp.

Ngày 1–2: cả nhóm cài trên máy mình và thực hiện luồng demo. Ngày 3–5: sửa các khác biệt cần thiết so Figma và phản hồi giảng viên. Ngày 6–8: mỗi người hoàn thành một thay đổi có kiểm thử, tích hợp cùng nhánh. Ngày 9–10: Trung thử điện thoại thật, Tài kiểm tra đủ quyền, Việt rà dữ liệu, Tuấn soát giao diện. Ngày 11–12: chạy lại kiểm thử, chốt báo cáo và ảnh. Ngày 13: tập bảo vệ với bốn vai trò. Ngày 14: đóng gói phiên bản nộp và dự phòng lỗi cài đặt.

## 10. Các thư mục trong gói nộp

`DOC`: báo cáo Word và tài liệu. `PDF`: bản đọc/in. `SRC`: toàn bộ mã nguồn, SQL, Android native và kiểm thử. `BIN`: APK và bản web đã build. `REF`: lược đồ, giao diện nguồn, bằng chứng kiểm thử và nguồn tham khảo. `SOFTS`: liên kết phần mềm cần cài. `README.md`: điểm bắt đầu. `_work`: chỉ là môi trường tạo bản bàn giao trên máy tác giả, không cần để chạy sản phẩm và không nằm trong ZIP nộp.
