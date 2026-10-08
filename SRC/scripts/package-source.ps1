param([string]$Destination)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (!$Destination) { $Destination = Join-Path $root 'HomeFix-Submission.zip' }
$Destination = [IO.Path]::GetFullPath($Destination)
if (!$Destination.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Tệp ZIP phải nằm trong thư mục dự án.' }
foreach ($file in @('HomeFix-Setup.exe', 'HomeFix-Android.apk', 'HomeFix-User-Manual.chm')) {
    if (!(Test-Path -LiteralPath (Join-Path $root ('BIN/' + $file)))) { throw ('Thiếu bản đóng gói: ' + $file) }
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Force }
$stream = [IO.File]::Open($Destination, [IO.FileMode]::CreateNew)
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
$count = 0
function Add-SourceFile([string]$File) {
    $relative = $File.Substring($root.Length + 1).Replace('\', '/')
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $File, ('HomeFix/' + $relative), [IO.Compression.CompressionLevel]::Optimal)
    $script:count++
}
function Add-SourceDirectory([string]$Directory) {
    foreach ($item in Get-ChildItem -LiteralPath $Directory -Force) {
        $relative = $item.FullName.Substring($root.Length + 1).Replace('\', '/')
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
        if ($item.PSIsContainer) {
            if ($item.Name -in @('node_modules', 'dist', 'build', '.gradle', '.cxx', '.externalNativeBuild', '.idea', '.vscode', '__pycache__', 'uploads', 'capacitor-cordova-android-plugins')) { continue }
            if ($relative -eq 'SRC/frontend/android/app/src/main/assets') { continue }
            Add-SourceDirectory $item.FullName
        } else {
            if ($item.Name -eq '.gitignore' -or $item.Name -like '.env*' -or $item.Name -eq 'local.properties' -or $item.Name -eq 'online-url.txt' -or $item.Extension -in @('.log', '.tmp', '.bak', '.jks', '.keystore', '.p12', '.zip')) { continue }
            if ($relative -eq 'SRC/frontend/android/app/src/main/res/xml/config.xml') { continue }
            Add-SourceFile $item.FullName
        }
    }
}
try {
    foreach ($name in @('.gitignore', '.gitattributes', '.prettierrc.json', '.prettierignore', 'README.md', 'THIRD_PARTY_LICENSES.txt', 'package.json', 'CAI_DAT.bat', 'CHAY_HOMEFIX.bat', 'CHAY_ONLINE.bat')) { Add-SourceFile (Join-Path $root $name) }
    Add-SourceDirectory (Join-Path $root 'SRC')
    foreach ($name in @('HomeFix-Setup.exe', 'HomeFix-Android.apk', 'HomeFix-User-Manual.chm')) { Add-SourceFile (Join-Path $root ('BIN/' + $name)) }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Host ('Đã tạo ZIP: ' + $Destination + ' (' + $count + ' tệp)') -ForegroundColor Green
