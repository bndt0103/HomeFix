. "$PSScriptRoot/runtime.ps1"
Push-Location $srcRoot
try {
    Write-Host 'HOMEFIX - CÀI ĐẶT LẦN ĐẦU' -ForegroundColor Green
    $nodeVersion = & $homeFixNode -p 'process.versions.node'
    if ([version]$nodeVersion -lt [version]'22.12.0') { throw 'Cần Node.js 22.12 trở lên; nên dùng 24 LTS x64.' }
    if (!(Test-Path 'node_modules/express')) { Invoke-HomeFixNpm @('ci') }
    $drivers = @(Get-OdbcDriver -Platform '64-bit' | Where-Object Name -Match '^ODBC Driver (17|18) for SQL Server$')
    if (!$drivers.Count) { throw 'Cài ODBC Driver 17 hoặc 18 x64. Xem mục Cài mã nguồn trong HomeFix-User-Manual.chm.' }
    $driver = if ($drivers.Name -contains 'ODBC Driver 18 for SQL Server') { 'ODBC Driver 18 for SQL Server' } else { 'ODBC Driver 17 for SQL Server' }
    $server = 'localhost'
    if (!(Get-Service MSSQLSERVER -ErrorAction SilentlyContinue) -and (Get-Service 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue)) { $server = 'localhost\SQLEXPRESS' }
    & $homeFixNode scripts/configure-env.js "DB_SERVER=$server" "DB_ODBC_DRIVER=$driver"
    if ($LASTEXITCODE -ne 0) { throw 'Không tạo được cấu hình.' }
    & $homeFixNode scripts/init-db.js
    if ($LASTEXITCODE -ne 0) { throw 'Kiểm tra SQL Server và DB_SERVER trong SRC/backend/.env, rồi chạy lại. Xem CHM để xử lý lỗi.' }
    Invoke-HomeFixNpm @('run', 'build')
    Write-Host 'CÀI ĐẶT THÀNH CÔNG. Mở CHAY_HOMEFIX.bat để bắt đầu.' -ForegroundColor Green
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 } finally { Pop-Location }
