$ErrorActionPreference = 'Stop'
$srcRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $srcRoot
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (!$nodeCommand) { throw 'Chưa có Node.js. Cài Node.js 24 LTS x64 kèm npm, rồi mở lại.' }
$homeFixNode = $nodeCommand.Source
function Invoke-HomeFixNpm([string[]]$NpmArgs) {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (!$npmCommand) { throw 'Chưa có npm. Cài lại Node.js và chọn thành phần npm.' }
    & $npmCommand.Source @NpmArgs
    if ($LASTEXITCODE -ne 0) { throw ('Lệnh npm thất bại. Mã lỗi: ' + $LASTEXITCODE) }
}
