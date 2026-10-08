#define AppVersion "1.0.0"
#ifndef StageDir
  #define StageDir "..\..\.build\stage"
#endif
#ifndef PrereqDir
  #define PrereqDir "..\..\.build\prerequisites"
#endif

[Setup]
AppId={{17DB28C5-35AE-4944-A70D-216E7F1848DE}
AppName=HomeFix
AppVersion={#AppVersion}
AppPublisher=HomeFix
DefaultDirName={autopf}\HomeFix
DefaultGroupName=HomeFix
OutputDir=..\..\BIN
OutputBaseFilename=HomeFix-Setup
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=commandline
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\HomeFix.exe
CloseApplications=yes
LicenseFile={#StageDir}\THIRD_PARTY_LICENSES.txt

[Tasks]
Name: desktopicon; Description: "Tạo biểu tượng HomeFix trên Desktop"; Flags: checkedonce

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#PrereqDir}\VC_redist.x64.exe"; Flags: dontcopy
Source: "{#PrereqDir}\SqlLocalDB.msi"; Flags: dontcopy
Source: "{#PrereqDir}\msodbcsql.msi"; Flags: dontcopy

[Icons]
Name: "{group}\HomeFix"; Filename: "{app}\HomeFix.exe"
Name: "{group}\Hướng dẫn sử dụng"; Filename: "{app}\HomeFix-User-Manual.chm"
Name: "{group}\Gỡ cài đặt HomeFix"; Filename: "{uninstallexe}"
Name: "{autodesktop}\HomeFix"; Filename: "{app}\HomeFix.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\HomeFix.exe"; Description: "Mở HomeFix"; Flags: nowait postinstall skipifsilent runasoriginaluser

[Code]
function InstallPackage(const FileName, Args: String; var NeedsRestart: Boolean): String;
var Code: Integer; ProgramName, Parameters: String;
begin
  Result := '';
  ExtractTemporaryFile(FileName);
  if ExtractFileExt(FileName) = '.msi' then begin
    ProgramName := ExpandConstant('{sys}\msiexec.exe');
    Parameters := '/i "' + ExpandConstant('{tmp}\') + FileName + '" /qn /norestart ' + Args;
  end else begin
    ProgramName := ExpandConstant('{tmp}\') + FileName;
    Parameters := Args;
  end;
  if not Exec(ProgramName, Parameters, '', SW_HIDE, ewWaitUntilTerminated, Code) then
    Result := 'Không chạy được bộ cài thành phần: ' + FileName
  else if Code = 3010 then NeedsRestart := True
  else if (Code <> 0) and (Code <> 1638) then
    Result := 'Cài thành phần thất bại: ' + FileName + '. Mã lỗi: ' + IntToStr(Code);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var Installed: Cardinal;
begin
  Result := '';
  if not (RegQueryDWordValue(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed) and (Installed = 1)) then begin
    Result := InstallPackage('VC_redist.x64.exe', '/install /quiet /norestart', NeedsRestart);
    if Result <> '' then Exit;
  end;
  if not (FileExists(ExpandConstant('{pf64}\Microsoft SQL Server\170\Tools\Binn\SqlLocalDB.exe')) or
          FileExists(ExpandConstant('{pf64}\Microsoft SQL Server\160\Tools\Binn\SqlLocalDB.exe'))) then begin
    Result := InstallPackage('SqlLocalDB.msi', 'IACCEPTSQLLOCALDBLICENSETERMS=YES', NeedsRestart);
    if Result <> '' then Exit;
  end;
  if not RegKeyExists(HKLM64, 'SOFTWARE\ODBC\ODBCINST.INI\ODBC Driver 18 for SQL Server') then
    Result := InstallPackage('msodbcsql.msi', 'IACCEPTMSODBCSQLLICENSETERMS=YES ADDLOCAL=ALL', NeedsRestart);
end;
