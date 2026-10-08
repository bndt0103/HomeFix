param(
    [string]$PrereqDir,
    [string]$IsccPath,
    [string]$NodePath
)
$ErrorActionPreference = 'Stop'
$srcRoot = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $srcRoot
$buildRoot = Join-Path $root '.build'
$stage = Join-Path $buildRoot 'stage'
if (!$PrereqDir) { $PrereqDir = Join-Path $buildRoot 'prerequisites' }
if (!$IsccPath) {
    $IsccPath = Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6/ISCC.exe'
    if (!(Test-Path $IsccPath)) { $IsccPath = Join-Path $buildRoot 'inno/ISCC.exe' }
}
if (!$NodePath) { $NodePath = (Get-Command node.exe).Source }
if (!(Test-Path $IsccPath)) { throw 'Chưa có Inno Setup. Cài Inno Setup 6 hoặc truyền IsccPath.' }
foreach ($file in @('SqlLocalDB.msi', 'msodbcsql.msi', 'VC_redist.x64.exe')) {
    $package = Join-Path $PrereqDir $file
    if (!(Test-Path $package)) { throw ('Thiếu thành phần: ' + $package) }
    $signature = Get-AuthenticodeSignature $package
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Microsoft Corporation') { throw ('Chữ ký Microsoft không hợp lệ: ' + $file) }
}
if (!(Test-Path (Join-Path $root 'BIN/HomeFix-User-Manual.chm'))) { throw 'Biên dịch CHM trước bằng npm run manual:build.' }
if (Test-Path -LiteralPath $stage) {
    $resolvedStage = (Resolve-Path -LiteralPath $stage).Path
    if (!$resolvedStage.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Thư mục đóng gói nằm ngoài dự án.' }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stage,(Join-Path $stage 'SRC/backend'),(Join-Path $stage 'SRC/frontend'),(Join-Path $stage 'runtime') | Out-Null
Push-Location $srcRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Build giao diện thất bại.' }
    Copy-Item -LiteralPath backend/src -Destination (Join-Path $stage 'SRC/backend') -Recurse
    Copy-Item -LiteralPath backend/package.json -Destination (Join-Path $stage 'SRC/backend/package.json')
    Copy-Item -LiteralPath database -Destination (Join-Path $stage 'SRC') -Recurse
    New-Item -ItemType Directory -Path (Join-Path $stage 'SRC/scripts') | Out-Null
    foreach ($file in @('init-db.js', 'configure-env.js', 'service-catalog.js')) { Copy-Item -LiteralPath (Join-Path 'scripts' $file) -Destination (Join-Path $stage 'SRC/scripts') }
    Copy-Item -LiteralPath frontend/dist -Destination (Join-Path $stage 'SRC/frontend') -Recurse
    $production = Join-Path $buildRoot 'production'
    New-Item -ItemType Directory -Force -Path $production | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $production 'backend'),(Join-Path $production 'frontend') | Out-Null
    foreach ($file in @('package.json', 'package-lock.json', 'backend/package.json', 'frontend/package.json')) {
        Copy-Item -LiteralPath $file -Destination (Join-Path $production $file) -Force
    }
    & npm.cmd ci --prefix $production --omit=dev --workspace backend --include-workspace-root --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Cài thư viện production thất bại.' }
    Copy-Item -LiteralPath (Join-Path $production 'node_modules') -Destination (Join-Path $stage 'SRC') -Recurse
    [IO.File]::WriteAllText((Join-Path $stage 'SRC/package.json'), '{"name":"homefix-runtime","version":"1.0.0","type":"module","private":true}', (New-Object Text.UTF8Encoding($false)))
} finally { Pop-Location }
Copy-Item -LiteralPath $NodePath -Destination (Join-Path $stage 'runtime/node.exe')
$nodeLicense = Join-Path (Split-Path -Parent $NodePath) 'LICENSE'
if (Test-Path $nodeLicense) {
    Copy-Item -LiteralPath $nodeLicense -Destination (Join-Path $stage 'runtime/NODE_LICENSE.txt')
} else {
    $nodeVersion = & $NodePath -p 'process.versions.node'
    if ($nodeVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Phiên bản Node không hợp lệ.' }
    $licenseUrl = 'https://raw.githubusercontent.com/nodejs/node/v' + $nodeVersion + '/LICENSE'
    Invoke-WebRequest -Uri $licenseUrl -OutFile (Join-Path $stage 'runtime/NODE_LICENSE.txt') -UseBasicParsing
}
Copy-Item -LiteralPath (Join-Path $root 'THIRD_PARTY_LICENSES.txt') -Destination $stage
Copy-Item -LiteralPath (Join-Path $root 'BIN/HomeFix-User-Manual.chm') -Destination $stage
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (!(Test-Path $compiler)) { throw 'Chưa có trình biên dịch C# của .NET Framework 4 x64.' }
& $compiler /nologo /target:winexe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll (('/out:' + (Join-Path $stage 'HomeFix.exe'))) (Join-Path $srcRoot 'installer/HomeFix.cs')
if ($LASTEXITCODE -ne 0) { throw 'Biên dịch HomeFix.exe thất bại.' }
& $IsccPath /Q ('/DStageDir=' + $stage) ('/DPrereqDir=' + $PrereqDir) (Join-Path $srcRoot 'installer/HomeFix.iss')
if ($LASTEXITCODE -ne 0) { throw 'Biên dịch bộ cài thất bại.' }
Write-Host ('Đã tạo bộ cài: ' + (Join-Path $root 'BIN/HomeFix-Setup.exe')) -ForegroundColor Green
