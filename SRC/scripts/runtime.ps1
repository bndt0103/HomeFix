$ErrorActionPreference='Stop'
function Find-HomeFixNode {
 $cmd=Get-Command node.exe -ErrorAction SilentlyContinue
 if($cmd){return $cmd.Source}
 $bundled=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
 if(Test-Path -LiteralPath $bundled){return $bundled}
 throw 'Chua co Node.js. Cai Node.js 24 LTS x64 tu https://nodejs.org/en/download roi mo lai file nay.'
}
$homeFixNode=Find-HomeFixNode
$env:PATH="$(Split-Path -Parent $homeFixNode);$env:PATH"
$srcRoot=Split-Path -Parent $PSScriptRoot
$projectRoot=Split-Path -Parent $srcRoot
function Invoke-HomeFixNpm([string[]]$NpmArgs) {
 $npm=Get-Command npm.cmd -ErrorAction SilentlyContinue
 if($npm){& $npm.Source @NpmArgs}
 else {
  $portable=Join-Path $projectRoot '_work/package/bin/npm-cli.js'
  if(!(Test-Path -LiteralPath $portable)){throw 'Can cai Node.js 24 LTS kem npm tren may nay, sau do chay lai.'}
  & $homeFixNode $portable @NpmArgs
 }
 if($LASTEXITCODE -ne 0){throw ('Lenh npm that bai. Ma loi: '+$LASTEXITCODE)}
}
