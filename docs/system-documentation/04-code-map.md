# 04 · Mapa completo del código

Inventario jerárquico de todo lo que hay en el repositorio: qué es cada cosa, de
qué depende, quién la usa y en qué flujo participa.

> **Estado aparente** de cada elemento: 🟢 activo · 🟡 legado o duplicado ·
> 🔵 experimental o de laboratorio · ⚪ generado, no se edita a mano.

---

## 1 · Vista de primer nivel

| Directorio | Qué contiene | Estado |
| --- | --- | --- |
| `src/` | El sistema. 22 archivos, 3356 líneas de JavaScript | 🟢 |
| `scripts/` | 14 utilidades y puertas de calidad | 🟢 |
| `test/` | 13 archivos de pruebas, 69 casos | 🟢 |
| `config/` | Avisos, política, catálogo de reglas y exenciones del escáner | 🟢 |
| `docs/` | 33 documentos + 27 fichas de regla + este directorio | 🟢 / ⚪ |
| `landing/` | Página pública para GitHub Pages | 🟢 / ⚪ |
| `packaging/windows/` | Empaquetador portable, instalador y lanzadores | 🟢 |
| `plugin/` | Copia distribuible de `.claude/` | ⚪ generado |
| `.claude/` | Skill, agente y comando de auditoría — **la fuente** | 🟢 |
| `.github/` | 5 workflows, Dependabot y configuración de zizmor | 🟢 |
| `examples/` | Tres cargas útiles públicas y ficticias | 🟢 |
| `labs/regtest/` | Configuración de nodo de laboratorio | 🔵 |
| `data/` | Directorio de estado. Solo contiene `.gitkeep` | 🟢 |
| `build/` | Artefactos generados. Ignorado por git | ⚪ |

> `build/portable/RootCause-Bitcoin-Defense/` contiene una **copia completa de
> `src/`, `scripts/`, `config/` y `docs/`**. Es el paquete ensamblado, no código
> fuente: se regenera en cada empaquetado y está en `.gitignore`. Nunca se edita
> allí. Detalle en [`15-risks-and-technical-debt.md`](15-risks-and-technical-debt.md).

---

## 2 · `src/` — el sistema

### 2.1 · Raíz de `src/`

| Archivo | Líneas | Responsabilidad | Importa | Lo usan |
| --- | ---: | --- | --- | --- |
| `src/config.js` | 80 | Leer el entorno una sola vez y devolverlo congelado | `node:fs`, `node:path`, `node:url` | `server.js`, todos los `scripts/`, `test/posture.test.js` |
| `src/server.js` | 153 | Ensamblar el runtime, abrir el puerto, apagar limpio | Toda la cadena | Punto de entrada; `check-security-claims.js`; `test/desktop-launch.test.js` |
| `src/app.js` | 175 | Cabeceras, límite de tasa, guardia de mutación, estáticos | `node:crypto`, `node:fs`, `api/router.js` | `server.js`, `test/api.test.js` |

**Símbolos exportados**

| Símbolo | Archivo | Tipo | Importancia |
| --- | --- | --- | --- |
| `PROJECT_ROOT` | `config.js` | constante | Alta — la usan 11 archivos para resolver rutas |
| `loadConfig(env)` | `config.js` | función | **Crítica** — gobierna todo el comportamiento |
| `assertProductionConfig(config)` | `config.js` | función | Alta — impide arrancar sin clave |
| `buildRuntime(env)` | `server.js` | función | Alta — composition root |
| `openBrowserIfRequested(env, config, url)` | `server.js` | función | Media — solo edición de escritorio |
| `startServer(env)` | `server.js` | función | **Crítica** — punto de entrada |
| `createApplication({service, config, staticRoot})` | `app.js` | factoría | **Crítica** — la frontera HTTP |

### 2.2 · `src/api/`

| Archivo | Líneas | Responsabilidad |
| --- | ---: | --- |
| `src/api/router.js` | 130 | Despachar 14 endpoints a `DefenseService` |

| Símbolo | Tipo | Nota |
| --- | --- | --- |
| `jsonResponse(response, status, body, extraHeaders)` | función | Toda respuesta de API pasa por aquí; fija `cache-control: no-store` |
| `createApiRouter({service, readJson})` | factoría | Devuelve la función de enrutado |
| `actorFrom(request)` | privada | Normaliza `x-rootcause-actor`; **etiqueta, no identidad** |

> `router.js` contiene la cadena `version: "0.3.0"` que responde `/api/health`.
> `scripts/validate-repo.js` comprueba que coincide con `package.json` y falla si
> no. **Cambiar la versión obliga a tocar los dos sitios.**

