# 19 · Matriz de trazabilidad

Cada funcionalidad seguida desde la interfaz hasta el disco y sus pruebas, para
poder responder en un vistazo: *¿dónde está esto y qué lo verifica?*

> **Estado de validación:** 🟢 verificado ejecutando · 🟡 verificado por lectura,
> sin prueba automática · ⚪ no verificado en este análisis.

---

## 1 · Cómo leer la matriz

| Columna | Qué contiene |
| --- | --- |
| Funcionalidad | Lo que el usuario o el sistema puede hacer |
| Requisito o regla | La razón de negocio que la justifica |
| Interfaz | Endpoint, vista del panel o comando |
| Módulo | Archivo que la implementa |
| Función | Símbolo concreto |
| Persistencia | Qué colección del estado toca |
| Prueba | Archivo de prueba, o el validador que la cubre |
| Documento | Dónde se explica |
| Estado | Nivel de validación alcanzado |

---

## 2 · Inventario de custodia

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Registrar wallet | Inventariar procedencia sin secretos | `POST /api/wallets` · vista Custodia | `defense-service.js` | `addWallet` | `wallets`, `audit`, `incidents` | `test/api.test.js` | [`09`](09-apis-and-integrations.md) | 🟢 |
| Validar huella | Identificar sin revelar la clave | Ídem | `defense-service.js` | `fingerprint` | `wallets[].fingerprint` | `test/api.test.js` | [`07`](07-database.md) | 🟢 |
| Impedir huella duplicada | Un inventario sin ambigüedad | Ídem | `defense-service.js` | `addWallet` | `wallets` | Sin prueba directa | [`07`](07-database.md) | 🟡 |
| Calcular fabricantes independientes | No poder falsear la diversidad | Ídem | `defense-service.js` | `normalizeWallet` | `wallets[].quorum` | Indirecta vía `BTC-CUSTODY-002` | [`06`](06-deep-code-explanation.md) | 🟡 |
| Validar coherencia del quorum | Impedir un 2-de-3 con un firmante | Ídem | `defense-service.js` | `normalizeWallet` | `wallets[].quorum` | Sin prueba directa | [`06`](06-deep-code-explanation.md) | 🟡 |
| Listar wallets | Consulta | `GET /api/wallets` | `defense-service.js` | `wallets` | Lectura de `wallets` | Sin prueba directa | [`09`](09-apis-and-integrations.md) | 🟡 |

---

## 3 · Rechazo de material secreto

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rechazar campo con nombre prohibido | **Principio no negociable 1** | Toda mutación | `secret-guard.js` | `isForbiddenKey` | Ninguna: rechaza antes | `test/secret-guard.test.js` + `check-security-claims.js` | [`11`](11-security.md) | 🟢 |
| Rechazar valor `xprv`/`tprv` | Ídem | Ídem | `secret-guard.js` | `EXTENDED_PRIVATE_KEY` | Ninguna | Ídem | [`11`](11-security.md) | 🟢 |
| Rechazar valor WIF | Ídem | Ídem | `secret-guard.js` | `WIF_PRIVATE_KEY` | Ninguna | `test/secret-guard.test.js` | [`11`](11-security.md) | 🟢 |
| Aceptar procedencia pública | El guardia no puede bloquear el uso | Ídem | `secret-guard.js` | `PUBLIC_PROVENANCE_FIELDS` | `wallets[].signers` | `test/secret-guard.test.js` + `check-security-claims.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Redactar la auditoría | Un secreto no debe acabar escrito | Toda escritura de auditoría | `secret-guard.js` | `redactForAudit` | `audit[].metadata` | `test/secret-guard.test.js` | [`11`](11-security.md) | 🟢 |
| No aceptar secretos en el histórico de git | El repositorio también es superficie | — | `check-history-secrets.js` | 11 patrones | — | Job `secretos` de CI | [`11`](11-security.md) | 🟢 |

---

## 4 · Detección — procedencia de claves

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-KEY-001` | Una semilla de firmware afectado está comprometida | `POST /api/scan` · vista Incidentes | `rule-engine.js` | `evaluateWallet` → `matchingAdvisories` | `incidents` | `test/rule-engine.test.js`, `test/firmware.test.js` | [`../reglas/BTC-KEY-001.md`](../reglas/BTC-KEY-001.md) | 🟢 |
| `BTC-KEY-002` | Sin trazabilidad no se puede descartar el riesgo | Ídem | `rule-engine.js` | `evaluateWallet` | `incidents` | Indirecta | [`../reglas/BTC-KEY-002.md`](../reglas/BTC-KEY-002.md) | 🟡 |
| `BTC-KEY-003` | La entropía no se infiere de una dirección | Ídem | `rule-engine.js` | `evaluateWallet` | `incidents` | Indirecta | [`../reglas/BTC-KEY-003.md`](../reglas/BTC-KEY-003.md) | 🟡 |
| Comparar versiones de firmware | Los fabricantes no siguen semver | — | `firmware.js` | `compareFirmwareVersions` | — | `test/firmware.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Coincidir modelo y canal | Un aviso puede afectar a `edge` y no a `standard` | — | `firmware.js` | `advisoryAffectsWallet` | — | `test/firmware.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |

---

## 5 · Detección — arquitectura de custodia

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-CUSTODY-001` | Alto valor no debe depender de una sola firma | `POST /api/scan` | `rule-engine.js` | `evaluateWallet` | `incidents` | `test/rule-engine.test.js` | [`../reglas/BTC-CUSTODY-001.md`](../reglas/BTC-CUSTODY-001.md) | 🟢 |
| `BTC-CUSTODY-002` | Un fallo común de firmware no debe alcanzar todo el quorum | Ídem | `rule-engine.js` | `evaluateWallet` | `incidents` | Indirecta | [`../reglas/BTC-CUSTODY-002.md`](../reglas/BTC-CUSTODY-002.md) | 🟡 |
| `BTC-CUSTODY-003` | N-de-N no reparte el riesgo: lo multiplica | Ídem · **solo por API** | `rule-engine.js` | `evaluateWallet` | `incidents` | `test/attack-patterns.test.js` | [`../reglas/BTC-CUSTODY-003.md`](../reglas/BTC-CUSTODY-003.md) | 🟢 |

---

## 6 · Detección — gasto observado

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-TX-001` | Un gasto fuera del flujo de autorización es un incidente | `POST /api/observe/transaction` · vista Laboratorio | `rule-engine.js` | `evaluateTransaction` | `observedTransactions`, `incidents` | `test/rule-engine.test.js` | [`../reglas/BTC-TX-001.md`](../reglas/BTC-TX-001.md) | 🟢 |
| `BTC-TX-002` | Un vaciado no es un pago | Ídem | `rule-engine.js` | `evaluateCorrelations` | `incidents` | `test/attack-patterns.test.js`, con su par negativo | [`../reglas/BTC-TX-002.md`](../reglas/BTC-TX-002.md) | 🟢 |
| `BTC-TX-003` | Una ráfaga indica extracción activa | Ídem | `rule-engine.js` | `evaluateCorrelations` | `incidents` | `test/attack-patterns.test.js`, con su par negativo | [`../reglas/BTC-TX-003.md`](../reglas/BTC-TX-003.md) | 🟢 |
| Registrar aprobación | Un gasto previsto no debe generar alarma | `POST /api/approvals` | `defense-service.js` | `approvePolicyHash` | `approvals`, `audit` | `test/rule-engine.test.js` (caso aprobado) | [`09`](09-apis-and-integrations.md) | 🟢 |
| Caducidad de aprobación | Una aprobación no debería valer siempre | Ídem | — | 🔴 **No implementada** | `approvals[].expiresAt` | Ninguna | [`15`](15-risks-and-technical-debt.md) R-06 | 🔴 |

---

