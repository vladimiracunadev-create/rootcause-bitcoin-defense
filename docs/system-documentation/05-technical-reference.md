# 05 · Referencia técnica

Catálogo de todo lo invocable, configurable o comprobable del sistema: firma,
parámetros, retorno, excepciones, efectos secundarios y riesgo al modificarlo.

> Pensado para consulta puntual y para servir de contexto fiable a otro agente.
> Cada entrada cita el archivo donde comprobarla.

---

## 1 · Constantes y estructuras de datos

### 1.1 · Constantes del dominio

| Constante | Archivo | Valor | Uso |
| --- | --- | --- | --- |
| `SEVERITY_WEIGHT` | `src/domain/risk.js` | `critical:100, high:75, medium:45, low:20, info:5` | Base de la puntuación de riesgo |
| `PUBLIC_PROVENANCE_FIELDS` | `src/domain/secret-guard.js` | `seedorigin`, `seedcreatedat`, `firmwareatseedcreation` | Excepciones al bloqueo por nombre de campo |
| `EXTENDED_PRIVATE_KEY` | `src/domain/secret-guard.js` | Regex `xprv`/`tprv` | Detección por forma del valor |
| `WIF_PRIVATE_KEY` | `src/domain/secret-guard.js` | Regex `[5KL]` + base58 | Detección por forma del valor |
| `READ_ONLY_METHODS` | `src/infrastructure/bitcoin-rpc.js` | 11 métodos | **Allowlist RPC** |
| `ALGORITHM` | `src/infrastructure/encrypted-store.js` | `aes-256-gcm` | Cifrado del estado |
| `STATIC_FILES` | `src/app.js` | 7 rutas → archivo y MIME | **Allowlist de estáticos** |
| `NETWORKS` | `src/services/defense-service.js` | `mainnet`, `signet`, `regtest`, `testnet4` | Validación |
| `WALLET_TYPES` | `src/services/defense-service.js` | `single-sig`, `multisig` | Validación |
| `STATUSES` | `src/services/defense-service.js` | `active`, `migration-required`, `quarantined`, `retired` | Validación |
| `SEED_ORIGINS` | `src/services/defense-service.js` | `device`, `dice`, `external`, `unknown` | Validación |
| `CACHE` | `src/web/static/sw.js` | `rootcause-bitcoin-defense-v1` | Nombre de caché del service worker |

### 1.2 · Métodos RPC permitidos

| Método | Para qué se usa |
| --- | --- |
| `getblockchaininfo` | Cadena, altura, cabeceras, IBD, progreso |
| `getnetworkinfo` | Conexiones y avisos del nodo |
| `getmempoolinfo` | Tamaño, uso, máximo y tarifa mínima |
| `getpeerinfo` | Recuento y redes de los peers |
| `getbestblockhash`, `getblockcount`, `getmempoolentry`, `getrawmempool`, `gettxout`, `getwalletinfo`, `estimatesmartfee` | Disponibles, sin uso actual en `snapshot()` |

**Todo lo que no está en esta lista lanza.** `check-security-claims.js` verifica
además que ningún método de la lista empiece por `send`, `sign`, `import`,
`dump`, `walletpassphrase`, `createwallet`, `generate` y otros doce prefijos.

### 1.3 · Estructura del estado

| Campo | Tipo | Se crea en |
| --- | --- | --- |
| `schemaVersion` | `1` | `createEmptyState()` |
| `createdAt` / `updatedAt` | ISO-8601 | `createEmptyState()` / `mutate()` |
| `wallets[]` | array de wallet | `addWallet()` |
| `incidents[]` | array de incidente | `mergeIncidents()` |
| `approvals[]` | array de aprobación | `approvePolicyHash()` |
| `observedTransactions[]` | array de evento | `observeTransaction()` |
| `privacyEvents[]` | array de evento | `observePrivacyEvent()` |
| `audit[]` | array de entrada encadenada | `appendAuditEntry()` |
| `node` | snapshot o `null` | `refreshNode()` |

Esquema campo a campo en [`07-database.md`](07-database.md).

---

## 2 · Variables de entorno

Todas se leen **una sola vez**, en `loadConfig()`. Rango y consecuencia de cada
una en [`10-configuration.md`](10-configuration.md).