### 2.3 · `src/domain/` — reglas y decisiones

| Archivo | Líneas | Responsabilidad | Importa |
| --- | ---: | --- | --- |
| `src/domain/rule-engine.js` | 622 | 18 reglas: claves, custodia, gasto, nodo, privacidad, inteligencia y correlaciones | `node:crypto`, `firmware.js`, `posture.js` |
| `src/domain/posture.js` | 251 | 8 reglas sobre la propia instalación | `node:crypto` |
| `src/domain/firmware.js` | 104 | Parseo, comparación y coincidencia de versiones de firmware | — |
| `src/domain/secret-guard.js` | 100 | Rechazo y redacción de material secreto | — |
| `src/domain/risk.js` | 46 | Agregar hallazgos a una puntuación y un nivel | — |
| `src/domain/bitcoin-forensics.js` | 203 | Parser UTXO, fees, change, historia, selección conceptual, reconciliación y cinco informes | — |

| Símbolo | Archivo | Familia de reglas que emite |
| --- | --- | --- |
| `evaluateWallet(wallet, context)` | `rule-engine.js` | `BTC-KEY-001..003`, `BTC-CUSTODY-001..003` |
| `evaluateTransaction(event, approvals)` | `rule-engine.js` | `BTC-TX-001` |
| `evaluateNode(node)` | `rule-engine.js` | `BTC-NODE-001..004` |
| `evaluatePrivacyEvent(event)` | `rule-engine.js` | `BTC-PRIVACY-001` |
| `evaluateIntel(advisories, context)` | `rule-engine.js` | `BTC-INTEL-001..003` |
| `evaluateCorrelations(state, context)` | `rule-engine.js` | `BTC-TX-002`, `BTC-TX-003`, `BTC-PRIVACY-002` |
| `evaluateState(state, context)` | `rule-engine.js` | **Orquesta las siete familias** |
| `evaluatePosture(state, context)` | `posture.js` | `BTC-OPSEC-001..008` |
| `estimateKeyStrengthBits(key)` | `posture.js` | Alimenta `BTC-OPSEC-003` |
| `parseFirmwareVersion(value)` | `firmware.js` | — |
| `compareFirmwareVersions(left, right)` | `firmware.js` | — |
| `advisoryAffectsWallet(advisory, wallet)` | `firmware.js` | Condición de `BTC-KEY-001` |
| `matchingAdvisories(wallet, advisories)` | `firmware.js` | — |
| `assertNoSecretMaterial(value, path)` | `secret-guard.js` | Lanza `SecretMaterialError` (422) |
| `redactForAudit(value)` | `secret-guard.js` | — |
| `SecretMaterialError` | `secret-guard.js` | Clase de error |
| `riskScore(findings)`, `riskLevel(score)`, `countBySeverity(findings)` | `risk.js` | — |
| `SEVERITY_WEIGHT` | `risk.js` | Constante: critical 100, high 75, medium 45, low 20, info 5 |
| `analyzeBitcoinScenario`, `renderForensicReports` | `bitcoin-forensics.js` | Calculan el caso y sus artefactos desde transacciones públicas |
| `btcToSats`, `satsToBtc`, `selectCoins` | `bitcoin-forensics.js` | Aritmética exacta y selección conceptual sin firma |

### 2.4 · `src/services/` — casos de uso

| Archivo | Líneas | Responsabilidad |
| --- | ---: | --- |
| `src/services/defense-service.js` | 541 | El único punto que escribe estado. 12 operaciones públicas |
| `src/services/demo-state.js` | 129 | Estado vacío y estado de demostración |
| `src/services/watchtower.js` | 53 | Vigilancia periódica opcional |

| Clase o función | Archivo | Métodos públicos |
| --- | --- | --- |
| `DefenseService` | `defense-service.js` | `initialize`, `summary`, `posture`, `wallets`, `addWallet`, `scan`, `incidents`, `updateIncident`, `approvePolicyHash`, `observeTransaction`, `observePrivacyEvent`, `refreshNode`, `advisoriesList`, `policiesDocument`, `audit` |
| `Watchtower` | `watchtower.js` | `start`, `stop`, `tick` |
| `createEmptyState()` | `demo-state.js` | — |
| `createDemoState()` | `demo-state.js` | — |

**Funciones privadas de `defense-service.js`** — no exportadas, pero centrales:

