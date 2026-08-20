# Referencia de comandos

Todo lo que se puede ejecutar en este repositorio, con lo que devuelve y cuándo
usarlo. Nada aquí necesita instalar dependencias: no hay ninguna.

---

## Scripts del proyecto

| Comando | Qué hace |
|---|---|
| `pnpm start` | Arranca el panel en `http://127.0.0.1:8787` |
| `pnpm dev` | Igual, con recarga automática al cambiar el código |
| `pnpm test` | Las pruebas (`node --test`) |
| `pnpm lint` | Validación del repositorio |
| `pnpm check` | **Las cinco puertas de calidad, en orden** |
| `pnpm check:local-only` | Solo la puerta de cero dependencias y cero orígenes remotos |
| `pnpm check:security` | Solo los invariantes de seguridad, con la app en marcha |
| `pnpm check:docs` | Solo la coherencia de la documentación |
| `pnpm generate:data-key` | Genera una clave AES-256 para la persistencia cifrada |
| `pnpm seed:demo` | Vuelca el estado de demostración por stdout |
| `pnpm package:windows` | Genera el icono y empaqueta la edición portable |

Si Corepack no está disponible, todo funciona igual con `node` directo:

~~~bash
node src/server.js
node --test
node scripts/validate-repo.js
node scripts/check-local-only.js
node scripts/check-security-claims.js
node scripts/check-docs.js
~~~

---

## Las cinco puertas, una por una

| Script | Qué comprueba | Falla cuando |
|---|---|---|
| `scripts/validate-repo.js` | Archivos obligatorios, JSON válido, sintaxis de cada `.js`, versión sincronizada entre `package.json` y `/api/health`, ausencia de claves privadas embebidas, tests enfocados (`.only`) | Alguien deja un `it.only`, rompe un JSON o desincroniza la versión |
| `scripts/check-local-only.js` | Cero dependencias declaradas o instaladas, ningún import externo, ninguna referencia remota en el panel, CSP `self` intacta | Alguien añade una dependencia npm o un CDN |
| `scripts/check-docs.js` | Toda ruta y enlace citado en un `.md` existe | Se renombra un documento sin actualizar quien lo cita |
| `node --test` | Las pruebas unitarias y de integración | Lo de siempre |
| `scripts/check-security-claims.js` | **Arranca la aplicación** y comprueba 20 invariantes: rechazo de material secreto, cabecera de mutación, cross-site, CSP servida, allowlist RPC, RPC remoto, valores por defecto | Cualquier promesa del README deja de ser cierta |

Salida esperada de la última:

~~~text
  ok  allowlist RPC solo de lectura (11 métodos)
  ok  material secreto rechazado (seed)
  ...
Invariantes de seguridad verificados: 20 comprobaciones.
~~~

---

## Variables de entorno

Todas opcionales; los valores por defecto son los conservadores.
Plantilla completa en [`../.env.example`](../.env.example).

| Variable | Por defecto | Para qué |
|---|---|---|
| `HOST` | `127.0.0.1` | Interfaz de escucha. Cámbialo solo sabiendo lo que haces |
| `PORT` | `8787` | Puerto del panel. `0` elige uno libre |
| `DEMO_MODE` | `true` | `false` activa persistencia cifrada |
| `ROOTCAUSE_DATA_KEY` | vacío | Obligatoria con `DEMO_MODE=false` |
| `DATA_DIR` | `./data` | Dónde vive el estado cifrado |
| `BITCOIN_RPC_URL` | `http://127.0.0.1:8332` | Nodo Bitcoin Core |
| `BITCOIN_RPC_COOKIE_FILE` | vacío | Vía preferida de autenticación |
| `BITCOIN_RPC_USER` / `BITCOIN_RPC_PASSWORD` | vacío | Alternativa a la cookie |
| `ALLOW_REMOTE_RPC` | `false` | Permitir un nodo fuera de loopback |
| `BITCOIN_RPC_TIMEOUT_MS` | `5000` | Tiempo máximo por llamada RPC |
| `WATCHTOWER_ENABLED` | `false` | Consulta periódica del nodo |
| `WATCHTOWER_INTERVAL_MS` | `15000` | Cada cuánto consulta |
| `REQUEST_BODY_LIMIT_BYTES` | `65536` | Tamaño máximo de cuerpo aceptado |
| `RATE_LIMIT_PER_MINUTE` | `120` | Peticiones por minuto y origen |
| `HIGH_VALUE_THRESHOLD_SATS` | `10000000` | Umbral de «alto valor» (0,1 BTC) |
| `ROOTCAUSE_OPEN_BROWSER` | sin definir | `1` abre el navegador al arrancar. Solo lo usa el lanzador de escritorio y solo funciona con bind loopback |

---

## API HTTP

Contrato completo en [`API.md`](API.md). Las mutaciones exigen la cabecera
`x-rootcause-request: 1`.

~~~bash
# Lectura
curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:8787/api/summary
curl http://127.0.0.1:8787/api/wallets
curl http://127.0.0.1:8787/api/incidents
curl http://127.0.0.1:8787/api/advisories
curl http://127.0.0.1:8787/api/policies
curl http://127.0.0.1:8787/api/audit

# Re-analizar
curl -X POST http://127.0.0.1:8787/api/scan \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"

# Consultar el nodo ahora
curl -X POST http://127.0.0.1:8787/api/node/refresh \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"

# Registrar una wallet watch-only
curl -X POST http://127.0.0.1:8787/api/wallets \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data @examples/wallets.sample.json
~~~

Comprobar a mano que el guardia de secretos funciona (debe responder `422`):

~~~bash
curl -i -X POST http://127.0.0.1:8787/api/wallets \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data '{"name":"prueba","mnemonic":"esto no debe aceptarse"}'
~~~

---

## Empaquetado de Windows

~~~powershell
# Icono multirresolución, generado desde código
powershell -File packaging/windows/make-icon.ps1

# Edición portable (descarga node.exe y verifica su SHA-256)
powershell -File packaging/windows/build-portable.ps1

# Con versión de Node fija, para compilación reproducible
powershell -File packaging/windows/build-portable.ps1 -NodeVersion 22.23.2

# Instalador (requiere Inno Setup 6)
iscc /DAppVersion=0.2.0 packaging/windows/RootCause-Bitcoin-Defense.iss
~~~

Detalles en [`WINDOWS-APP.md`](WINDOWS-APP.md).

---

## Laboratorio Bitcoin

Configuración de `regtest` en [`../labs/regtest/`](../labs/regtest/README.md),
para practicar sin fondos reales.

~~~bash
bitcoind -regtest -conf=$(pwd)/labs/regtest/bitcoin.conf
~~~

---

## Contenedor

~~~bash
docker compose up --build
~~~

Escucha en loopback y arranca en modo demostración. Para datos reales hay que
pasar la clave por entorno y montar un volumen para `DATA_DIR`.

---

## GitHub (`gh`)

~~~bash
# Estado de los workflows
gh run list --limit 5

# Ensayar el empaquetado de Windows sin publicar nada
gh workflow run release-windows.yml --ref main

# Publicar un release (el workflow hace todo lo demás)
git tag v0.2.0 && git push origin v0.2.0

# Ver los artefactos de un run
gh run view <RUN_ID> --log | grep "instalada y funcionando"
~~~

El checklist completo está en [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).