| Variable | Tipo | Rango | Defecto |
| --- | --- | --- | --- |
| `HOST` | cadena | — | `127.0.0.1` |
| `PORT` | entero | 0–65535 | `8787` |
| `DEMO_MODE` | booleano | `true`/`false` | `true` |
| `ROOTCAUSE_DATA_KEY` | cadena | 32 bytes en hex o base64 | vacío |
| `DATA_DIR` | ruta | — | `./data` |
| `REQUEST_BODY_LIMIT_BYTES` | entero | 1024–1048576 | `65536` |
| `RATE_LIMIT_PER_MINUTE` | entero | 10–10000 | `120` |
| `HIGH_VALUE_THRESHOLD_SATS` | entero | 1–`MAX_SAFE_INTEGER` | `10000000` |
| `BITCOIN_RPC_URL` | URL | http o https | `http://127.0.0.1:8332` |
| `BITCOIN_RPC_USER` | cadena | — | vacío |
| `BITCOIN_RPC_PASSWORD` | cadena | — | vacío |
| `BITCOIN_RPC_COOKIE_FILE` | ruta | — | vacío |
| `ALLOW_REMOTE_RPC` | booleano | `true`/`false` | `false` |
| `BITCOIN_RPC_TIMEOUT_MS` | entero | 500–60000 | `5000` |
| `WATCHTOWER_ENABLED` | booleano | `true`/`false` | `false` |
| `WATCHTOWER_INTERVAL_MS` | entero | 5000–3600000 | `15000` |
| `ROOTCAUSE_CONTAINERIZED` | booleano | `true`/`false` | autodetectado |
| `ROOTCAUSE_OPEN_BROWSER` | `"1"` | — | sin definir |

> Un valor fuera de rango **no lanza**: `parseInteger` lo recorta al límite más
> cercano. Un valor no numérico cae al valor por defecto. Es tolerante a
> propósito, pero significa que una errata puede pasar inadvertida.

---

## 3 · Endpoints HTTP

Base local: `http://127.0.0.1:8787`. Contrato de uso completo en
[`../API.md`](../API.md); aquí, el detalle de implementación.

| Método | Ruta | Handler | Estado OK |
| --- | --- | --- | ---: |
| GET | `/api/health` | Literal en `router.js` | 200 |
| GET | `/api/summary` | `service.summary()` | 200 |
| GET | `/api/wallets` | `service.wallets()` | 200 |
| POST | `/api/wallets` | `service.addWallet()` | 201 |
| POST | `/api/scan` | `service.scan()` | 200 |
| GET | `/api/incidents` | `service.incidents()` | 200 |
| PATCH | `/api/incidents/{id}` | `service.updateIncident()` | 200 |
| GET | `/api/advisories` | `service.advisoriesList()` | 200 |
| GET | `/api/policies` | `service.policiesDocument()` | 200 |
| GET | `/api/posture` | `service.posture()` | 200 |
| GET | `/api/audit` | `service.audit()` | 200 |
| POST | `/api/approvals` | `service.approvePolicyHash()` | 201 |
| POST | `/api/observe/transaction` | `service.observeTransaction()` | 201 |
| POST | `/api/observe/privacy` | `service.observePrivacyEvent()` | 201 |
| POST | `/api/node/refresh` | `service.refreshNode()` | 200 |

El `{id}` de incidente se valida con `/^[a-f0-9]{20}$/`: **cualquier otra forma
cae al 404 sin llegar al servicio**.

### 3.1 · Rutas estáticas

| Ruta | Archivo | MIME | `cache-control` |
| --- | --- | --- | --- |
| `/`, `/index.html` | `index.html` | `text/html; charset=utf-8` | `no-cache` |
| `/app.js` | `app.js` | `text/javascript; charset=utf-8` | `public, max-age=300` |
| `/styles.css` | `styles.css` | `text/css; charset=utf-8` | `public, max-age=300` |
| `/manifest.webmanifest` | `manifest.webmanifest` | `application/manifest+json` | `public, max-age=300` |
| `/sw.js` | `sw.js` | `text/javascript; charset=utf-8` | `no-cache` |
| `/icon.svg` | `icon.svg` | `image/svg+xml` | `public, max-age=300` |