| Función | Qué hace | Riesgo al modificar |
| --- | --- | --- |
| `text`, `integer`, `enumValue`, `fingerprint`, `txHash` | Validadores que lanzan con `statusCode: 400` | Relajarlos abre la puerta de entrada |
| `normalizeSigner(input, index)` | Normaliza un firmante y le asigna UUID | Cambiar los valores por defecto altera qué reglas disparan |
| `normalizeWallet(input)` | Valida quorum, firmantes y calcula `independentVendors` | Es la única defensa contra un quorum incoherente |
| `mergeIncidents(existing, findings, now)` | Refunde hallazgos nuevos con incidentes previos | **Alto** — decide qué se resuelve y qué conserva su historial |

### 2.5 · `src/infrastructure/`

| Archivo | Líneas | Responsabilidad | Importa |
| --- | ---: | --- | --- |
| `src/infrastructure/encrypted-store.js` | 118 | AES-256-GCM, escritura atómica, y el almacén en memoria | `node:crypto`, `node:fs`, `node:path` |
| `src/infrastructure/bitcoin-rpc.js` | 156 | Cliente JSON-RPC con allowlist de lectura | `node:fs`, `node:net` |
| `src/infrastructure/audit-log.js` | 68 | Cadena de hashes y su verificación | `node:crypto`, `../domain/secret-guard.js` |

| Símbolo | Archivo | Nota |
| --- | --- | --- |
| `decodeDataKey(value)` | `encrypted-store.js` | Acepta hex de 64 o base64; exige 32 bytes exactos |
| `encryptJson(value, key)` / `decryptJson(envelope, key)` | `encrypted-store.js` | Sobre versionado `version: 1` |
| `MemoryStore` / `EncryptedFileStore` | `encrypted-store.js` | Mismo contrato `load()` / `save()` |
| `validateRpcUrl(value, allowRemote)` | `bitcoin-rpc.js` | Rechaza remoto y credenciales en la URL |
| `BitcoinRpcClient` | `bitcoin-rpc.js` | `READ_ONLY_METHODS` con 11 métodos |
| `appendAuditEntry(audit, input)` | `audit-log.js` | Redacta la metadata antes de encadenar |
| `verifyAuditChain(audit)` | `audit-log.js` | Alimenta `BTC-OPSEC-008` |

### 2.6 · `src/web/static/` — el panel

| Archivo | Líneas | Responsabilidad |
| --- | ---: | --- |
| `src/web/static/index.html` | 321 | Cinco vistas: Resumen, Custodia, Incidentes, Inteligencia, Laboratorio |
| `src/web/static/app.js` | 601 | Estado en memoria, render y llamadas a la API |
| `src/web/static/styles.css` | 980 | Hoja de estilos completa, sin fuentes remotas |
| `src/web/static/sw.js` | 42 | Service worker: red primero, `/api/` excluido |
| `manifest.webmanifest` (en `src/web/static/`) | — | Metadatos PWA |
| `src/web/static/icon.svg` | — | Icono, embebido sin recursos externos |

**Funciones destacadas de `app.js` del navegador**

| Función | Papel | Por qué importa |
| --- | --- | --- |
| `escapeHtml(value)` | Escapa `& < > " '` | **Única defensa contra XSS** — todo dato del servidor pasa por aquí |
| `safeUrl(value)` | Solo deja pasar `http:` y `https:` | Evita `javascript:` en los enlaces de aviso |
| `api(path, options)` | Envoltorio de `fetch` | Añade `x-rootcause-request: 1` en toda mutación |
| `refresh()` | Recarga resumen y avisos | Se llama tras cada acción |
| `renderDashboard`, `renderWallets`, `renderIncidents`, `renderAdvisories`, `renderNode` | Render por concatenación | Sin framework y sin plantillas |
| `submitWallet(form)` | Compone la carga útil del formulario | Fija 3 firmantes para multisig y 1 para single-sig |
| `simulateSpend()` | Genera un txid aleatorio y lo observa | Vista Laboratorio |

Los ocho ficheros estáticos servibles están declarados en la allowlist
`STATIC_FILES` de `src/app.js`: **lo que no está en esa tabla no se sirve**, así
que no hay superficie de path traversal.

---

## 3 · `scripts/` — puertas de calidad y utilidades

