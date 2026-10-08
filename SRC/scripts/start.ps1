. "$PSScriptRoot/runtime.ps1"
Push-Location $srcRoot
try {
 if(!(Test-Path 'node_modules/express') -or !(Test-Path 'backend/.env') -or !(Test-Path 'frontend/dist/index.html')){throw 'Chua cai dat du. Hay chay CAI_DAT.bat truoc.'}
 $portLine=Get-Content 'backend/.env' | Where-Object {$_ -match '^PORT=([0-9]+)$'} | Select-Object -First 1
 $portNumber=if($portLine){[int]($portLine.Split('=')[1])}else{3000}
 $localUrl="http://localhost:$portNumber"
 Write-Host "HOMEFIX - WEBSITE: $localUrl" -ForegroundColor Green
 Write-Host 'API cho dien thoai (chon IP Wi-Fi cua may):'
 Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | ForEach-Object {Write-Host ("  http://"+$_.IPAddress+":"+$portNumber+"/api  ["+$_.InterfaceAlias+"]")}
 Write-Host 'Giu cua so nay mo. Nhan Ctrl+C de dung. Tai khoan: kh@homefix.local / HomeFix@123'
 try{$runningHealth=Invoke-RestMethod "$localUrl/api/health" -TimeoutSec 3}catch{$runningHealth=$null}
 if($runningHealth -and $runningHealth.data.status -eq 'ok'){Write-Host 'HomeFix da dang chay. Mo dia chi website phia tren.';exit 0}
 $inUse=Get-NetTCPConnection -LocalPort $portNumber -State Listen -ErrorAction SilentlyContinue
 if($inUse){
  try{$health=Invoke-RestMethod "$localUrl/api/health" -TimeoutSec 3}catch{throw "Cong $portNumber dang duoc ung dung khac su dung. Doi PORT trong backend/.env."}
  if($health.data.status -eq 'ok'){Write-Host 'HomeFix da dang chay. Mo dia chi website phia tren.';exit 0}
  throw "Cong $portNumber dang ban."
 }
 & $homeFixNode backend/src/server.js
 if($LASTEXITCODE -ne 0){throw 'May chu da dung voi loi. Xem thong bao phia tren va muc xu ly loi trong huong dan.'}
}catch{Write-Host $_.Exception.Message -ForegroundColor Red;exit 1}finally{Pop-Location}