---

## 4 · Códigos de error

| HTTP | `code` | Cuándo | Dónde se lanza |
| ---: | --- | --- | --- |
| 400 | `REQUEST_REJECTED` | Validación de campo, JSON malformado, estado de incidente no soportado | `defense-service.js`, `app.js` |
| 403 | `MUTATION_HEADER_REQUIRED` | Mutación sin `x-rootcause-request: 1` | `app.js` → `validateMutationRequest` |
| 403 | `CROSS_SITE_REQUEST_REJECTED` | `sec-fetch-site` distinto de `same-origin`/`none` | `app.js` |
| 404 | `NOT_FOUND` | Ruta estática o de API inexistente, incidente inexistente | `app.js`, `router.js`, `defense-service.js` |
| 405 | `METHOD_NOT_ALLOWED` | Método distinto de GET/HEAD en un estático | `app.js` |
| 409 | `REQUEST_REJECTED` | Huella de wallet duplicada | `defense-service.js` → `addWallet` |
| 413 | `REQUEST_REJECTED` | Cuerpo por encima de `REQUEST_BODY_LIMIT_BYTES` | `app.js` → `readJson` |
| 415 | `REQUEST_REJECTED` | Falta `content-type: application/json` | `app.js` → `readJson` |
| 422 | `SECRET_MATERIAL_REJECTED` | Material secreto detectado | `secret-guard.js` |
| 429 | `RATE_LIMITED` | Más de `RATE_LIMIT_PER_MINUTE` en 60 s | `app.js` → `createRateLimiter` |
| 500 | `INTERNAL_ERROR` | Cualquier otra | `app.js` — **mensaje genérico** |
| 503 | `REQUEST_REJECTED` | `refreshNode` sin cliente RPC | `defense-service.js` |

---

## 5 · Códigos de regla

Las 26 reglas, con su archivo y su condición resumida. Ficha completa de cada
una en [`../reglas/README.md`](../reglas/README.md).

| Código | Severidad | Archivo | Condición |
| --- | --- | --- | --- |
| `BTC-KEY-001` | critical | `rule-engine.js` | Firmante coincide con un aviso: fabricante, modelo, canal y rango de firmware |
| `BTC-KEY-002` | high / medium | `rule-engine.js` | `firmwareAtSeedCreation` vacío o `unknown` |
| `BTC-KEY-003` | medium | `rule-engine.js` | `seedOrigin === "unknown"` |
| `BTC-CUSTODY-001` | critical | `rule-engine.js` | `single-sig` con saldo ≥ umbral |
| `BTC-CUSTODY-002` | high / medium | `rule-engine.js` | `multisig` con `independentVendors < 2` |
| `BTC-CUSTODY-003` | high / medium | `rule-engine.js` | `multisig` con `required === total > 1` |
| `BTC-TX-001` | critical | `rule-engine.js` | Gasto vigilado sin `approvalHash` conocido |
| `BTC-TX-002` | critical | `rule-engine.js` | Gasto sin aprobar ≥ 90 % del saldo de la wallet |
| `BTC-TX-003` | critical | `rule-engine.js` | ≥ 2 gastos sin aprobar en la misma wallet en < 1 h |
| `BTC-NODE-001` | high | `rule-engine.js` | `node.connected === false` |
| `BTC-NODE-002` | medium | `rule-engine.js` | IBD activo o `verificationProgress < 0.999` |
| `BTC-NODE-003` | high | `rule-engine.js` | `connections === 0` |
| `BTC-NODE-004` | medium | `rule-engine.js` | Uso de mempool ≥ 90 % del máximo |
| `BTC-PRIVACY-001` | critical / medium | `rule-engine.js` | Evento `bulk_customer_data_access`; medium si `authorized` |
| `BTC-PRIVACY-002` | high | `rule-engine.js` | El fabricante del evento fabrica firmantes del inventario |
| `BTC-INTEL-001` | medium / high | `rule-engine.js` | Aviso más reciente con más de `advisoryMaxAgeDays` (30) |
| `BTC-INTEL-002` | high | `rule-engine.js` | Matriz de avisos vacía o ilegible |
| `BTC-INTEL-003` | medium | `rule-engine.js` | Ningún aviso declara `verifiedAt` ni `publishedAt` |
| `BTC-OPSEC-001` | critical / medium | `posture.js` | `HOST` fuera de loopback; medium dentro de contenedor |
| `BTC-OPSEC-002` | medium | `posture.js` | `DEMO_MODE=true` con saldo declarado > 0 |
| `BTC-OPSEC-003` | high / medium | `posture.js` | Entropía estimada de la clave < 128 bits; high si < 64 |
| `BTC-OPSEC-004` | high | `posture.js` | `ALLOW_REMOTE_RPC=true` |
| `BTC-OPSEC-005` | medium | `posture.js` | Usuario o contraseña RPC sin `cookieFile` |
| `BTC-OPSEC-006` | medium | `posture.js` | Wallet de alto valor con watchtower apagado |
| `BTC-OPSEC-007` | low | `posture.js` | `rateLimitPerMinute ≥ 5000` o `bodyLimitBytes ≥ 1048576` |
| `BTC-OPSEC-008` | critical | `posture.js` | `verifyAuditChain()` devuelve `valid: false` |

