. "$PSScriptRoot/runtime.ps1"
Push-Location $srcRoot
try {
 Invoke-HomeFixNpm -NpmArgs @('run','online:setup')
 Invoke-HomeFixNpm -NpmArgs @('run','online')
} finally { Pop-Location }
