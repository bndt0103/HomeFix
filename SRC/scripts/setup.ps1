. "$PSScriptRoot/runtime.ps1"
Push-Location $srcRoot
try {
 Write-Host 'HOMEFIX - CAI DAT LAN DAU' -ForegroundColor Green
 $nodeVersion=& $homeFixNode -p 'process.versions.node'
 if([version]$nodeVersion -lt [version]'22.12.0'){throw 'Can Node.js 22.12 tro len; khuyen dung 24 LTS x64.'}
 if(!(Test-Path 'node_modules/express')){Invoke-HomeFixNpm @('ci')}
 $drivers=@(Get-OdbcDriver -Platform '64-bit' -ErrorAction SilentlyContinue | Where-Object {$_.Name -match '^ODBC Driver (17|18) for SQL Server$'})
 if(!$drivers.Count){throw 'Can cai Microsoft ODBC Driver 17 hoac 18 for SQL Server (x64). Xem HUONG_DAN_CAI_DAT.md muc 2.'}
 if(!(Test-Path 'backend/.env')){
  $rng=[System.Security.Cryptography.RandomNumberGenerator]::Create();$secretBytes=New-Object byte[] 48;$rng.GetBytes($secretBytes);$rng.Dispose()
  $secret=[Convert]::ToBase64String($secretBytes)
  $template=Get-Content 'backend/.env.example' -Raw
  $template=$template.Replace('replace-with-a-random-value-at-least-32-characters',$secret)
  if(!($drivers | Where-Object Name -eq 'ODBC Driver 17 for SQL Server')){$template=$template.Replace('ODBC Driver 17 for SQL Server','ODBC Driver 18 for SQL Server')}
  if(!(Get-Service -Name MSSQLSERVER -ErrorAction SilentlyContinue)){
   if(Get-Service -Name 'MSSQL$SQLEXPRESS' -ErrorAction SilentlyContinue){$template=$template.Replace('DB_SERVER=localhost','DB_SERVER=localhost\SQLEXPRESS')}
  }
  [IO.File]::WriteAllText((Join-Path $srcRoot 'backend/.env'),$template,(New-Object Text.UTF8Encoding($false)))
 }
 & $homeFixNode scripts/init-db.js
 if($LASTEXITCODE -ne 0){throw 'Chua ket noi duoc SQL Server. Xem HUONG_DAN_CAI_DAT.md, sua DB_SERVER trong SRC/backend/.env roi chay lai. Khong xoa CSDL.'}
 Push-Location frontend
 try {& $homeFixNode ../node_modules/vite/bin/vite.js build;if($LASTEXITCODE -ne 0){throw 'Build giao dien that bai.'}} finally {Pop-Location}
 Write-Host 'CAI DAT THANH CONG. Mo CHAY_HOMEFIX.bat de bat dau.' -ForegroundColor Green
}catch{Write-Host $_.Exception.Message -ForegroundColor Red;exit 1}finally{Pop-Location}