---

## 6 · Referencia de funciones

Formato de cada ficha: **firma · propósito · parámetros · retorno · excepciones ·
efectos · quién la llama · qué llama · riesgo al modificarla.**

### 6.1 · `loadConfig(env = process.env)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/config.js` |
| Propósito | Leer el entorno una vez y devolver un objeto congelado |
| Parámetros | `env` — objeto tipo `process.env`. Inyectable para pruebas |
| Retorna | Objeto congelado con `host`, `port`, `demoMode`, `dataDir`, `dataFile`, `dataKey`, `bodyLimitBytes`, `rateLimitPerMinute`, `highValueThresholdSats`, `containerized`, `bitcoin{}`, `watchtower{}` |
| Excepciones | Ninguna. **Nunca lanza**: recorta al rango o cae al defecto |
| Efectos | Lee el sistema de archivos para detectar `/.dockerenv` y `/run/.containerenv` |
| La llaman | `server.js`, los 12 scripts, `check-security-claims.js`, `audit-bitcoin.js` |
| Llama a | `parseBoolean`, `parseInteger`, `path.resolve`, `fs.existsSync` |
| Riesgo | **Alto.** Cambiar un valor por defecto altera lo que `check-security-claims.js` verifica y puede abrir el producto sin que nadie lo note |

### 6.2 · `assertProductionConfig(config)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/config.js` |
| Propósito | Impedir que el sistema arranque persistente sin clave |
| Retorna | `undefined` |
| Excepciones | `Error` si `!demoMode && !dataKey` |
| La llaman | `buildRuntime()`, `seed-demo.js` |
| Riesgo | Medio. Quitarla haría que un arranque persistente fallara más tarde y de forma menos clara |

### 6.3 · `createApplication({ service, config, staticRoot })`

| Campo | Valor |
| --- | --- |
| Archivo | `src/app.js` |
| Propósito | Devolver el manejador `(request, response)` con toda la frontera aplicada |
| Retorna | Función asíncrona compatible con `http.createServer` |
| Excepciones | Las captura todas y las traduce a JSON con el `statusCode` adecuado |
| Efectos | Escribe cabeceras, lee archivos estáticos, registra los 5xx en `stderr` |
| La llaman | `buildRuntime()`, `test/api.test.js` |
| Riesgo | **Crítico.** Es donde viven la CSP, el límite de tasa y la guardia de mutación |

### 6.4 · `validateMutationRequest(request)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/app.js` (privada) |
| Propósito | Rechazar mutaciones que no vengan del panel local |
| Excepciones | 403 `MUTATION_HEADER_REQUIRED`; 403 `CROSS_SITE_REQUEST_REJECTED` |
| Riesgo | **Crítico.** Es la única protección CSRF del sistema |

> **Límite conocido:** un `sec-fetch-site` ausente pasa el segundo control. Los
> navegadores actuales lo envían siempre; un cliente que no sea navegador puede
> omitirlo, pero también puede poner la cabecera `x-rootcause-request`. La
> defensa real sigue siendo el bind en loopback.

