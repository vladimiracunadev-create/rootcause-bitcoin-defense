# Problemas comunes

Ordenado por dónde te atascaste. Cada caso trae el síntoma exacto, la causa y el
comando que lo confirma.

---

## La aplicación de Windows

### Windows dice que el archivo no es seguro / SmartScreen lo bloquea

**Esperado.** Los binarios no están firmados con certificado de código todavía.
Antes de saltarte el aviso, verifica el hash:

~~~powershell
Get-FileHash .\RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe -Algorithm SHA256
~~~

Compáralo con `SHA256SUMS.txt` del release. **Si no coincide, no lo ejecutes** y
abre un aviso de seguridad. Si coincide: *Más información* → *Ejecutar de todas
formas*.

### La ventana negra aparece y se cierra al instante

Algo abortó el arranque. Para ver el motivo, ejecuta el lanzador desde una
consola que no se cierre:

~~~powershell
cd "$env:LOCALAPPDATA\Programs\RootCause Bitcoin Defense"
.\runtime\node.exe .\src\server.js
~~~

Causas habituales:

| Mensaje | Causa | Solución |
|---|---|---|
| `ROOTCAUSE_DATA_KEY is required` | `DEMO_MODE=false` sin clave | Genera la clave y ponla en `config.cmd` |
| `EADDRINUSE` | El puerto 8787 está ocupado | `set "PORT=8790"` en `config.cmd` |
| `ENOENT ... config/advisories.json` | Instalación incompleta | Reinstala; verifica el hash del instalador |

### El navegador no se abre solo

El panel probablemente **sí** está corriendo: abre `http://127.0.0.1:8787` a
mano. La apertura automática requiere `ROOTCAUSE_OPEN_BROWSER=1` (que el
lanzador pone) y un bind loopback; si cambiaste `HOST`, la apertura se desactiva
a propósito.

### ¿Cómo lo detengo?

Cierra la ventana de consola. Si quedó un proceso huérfano:

~~~powershell
Get-Process node | Where-Object { $_.Path -like "*RootCause*" } | Stop-Process
~~~

### Actualicé y perdí mis datos

No los perdiste: viven fuera del programa, en
`%LOCALAPPDATA%\RootCause\bitcoin-defense`. Comprueba que `config.cmd` sigue
ahí con la clave correcta; sin la clave adecuada el estado no se descifra.

---

## El panel local (desde el código)

### `corepack: command not found` o pnpm no resuelve

No hace falta ninguno: el proyecto no tiene dependencias.

~~~bash
node src/server.js
node --test
~~~

### `Error: ROOTCAUSE_DATA_KEY is required when DEMO_MODE=false`

Es intencionado: la aplicación prefiere no arrancar antes que guardar tu estado
sin cifrar.

~~~bash
pnpm generate:data-key
DEMO_MODE=false ROOTCAUSE_DATA_KEY="valor" pnpm start
~~~

### El panel carga pero sale vacío

Estás en modo persistente con estado vacío, que es lo correcto la primera vez:
el modo demostración es el único que trae datos ficticios. Registra una wallet
en *Custodia* o arranca con `DEMO_MODE=true` para explorar.

### `Unsupported engine` o errores de sintaxis raros

Node antiguo. Hace falta 22.12 o superior:

~~~bash
node --version
~~~

---

## La API

### Todo `POST` devuelve `403 MUTATION_HEADER_REQUIRED`

Falta la cabecera. Es una defensa contra peticiones lanzadas desde otra pestaña:

~~~bash
curl -X POST http://127.0.0.1:8787/api/scan \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"
~~~

### `403 CROSS_SITE_REQUEST_REJECTED`

La petición llegó con `sec-fetch-site: cross-site`. Correcto: significa que algo
fuera del panel intentó mutar estado.

### `415`

Falta `content-type: application/json`.

### `422 SECRET_MATERIAL_REJECTED`

**No es un error, es el producto funcionando.** El cuerpo contenía un campo con
nombre prohibido (`seed`, `mnemonic`, `passphrase`, `wif`, `xprv`…) o una cadena
con forma de clave privada. Quita ese campo: la aplicación no lo necesita para
nada.

Ojo: la comprobación es a cualquier profundidad y normaliza el nombre, así que
`Seed_Words`, `recovery-phrase` o `walletBackup` también se rechazan.

### `400 REQUEST_REJECTED` al registrar una wallet

Validación de esquema. Los tropiezos frecuentes:

| Mensaje | Qué espera |
|---|---|
| `signer.seedOrigin has an unsupported value` | `device`, `dice`, `external` o `unknown` |
| `quorum must match the signer list` | `quorum.total` igual al número de firmantes |
| `fingerprint` | 8 caracteres hexadecimales |
| `signers must contain between one and five` | Entre 1 y 5 firmantes |

### `429`

Superaste `RATE_LIMIT_PER_MINUTE` (120 por defecto).

---

## Bitcoin Core

### `BTC-NODE-001` con `Remote Bitcoin RPC is disabled`

La URL apunta fuera de loopback. Es deliberado. Usa un túnel SSH hacia
`127.0.0.1` o, si sabes lo que haces y el canal está cifrado, `ALLOW_REMOTE_RPC=true`.

### `Invalid Bitcoin Core cookie file`

El archivo `.cookie` debe contener `usuario:contraseña`. Comprueba ruta y
permisos de lectura. En Windows suele estar en
`%APPDATA%\Bitcoin\.cookie`; en Linux, `~/.bitcoin/.cookie`.

### `Do not place Bitcoin RPC credentials inside the URL`

Nada de `http://usuario:clave@127.0.0.1:8332`. Usa cookie o las variables
`BITCOIN_RPC_USER` / `BITCOIN_RPC_PASSWORD`.

### El nodo responde pero el panel no muestra datos

El watchtower está apagado por defecto. Enciéndelo con
`WATCHTOWER_ENABLED=true` o pulsa el botón de consultar nodo en el panel.

---

## Desarrollo y CI

### `pnpm check` falla en `check-local-only`

Alguien añadió una dependencia, un import externo o una referencia remota. El
mensaje dice cuál y en qué archivo. Es el guardián del claim principal del
proyecto: no lo silencies.

### `pnpm check` falla en `check-security-claims`

Una promesa dejó de cumplirse. El informe nombra el invariante exacto. **Este
fallo nunca se arregla ajustando el test**: se arregla en el código.

### `validate-repo` dice `Version desincronizada`

`package.json` y la versión que devuelve `/api/health` en `src/api/router.js` no
coinciden. Actualiza ambas.

### `validate-repo` dice `Potential embedded private material`

Hay algo con forma de `xprv`/`tprv` o de clave PEM en un archivo versionado. Si
es un vector de prueba legítimo, constrúyelo concatenando en tiempo de
ejecución, como hace `scripts/check-security-claims.js`.

### El job `app-windows` falla al comprimir

`node.exe` queda bloqueado unos segundos tras la verificación de arranque. El
empaquetador reintenta cinco veces; si agota los reintentos, hay un proceso
huérfano.

---

## Nada de lo anterior

Abre un issue con: sistema operativo, `node --version`, cómo lo ejecutas
(Windows o código), el comando exacto y la salida completa. **Nunca pegues
claves, semillas ni frases de recuperación en un issue** — ni siquiera de
prueba, ni siquiera parciales.