## 7 · Detección — salud del nodo

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-NODE-001` | Sin nodo, la aplicación está ciega y debe decirlo | `POST /api/node/refresh` · vista Resumen | `rule-engine.js` | `evaluateNode` | `node`, `incidents` | `test/rule-engine.test.js` | [`../reglas/BTC-NODE-001.md`](../reglas/BTC-NODE-001.md) | 🟢 |
| `BTC-NODE-002` | Un nodo sin sincronizar da una vista incompleta | Ídem | `rule-engine.js` | `evaluateNode` | `incidents` | Sin prueba directa | [`../reglas/BTC-NODE-002.md`](../reglas/BTC-NODE-002.md) | 🟡 |
| `BTC-NODE-003` | Sin peers, la observación está aislada | Ídem | `rule-engine.js` | `evaluateNode` | `incidents` | Sin prueba directa | [`../reglas/BTC-NODE-003.md`](../reglas/BTC-NODE-003.md) | 🟡 |
| `BTC-NODE-004` | Una mempool llena expulsa transacciones | Ídem | `rule-engine.js` | `evaluateNode` | `incidents` | Sin prueba directa | [`../reglas/BTC-NODE-004.md`](../reglas/BTC-NODE-004.md) | 🟡 |
| Snapshot normalizado | Una foto del nodo, sin credenciales | Ídem | `bitcoin-rpc.js` | `snapshot` | `node` | `test/bitcoin-rpc.test.js` | [`05`](05-technical-reference.md) | 🟢 |
| Allowlist de solo lectura | **Principio no negociable 3** | — | `bitcoin-rpc.js` | `READ_ONLY_METHODS` | — | `test/bitcoin-rpc.test.js` + `check-security-claims.js` + `grep` en CI | [`11`](11-security.md) | 🟢 |
| Rechazo de RPC remoto | **Principio no negociable 4** | — | `bitcoin-rpc.js` | `validateRpcUrl` | — | `test/bitcoin-rpc.test.js` + `check-security-claims.js` | [`11`](11-security.md) | 🟢 |

---

## 8 · Detección — privacidad e inteligencia

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-PRIVACY-001` | La superficie de una wallet incluye a quien la usa | `POST /api/observe/privacy` | `rule-engine.js` | `evaluatePrivacyEvent` | `privacyEvents`, `incidents` | Indirecta | [`../reglas/BTC-PRIVACY-001.md`](../reglas/BTC-PRIVACY-001.md) | 🟡 |
| `BTC-PRIVACY-002` | Si filtran a tu fabricante, el phishing deja de ser genérico | Ídem | `rule-engine.js` | `evaluateCorrelations` | `incidents` | `test/attack-patterns.test.js`, con su par negativo | [`../reglas/BTC-PRIVACY-002.md`](../reglas/BTC-PRIVACY-002.md) | 🟢 |
| `BTC-INTEL-001` | Un verde sobre avisos viejos es una tranquilidad falsa | `POST /api/scan` · vista Inteligencia | `rule-engine.js` | `evaluateIntel` | `incidents` | `test/attack-patterns.test.js`, con su par negativo | [`../reglas/BTC-INTEL-001.md`](../reglas/BTC-INTEL-001.md) | 🟢 |
| `BTC-INTEL-002` | Sin matriz no hay nada con lo que contrastar | Ídem | `rule-engine.js` | `evaluateIntel` | `incidents` | `test/attack-patterns.test.js` | [`../reglas/BTC-INTEL-002.md`](../reglas/BTC-INTEL-002.md) | 🟢 |
| `BTC-INTEL-003` | La matriz debe registrar su propia frescura | Ídem | `rule-engine.js` | `evaluateIntel` | `incidents` | Sin prueba directa | [`../reglas/BTC-INTEL-003.md`](../reglas/BTC-INTEL-003.md) | 🟡 |
| Vigilancia semanal de la frescura | El mundo cambia aunque el repositorio no | Job `inteligencia` | `audit-bitcoin.js` | Etapa 2 | — | CI semanal | [`13`](13-deployment-and-operations.md) | ⚪ |

---

## 9 · Autoauditoría de la instalación