### 6.5 · `assertNoSecretMaterial(value, path = "request")`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/secret-guard.js` |
| Propósito | **Impedir que entre material secreto.** La frontera que define el producto |
| Parámetros | `value` — cualquier valor; `path` — ruta acumulada para el mensaje |
| Retorna | `undefined` si es seguro |
| Excepciones | `SecretMaterialError` (422, `SECRET_MATERIAL_REJECTED`) |
| Efectos | Ninguno. Función pura y recursiva |
| La llaman | `normalizeWallet()`, `approvePolicyHash()`, `observeTransaction()`, `observePrivacyEvent()` |
| Riesgo | **Crítico.** Es el invariante central; `check-security-claims.js` lo prueba con 5 cargas hostiles en cada build |

### 6.6 · `redactForAudit(value)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/secret-guard.js` |
| Propósito | Sustituir por `[REDACTED]` lo que no debe quedar escrito en la auditoría |
| Retorna | Copia con los campos prohibidos redactados y las cadenas de más de 512 caracteres truncadas |
| Efectos | Ninguno; no muta la entrada |
| La llama | `appendAuditEntry()` |
| Riesgo | **Alto.** Sin ella, un valor rechazado podría acabar escrito en el registro |

### 6.7 · `evaluateState(state, context)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/rule-engine.js` |
| Propósito | Ejecutar las siete familias de reglas sobre el estado completo |
| Parámetros | `context` con `advisories`, `highValueThresholdSats`, `config`, `auditVerification`, `advisoryMaxAgeDays`, `now` |
| Retorna | Array plano de hallazgos |
| Excepciones | Ninguna prevista. **Presupone que `state.wallets`, `state.observedTransactions` y `state.privacyEvents` son arrays**; si faltan, lanza `TypeError` |
| Efectos | Ninguno. Función pura, salvo `Date` cuando no se pasa `now` |
| La llama | `DefenseService.evaluate()` |
| Llama a | `evaluateWallet`, `evaluateTransaction`, `evaluatePrivacyEvent`, `evaluateNode`, `evaluateCorrelations`, `evaluateIntel`, `evaluatePosture` |
| Riesgo | **Crítico.** Añadir una regla aquí sin ficha en `config/rules-catalog.json` rompe el build |

### 6.8 · `evaluatePosture(state, context = {})`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/posture.js` |
| Propósito | Auditar la instalación con la configuración viva |
| Retorna | Array de hallazgos `BTC-OPSEC-*`. **Array vacío si no hay `context.config`** |
| Efectos | Ninguno |
| La llaman | `evaluateState()`, `DefenseService.posture()`, etapas 9 y 11 de `audit-bitcoin.js` |
| Riesgo | Alto. Es lo que hace que la herramienta se audite a sí misma |

### 6.9 · `estimateKeyStrengthBits(key)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/posture.js` |
| Propósito | Estimar la entropía aproximada de la clave de datos |
| Retorna | Entero de bits; `0` si la clave está vacía |
| Efectos | Ninguno |
| Riesgo | Bajo, pero **no mide calidad criptográfica**: detecta una clave escrita a mano, nada más. La longitud efectiva se recorta a `min(longitud, únicos × 4)` para que un valor largo y repetitivo no puntúe como uno aleatorio |

### 6.10 · `advisoryAffectsWallet(advisory, wallet)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/firmware.js` |
| Propósito | Decidir si un aviso alcanza a un firmante concreto |
| Retorna | `true` solo si coinciden fabricante, modelo, canal y rango de versión |
| Excepciones | Ninguna: `isInRange` atrapa los errores de comparación y devuelve `false` |
| Riesgo | **Crítico en ambos sentidos.** Un falso negativo oculta una clave comprometida; un falso positivo declara comprometidos unos fondos que no lo están |

### 6.11 · `compareFirmwareVersions(left, right)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/firmware.js` |
| Propósito | Ordenar dos versiones de firmware |
| Retorna | `-1`, `0` o `1` |
| Excepciones | `Error("Invalid firmware version")` si alguna no parsea |
| Riesgo | Alto. Compara los tres números y **después el sufijo con `localeCompare`**, no semver. Adecuado para `6.6.0X` frente a `6.6.0`, y no extrapolable a otros esquemas |

