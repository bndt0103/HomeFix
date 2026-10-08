# HomeFix

Hệ thống đặt dịch vụ sửa chữa và bảo trì: React, Express, SQL Server và Android (Capacitor). Phiên bản 1.0.0.

## Mở ứng dụng

- **Windows:** cài [BIN/HomeFix-Setup.exe](BIN/HomeFix-Setup.exe), rồi mở biểu tượng HomeFix trên Desktop. Bộ cài kèm Node.js, SQL Server LocalDB và ODBC; giao diện nghiệp vụ mở trong trình duyệt.
- **Android:** cài [BIN/HomeFix-Android.apk](BIN/HomeFix-Android.apk), chọn **Cài đặt kết nối**, nhập địa chỉ API của máy chủ rồi đăng nhập.
- **Hướng dẫn đầy đủ:** mở [BIN/HomeFix-User-Manual.chm](BIN/HomeFix-User-Manual.chm). Tài liệu có mục lục, chỉ mục và tìm kiếm; bao gồm cài đặt, local, online, máy chủ, APK và nghiệp vụ từng vai trò.

Bộ cài EXE trên GitHub được lưu bằng Git LFS. Khi lấy dự án bằng Git, cài [Git LFS](https://git-lfs.com/) rồi chạy:

```powershell
git lfs install
git clone https://github.com/bndt0103/HomeFix.git
```

Nếu đã clone, chạy `git lfs pull` trong thư mục dự án để tải bộ cài đầy đủ. Nếu tải ZIP source từ GitHub mà EXE chỉ là tệp văn bản nhỏ, tải riêng [bộ cài EXE](https://github.com/bndt0103/HomeFix/raw/refs/heads/main/BIN/HomeFix-Setup.exe). ZIP nộp bài được tạo bằng `package:source` chứa EXE đầy đủ khi đã tải Git LFS.

Khách dùng thử: `kh@homefix.local` / `HomeFix@123`. Các vai trò khác: `ktv`, `dpv`, `cskh`, `kt`, `admin`, `gd` tại `@homefix.local`, cùng mật khẩu khi khởi tạo database mới. Tài khoản đã tồn tại giữ nguyên mật khẩu hiện tại. Đăng ký và khôi phục mật khẩu bằng OTP cần cấu hình email thật theo CHM.

## Chạy mã nguồn

Cài Node.js từ 22.12 trở lên (nên dùng 24 LTS x64), SQL Server 2022/2025 và ODBC Driver 17/18 x64 khi dùng xác thực Windows. Giải nén dự án vào thư mục có quyền ghi.

Chạy `CAI_DAT.bat` để cài thư viện, tạo cấu hình riêng, khởi tạo database và build giao diện. Sau đó chạy `CHAY_HOMEFIX.bat`, mở `http://localhost:3000`.

Hoặc chạy từ thư mục gốc:

```powershell
npm.cmd run install:all
node SRC/scripts/configure-env.js "DB_SERVER=localhost\SQLEXPRESS"
npm.cmd run db:init
npm.cmd run build
npm.cmd start
```

Sửa `SRC/backend/.env` theo SQL Server thực tế. Không có tệp example; script tự tạo cấu hình và khóa JWT mới, giữ nguyên tệp đã có. `db:init` tạo schema, áp dụng cập nhật và dữ liệu ban đầu, không xóa database hoặc đặt lại tài khoản đã có. Chọn database mới nếu đang dùng cấu trúc HomeFix cũ không tương thích.

Để phát triển: `npm.cmd run dev`, mở `http://localhost:5173`. Giữ cửa sổ máy chủ hoạt động; Ctrl+C để dừng.

## Chạy online

Mở `CHAY_ONLINE.bat` hoặc chạy:

```powershell
npm.cmd run online:setup
npm.cmd run online
```

Chờ dòng `HOMEFIX ONLINE:` rồi chia sẻ link HTTPS. Website và APK dùng chung database của máy chủ. Máy chủ phải luôn bật; link demo có thể đổi khi chạy lại. Android nhập `LINK-HTTPS/api`. Dùng `npm.cmd run online:status` để kiểm tra, `npm.cmd run online:stop` để dừng. Triển khai domain cố định được hướng dẫn trong CHM.

## Mã nguồn và đóng gói

| Vị trí | Nội dung |
| --- | --- |
| `SRC/backend/src` | API, phân quyền và nghiệp vụ |
| `SRC/frontend/src` | Giao diện web và mobile |
| `SRC/frontend/android` | Dự án Android và Gradle wrapper |
| `SRC/database` | Schema, thủ tục, trigger và các cập nhật SQL đang sử dụng |
| `SRC/scripts` | Cài đặt, chạy, cập nhật dữ liệu và biên dịch |
| `SRC/manual` | Mã nguồn nội dung và giao diện CHM |
| `SRC/installer` | Mã launcher Windows và cấu hình Inno Setup |
| `BIN` | Bộ cài EXE, APK và user manual CHM |

`npm.cmd run format` định dạng code; `npm.cmd run format:check` kiểm tra. Dự án chỉ dùng một `.gitignore` tại thư mục gốc.

Biên dịch CHM: `npm.cmd run manual:build` (HTML Help Workshop; có thể đặt `HHC_PATH`). Biên dịch bộ cài: `npm.cmd run installer:build` (Inno Setup, C#/.NET Framework và các gói Microsoft trong `.build/prerequisites`). Build APK: trong `SRC` chạy `npm.cmd run mobile:sync`, rồi chạy `gradlew.bat assembleDebug` trong `frontend/android` với JDK 21 và Android SDK 36. Chi tiết nằm trong CHM.

Bản source không kèm thư viện, cache, tài liệu nhóm, lịch sử làm việc hoặc cấu hình riêng. Cài thư viện bằng `npm ci`. Giấy phép thành phần được giữ ở [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt).

Chạy `npm.cmd run package:source` để tạo `HomeFix-Submission.zip` gồm source, README, giấy phép, EXE, APK và CHM. Script tự loại Git, thư viện, cache, `.env`, khóa riêng và ảnh người dùng khỏi ZIP.