| Archivo | Líneas | Qué hace | ¿Puerta de CI? |
| --- | ---: | --- | --- |
| `scripts/audit-bitcoin.js` | 704 | Las 14 etapas de auditoría de custodia y su informe | Sí, `security-audit.yml` |
| `scripts/check-history-secrets.js` | 403 | 11 patrones de secreto sobre **todo el histórico de git**, saltando el contenido de los binarios | Sí |
| `scripts/generate-rule-docs.js` | 356 | Genera las 26 fichas, su índice y `landing/reglas.html` | Sí, en modo `--check` |
| `scripts/check-runtime-advisories.js` | 314 | Avisos del Node que se distribuye, contra el Security WG | Sí |
| `scripts/check-security-claims.js` | 222 | 20 invariantes **contra la aplicación en marcha** | Sí |
| `scripts/check-doc-style.js` | 204 | Estilo visual de la documentación | Sí |
| `scripts/sync-plugin.js` | 139 | Regenera `plugin/` desde `.claude/` | Sí, en modo `--check` |
| `scripts/check-local-only.js` | 136 | Cero dependencias, cero orígenes remotos, CSP intacta | Sí |
| `scripts/validate-repo.js` | 117 | Archivos obligatorios, JSON, sintaxis, versión, secretos | Sí |
| `scripts/check-docs.js` | 91 | Todo enlace y ruta citada existe | Sí |
| `scripts/seed-demo.js` | 23 | Siembra el estado cifrado con el inventario de demostración | No |
| `scripts/generate-key.js` | 7 | Genera 32 bytes en base64 | No |
| `scripts/analyze-bitcoin-scenario.js` | 24 | Genera los cinco informes desde evidencia pública | No |
| `scripts/run-regtest-lab.js` | 122 | Construye DigitalCustody Labs en Bitcoin Core regtest | Sí, solo al nodo desechable |

**Dependencia común:** los catorce importan `PROJECT_ROOT` de `src/config.js`. Eso
los ata al árbol del repositorio: **no funcionan como herramienta global**.

---

## 4 · `test/` — 69 casos en 13 archivos

| Archivo | Casos | Qué cubre | Módulo bajo prueba |
| --- | ---: | --- | --- |
| `test/incident-lifecycle.test.js` | 14 | Ciclo de vida del incidente y reparación del estado | `defense-service.js` |
| `test/attack-patterns.test.js` | 11 | Barrido, ráfaga, correlación de fabricante, frescura, N-de-N | `rule-engine.js` |
| `test/posture.test.js` | 9 | Los 8 controles de postura y la entropía de la clave | `posture.js` |
| `test/rules-catalog.test.js` | 6 | **Que catálogo y motor no diverjan** | `rules-catalog.json` ↔ dominio |
| `test/api.test.js` | 4 | Endpoints, cabecera de mutación, rechazo de secretos, alta | `app.js`, `router.js`, `DefenseService` |
| `test/rule-engine.test.js` | 4 | Firmware afectado, concentración, aprobaciones, nodo caído | `rule-engine.js` |
| `test/bitcoin-rpc.test.js` | 3 | RPC remoto, allowlist, normalización del snapshot | `bitcoin-rpc.js` |
| `test/bitcoin-forensics.test.js` | 5 | UTXOs, fees, change, reconciliación e informes | `bitcoin-forensics.js` |
| `test/encrypted-store.test.js` | 3 | Cifrado, clave incorrecta, escritura atómica | `encrypted-store.js` |
| `test/secret-guard.test.js` | 3 | Campos prohibidos a cualquier profundidad, redacción | `secret-guard.js` |
| `test/firmware.test.js` | 3 | Parseo, comparación, coincidencia de modelo y canal | `firmware.js` |
| `test/desktop-launch.test.js` | 2 | El navegador no se abre solo, ni fuera de loopback | `server.js` |
| `test/audit-log.test.js` | 2 | Cadena íntegra y cadena manipulada | `audit-log.js` |

Cobertura por módulo y huecos identificados en
[`12-testing-and-quality.md`](12-testing-and-quality.md).

---

## 5 · `config/` — datos versionados

| Archivo | Contenido | Quién lo lee |
| --- | --- | --- |
| `config/advisories.json` | 2 avisos con rangos de firmware, mitigación y fuentes | `server.js`, `audit-bitcoin.js` |
| `config/policies.json` | Umbral, quorum mínimo, acciones automáticas, prohibidas y de aprobación humana | `server.js`, etapa 14 de la auditoría |
| `config/rules-catalog.json` | 7 familias y **26 fichas de regla** | `generate-rule-docs.js`, `test/rules-catalog.test.js` |
| `config/secret-scan-allow.json` | 1 exención declarada, con motivo | `check-history-secrets.js` |

`rules-catalog.json` es la **fuente única** de `docs/reglas/` y de
`landing/reglas.html`. Editar una ficha a mano rompe el build.