### 6.12 · `riskScore(findings)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/domain/risk.js` |
| Propósito | Reducir una lista de hallazgos a un número de 0 a 100 |
| Algoritmo | `min(100, round(máximo + 0.08 × suma de los demás pesos))` |
| Retorna | Entero 0–100; `0` si no hay hallazgos |
| Riesgo | Medio. Cambiar el 0.08 altera cómo se ve el panel, no qué se detecta |

### 6.13 · `DefenseService.mutate(mutator)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/services/defense-service.js` (privada por convención) |
| Propósito | **Serializar** toda escritura: cargar, mutar, sellar fecha y guardar |
| Retorna | La promesa del resultado del mutador |
| Efectos | Escribe en el almacén; encadena en `this.writeQueue` |
| Riesgo | **Crítico.** Sin la cola, dos peticiones concurrentes leerían el mismo estado y la segunda escritura perdería la primera. `this.writeQueue = operation.catch(() => {})` es deliberado: un fallo no debe romper la cadena para las operaciones siguientes |

### 6.14 · `DefenseService.addWallet(input, actor)`

| Campo | Valor |
| --- | --- |
| Propósito | Registrar una wallet y reevaluar el inventario completo |
| Retorna | La wallet normalizada, con UUID |
| Excepciones | 422 material secreto · 400 validación · 409 huella duplicada |
| Efectos | Añade la wallet, escribe 2 entradas de auditoría, refunde incidentes y guarda |
| Riesgo | Alto. La unicidad se comprueba **por huella de wallet**, no por firmante |

### 6.15 · `DefenseService.observeTransaction(input, actor)`

| Campo | Valor |
| --- | --- |
| Propósito | Registrar un gasto observado y correlacionarlo con las aprobaciones |
| Parámetros | `txid` (64 hex, obligatorio), `walletId`, `spendsWatchedWallet` (por defecto `true`), `valueSats` (opcional), `approvalHash` (opcional), `source` |
| Retorna | El evento normalizado |
| Excepciones | 422 · 400 |
| Efectos | Añade el evento, audita, reevalúa y refunde incidentes |
| Riesgo | Alto. **`walletId` no se comprueba contra el inventario**: un identificador inexistente crea un evento que `BTC-TX-001` marcará, pero que `BTC-TX-002` ignorará por no encontrar la wallet |

### 6.16 · `DefenseService.updateIncident(id, status, actor)`

| Campo | Valor |
| --- | --- |
| Propósito | Marcar un incidente como reconocido o resuelto |
| Parámetros | `status` ∈ `{acknowledged, resolved}` |
| Excepciones | 400 estado no soportado · 404 incidente inexistente |
| Riesgo | Medio. **Reconocer no cierra el hallazgo**: `mergeIncidents` conserva el estado `acknowledged` mientras la condición siga activa, y lo pasa a `resolved` automáticamente cuando deja de detectarse |

### 6.17 · `mergeIncidents(existing, findings, now)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/services/defense-service.js` (privada) |
| Propósito | Refundir hallazgos nuevos con el historial de incidentes |
| Retorna | Array ordenado por `lastSeenAt` descendente |
| Reglas | Conserva `createdAt`; conserva `acknowledged`; marca `resolved` lo que ya no aparece; actualiza `lastSeenAt` |
| Riesgo | **Alto.** Depende por completo de que `findingId` sea determinista. Cambiar el cálculo del identificador convertiría cada análisis en un incidente nuevo y resolvería en falso todos los anteriores |

### 6.18 · `appendAuditEntry(audit, input)` y `verifyAuditChain(audit)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/infrastructure/audit-log.js` |
| Propósito | Añadir una entrada encadenada por hash y verificar la cadena completa |
| Retorna | `appendAuditEntry`: **array nuevo** (no muta). `verifyAuditChain`: `{valid, entries, head}` o `{valid, brokenAt, reason}` |
| Efectos | `appendAuditEntry` redacta la metadata antes de encadenar |
| Riesgo | **Crítico.** El hash se calcula sobre una forma canónica con claves ordenadas: cambiar `canonicalize` invalidaría todas las cadenas ya escritas |

### 6.19 · `decodeDataKey`, `encryptJson`, `decryptJson`