| Regla | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-OPSEC-001` | Salir de loopback invalida el modelo de seguridad | `GET /api/posture` | `posture.js` | `evaluatePosture` | **No se persiste** | `test/posture.test.js`, incluido el caso de contenedor | [`../reglas/BTC-OPSEC-001.md`](../reglas/BTC-OPSEC-001.md) | 🟢 |
| `BTC-OPSEC-002` | Un inventario real en memoria se pierde al cerrar | Ídem | `posture.js` | `evaluatePosture` | — | Sin prueba directa | [`../reglas/BTC-OPSEC-002.md`](../reglas/BTC-OPSEC-002.md) | 🟡 |
| `BTC-OPSEC-003` | Una clave escrita a mano no protege | Ídem | `posture.js` | `estimateKeyStrengthBits` | — | `test/posture.test.js`, con clave fuerte y repetitiva | [`../reglas/BTC-OPSEC-003.md`](../reglas/BTC-OPSEC-003.md) | 🟢 |
| `BTC-OPSEC-004` | Bitcoin Core desaconseja exponer RPC | Ídem | `posture.js` | `evaluatePosture` | — | `test/posture.test.js` | [`../reglas/BTC-OPSEC-004.md`](../reglas/BTC-OPSEC-004.md) | 🟢 |
| `BTC-OPSEC-005` | La cookie rota sola; una contraseña no | Ídem | `posture.js` | `evaluatePosture` | — | `test/posture.test.js` | [`../reglas/BTC-OPSEC-005.md`](../reglas/BTC-OPSEC-005.md) | 🟢 |
| `BTC-OPSEC-006` | Valor en juego sin vigilancia es ceguera elegida | Ídem | `posture.js` | `evaluatePosture` | — | `test/posture.test.js` | [`../reglas/BTC-OPSEC-006.md`](../reglas/BTC-OPSEC-006.md) | 🟢 |
| `BTC-OPSEC-007` | Límites relajados amplían la superficie sin aportar nada | Ídem | `posture.js` | `evaluatePosture` | — | Sin prueba directa | [`../reglas/BTC-OPSEC-007.md`](../reglas/BTC-OPSEC-007.md) | 🟡 |
| `BTC-OPSEC-008` | Un historial modificado es evidencia de manipulación | Ídem · `GET /api/audit` | `posture.js` + `audit-log.js` | `verifyAuditChain` | `audit` | `test/posture.test.js`, `test/audit-log.test.js` | [`../reglas/BTC-OPSEC-008.md`](../reglas/BTC-OPSEC-008.md) | 🟢 |

---

## 10 · Ciclo de vida de los incidentes

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identificador determinista | Reconocer el mismo problema entre análisis | — | `rule-engine.js` | `findingId` | `incidents[].id` | `test/incident-lifecycle.test.js` (identidad del hallazgo) | [`06`](06-deep-code-explanation.md) | 🟢 |
| Reabrir un problema que vuelve | Un incidente cerrado que reaparece es información nueva | `POST /api/scan` | `defense-service.js` | `mergeIncidents` | `incidents` | `test/incident-lifecycle.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| No re-resolver lo ya resuelto | `resolvedAt` debe decir cuándo dejó de darse el problema | Ídem | `defense-service.js` | `mergeIncidents` | `incidents` | `test/incident-lifecycle.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Reparar un estado incompleto | Un estado sin colecciones no debe impedir el arranque | Arranque | `defense-service.js` | `initialize` | Todo el estado | `test/incident-lifecycle.test.js` | [`15`](15-risks-and-technical-debt.md) R-03 | 🟢 |
| Conservar `createdAt` | Saber desde cuándo existe, no desde cuándo se miró | — | `defense-service.js` | `mergeIncidents` | `incidents` | `test/incident-lifecycle.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Reconocer un incidente | Documentar que alguien lo vio | `PATCH /api/incidents/{id}` · vista Incidentes | `defense-service.js` | `updateIncident` | `incidents`, `audit` | 🔴 **Sin prueba** | [`09`](09-apis-and-integrations.md) | 🟡 |
| Resolver automáticamente | Un problema que desaparece no debe seguir abierto | `POST /api/scan` | `defense-service.js` | `mergeIncidents` | `incidents` | `test/incident-lifecycle.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Reevaluar tras cada cambio | Un panel que no se entera es un panel que miente | Toda mutación | `defense-service.js` | `rescanAfterChange` | `incidents`, `audit` | `test/api.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Puntuación agregada | Un crítico siempre debe pintar de rojo | `GET /api/summary` · vista Resumen | `risk.js` | `riskScore`, `riskLevel` | — | 🔴 **Sin prueba directa** | [`15`](15-risks-and-technical-debt.md) R-12 | 🟡 |

---

