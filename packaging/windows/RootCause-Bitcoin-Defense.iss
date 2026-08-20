; ---------------------------------------------------------------------------
;  Instalador de escritorio - RootCause Bitcoin Defense
;
;  Instala POR USUARIO (sin permisos de administrador) la carpeta portable ya
;  ensamblada por packaging/windows/build-portable.ps1, junto con su motor
;  Node.js verificado por SHA-256.
;
;  Compilar:
;      powershell -File packaging/windows/build-portable.ps1
;      powershell -File packaging/windows/make-icon.ps1
;      iscc packaging/windows/RootCause-Bitcoin-Defense.iss
;
;  Los datos del usuario NUNCA viven junto al programa: se guardan cifrados en
;  %LOCALAPPDATA%\RootCause\bitcoin-defense y sobreviven a la desinstalacion.
; ---------------------------------------------------------------------------

#define AppName "RootCause Bitcoin Defense"
#define AppPublisher "Vladimir Acuna"
#define AppUrl "https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense"
#define AppExeName "RootCause Bitcoin Defense.cmd"
#define SourceRoot "..\..\build\portable\RootCause-Bitcoin-Defense"

#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

[Setup]
AppId={{8E2C6B4A-9F1D-4C7E-B3A5-1D6F0A2E7C94}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppUrl}
AppSupportURL={#AppUrl}/blob/main/SECURITY.md
AppUpdatesURL={#AppUrl}/releases
VersionInfoVersion={#AppVersion}
VersionInfoDescription=Defensa watch-only y analisis causal para Bitcoin

; Instalacion por usuario: no pide UAC y no toca Archivos de programa.
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
DisableDirPage=auto
AllowNoIcons=yes
UninstallDisplayName={#AppName}
UninstallDisplayIcon={app}\rootcause.ico

OutputDir=..\..\build\installer
OutputBaseFilename=RootCause-Bitcoin-Defense-{#AppVersion}-win-x64-setup
SetupIconFile=rootcause.ico
WizardStyle=modern
Compression=lzma2/max
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

LicenseFile=..\..\LICENSE
InfoBeforeFile=informacion-antes.txt

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#SourceRoot}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "rootcause.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\rootcause.ico"; WorkingDir: "{app}"; Comment: "Panel local watch-only de defensa Bitcoin"
Name: "{group}\Generar clave de datos"; Filename: "{app}\Generar clave de datos.cmd"; IconFilename: "{app}\rootcause.ico"; WorkingDir: "{app}"
Name: "{group}\Leeme"; Filename: "{app}\LEEME.txt"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\rootcause.ico"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Abrir el panel ahora"; Flags: postinstall nowait skipifsilent shellexec

[UninstallDelete]
; Solo el programa. La carpeta de datos del usuario se conserva a proposito:
; borrar estado cifrado sin preguntar seria una perdida irreversible.
Type: filesandordirs; Name: "{app}\runtime"

[Messages]
spanish.WelcomeLabel2=Esto instalara [name/ver] en tu equipo.%n%nLa aplicacion es watch-only: nunca pide semillas, passphrases ni claves privadas, y no firma ni envia transacciones. Todo se ejecuta en tu maquina.