---

## 6 · `packaging/windows/`

| Archivo | Qué es |
| --- | --- |
| `packaging/windows/build-portable.ps1` | Ensambla el portable, verifica el SHA-256 del runtime y arranca la app antes de comprimir |
| `packaging/windows/RootCause-Bitcoin-Defense.iss` | Instalador Inno Setup por usuario, sin UAC |
| `packaging/windows/make-icon.ps1` | Genera `rootcause.ico` desde código |
| `packaging/windows/launcher/RootCause-Bitcoin-Defense.cmd` | Lanzador de escritorio; lee `config.cmd` del perfil |
| `packaging/windows/launcher/Generar clave de datos.cmd` | Envoltorio de `generate-key.js` con instrucciones |
| `packaging/windows/launcher/LEEME.txt` | Texto de bienvenida del paquete |
| `packaging/windows/informacion-antes.txt` | Texto que muestra el instalador antes de instalar |

Los `.cmd`, `.ps1` e `.iss` conservan CRLF por `.gitattributes`: `cmd.exe`
interpreta mal los bloques multilínea con finales Unix.

---

## 7 · `.github/` — automatización

| Workflow | Trabajos | Disparadores |
| --- | ---: | --- |
| `ci.yml` | 6: calidad, solo-local, invariantes, regtest, app-windows, documentación | push, PR, manual |
| `security-audit.yml` | 6: custodia, runtime, secretos, workflows, inteligencia, plugin | push, PR, lunes 07:23 UTC, manual |
| `codeql.yml` | 1: análisis JavaScript con `security-extended` | push, PR, lunes 06:17 UTC, manual |
| `release-windows.yml` | 1: empaquetar, verificar y publicar | tag `v*`, manual |
| `deploy-landing.yml` | 1: publicar `landing/` en Pages | cambios en `landing/`, manual |

Todas las actions están pinneadas a **commit SHA**, con `permissions` mínimos,
`concurrency` y `timeout-minutes`. `persist-credentials: false` en cada checkout.

---

## 8 · Elementos generados — no editar a mano

| Ruta | Se genera con | Comprobado por |
| --- | --- | --- |
| `docs/reglas/*.md` (27 archivos) | `node scripts/generate-rule-docs.js` | `--check` en CI |
| `landing/reglas.html` | `node scripts/generate-rule-docs.js` | `--check` en CI |
| `plugin/` (5 archivos) | `node scripts/sync-plugin.js` | `--check` en CI |
| `build/` | `packaging/windows/build-portable.ps1` | Prueba de arranque en CI |
| `packaging/windows/rootcause.ico` | `make-icon.ps1` | — |
| `SECURITY_AUDIT_BITCOIN_*.md` | `audit-bitcoin.js --report` | — |
| `docs/system-documentation/pdf/*.pdf` | `python scripts/build-docs-pdf.py` | Presencia verificada por `check-docs.js` |

Los tres últimos están en `.gitignore` o se regeneran a demanda.

---

## 9 · Módulos sin uso aparente

Revisión explícita, porque un módulo huérfano es deuda silenciosa:

| Elemento | Veredicto |
| --- | --- |
| `pnpm-workspace.yaml` con `packages: []` | 🟡 Vacío. Lo exige `validate-repo.js` como archivo obligatorio; sin él, el build cae |
| `pnpm-lock.yaml` con `importers: {}` | 🟢 Deliberadamente vacío; `check-local-only.js` falla si adquiere paquetes |
| `data/.gitkeep` | 🟢 Mantiene el directorio en git |
| `examples/*.json` | 🟢 Citados en `docs/COMMANDS.md`; cargas útiles listas para `curl` |
| `labs/regtest/` | 🔵 Laboratorio, no participa en ningún flujo de producción |
| `DefenseService.advisoriesList()` y `policiesDocument()` | 🟢 Los usan `GET /api/advisories` y `GET /api/policies` |
| `SEVERITY_WEIGHT` exportado | 🟢 Lo importan `risk.js` internamente y está disponible para pruebas |
| `MASTER_PROMPT.md` | 🟢 Documento fundacional; `validate-repo.js` lo exige |

**No se encontró código muerto en `src/`.** Todos los símbolos exportados tienen
al menos un consumidor.

---

| Siguiente | |
| --- | --- |
| Firma y contrato de cada función | [`05-technical-reference.md`](05-technical-reference.md) |
| Cómo funciona por dentro | [`06-deep-code-explanation.md`](06-deep-code-explanation.md) |
| Volver al índice | [`README.md`](README.md) |