## 11 · Persistencia y auditoría

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Persistencia | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cifrado del estado | El inventario es sensible | — | `encrypted-store.js` | `encryptJson` | Archivo | `test/encrypted-store.test.js` | [`07`](07-database.md) | 🟢 |
| Rechazo con clave incorrecta | GCM autentica | — | `encrypted-store.js` | `decryptJson` | — | `test/encrypted-store.test.js` | [`07`](07-database.md) | 🟢 |
| Sin metadatos en claro | El sobre no debe filtrar nada | — | `encrypted-store.js` | `save` | Archivo | `test/encrypted-store.test.js` | [`07`](07-database.md) | 🟢 |
| Escritura atómica | Un corte no debe dejar el estado a medias | — | `encrypted-store.js` | `save` | Archivo | `test/encrypted-store.test.js` | [`06`](06-deep-code-explanation.md) | 🟢 |
| Serializar escrituras | Dos peticiones no deben pisarse | Toda mutación | `defense-service.js` | `mutate` | Todo el estado | 🔴 **Sin prueba** | [`15`](15-risks-and-technical-debt.md) R-10 | 🟡 |
| Cadena de auditoría | Editar un evento debe notarse | `GET /api/audit` | `audit-log.js` | `appendAuditEntry` | `audit` | `test/audit-log.test.js` | [`11`](11-security.md) | 🟢 |
| Verificación de la cadena | El registro debe poder demostrarse íntegro | Ídem | `audit-log.js` | `verifyAuditChain` | — | `test/audit-log.test.js` | [`11`](11-security.md) | 🟢 |
| Generar clave de datos | 32 bytes aleatorios de verdad | `node scripts/generate-key.js` | `generate-key.js` | — | — | Sin prueba | [`02`](02-installation-and-execution.md) | 🟡 |

---

## 12 · Frontera HTTP

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cabeceras de seguridad | El panel no debe poder cargar nada externo | Todas | `app.js` | `applySecurityHeaders` | `check-security-claims.js`, `check-local-only.js` | [`11`](11-security.md) | 🟢 |
| Guardia de mutación local | Protección CSRF | Toda mutación | `app.js` | `validateMutationRequest` | `test/api.test.js` + `check-security-claims.js` | [`11`](11-security.md) | 🟢 |
| Rechazo cross-site | Ídem | Ídem | `app.js` | `validateMutationRequest` | `check-security-claims.js` | [`11`](11-security.md) | 🟢 |
| Límite de tasa | Acotar el abuso local | Todas | `app.js` | `createRateLimiter` | 🔴 **Sin prueba** | [`15`](15-risks-and-technical-debt.md) | 🟡 |
| Límite de cuerpo | No bufferizar cargas enormes | Con cuerpo | `app.js` | `readJson` | 🔴 **Sin prueba** | [`15`](15-risks-and-technical-debt.md) | 🟡 |
| Allowlist de estáticos | Sin path traversal | GET, HEAD | `app.js` | `STATIC_FILES` | `test/api.test.js` (indirecta) | [`06`](06-deep-code-explanation.md) | 🟡 |
| Ocultar detalle en 5xx | Un error puede filtrar rutas del sistema | Todas | `app.js` | Manejador de errores | Sin prueba | [`03`](03-architecture.md) | 🟡 |
| Escapar todo en el panel | Sin XSS | Panel | `web/static/app.js` | `escapeHtml`, `safeUrl` | 🔴 **Sin prueba** | [`15`](15-risks-and-technical-debt.md) | 🟡 |

---

## 13 · Distribución y garantías del producto

