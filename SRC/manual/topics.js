export const groups = [
  {
    title: 'Bắt đầu và cài đặt',
    pages: ['welcome', 'windows', 'source', 'online', 'server', 'android', 'accounts'],
  },
  {
    title: 'Hướng dẫn theo vai trò',
    pages: ['customer', 'dispatcher', 'technician', 'support', 'finance', 'admin', 'director'],
  },
  {
    title: 'Quy trình và hỗ trợ',
    pages: ['workflow', 'payments', 'email-ai', 'backup', 'troubleshoot', 'build'],
  },
];

export const topics = [
  {
    id: 'welcome',
    title: 'Chào mừng đến với HomeFix',
    keywords: ['Bắt đầu', 'Hướng dẫn sử dụng', 'User manual'],
    body: `
    <p class="lead">HomeFix giúp khách hàng đặt dịch vụ sửa chữa, điều phối kỹ thuật viên, theo dõi công việc và quản lý thanh toán trên cùng hệ thống.</p>
    <div class="callout"><strong>Bạn muốn mở nhanh?</strong><br>Cài <code>BIN/HomeFix-Setup.exe</code>, mở biểu tượng HomeFix trên Desktop, rồi đăng nhập bằng tài khoản dùng thử. Xem <a href="windows.html">Cài đặt trên Windows</a>.</div>
    <h2>Chọn cách sử dụng</h2>
    <table><tr><th>Cách chạy</th><th>Phù hợp với</th><th>Cần làm</th></tr>
    <tr><td>Desktop Windows</td><td>Dùng thử trên laptop, không sửa code</td><td>Cài EXE. Bộ cài kèm Node, SQL LocalDB và ODBC.</td></tr>
    <tr><td>Local bằng mã nguồn</td><td>Chạy và chỉnh sửa hệ thống</td><td>Cài Node, SQL Server, ODBC; chạy CAI_DAT.bat.</td></tr>
    <tr><td>Online demo</td><td>Nhiều thiết bị ở các mạng khác nhau</td><td>Máy chủ chạy CHAY_ONLINE.bat và chia sẻ link HTTPS.</td></tr>
    <tr><td>Máy chủ lâu dài</td><td>Địa chỉ cố định, hoạt động liên tục</td><td>Cài dịch vụ Node, SQL và proxy HTTPS.</td></tr>
    <tr><td>Android</td><td>Khách và kỹ thuật viên dùng điện thoại</td><td>Cài APK và nhập địa chỉ API của máy chủ.</td></tr></table>
    <h2>Dùng tài liệu này như thế nào?</h2><ol><li>Chọn mục cài đặt phù hợp trong cây mục lục bên trái.</li><li>Đọc mục tài khoản, rồi mở hướng dẫn đúng vai trò.</li><li>Dùng <strong>Chỉ mục</strong> để tìm theo tên nghiệp vụ, hoặc <strong>Tìm kiếm</strong> để tìm nội dung.</li><li>Khi gặp lỗi, tra mục Xử lý lỗi và làm từng bước.</li></ol>
    <p>Mỗi thiết bị cần kết nối tới đúng máy chủ. Website và Android đọc dữ liệu của máy chủ đó. Bản Desktop mặc định dùng cơ sở dữ liệu riêng trên laptop; muốn dùng dữ liệu chung, phải cấu hình kết nối đúng cơ sở dữ liệu.</p>`,
  },
  {
    id: 'windows',
    title: 'Cài đặt và chạy Desktop Windows',
    keywords: ['EXE', 'Bộ cài', 'Desktop', 'LocalDB'],
    body: `
    <h2>Chuẩn bị</h2><p>Dùng Windows 10/11 x64 và tài khoản được phép cài phần mềm. Nên có RAM từ 8 GB và còn ít nhất 3 GB dung lượng trống. Đây là cấu hình sử dụng gợi ý. Bộ cài kèm môi trường chạy, không cần tự cài Node hoặc nhập lệnh npm.</p>
    <h2>Cài lần đầu</h2><ol><li>Mở thư mục BIN, nhấp đúp <strong>HomeFix-Setup.exe</strong>.</li><li>Nếu Windows yêu cầu quyền cài đặt, kiểm tra đúng tệp HomeFix rồi cho phép.</li><li>Đọc giấy phép thành phần, chọn thư mục cài và tùy chọn tạo biểu tượng Desktop.</li><li>Chờ bộ cài chép ứng dụng và cài thành phần Microsoft còn thiếu. Nếu được yêu cầu khởi động lại Windows, thực hiện trước khi mở HomeFix.</li><li>Chọn Mở HomeFix ở màn hình hoàn tất, hoặc nhấp đúp biểu tượng HomeFix.</li></ol>
    <h2>Mở và tắt ứng dụng</h2><p>Cửa sổ HomeFix tự chuẩn bị SQL LocalDB, tạo dữ liệu ban đầu và mở trình duyệt tại <code>http://localhost:3000</code>. Lần đầu có thể lâu hơn các lần sau. Giữ cửa sổ HomeFix mở trong lúc sử dụng. Nút <strong>Mở HomeFix</strong> mở lại website; <strong>Dừng máy chủ</strong> dừng máy chủ do cửa sổ này mở. Đóng cửa sổ cũng dừng máy chủ đó.</p>
    <p>Đây là ứng dụng web được cài trên Windows: cửa sổ HomeFix quản lý máy chủ, còn màn hình nghiệp vụ hiển thị trong trình duyệt. Sau khi cài, có thể mở lại bằng biểu tượng như phần mềm thông thường.</p>
    <h2>Dữ liệu và cấu hình</h2><p>Nút <strong>Cấu hình</strong> mở <code>%LOCALAPPDATA%\\HomeFix\\homefix.env</code>. Ảnh tải lên nằm trong thư mục <code>uploads</code> ở cùng vị trí. SQL dùng instance <code>(localdb)\\HomeFix</code>, database <code>HomeFix_Desktop</code>. Tài khoản Windows khác có dữ liệu LocalDB riêng.</p>
    <div class="callout">Để Android dùng dữ liệu của laptop, giữ HomeFix chạy, cho phép kết nối cổng 3000 trên mạng riêng khi Windows hỏi, rồi nhập IP Wi-Fi của laptop trong ứng dụng Android.</div>
    <h2>Gỡ cài đặt</h2><p>Mở Settings → Apps → Installed apps → HomeFix → Uninstall. Bộ gỡ cài đặt bỏ ứng dụng và biểu tượng; dữ liệu người dùng và các thành phần Microsoft được giữ để có thể sao lưu hoặc cài lại. Không xóa instance LocalDB nếu còn dữ liệu cần giữ.</p>`,
  },
  {
    id: 'source',
    title: 'Cài mã nguồn và chạy local',
    keywords: ['Local', 'CAI_DAT', 'Node.js', 'SQL Server', 'npm'],
    body: `
    <h2>Phần mềm cần cài</h2><table><tr><th>Thành phần</th><th>Yêu cầu</th></tr><tr><td>Node.js</td><td>22.12 trở lên; nên dùng Node 24 LTS x64, kèm npm và PATH.</td></tr><tr><td>SQL Server</td><td>SQL Server 2022/2025 Express hoặc Developer. Tài khoản Windows hiện tại cần quyền tạo database cho lần cài đầu.</td></tr><tr><td>ODBC</td><td>ODBC Driver 17 hoặc 18 for SQL Server x64, dùng khi xác thực Windows.</td></tr><tr><td>SSMS</td><td>Tùy chọn, dùng xem dữ liệu và sao lưu.</td></tr></table>
    <p>Tải từ <a href="https://nodejs.org/en/download">Node.js</a>, <a href="https://www.microsoft.com/en-us/sql-server/sql-server-downloads">Microsoft SQL Server</a> và <a href="https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server">Microsoft ODBC</a>. Sau khi cài Node, mở lại Terminal.</p>
    <h2>Cách đơn giản</h2><ol><li>Giải nén gói dự án vào thư mục được phép ghi, không chạy ngay trong ZIP.</li><li>Đảm bảo dịch vụ SQL Server đang chạy.</li><li>Nhấp đúp <strong>CAI_DAT.bat</strong>. Script cài thư viện, tạo cấu hình riêng, khởi tạo SQL và build giao diện.</li><li>Nếu kết nối SQL lỗi, sửa <code>DB_SERVER</code> trong <code>SRC/backend/.env</code>, rồi chạy lại CAI_DAT.bat. Instance Express thường là <code>localhost\\SQLEXPRESS</code>.</li><li>Mở <strong>CHAY_HOMEFIX.bat</strong>, truy cập <code>http://localhost:3000</code> và đăng nhập.</li></ol>
    <h2>Cách chạy bằng Terminal</h2><pre>cd SRC
npm.cmd ci
node scripts/configure-env.js "DB_SERVER=localhost\\SQLEXPRESS"
npm.cmd run db:init
npm.cmd run build
npm.cmd start</pre>
    <p>Muốn sửa giao diện và thấy thay đổi ngay, chạy <code>npm.cmd run dev</code> trong SRC, mở <code>http://localhost:5173</code>. Vite chuyển yêu cầu API tới cổng 3000. Chỉ chạy một phiên backend trên cùng cổng.</p>
    <h2>Kết nối SQL bằng tài khoản SQL</h2><p>Trong backend/.env, đặt <code>DB_AUTH=sql</code>, điền <code>DB_SERVER</code>, <code>DB_USER</code>, <code>DB_PASSWORD</code> và <code>DB_NAME</code>. SQL Server phải bật chế độ xác thực tương ứng và TCP/IP khi kết nối từ máy khác. Không đưa mật khẩu vào frontend.</p>
    <div class="callout">Chạy db:init trên database HomeFix hiện tại sẽ giữ dữ liệu và mật khẩu tài khoản đã có. Nếu database chứa bảng của phần mềm khác hoặc cấu trúc HomeFix cũ không tương thích, script dừng để bảo vệ dữ liệu; chọn tên database mới.</div>`,
  },
  {
    id: 'online',
    title: 'Chạy online để dùng chung nhiều máy',
    keywords: ['Online', 'Cloudflare', 'HTTPS', 'CHAY_ONLINE'],
    body: `
    <h2>Máy nào làm máy chủ?</h2><p>Chọn một máy Windows đã cài và chạy được HomeFix từ mã nguồn. Database trong backend/.env của máy đó là dữ liệu chung cho mọi người truy cập link. Máy chủ phải có Internet và luôn bật.</p>
    <ol><li>Hoàn tất cài local và kiểm tra đăng nhập được.</li><li>Từ thư mục dự án, mở <strong>CHAY_ONLINE.bat</strong>. Hoặc chạy các lệnh bên dưới trong SRC.</li><li>Chờ kiểm tra database, build giao diện và tạo kết nối HTTPS.</li><li>Chỉ chia sẻ link khi màn hình in <strong>HOMEFIX ONLINE:</strong> và địa chỉ HTTPS. Link cũng được lưu trong SRC/online-url.txt.</li><li>Người dùng trên máy khác mở link bằng trình duyệt. Android nhập cùng link, thêm <code>/api</code> trong Cài đặt kết nối.</li></ol>
    <pre>cd SRC
npm.cmd run online:setup
npm.cmd run online</pre>
    <h2>Kiểm tra và dừng</h2><pre>npm.cmd run online:status
npm.cmd run online:stop</pre><p>Cũng có thể nhấn Ctrl+C ở cửa sổ online để dừng. Luồng online dùng cổng 3001 mặc định, có thể đổi bằng biến <code>ONLINE_PORT</code>. Máy không được chuyển sang Sleep trong lúc sử dụng.</p>
    <div class="callout">Link Cloudflare demo có thể đổi khi khởi động lại. Người dùng Android phải cập nhật địa chỉ máy chủ nếu link đổi. Đây là cách chia sẻ phiên chạy; để có domain cố định và hoạt động liên tục, đọc mục Chạy trên máy chủ.</div>
    <p>Nếu báo thiếu bảng hoặc cột, dừng phiên online, chạy <code>npm.cmd run db:init</code> để cập nhật cấu trúc HomeFix hiện tại, rồi chạy lại. Tất cả vai trò dùng cùng link nhưng đăng nhập bằng tài khoản riêng.</p>`,
  },
  {
    id: 'server',
    title: 'Triển khai trên máy chủ lâu dài',
    keywords: ['Máy chủ', 'Domain', 'IIS', 'Nginx', 'Triển khai'],
    body: `
    <h2>Cách bố trí</h2><p>Đặt Express và giao diện đã build trên máy chủ, dùng SQL Server cho dữ liệu. Domain trỏ tới proxy HTTPS; proxy chuyển yêu cầu website và /api tới Express. Android dùng <code>https://ten-mien-cua-ban/api</code>. Máy người dùng chỉ cần trình duyệt hoặc APK.</p>
    <ol><li>Chuẩn bị máy chủ Windows x64, Node 24 LTS và SQL Server. Với xác thực Windows, cài ODBC x64 và cấp quyền SQL cho đúng tài khoản chạy dịch vụ.</li><li>Chép mã nguồn; trong SRC chạy <code>npm.cmd ci</code> và <code>node scripts/configure-env.js</code>.</li><li>Sửa backend/.env: SQL server/database, tài khoản SQL nếu cần, JWT_SECRET ngẫu nhiên dài ít nhất 32 ký tự, và CLIENT_ORIGINS chứa domain HTTPS chính xác.</li><li>Khởi tạo database một lần bằng <code>npm.cmd run db:init</code>, rồi build bằng <code>npm.cmd run build</code>. Kiểm tra /api/health và đăng nhập.</li><li>Đăng ký <code>node backend/src/server.js</code> bằng trình quản lý dịch vụ như NSSM hoặc công cụ vận hành được chọn. Đặt working directory là SRC và dùng tài khoản có quyền đọc ứng dụng, ghi ảnh và truy cập SQL.</li><li>Cấu hình IIS ARR hoặc Nginx, chứng chỉ HTTPS và chuyển cả website lẫn API tới <code>http://127.0.0.1:3000</code>. Giới hạn cổng nội bộ bằng firewall.</li><li>Kiểm tra website và APK từ mạng khác, sau đó thiết lập sao lưu database và ảnh định kỳ.</li></ol>
    <h2>Thiết lập proxy mẫu</h2><pre>location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}</pre>
    <p>Ví dụ trên là phần location trong server HTTPS của Nginx, cần điền domain và chứng chỉ phù hợp. Nếu proxy nằm cùng máy và đi qua loopback, đặt biến <code>TRUST_PROXY=loopback</code> cho tiến trình Node. Khi đưa vào sử dụng thật, thay mật khẩu dùng thử, tắt tài khoản không cần dùng và quản lý khóa riêng của máy chủ.</p>
    <h2>Cập nhật phiên bản</h2><p>Sao lưu trước, dừng dịch vụ, thay mã nguồn, chạy npm ci, db:init và build, rồi khởi động lại. Không tạo database mới nếu muốn tiếp tục sử dụng dữ liệu hiện tại. Kiểm tra đơn hàng, thanh toán và ảnh sau cập nhật.</p>`,
  },
  {
    id: 'android',
    title: 'Cài APK và kết nối Android',
    keywords: ['Android', 'APK', 'Điện thoại', 'Kết nối máy chủ'],
    body: `
    <h2>Cài ứng dụng</h2><ol><li>Dùng Android 7.0 trở lên, chép <strong>BIN/HomeFix-Android.apk</strong> vào điện thoại.</li><li>Mở APK bằng trình quản lý tệp. Nếu được hỏi, cho phép ứng dụng đó cài từ nguồn này.</li><li>Chọn Cài đặt và mở HomeFix.</li><li>Ở màn hình đăng nhập, bấm <strong>Cài đặt kết nối</strong>.</li><li>Nhập địa chỉ API, bấm <strong>Lưu và kiểm tra kết nối</strong>. Khi báo thành công, đóng cửa sổ và đăng nhập.</li></ol>
    <h2>Nhập địa chỉ nào?</h2><table><tr><th>Trường hợp</th><th>Địa chỉ</th></tr><tr><td>Cùng Wi-Fi với laptop</td><td>http://IP-LAPTOP:3000/api</td></tr><tr><td>Online demo</td><td>https://LINK-DEMO.trycloudflare.com/api</td></tr><tr><td>Máy chủ cố định</td><td>https://DOMAIN/api</td></tr><tr><td>Giả lập Android mặc định</td><td>http://10.0.2.2:3000/api</td></tr></table>
    <p>Ví dụ IP laptop là 192.168.1.20 thì nhập <code>http://192.168.1.20:3000/api</code>. Xem IP Wi-Fi bằng lệnh <code>ipconfig</code> trên laptop. Không nhập localhost khi dùng điện thoại thật vì localhost lúc đó là điện thoại.</p>
    <h2>Điều kiện mạng</h2><p>Máy chủ phải đang chạy. Khi dùng Wi-Fi, hai thiết bị phải cùng mạng có thể liên lạc với nhau; tránh Wi-Fi khách bị cách ly. Cho phép Node/HomeFix qua firewall trên mạng riêng. Khi dùng 4G/5G, dùng link HTTPS online hoặc domain máy chủ.</p>
    <h2>Ảnh và vị trí</h2><p>Cho phép các quyền Android được yêu cầu khi tải ảnh hoặc lấy vị trí. Chọn ảnh rõ, đúng đơn và không quá 5 MB mỗi ảnh. Vị trí được lấy khi người dùng thao tác, không phải theo dõi vị trí liên tục khi ứng dụng đóng.</p>
    <div class="callout">Ứng dụng Android cần máy chủ và database đang hoạt động. Cài APK không tự tạo database trên điện thoại. Khi link online hoặc IP laptop đổi, mở Cài đặt kết nối và lưu địa chỉ mới.</div>`,
  },
  {
    id: 'accounts',
    title: 'Tài khoản, đăng nhập và các quyền',
    keywords: ['Tài khoản', 'Mật khẩu', 'Vai trò', 'Đăng nhập'],
    body: `
    <p>Sau khi khởi tạo database mới, các tài khoản dùng thử bên dưới có mật khẩu <strong>HomeFix@123</strong>. Tài khoản đã có trong database giữ nguyên mật khẩu hiện tại.</p>
    <table><tr><th>Email</th><th>Vai trò</th><th>Nhiệm vụ chính</th></tr><tr><td>kh@homefix.local</td><td>Khách hàng</td><td>Đặt dịch vụ, duyệt giá, nghiệm thu, thanh toán.</td></tr><tr><td>ktv@homefix.local</td><td>Kỹ thuật viên</td><td>Nhận việc, xử lý, kê khai vật tư, lập nghiệm thu.</td></tr><tr><td>dpv@homefix.local</td><td>Điều phối viên</td><td>Tiếp nhận, báo giá sơ bộ, phân công và theo dõi.</td></tr><tr><td>cskh@homefix.local</td><td>Chăm sóc khách hàng</td><td>Xử lý phiếu và tin nhắn hỗ trợ.</td></tr><tr><td>kt@homefix.local</td><td>Kế toán</td><td>Xác nhận giao dịch, đối soát, duyệt nạp/rút ví.</td></tr><tr><td>admin@homefix.local</td><td>Quản trị viên</td><td>Quản lý tài khoản, danh mục, hồ sơ và cấu hình.</td></tr><tr><td>gd@homefix.local</td><td>Giám đốc</td><td>Xem báo cáo và phê duyệt chính sách.</td></tr></table>
    <p>Có thêm <code>kh2@homefix.local</code> và <code>ktv2@homefix.local</code> để dùng thử nhiều khách và thợ. Mỗi người chỉ xem được dữ liệu trong phạm vi vai trò của mình.</p>
    <h2>Đăng nhập và đăng xuất</h2><ol><li>Mở website hoặc Android đã kết nối thành công.</li><li>Nhập email/số điện thoại và mật khẩu theo nhãn của biểu mẫu.</li><li>Bấm Đăng nhập. Menu sẽ đổi theo vai trò tài khoản.</li><li>Khi dùng máy chung hoặc đổi vai trò, bấm Đăng xuất trước khi đăng nhập tài khoản khác.</li></ol>
    <h2>Tài khoản mới và mật khẩu</h2><p>Khách hàng đăng ký bằng biểu mẫu Đăng ký; xác thực OTP gửi qua email thật. Quên mật khẩu và đổi mật khẩu cũng cần OTP email. Người vận hành phải cấu hình dịch vụ gửi email trước. Địa chỉ .local của tài khoản dùng thử không nhận thư thực tế; không dùng các địa chỉ này để thử OTP.</p>
    <p>Khách muốn trở thành kỹ thuật viên gửi hồ sơ cộng tác, thông tin chuyên môn và giấy tờ theo biểu mẫu. Quản trị viên xét duyệt hồ sơ. Không tự chọn vai trò nhân viên qua biểu mẫu đăng ký khách hàng.</p>`,
  },
  {
    id: 'customer',
    title: 'Khách hàng: đặt và theo dõi dịch vụ',
    keywords: ['Khách hàng', 'Đặt lịch', 'Báo giá', 'Nghiệm thu', 'Đánh giá'],
    body: `
    <p>Khách hàng chịu trách nhiệm cung cấp thông tin công việc, duyệt chi phí, kiểm tra kết quả và thanh toán. Menu chính gồm Trang chủ, Dịch vụ, Đơn của tôi và Hỗ trợ.</p>
    <h2>1. Đặt dịch vụ</h2><ol><li>Mở <strong>Dịch vụ</strong>, xem mô tả và chọn dịch vụ cần làm.</li><li>Nhập địa chỉ thực hiện, nội dung sự cố, ngày giờ hẹn và thông tin liên hệ theo biểu mẫu. Tải ảnh nếu có để điều phối viên dễ nhận diện.</li><li>Kiểm tra thông tin rồi gửi yêu cầu. Mở <strong>Đơn của tôi</strong> để xem mã đơn và trạng thái.</li><li>Một đơn có thể có nhiều chi tiết dịch vụ. Dùng chức năng bổ sung dịch vụ trong trang tổng hợp đơn khi cần thêm công việc.</li></ol>
    <h2>2. Duyệt báo giá và theo dõi</h2><p>Khi điều phối viên lập báo giá, mở đúng chi tiết dịch vụ, đọc phí kiểm tra, tiền công và nội dung công việc. Bấm <strong>Đồng ý báo giá</strong> nếu chấp thuận; nếu từ chối, ghi lý do. Chỉ phần dịch vụ đã được duyệt mới được phân công thợ. Theo dõi các trạng thái tiếp nhận, di chuyển, đến nơi và xử lý trong chi tiết.</p>
    <p>Dùng tin nhắn của đơn để trao đổi về địa chỉ và thời gian. Khi cần, cập nhật vị trí theo chức năng của giao diện. Đừng gửi thông tin thanh toán hoặc mật khẩu qua chat.</p>
    <h2>3. Vật tư và nghiệm thu</h2><p>Nếu cần thêm vật tư, kỹ thuật viên trao đổi và xin đồng ý trực tiếp tại hiện trường, rồi kê khai tên vật tư, số lượng, đơn giá và bảo hành vào hệ thống. Xem bảng kê để kiểm tra nội dung đã thống nhất. Luồng hiện tại không yêu cầu khách chờ bấm duyệt vật tư online.</p>
    <p>Khi có phiếu nghiệm thu, kiểm tra nguyên nhân, cách xử lý, ảnh thành phẩm và chi phí. Chọn <strong>Xác nhận nghiệm thu</strong> nếu công việc đạt; chọn <strong>Yêu cầu xử lý lại</strong> và ghi lý do nếu chưa đạt. Nếu hệ thống yêu cầu chữ ký, ký hoặc cung cấp ảnh chữ ký theo biểu mẫu. Chọn phương thức thanh toán ở bước xác nhận.</p>
    <h2>4. Thanh toán, đánh giá và hỗ trợ</h2><p>Với tiền mặt, trả cho thợ và chờ ghi nhận thu tiền. Với chuyển khoản, dùng đúng tài khoản, số tiền và nội dung hệ thống hiển thị; giao dịch cần người có quyền xác nhận. Sau khi hoàn thành và được ghi nhận thanh toán, đánh giá số sao và nhận xét thực tế.</p>
    <p>Muốn hủy, dùng <strong>Hủy yêu cầu dịch vụ</strong> và đọc thông báo điều kiện. Yêu cầu hủy có thể chờ điều phối xử lý; trạng thái chưa chuyển sang Hủy thì đơn chưa được hủy. Khi có vấn đề, mở Hỗ trợ để gửi khiếu nại/bảo hành hoặc dùng chat với nhân viên.</p>`,
  },
  {
    id: 'dispatcher',
    title: 'Điều phối viên: tiếp nhận và phân công',
    keywords: ['Điều phối', 'Phân công', 'Lệnh công việc', 'Báo giá sơ bộ'],
    body: `
    <p>Điều phối viên bảo đảm yêu cầu được hiểu đúng, báo giá rõ và giao cho thợ phù hợp. Dùng menu <strong>Điều phối</strong>, <strong>Tin nhắn khách hàng</strong> và <strong>Tất cả đơn</strong>.</p>
    <h2>Tiếp nhận và báo giá</h2><ol><li>Mở Điều phối, chọn đơn hoặc chi tiết đang chờ tiếp nhận.</li><li>Đọc địa chỉ, thời gian, mô tả và ảnh khách gửi. Trao đổi qua tin nhắn nếu thông tin chưa rõ.</li><li>Bấm <strong>Lập báo giá sơ bộ</strong>, nhập chẩn đoán và các khoản phí theo biểu mẫu.</li><li>Kiểm tra trước khi gửi cho khách. Theo dõi phản hồi; khách đồng ý thì công việc chuyển sang chờ phân công.</li><li>Nếu khách từ chối hoặc đổi nhu cầu, xem lý do và xử lý theo các nút được phép ở trạng thái hiện tại.</li></ol>
    <h2>Phân công kỹ thuật viên</h2><ol><li>Mở chi tiết ở trạng thái chờ phân công, chọn <strong>Phân công kỹ thuật viên</strong>.</li><li>Chọn thợ trong danh sách đủ điều kiện: chuyên môn, khu vực, trạng thái sẵn sàng và điều kiện ví.</li><li>Gửi lệnh, theo dõi thời gian còn lại để thợ phản hồi. Thời hạn mặc định 10 phút, có thể được đổi trong cấu hình.</li><li>Nếu thợ từ chối hoặc hết hạn, công việc quay về chờ phân công. Chọn thợ khác phù hợp.</li></ol>
    <div class="callout">Mỗi chi tiết dịch vụ có báo giá, thợ và tiến độ riêng. Đơn nhiều dịch vụ có thể cần nhiều chuyên môn; kiểm tra từng chi tiết, không hiểu trạng thái của một chi tiết là toàn bộ đơn.</div>
    <h2>Theo dõi và xử lý phát sinh</h2><p>Xem tiến độ, tin nhắn và thông báo để phát hiện đơn cần xử lý. Ghi chú điều phối phải rõ, ngắn và đúng người được xem. Khi khách yêu cầu hủy, kiểm tra công việc đã di chuyển/chưa và thông báo phí nếu có; thực hiện thao tác theo trạng thái cho phép.</p>
    <p>Nếu thợ không xuất hiện trong danh sách, kiểm tra trạng thái sẵn sàng, chuyên môn, khu vực, ví và công việc đang nhận của thợ. Nếu dữ liệu báo vừa thay đổi, tải lại chi tiết trước khi gửi lệnh mới. Không gửi lặp liên tục cùng thao tác.</p>`,
  },
  {
    id: 'technician',
    title: 'Kỹ thuật viên: nhận việc và hoàn thành',
    keywords: ['Kỹ thuật viên', 'Nhận việc', 'Vật tư', 'Phiếu nghiệm thu', 'Ví'],
    body: `
    <p>Kỹ thuật viên thực hiện công việc đã nhận, cập nhật tiến độ và ghi lại kết quả. Menu gồm Tổng quan, Công việc, Ví &amp; thu nhập và Cá nhân.</p>
    <h2>Chuẩn bị nhận việc</h2><ol><li>Kiểm tra thông tin chuyên môn, khu vực và liên hệ trong Cá nhân.</li><li>Chuyển trạng thái sẵn sàng khi có thể nhận việc.</li><li>Kiểm tra ví đáp ứng số dư tối thiểu. Mức mặc định khi khởi tạo là 200.000 đồng; quản trị có thể đổi theo chính sách.</li></ol>
    <h2>Nhận và cập nhật tiến độ</h2><ol><li>Khi có lệnh mới, mở Công việc, đọc địa chỉ, dịch vụ, thời gian và báo giá.</li><li>Bấm nhận hoặc từ chối trong thời hạn hiển thị. Từ chối cần chọn/ghi lý do theo biểu mẫu. Lệnh hết hạn không còn nhận được.</li><li>Khi bắt đầu đi, cập nhật Đang di chuyển; tới địa chỉ thì cập nhật Đã đến nơi; bắt đầu sửa thì cập nhật Đang xử lý.</li><li>Trao đổi với khách và điều phối qua tin nhắn đúng công việc.</li></ol>
    <h2>Kê khai vật tư</h2><p>Trước khi sử dụng vật tư phát sinh, giải thích cho khách tên vật tư, số lượng, đơn giá và bảo hành, rồi lấy sự đồng ý trực tiếp. Chọn <strong>Kê khai vật tư tại hiện trường</strong>, nhập từng dòng và xác nhận đã được khách đồng ý theo biểu mẫu. Không kê khai khoản chưa thống nhất.</p>
    <h2>Lập phiếu nghiệm thu</h2><ol><li>Khi hoàn thành, chụp ít nhất một ảnh thành phẩm rõ ràng.</li><li>Chọn <strong>Lập phiếu nghiệm thu</strong>; nhập nguyên nhân, giải pháp và tải ảnh.</li><li>Kiểm tra bảng kê vật tư, số tiền và phương thức thanh toán đề xuất.</li><li>Gửi phiếu, chờ khách xác nhận. Nếu khách yêu cầu xử lý lại, đọc lý do, tiếp tục công việc rồi lập/gửi phiếu theo trạng thái cho phép.</li></ol>
    <h2>Thu tiền và quản lý ví</h2><p>Chỉ xác nhận thu tiền mặt sau khi đã nhận đủ tiền. Chọn <strong>Xác nhận thu tiền mặt</strong> để lưu biên nhận. Kế toán sẽ đối soát phần hoa hồng; không tự đánh dấu chuyển khoản đã về tài khoản ngân hàng.</p>
    <p>Trong Ví &amp; thu nhập, xem số dư và lịch sử, gửi yêu cầu nạp/rút theo hướng dẫn trên màn hình. Yêu cầu đang chờ cần kế toán duyệt, không tăng/giảm số dư ngay khi gửi. Nếu không nhận được việc, kiểm tra trạng thái sẵn sàng, số dư và công việc đang xử lý.</p>`,
  },
  {
    id: 'support',
    title: 'Chăm sóc khách hàng: phiếu và tin nhắn',
    keywords: ['CSKH', 'Khiếu nại', 'Bảo hành', 'Hỗ trợ', 'Chat'],
    body: `
    <p>Chăm sóc khách hàng tiếp nhận vấn đề, trao đổi với khách và ghi kết quả xử lý. Menu chính là Yêu cầu hỗ trợ, Hộp thư hỗ trợ và Tra cứu đơn.</p>
    <h2>Xử lý phiếu hỗ trợ</h2><ol><li>Mở <strong>Yêu cầu hỗ trợ</strong>, lọc các phiếu mới hoặc đang xử lý.</li><li>Đọc loại yêu cầu, mô tả, khách hàng, đơn liên quan và lịch sử.</li><li>Tiếp nhận/cập nhật xử lý bằng thao tác đang có trên màn hình.</li><li>Tra cứu chi tiết công việc để kiểm tra vật tư, nghiệm thu, thanh toán và bảo hành.</li><li>Trao đổi với khách, ghi rõ vấn đề và phương án. Sau khi xử lý, nhập kết quả trước khi đóng phiếu.</li></ol>
    <h2>Trả lời chat với nhân viên</h2><ol><li>Mở <strong>Hộp thư hỗ trợ</strong>, xem hội thoại cần tiếp nhận.</li><li>Nhận hội thoại theo nút hiển thị, đọc nội dung trước khi trả lời.</li><li>Trả lời ngắn, rõ bước cần làm; yêu cầu khách cung cấp mã đơn khi cần tra cứu.</li><li>Kết thúc hoặc chuyển trạng thái hội thoại theo tình hình thực tế.</li></ol>
    <p>Tin nhắn hỗ trợ khách hàng và tin nhắn điều phối theo đơn phục vụ các mục đích khác nhau. Nếu khách cần đổi lịch/địa chỉ của công việc, phối hợp điều phối viên. Nếu cần kiểm tra giao dịch ngân hàng, phối hợp kế toán.</p>
    <div class="callout">Phiếu bảo hành ghi nhận yêu cầu cần xử lý; hệ thống không tự tạo đơn sửa mới hoặc tự chuyển tiền hoàn trả chỉ vì khách gửi phiếu. Kiểm tra đầy đủ trước khi ghi kết quả.</div>
    <p>Chat Gemini là một kênh trả lời riêng, chỉ hoạt động khi máy chủ cấu hình API key và bật tính năng. Nhân viên vẫn xử lý hội thoại được chuyển đến hộp thư hỗ trợ. Không yêu cầu mật khẩu hay OTP của khách.</p>`,
  },
  {
    id: 'finance',
    title: 'Kế toán: giao dịch, đối soát và ví',
    keywords: ['Kế toán', 'Đối soát', 'Nạp ví', 'Rút ví', 'Chuyển khoản'],
    body: `
    <p>Kế toán xác nhận tiền thực nhận, đối soát phần hoa hồng và duyệt biến động ví. Menu gồm Tổng quan tài chính, Đối soát doanh thu, Duyệt Ví KTV, Giao dịch và Báo cáo dòng tiền.</p>
    <h2>Xác nhận chuyển khoản</h2><ol><li>Mở <strong>Giao dịch</strong>, chọn yêu cầu thanh toán ngân hàng đang chờ.</li><li>Đọc đơn, người trả, số tiền, tài khoản nhận và nội dung chuyển khoản.</li><li>Đối chiếu với sao kê hoặc bằng chứng ngân hàng thực tế.</li><li>Chỉ xác nhận khi tiền đã đến đúng tài khoản và đúng yêu cầu. Nếu sai, dùng thao tác từ chối/xử lý theo biểu mẫu và ghi lý do rõ ràng.</li></ol>
    <p>Khách cung cấp bằng chứng không đồng nghĩa giao dịch tự động được xác nhận. HomeFix không kết nối cổng thanh toán để tự kiểm tra tiền về.</p>
    <h2>Đối soát doanh thu</h2><ol><li>Mở <strong>Đối soát doanh thu</strong>, lọc bản ghi đang chờ.</li><li>Kiểm tra chi tiết dịch vụ, tiền công, hoa hồng, kỹ thuật viên và biên nhận thu tiền.</li><li>Xác nhận đối soát khi dữ liệu đúng. Với COD, hệ thống ghi giao dịch trừ hoa hồng vào ví thợ.</li><li>Nếu báo ví không đủ, liên hệ thợ để bổ sung và duyệt khoản nạp hợp lệ trước khi đối soát lại.</li></ol>
    <h2>Duyệt ví kỹ thuật viên</h2><p>Trong <strong>Duyệt Ví KTV</strong>, kiểm tra yêu cầu nạp/rút, số tiền, người yêu cầu và thông tin liên quan. Đối chiếu khoản tiền thực tế rồi duyệt hoặc từ chối, ghi lý do. Theo dõi số dư và lịch sử sau khi xử lý. Không nhập giao dịch trùng để sửa một thao tác đã thành công.</p>
    <h2>Xem và xuất báo cáo</h2><p>Chọn khoảng thời gian trong Báo cáo dòng tiền, kiểm tra bộ lọc và xuất theo chức năng màn hình. Phân biệt tổng tiền dịch vụ, vật tư, tiền công và doanh thu hoa hồng. Nếu số liệu khác nhau, kiểm tra trạng thái thanh toán và thời gian lọc trước.</p>
    <div class="callout">Một khoản tiền chỉ được ghi nhận một lần. Nếu hệ thống báo đã xử lý hoặc dữ liệu cũ, tải lại danh sách rồi kiểm tra lịch sử; không bấm xác nhận liên tục.</div>`,
  },
  {
    id: 'admin',
    title: 'Quản trị viên: tài khoản và hệ thống',
    keywords: ['Quản trị', 'ADMIN', 'Hồ sơ KTV', 'Danh mục', 'Cấu hình'],
    body: `
    <h2>Quản lý tài khoản</h2><ol><li>Mở <strong>Quản lý tài khoản</strong>, tìm đúng người theo tên/email/số điện thoại.</li><li>Xem vai trò và trạng thái trước khi chỉnh sửa.</li><li>Thực hiện thao tác được phép như kích hoạt, khóa hoặc cập nhật thông tin; nhập lý do nếu biểu mẫu yêu cầu.</li><li>Kiểm tra kết quả sau khi lưu. Khóa tài khoản có thể khiến phiên đăng nhập hiện tại hết hiệu lực.</li></ol>
    <h2>Duyệt hồ sơ kỹ thuật viên</h2><p>Mở <strong>Duyệt hồ sơ KTV</strong>, xem thông tin cá nhân, giấy tờ, chuyên môn và khu vực hoạt động. Phê duyệt khi hồ sơ đủ điều kiện; nếu chưa đạt, từ chối và ghi phần cần bổ sung. Không duyệt chỉ dựa vào tên người gửi.</p>
    <h2>Danh mục dịch vụ</h2><p>Trong Danh mục dịch vụ, kiểm tra tên, nhóm chuyên môn, mô tả, phí kiểm tra, tiền công, hoa hồng và trạng thái. Dùng chức năng thêm/sửa/ẩn theo màn hình. Việc đổi giá danh mục cần được kiểm tra với báo giá đã phát hành; không hiểu giá mới sẽ tự sửa toàn bộ đơn cũ.</p>
    <h2>Cấu hình và chính sách</h2><p>Mở Cấu hình hệ thống để xem số dư tối thiểu nhận việc, thời hạn phản hồi lệnh, phí hủy và yêu cầu chữ ký nghiệm thu. Đọc ý nghĩa và đơn vị trước khi thay đổi. Các đề xuất chính sách cần phê duyệt sẽ được giám đốc xét ở mục Phê duyệt chính sách.</p>
    <h2>Tra cứu và nhật ký</h2><p>Dùng Đơn sửa chữa &amp; Bảo trì để tra cứu; dùng Nhật ký hệ thống để kiểm tra ai làm gì, vào thời điểm nào. Khi có phản ánh, ghi lại mã đơn/mã yêu cầu và đối chiếu nhật ký thay vì sửa trực tiếp dữ liệu SQL.</p>
    <div class="callout">Quản trị tài khoản trên giao diện khác với quản trị máy chủ. Gmail, Gemini, kết nối SQL và khóa JWT được người vận hành cấu hình trong tệp .env của máy chủ, không nhập vào trình duyệt.</div>`,
  },
  {
    id: 'director',
    title: 'Giám đốc: giám sát và phê duyệt',
    keywords: ['Giám đốc', 'GD', 'Báo cáo', 'Chính sách', 'Hiệu suất'],
    body: `
    <p>Giám đốc xem kết quả hoạt động, chất lượng và tài chính; xét đề xuất chính sách theo quyền được cấp. Menu gồm Tổng quan điều hành, Phê duyệt chính sách, Khách hàng &amp; chất lượng, Báo cáo tài chính và Hiệu suất KTV.</p>
    <h2>Đọc báo cáo</h2><ol><li>Chọn mục báo cáo phù hợp với câu hỏi cần xem.</li><li>Chọn thời gian và các bộ lọc hiển thị; kiểm tra khoảng ngày trước khi so sánh.</li><li>Xem số đơn, trạng thái, thanh toán, chất lượng và hiệu suất trong phạm vi được chọn.</li><li>Đối chiếu các khoản thu với trạng thái thanh toán. Tổng giá trị dịch vụ khác với doanh thu hoa hồng của hệ thống.</li><li>Xuất báo cáo nếu màn hình hỗ trợ, lưu kèm thông tin khoảng thời gian.</li></ol>
    <h2>Phê duyệt chính sách</h2><ol><li>Mở Phê duyệt chính sách, xem đề xuất đang chờ.</li><li>Đọc cấu hình hiện tại, giá trị đề xuất, lý do và người đề xuất.</li><li>Đánh giá tác động tới khách, thợ và kế toán.</li><li>Phê duyệt hoặc từ chối theo biểu mẫu, ghi lý do khi cần.</li><li>Kiểm tra trạng thái sau khi xử lý và giá trị cấu hình được áp dụng.</li></ol>
    <p>Nếu số liệu bất thường, tra khoảng ngày và trạng thái trước, rồi chuyển mã đơn/giao dịch cho bộ phận liên quan kiểm tra. Quyền xem báo cáo không thay thế thao tác xác nhận ngân hàng hoặc đối soát của kế toán.</p>`,
  },
  {
    id: 'workflow',
    title: 'Thực hành quy trình từ đặt đến thanh toán',
    keywords: ['Demo', 'Quy trình', 'Trạng thái', 'Nhiều dịch vụ'],
    body: `
    <p>Dùng các cửa sổ trình duyệt riêng hoặc hồ sơ trình duyệt riêng để đăng nhập KH, ĐPV, KTV và KT cùng lúc. Các tab chung một hồ sơ có thể dùng chung phiên đăng nhập.</p>
    <table><tr><th>Bước</th><th>Người thực hiện</th><th>Thao tác và kết quả cần thấy</th></tr><tr><td>1</td><td>KH</td><td>Đặt dịch vụ và ghi mã đơn. Công việc chờ tiếp nhận.</td></tr><tr><td>2</td><td>ĐPV</td><td>Mở đúng chi tiết, lập báo giá sơ bộ. Khách thấy yêu cầu duyệt.</td></tr><tr><td>3</td><td>KH</td><td>Đồng ý báo giá. Công việc chuyển sang chờ phân công.</td></tr><tr><td>4</td><td>ĐPV</td><td>Chọn thợ đủ điều kiện và gửi lệnh. Xuất hiện thời hạn phản hồi.</td></tr><tr><td>5</td><td>KTV</td><td>Nhận việc đúng hạn; cập nhật di chuyển, đến nơi và xử lý.</td></tr><tr><td>6</td><td>KTV + KH</td><td>Nếu có vật tư, thống nhất trực tiếp rồi kê khai. Kiểm tra bảng kê.</td></tr><tr><td>7</td><td>KTV</td><td>Lập nghiệm thu có nguyên nhân, giải pháp, ít nhất một ảnh thành phẩm.</td></tr><tr><td>8</td><td>KH</td><td>Kiểm tra kết quả, xác nhận nghiệm thu và chọn thanh toán.</td></tr><tr><td>9</td><td>KTV hoặc KT</td><td>Thợ xác nhận tiền mặt đã thu; kế toán xác nhận chuyển khoản thực nhận.</td></tr><tr><td>10</td><td>KT</td><td>Đối soát khoản đang chờ; kiểm tra sổ ví và báo cáo.</td></tr><tr><td>11</td><td>KH</td><td>Đánh giá sau hoàn thành và thanh toán; thử gửi hỗ trợ khi cần.</td></tr></table>
    <h2>Các trạng thái chính</h2><p class="flow">Chờ tiếp nhận → Chờ duyệt sơ bộ → Chờ phân công → Chờ nhận → Đã tiếp nhận → Đang di chuyển → Đã đến nơi → Đang xử lý → Chờ nghiệm thu → Hoàn thành</p>
    <p>Nếu từ chối lệnh/hết hạn: quay lại chờ phân công. Nếu nghiệm thu chưa đạt: quay lại xử lý. Hủy chỉ xuất hiện ở những trạng thái và điều kiện cho phép. Hoàn thành công việc và ghi nhận thanh toán là hai việc cần kiểm tra riêng.</p>
    <div class="callout">Với đơn nhiều dịch vụ, làm đủ quy trình cho từng chi tiết. Mỗi chi tiết có thể có kỹ thuật viên và thanh toán riêng; xem trang tổng hợp để biết toàn bộ đơn đã xong chưa.</div>`,
  },
  {
    id: 'payments',
    title: 'Hiểu chi phí và thanh toán',
    keywords: ['COD', 'Ngân hàng', 'Hoa hồng', 'Vật tư', 'Chi phí'],
    body: `
    <h2>Các khoản chi phí</h2><p>Báo giá sơ bộ thể hiện phí kiểm tra và tiền công. Vật tư phát sinh được kê khai riêng sau khi thống nhất tại hiện trường. Khi nghiệm thu, xem bảng kê và tổng tiền đúng chi tiết dịch vụ. Hoa hồng của hệ thống và tiền vật tư có ý nghĩa khác nhau, không gộp thành doanh thu hoa hồng.</p>
    <h2>Tiền mặt (COD)</h2><ol><li>Khách chọn tiền mặt khi xác nhận nghiệm thu.</li><li>Khách trả tiền; kỹ thuật viên kiểm tra đủ số tiền thực nhận.</li><li>Kỹ thuật viên xác nhận thu tiền mặt trong hệ thống.</li><li>Kế toán kiểm tra và đối soát hoa hồng. Giao dịch ví được hệ thống ghi khi đối soát thành công.</li></ol>
    <h2>Chuyển khoản</h2><ol><li>Khách chọn chuyển khoản và tài khoản nhận được hiển thị.</li><li>Dùng đúng số tiền và nội dung chuyển khoản của yêu cầu. Nếu có QR, kiểm tra lại thông tin trước khi xác nhận trên ứng dụng ngân hàng.</li><li>Gửi thông tin/bằng chứng theo màn hình nếu được yêu cầu.</li><li>Kế toán kiểm tra ngân hàng và xác nhận. Trước bước này, yêu cầu có thể vẫn ở trạng thái chờ.</li></ol>
    <p>HomeFix không tự chuyển tiền, không tự lấy OTP ngân hàng và không tự xác minh mọi chuyển khoản. Không gửi OTP, mật khẩu hoặc số thẻ đầy đủ qua hệ thống.</p>
    <h2>Trường hợp cần kiểm tra lại</h2><p>Nếu đã chuyển tiền nhưng vẫn chờ, cung cấp mã đơn, thời điểm, số tiền và nội dung chuyển khoản cho bộ phận hỗ trợ/kế toán. Không chuyển thêm lần nữa chỉ vì trang chưa cập nhật. Với trạng thái đã xử lý, tải lại dữ liệu để kiểm tra trước khi thao tác.</p>`,
  },
  {
    id: 'email-ai',
    title: 'Cấu hình email OTP và chat Gemini',
    keywords: ['OTP', 'Gmail', 'SMTP', 'Gemini', 'API key'],
    body: `
    <p>Mục này dành cho người vận hành máy chủ. Đóng ứng dụng hoặc dừng Node trước khi đổi cấu hình, rồi khởi động lại để áp dụng.</p>
    <h2>Gửi OTP bằng Gmail</h2><ol><li>Chuẩn bị Gmail có xác minh hai bước và tạo App Password nếu tài khoản hỗ trợ.</li><li>Mở cấu hình của phiên đang chạy: Desktop dùng nút Cấu hình; mã nguồn dùng SRC/backend/.env.</li><li>Điền các giá trị bên dưới bằng thông tin thật của Gmail gửi thư.</li><li>Với mã nguồn, chạy <code>npm.cmd run email:check</code> trong SRC để kiểm tra cấu hình/kết nối theo thông báo.</li><li>Khởi động lại và thử đăng ký bằng email thật có thể nhận thư.</li></ol>
    <pre>OTP_EMAIL_PROVIDER=gmail
GMAIL_USER=dia-chi-gmail-gui-thu
GMAIL_APP_PASSWORD=mat-khau-ung-dung-google</pre>
    <p>App Password khác mật khẩu đăng nhập Gmail. Khi lấy mật khẩu ứng dụng, không chép khoảng trắng trang trí. Nếu dùng Resend, đặt OTP_EMAIL_PROVIDER=resend, RESEND_API_KEY và OTP_EMAIL_FROM phù hợp nhà cung cấp.</p>
    <h2>Chat Gemini</h2><pre>GEMINI_ENABLED=true
GEMINI_API_KEY=khoa-rieng-cua-may-chu
GEMINI_MODEL=ten-model-duoc-tai-khoan-ho-tro
GEMINI_DAILY_LIMIT=100</pre><p>Dùng model được tài khoản nhà cung cấp cấp quyền ở thời điểm triển khai. Khởi động lại máy chủ, mở chat của khách rồi chọn Gemini để thử. Nếu chưa cấu hình, dùng kênh nhân viên hỗ trợ. Giới hạn ngày giúp kiểm soát lượng yêu cầu.</p>
    <div class="callout">Khóa Gmail, Resend và Gemini chỉ lưu ở máy chủ. Không đưa vào frontend, APK, Git hoặc ZIP nộp bài. Tài khoản @homefix.local dùng đăng nhập demo, không nhận OTP email thực.</div>`,
  },
  {
    id: 'backup',
    title: 'Sao lưu, phục hồi và cập nhật dữ liệu',
    keywords: ['Sao lưu', 'Phục hồi', 'Database', 'Migration'],
    body: `
    <h2>Cần sao lưu những gì?</h2><ul><li>Database SQL Server: người dùng, đơn, thanh toán, ví và lịch sử.</li><li>Ảnh tải lên: SRC/backend/uploads với mã nguồn; %LOCALAPPDATA%\\HomeFix\\uploads với Desktop.</li><li>Cấu hình riêng của máy, lưu ở nơi an toàn và tách khỏi gói source gửi đi.</li></ul>
    <p>Sao chép mã nguồn không sao lưu dữ liệu SQL. Với Desktop, kết nối SSMS tới <code>(localdb)\\HomeFix</code>, chọn HomeFix_Desktop. Với mã nguồn, dùng server/database ghi trong backend/.env.</p>
    <h2>Sao lưu bằng SSMS</h2><ol><li>Dừng thao tác nghiệp vụ hoặc chọn thời điểm không có người dùng.</li><li>Trong SSMS, nhấp phải database → Tasks → Back Up.</li><li>Chọn Full, đặt tệp .bak ở nơi tài khoản SQL được phép ghi và chạy sao lưu.</li><li>Kiểm tra thông báo thành công, chép bản sao lưu và ảnh sang nơi lưu trữ riêng.</li></ol>
    <h2>Phục hồi trên máy mới</h2><ol><li>Cài SQL Server tương thích, kết nối bằng SSMS.</li><li>Restore tệp .bak vào một tên database mới, kiểm tra đường dẫn .mdf/.ldf phù hợp máy mới.</li><li>Chép thư mục ảnh; sửa DB_SERVER và DB_NAME trong cấu hình của phiên chạy.</li><li>Chạy db:init từ mã nguồn để cập nhật cấu trúc HomeFix cần thiết. Desktop tự kiểm tra cấu trúc khi khởi động.</li><li>Đăng nhập, kiểm tra đơn, ảnh và số dư trước khi cho người dùng tiếp tục.</li></ol>
    <div class="callout">Không ghi đè database khác. Không xóa instance LocalDB để xử lý lỗi kết nối khi chưa sao lưu. Dữ liệu SQL phiên bản mới hơn có thể không phục hồi xuống SQL phiên bản cũ.</div>
    <h2>Các tệp SQL trong dự án</h2><p>001_schema.sql tạo cấu trúc ban đầu; 002_procedures_triggers.sql tạo thủ tục và trigger; các tệp tiếp theo bổ sung OTP, ngân hàng, danh mục, hồ sơ, vị trí, điều phối, vật tư, toàn vẹn đơn, chú thích tiếng Việt và chat. Tất cả đang được luồng khởi tạo hoặc cập nhật sử dụng; chạy bằng script đúng thứ tự thay vì dán tùy ý vào database khác.</p>`,
  },
  {
    id: 'troubleshoot',
    title: 'Xử lý lỗi thường gặp',
    keywords: ['Lỗi', 'Không chạy', 'Không kết nối', 'CHM', 'Firewall'],
    body: `
    <table><tr><th>Hiện tượng</th><th>Cách xử lý</th></tr><tr><td>CHM mở nhưng trang trắng</td><td>Giải nén CHM ra ổ đĩa máy. Nhấp phải → Properties → Unblock nếu có → Apply. Mở lại, không đọc trực tiếp trên thư mục mạng.</td></tr><tr><td>Không có node/npm</td><td>Cài Node 24 LTS x64 kèm npm, mở lại Terminal. Bản EXE đã có Node đi kèm nên chạy biểu tượng HomeFix.</td></tr><tr><td>SQL không kết nối</td><td>Kiểm tra DB_SERVER, dịch vụ SQL và quyền của tài khoản chạy. Desktop kiểm tra LocalDB đã được bộ cài cài thành công.</td></tr><tr><td>Không tìm thấy ODBC</td><td>Cài ODBC x64 đúng tên trong DB_ODBC_DRIVER; hoặc chạy lại bộ cài EXE để cài thành phần còn thiếu.</td></tr><tr><td>Cổng đang được sử dụng</td><td>Dừng phiên HomeFix cũ. Nếu cần đổi PORT trong cấu hình, đổi cả địa chỉ web/API trên thiết bị.</td></tr><tr><td>Web báo chưa build</td><td>Trong SRC chạy npm.cmd run build, rồi khởi động lại backend.</td></tr><tr><td>Android không kết nối</td><td>Kiểm tra máy chủ bật, IP/link còn đúng, cùng Wi-Fi và firewall. Điện thoại thật không dùng localhost.</td></tr><tr><td>Online không tạo link</td><td>Kiểm tra Internet, chạy online:setup, xem log Cloudflare và kiểm tra database; dừng phiên cũ rồi chạy lại.</td></tr><tr><td>Không nhận OTP</td><td>Dùng email thật; xem Spam; kiểm tra Gmail App Password/provider và email:check. @homefix.local không nhận thư.</td></tr><tr><td>Không thấy thợ để phân công</td><td>Kiểm tra sẵn sàng, chuyên môn, khu vực, ví tối thiểu và công việc đang nhận.</td></tr><tr><td>Báo dữ liệu đã thay đổi</td><td>Tải lại chi tiết để lấy phiên bản mới, kiểm tra kết quả thao tác trước rồi thực hiện lại nếu cần.</td></tr><tr><td>Ảnh tải lên thất bại</td><td>Dùng ảnh đúng định dạng màn hình hỗ trợ, tối đa 5 MB; kiểm tra quyền ghi uploads và chọn đúng đơn.</td></tr></table>
    <h2>Khi cần hỗ trợ</h2><p>Ghi lại vai trò, mã đơn, thời điểm, thao tác vừa làm và thông báo lỗi/mã yêu cầu. Gửi qua kênh hỗ trợ của đơn vị vận hành. Không gửi mật khẩu, OTP hoặc tệp .env chứa khóa riêng.</p>
    <p>Với Desktop, đọc thông báo trong cửa sổ HomeFix. Với mã nguồn, đọc cửa sổ máy chủ. Nếu cần cập nhật cấu trúc, sao lưu rồi chạy db:init; không xóa database để thử sửa lỗi.</p>`,
  },
  {
    id: 'build',
    title: 'Biên dịch CHM, bộ cài và APK',
    keywords: ['Build', 'Biên dịch', 'CHM', 'Inno Setup', 'Android Studio'],
    body: `
    <p>Mục này dành cho người bảo trì mã nguồn. Người chỉ sử dụng ứng dụng có thể cài EXE hoặc APK đã có trong BIN.</p>
    <h2>Biên dịch hướng dẫn CHM</h2><p>Nội dung nằm trong <code>SRC/manual/topics.js</code>, trình bày ở <code>SRC/manual/manual.css</code>. Cài Microsoft HTML Help Workshop, trỏ biến HHC_PATH tới hhc.exe nếu không dùng đường dẫn mặc định, rồi chạy từ thư mục gốc:</p><pre>npm.cmd run manual:build</pre><p>Kết quả là BIN/HomeFix-User-Manual.chm, có mục lục, chỉ mục và tìm kiếm.</p>
    <h2>Biên dịch bộ cài Windows</h2><p>Cần Node x64 tương thích các thư viện native, Inno Setup 6, trình biên dịch C# của .NET Framework và các gói Microsoft có chữ ký hợp lệ: SqlLocalDB.msi, msodbcsql.msi, VC_redist.x64.exe. Đặt chúng vào .build/prerequisites hoặc truyền PrereqDir cho script.</p><pre>npm.cmd run installer:build</pre><p>Script cài bản sao thư viện production, build web, biên dịch HomeFix.exe, đưa Node và CHM vào bộ cài, rồi tạo BIN/HomeFix-Setup.exe. Không chép .env hoặc ảnh người dùng vào bộ cài.</p>
    <h2>Biên dịch APK</h2><p>Cài Android Studio, JDK 21, Android SDK Platform 36 và công cụ build Gradle theo dự án. Cấu hình SDK trên máy riêng; không đưa đường dẫn local.properties vào gói nộp.</p><pre>cd SRC
npm.cmd ci
npm.cmd run mobile:sync
cd frontend/android
.\\gradlew.bat assembleDebug</pre><p>APK nằm ở app/build/outputs/apk/debug/app-debug.apk. Bản debug dùng thực hành; phát hành qua cửa hàng cần cấu hình ký release bằng khóa riêng, lưu khóa ngoài source. Sau khi build, thử cài và kiểm tra kết nối trên điện thoại thật.</p>
    <h2>Định dạng code</h2><p>Từ thư mục gốc chạy <code>npm.cmd run format:check</code> để kiểm tra, <code>npm.cmd run format</code> để định dạng. SQL trong database và chuỗi truy vấn backend cần giữ đúng tham số, ràng buộc và nghiệp vụ khi sửa.</p>`,
  },
];