| Campo | Valor |
| --- | --- |
| Archivo | `src/infrastructure/encrypted-store.js` |
| Excepciones | `"A data-encryption key is required."` · `"ROOTCAUSE_DATA_KEY must decode to exactly 32 bytes."` · `"Unsupported encrypted state envelope."` · error de `crypto` si el tag de autenticación no cuadra |
| Riesgo | **Crítico.** No hay derivación de clave: se usa tal cual. Correcto para una clave generada; por eso existe `BTC-OPSEC-003` para la escrita a mano |

### 6.20 · `EncryptedFileStore.save(nextState)`

| Campo | Valor |
| --- | --- |
| Propósito | Escribir el estado cifrado de forma atómica |
| Efectos | `mkdir` recursivo con modo `0700`, escritura temporal `<archivo>.<pid>.tmp` con modo `0600`, y `rename` |
| Riesgo | Alto. El `rename` es lo que evita un estado truncado tras un corte. **En Windows los modos POSIX se ignoran**: la protección real la da la ACL del perfil del usuario |

### 6.21 · `validateRpcUrl(value, allowRemote = false)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/infrastructure/bitcoin-rpc.js` |
| Excepciones | Protocolo no http/https · credenciales en la URL · destino remoto sin `allowRemote` |
| Riesgo | **Crítico.** `isLoopback` resuelve `localhost`, `::1` y el prefijo `127.` — **no resuelve DNS**, así que un nombre que apunte a loopback se rechaza igualmente. Es conservador a propósito |

### 6.22 · `BitcoinRpcClient.call(method, params = [])`

| Campo | Valor |
| --- | --- |
| Excepciones | Método fuera de la allowlist · cookie inválida · respuesta > 2 MiB · HTTP no OK · error JSON-RPC · `AbortError` por timeout |
| Efectos | Lee el archivo de cookie **en cada llamada** (el nodo la rota) y hace una petición HTTP |
| Riesgo | **Crítico.** Añadir un método capaz de firmar o enviar convierte el producto en algo que puede perder fondos. Hay tres controles que lo impiden: la allowlist, `check-security-claims.js` y un `grep` en CI |

### 6.23 · `BitcoinRpcClient.snapshot()`

| Campo | Valor |
| --- | --- |
| Propósito | Componer una foto normalizada del nodo con cuatro llamadas |
| Retorna | Objeto con `connected: true` y 15 campos, o `{connected: false, endpoint, checkedAt, error}` |
| Excepciones | **Ninguna. Nunca lanza** |
| Riesgo | Medio. Que no lance es deliberado: un nodo caído es el dato que alimenta `BTC-NODE-001`, no un fallo que deba tumbar el análisis |

### 6.24 · `Watchtower.start()` / `stop()` / `tick()`

| Campo | Valor |
| --- | --- |
| Archivo | `src/services/watchtower.js` |
| Efectos | `setInterval` con `unref()`; `tick()` llama a `refreshNode()` y a `scan()` |
| Riesgo | Medio. La bandera `running` evita el solapamiento; los errores se registran y se tragan. **Habilitarlo por defecto rompería el invariante que verifica `check-security-claims.js`** |

### 6.25 · `openBrowserIfRequested(env, config, url)`

| Campo | Valor |
| --- | --- |
| Archivo | `src/server.js` |
| Propósito | Abrir el panel al arrancar, solo si el lanzador de escritorio lo pide |
| Retorna | `true` si se lanzó el proceso hijo, `false` en cualquier otro caso |
| Efectos | `spawn` desacoplado con `detached`, `stdio: "ignore"`, `windowsHide` |
| Riesgo | Medio. **Doble condición**: `ROOTCAUSE_OPEN_BROWSER=1` **y** bind loopback. Un despliegue de servidor nunca abre un navegador ni expone una URL remota. Cubierto por `test/desktop-launch.test.js` |

---

## 7 · Comandos

