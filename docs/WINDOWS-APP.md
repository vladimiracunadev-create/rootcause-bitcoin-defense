# Aplicación de Windows

RootCause Bitcoin Defense se distribuye como aplicación de escritorio para
Windows en dos formatos, ambos con el mismo contenido:

| Formato | Archivo | Cuándo usarlo |
| --- | --- | --- |
| Instalador | `RootCause-Bitcoin-Defense-<versión>-win-x64-setup.exe` | Uso normal. Instala por usuario, sin permisos de administrador, y crea accesos directos. |
| Portable | `RootCause-Bitcoin-Defense-<versión>-win-x64-portable.zip` | Equipos donde no se instala software, auditoría, o uso desde una unidad extraíble. |

Ninguno de los dos requiere tener Node.js instalado: el motor oficial viaja
dentro, verificado por SHA-256 contra `SHASUMS256.txt` de nodejs.org en el
momento de empaquetar. El hash queda registrado en `BUILD-INFO.json`, dentro del
propio paquete.

## 🖥️ Qué ve el usuario

1. Ejecuta **RootCause Bitcoin Defense** (acceso directo o `.cmd`).
2. Se abre una ventana de consola con la dirección del panel y se lanza el
   navegador por defecto en `http://127.0.0.1:8787`.
3. Cierra la ventana de consola para detener la aplicación.

El navegador se abre solo si la variable `ROOTCAUSE_OPEN_BROWSER` vale `1`, cosa
que hace el lanzador de escritorio y nadie más. Un despliegue de servidor nunca
lanza un navegador, y la apertura se bloquea si el proceso no está escuchando en
una dirección de loopback.

## 📁 Dónde queda cada cosa

| Contenido | Ruta |
| --- | --- |
| Programa (instalado) | `%LOCALAPPDATA%\Programs\RootCause Bitcoin Defense` |
| Configuración del usuario | `%LOCALAPPDATA%\RootCause\bitcoin-defense\config.cmd` |
| Estado cifrado | `%LOCALAPPDATA%\RootCause\bitcoin-defense\data` |

El programa y los datos viven separados a propósito: desinstalar no borra el
estado cifrado, y actualizar no lo pisa.

### Configuración

`config.cmd` es un archivo de variables que el lanzador ejecuta antes de
arrancar. Ejemplo completo:

~~~bat
set "DEMO_MODE=false"
set "ROOTCAUSE_DATA_KEY=clave-generada-con-generar-clave-de-datos"
set "PORT=8787"
set "BITCOIN_RPC_URL=http://127.0.0.1:8332"
set "BITCOIN_RPC_COOKIE_FILE=C:\Users\tu-usuario\AppData\Roaming\Bitcoin\.cookie"
set "WATCHTOWER_ENABLED=true"
~~~

Si `DEMO_MODE=false` y falta `ROOTCAUSE_DATA_KEY`, el lanzador se detiene y
explica cómo generarla en vez de arrancar sin cifrado.

## 🛠️ Construir los artefactos

Requisitos: Windows con PowerShell 5.1 o superior. Para el instalador, además,
Inno Setup 6 (`choco install innosetup`).

~~~powershell
# Icono multirresolución, generado desde código
powershell -File packaging/windows/make-icon.ps1

# Edición portable: descarga y verifica node.exe, ensambla y comprime
powershell -File packaging/windows/build-portable.ps1

# Instalador (reutiliza la carpeta ensamblada por el paso anterior)
iscc /DAppVersion=0.1.0 packaging/windows/RootCause-Bitcoin-Defense.iss
~~~

Atajo para los dos primeros pasos:

~~~bash
pnpm package:windows
~~~

`build-portable.ps1` acepta `-NodeVersion 22.23.2` para fijar el runtime exacto
y hacer reproducible la compilación; sin ese parámetro resuelve la última LTS de
la rama indicada en `-NodeMajor`.

## ✅ Qué se verifica antes de publicar

Un paquete que pesa lo esperado no prueba nada. La cadena de verificación es:

1. **Al empaquetar** — `build-portable.ps1` arranca la aplicación *con el
   `node.exe` empaquetado* y ejecuta `scripts/check-security-claims.js`: si el
   paquete no sirviera el panel o dejara de rechazar material secreto, el ZIP no
   llega a crearse.
2. **En CI, cada push** — el job `app-windows` empaqueta, ejecuta el lanzador
   `.cmd` real y comprueba `/api/health`, el título del panel y que
   `/api/summary` devuelva inventario. Una aplicación que abre vacía es el fallo
   que nadie detecta a tiempo.
3. **En cada release** — el job de `release-windows.yml` instala el `.exe` en
   silencio, arranca la aplicación *instalada* y repite la comprobación de
   inventario antes de subir nada.
4. **Integridad** — `SHA256SUMS.txt` acompaña a cada release.

Para verificar una descarga:

~~~powershell
Get-FileHash .\RootCause-Bitcoin-Defense-0.1.0-win-x64-setup.exe -Algorithm SHA256
~~~

## 🗓️ Mantenimiento del runtime

Empaquetar Node significa hacerse cargo de él. Cuando Node publique una versión
de seguridad de la rama incluida, hay que republicar la aplicación aunque el
código propio no haya cambiado:

1. `powershell -File packaging/windows/build-portable.ps1 -NodeVersion <nueva>`;
2. subir la versión en `package.json` y `CHANGELOG.md`;
3. crear el tag `vX.Y.Z`; el workflow hace el resto.

El motivo de asumir este coste, y las condiciones bajo las cuales dejaría de
merecer la pena, están en [ADR-0001](ADR-0001-plataforma-y-lenguaje.md).

## ⚖️ Limitaciones conocidas

- Solo x64. No se publica compilación ARM64 todavía.
- Los binarios no están firmados con certificado de código: SmartScreen puede
  advertir en la primera ejecución. La verificación disponible hoy es el hash
  publicado.
- El instalador no registra la aplicación como servicio ni la añade al arranque:
  es deliberado, el watchtower solo corre mientras el panel está abierto.