| Funcionalidad | Requisito | Interfaz | Módulo | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Cero dependencias | Claim central de distribución | — | `check-local-only.js` | Job `solo-local` | [`11`](11-security.md) | 🟢 |
| CSP self-only intacta | Ídem | — | `check-local-only.js` | Ídem | [`11`](11-security.md) | 🟢 |
| 20 invariantes con la app en marcha | Los claims se ejecutan, no se afirman | — | `check-security-claims.js` | Job `invariantes` | [`11`](11-security.md) | 🟢 |
| Ningún método RPC de gasto en `src/` | **Principio no negociable 2** | — | `grep` en `ci.yml` | Job `invariantes` | [`11`](11-security.md) | ⚪ |
| Enlaces de documentación válidos | Un runbook roto envía a nadie a ninguna parte | — | `check-docs.js` | Job `documentacion` | [`12`](12-testing-and-quality.md) | 🟢 |
| Estilo visual de la documentación | Coherencia de la familia RootCause | — | `check-doc-style.js` | Ídem | [`12`](12-testing-and-quality.md) | 🟢 |
| Fichas de regla sincronizadas | La documentación no puede divergir del motor | — | `generate-rule-docs.js --check` | Ídem + `test/rules-catalog.test.js` | [`12`](12-testing-and-quality.md) | 🟢 |
| Plugin sincronizado con su fuente | No prometer lo que el proyecto no practica | — | `sync-plugin.js --check` | Job `plugin` | [`04`](04-code-map.md) | 🟡 |
| Versión coherente en dos sitios | Un endpoint de salud no debe mentir | `GET /api/health` | `validate-repo.js` | Todos los jobs de calidad | [`09`](09-apis-and-integrations.md) | 🟢 |
| Runtime verificado por SHA-256 | Procedencia del código ajeno que se distribuye | — | `build-portable.ps1` | Job `app-windows` | [`13`](13-deployment-and-operations.md) | ⚪ |
| El artefacto arranca con inventario | Un binario puede instalarse vacío | — | `release-windows.yml` | Job de release | [`13`](13-deployment-and-operations.md) | ⚪ |
| Avisos del runtime distribuido | Cero dependencias no es cero código ajeno | — | `check-runtime-advisories.js` | Job `runtime` | [`11`](11-security.md) | 🟢 |
| Secretos en todo el histórico | Borrarlo del árbol no lo borra del histórico | — | `check-history-secrets.js` | Job `secretos` | [`11`](11-security.md) | 🟢 |
| Auditoría de custodia en 14 etapas | Declarar siempre la cobertura real | `node scripts/audit-bitcoin.js` | `audit-bitcoin.js` | Job `custodia` | [`../AUDITORIA_14_ETAPAS.md`](../AUDITORIA_14_ETAPAS.md) | ⚪ |

---

## 14 · Arranque de escritorio

| Funcionalidad | Requisito | Interfaz | Módulo | Función | Prueba | Documento | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Abrir el panel al arrancar | Comodidad de escritorio | Lanzador `.cmd` | `server.js` | `openBrowserIfRequested` | `test/desktop-launch.test.js` | [`05`](05-technical-reference.md) | 🟢 |
| Nunca abrirlo sin pedirlo | Un servidor no debe lanzar un navegador | — | Ídem | Ídem | Ídem | [`05`](05-technical-reference.md) | 🟢 |
| Nunca abrirlo con bind no loopback | No exponer una URL remota | — | Ídem | Ídem | Ídem | [`05`](05-technical-reference.md) | 🟢 |
| Datos fuera de la carpeta del programa | Sobrevivir a la desinstalación | Lanzador | `RootCause-Bitcoin-Defense.cmd` | — | Job `app-windows` | [`13`](13-deployment-and-operations.md) | ⚪ |
| Detenerse si falta la clave | Mejor no arrancar que arrancar sin lo que se pidió | Ídem | Ídem | Sin prueba | [`14`](14-troubleshooting.md) | 🟡 |

---

## 15 · Cobertura de la matriz

| Estado | Filas | Lectura |
| --- | ---: | --- |
| 🟢 Verificado ejecutando | 52 | Cubierto por prueba automática o validador ejecutado en este análisis |
| 🟡 Verificado por lectura | 30 | El código lo implementa; **ninguna prueba automática lo protege** |
| 🔴 No implementado | 1 | La caducidad de aprobaciones |
| ⚪ No verificado aquí | 6 | Corre en CI, o requiere Windows |
| **Total** | **89** | |

> **Lo que esta tabla dice de verdad:** un tercio de las filas sigue en 🟡. Son
> funcionalidades reales y correctas, pero **sin red de seguridad automática**:
> una regresión en ellas no la detectaría nadie hasta que alguien la sufriera.
> `mergeIncidents` acaba de salir de ese grupo; las que más importan de las que
> quedan —la cola de escritura y `riskScore`— encabezan la propuesta priorizada
> de [`12-testing-and-quality.md`](12-testing-and-quality.md).

---

| Volver a | |
| --- | --- |
| Índice de esta documentación | [`README.md`](README.md) |
| Índice general | [`../INDEX.md`](../INDEX.md) |