| Comando | Qué hace | Sale con ≠ 0 si |
| --- | --- | --- |
| `pnpm start` | Arranca el servidor | El puerto está ocupado o falta la clave |
| `pnpm dev` | Arranca con `--watch` | Ídem |
| `pnpm test` | Ejecuta las 69 pruebas | Alguna falla |
| `pnpm lint` | `validate-repo.js` | Falta un archivo, JSON inválido, sintaxis rota, versión desincronizada |
| `pnpm check` | Encadena 7 puertas | Cualquiera falla |
| `pnpm check:local-only` | Cero dependencias y orígenes | Hay dependencias, CDN o CSP relajada |
| `pnpm check:security` | 20 invariantes en marcha | Algún invariante roto |
| `pnpm check:docs` | Enlaces y rutas citadas | Hay un enlace roto |
| `pnpm check:style` | Estilo de la documentación | Hay un problema de formato |
| `pnpm check:secrets` | Secretos en el histórico | Hay material secreto |
| `pnpm check:runtime` | Avisos del Node distribuido | Hay avisos aplicables, o **no hay red** |
| `pnpm check:rules` | Fichas sincronizadas | Alguna ficha difiere del catálogo |
| `pnpm generate:data-key` | 32 bytes en base64 | — |
| `pnpm seed:demo` | Siembra el estado cifrado | El archivo ya existe |
| `pnpm audit:bitcoin` | Las 14 etapas | Alguna etapa **falla** (no basta con «con atención») |
| `pnpm audit:bitcoin:report` | Ídem, escribiendo el informe | Ídem |
| `pnpm plugin:sync` | Regenera `plugin/` | — |
| `pnpm docs:rules` | Regenera las 26 fichas | — |
| `pnpm package:windows` | Icono y portable | Falla el hash del runtime o los invariantes |

### 7.1 · Banderas de los scripts

| Script | Banderas |
| --- | --- |
| `audit-bitcoin.js` | `--report`, `--json`, `--stages=1,2,3`, `--fail-on-attention` |
| `check-history-secrets.js` | `--staged`, `--json` |
| `check-runtime-advisories.js` | `--version=X.Y.Z`, `--json`, `--offline-ok`, `--include-current` |
| `check-doc-style.js` | `--json` |
| `generate-rule-docs.js` | `--check` |
| `sync-plugin.js` | `--check` |

---

## 8 · Archivos de configuración

| Archivo | Formato | Quién lo lee | Efecto de romperlo |
| --- | --- | --- | --- |
| `package.json` | JSON | Node, scripts, CI | El build cae en `validate-repo.js` |
| `config/advisories.json` | JSON array | `server.js`, auditoría | Sin avisos, `BTC-INTEL-002` dispara en alto |
| `config/policies.json` | JSON objeto | `server.js`, etapa 14 | `advisoryMaxAgeDays` cae a 30 |
| `config/rules-catalog.json` | JSON objeto | Generador y pruebas | El build cae |
| `config/secret-scan-allow.json` | JSON objeto | Escáner de secretos | El escáner denuncia la wordlist BIP-39 del propio detector |
| `compose.yaml` | YAML | Docker | — |
| `Dockerfile` | Dockerfile | Docker, hadolint | Falla el job `workflows` |
| `.editorconfig`, `.gitattributes` | INI / gitattributes | Editores y git | Los `.cmd` pierden CRLF y `cmd.exe` los interpreta mal |

---

## 9 · Eventos de auditoría

Valores de `action` que escribe el sistema:

| Acción | Actor típico | Cuándo |
| --- | --- | --- |
| `application_initialized` | `system` | Primer arranque, cadena vacía |
| `wallet_registered` | `local-user` | `POST /api/wallets` |
| `auto_rescan` | El actor de la petición | Tras cada cambio de inventario |
| `risk_scan_completed` | `system` o `watchtower` | `POST /api/scan` |
| `incident_acknowledged` / `incident_resolved` | `local-user` | `PATCH /api/incidents/{id}` |
| `policy_hash_approved` | `local-user` | `POST /api/approvals` |
| `transaction_observed` | `watchtower` | `POST /api/observe/transaction` |
| `privacy_event_observed` | `vendor-monitor` | `POST /api/observe/privacy` |
| `bitcoin_node_checked` | `watchtower` | `POST /api/node/refresh` |

---

| Siguiente | |
| --- | --- |
| Cómo funciona por dentro, bloque a bloque | [`06-deep-code-explanation.md`](06-deep-code-explanation.md) |
| Volver al índice | [`README.md`](README.md) |
