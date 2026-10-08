$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$toolDir = Join-Path $projectDir '.runtime/tools'
New-Item -ItemType Directory -Force -Path $toolDir | Out-Null
$destination = Join-Path $toolDir 'cloudflared.exe'
$download = Join-Path $toolDir 'cloudflared.download'
# Kiểm tra phiên bản và mã SHA256 trước khi dùng công cụ tải về.
$version = '2026.9.3'
$downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/download/2026.9.3/cloudflared-windows-amd64.exe'
$expectedHash = 'f096265ec2fcbe9bb6e2d64268db167ced3fcbb83d894bdb9e2fcdb26f2ea7e2'
if ((Test-Path $destination) -and (Get-FileHash $destination -Algorithm SHA256).Hash -eq $expectedHash) {
 Write-Host 'cloudflared da san sang.'
 exit 0
}
Write-Host ('Dang tai cloudflared ' + $version + ' tu Cloudflare/GitHub...')
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest $downloadUrl -OutFile $download -UseBasicParsing
if ((Get-FileHash $download -Algorithm SHA256).Hash -ne $expectedHash) { throw 'SHA256 khong khop. Khong su dung file vua tai.' }
Move-Item -LiteralPath $download -Destination $destination -Force
& $destination --version
if ($LASTEXITCODE -ne 0) { throw 'Khong chay duoc cloudflared.' }
