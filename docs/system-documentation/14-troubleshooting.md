# 14 · Solución de problemas

Ordenado por dónde te atascaste. Cada caso trae síntoma exacto, causa,
diagnóstico, solución y **qué riesgo tiene esa solución**.

> Complementa a [`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) desde el ángulo
> del código: para cada síntoma se indica el archivo que lo produce.

---

## 1 · Instalación y arranque

### 1.1 · `ROOTCAUSE_DATA_KEY is required when DEMO_MODE=false`

| Campo | Valor |
| --- | --- |
| Causa | `DEMO_MODE=false` sin clave de datos |
| Dónde | `src/config.js` → `assertProductionConfig` |
| Diagnóstico | `echo $DEMO_MODE` y comprobar si la clave está definida |
| Solución | `node scripts/generate-key.js` y exportar el valor |
| Riesgo | **Ninguno.** Guarda la clave en un gestor de contraseñas: sin ella, los datos ya cifrados son irrecuperables |

### 1.2 · `ROOTCAUSE_DATA_KEY must decode to exactly 32 bytes`

| Campo | Valor |
| --- | --- |
| Causa | Clave escrita a mano, truncada, o con espacios al pegarla |
| Dónde | `src/infrastructure/encrypted-store.js` → `decodeDataKey` |
| Diagnóstico | Debe ser 64 caracteres hexadecimales, o base64 que decodifique a 32 bytes |
| Solución | Regenerar con el script |
| Riesgo | 🔴 **Alto si ya había estado cifrado con otra clave.** Cambiar la clave lo hace ilegible: guarda el archivo antes de tocar nada |

### 1.3 · `EADDRINUSE`

| Campo | Valor |
| --- | --- |
| Causa | El puerto ya está ocupado, a menudo por otra instancia |
| Diagnóstico | `netstat -ano` filtrado por el puerto 8787, o el comando de PowerShell de la sección 7 |
| Solución | Cerrar la otra instancia, o `PORT=8788`, o `PORT=0` |
| Riesgo | 🟡 **Dos instancias con el mismo `DATA_DIR` se pisan las escrituras.** Cerrar la otra es preferible a cambiar de puerto |

### 1.4 · `Unsupported encrypted state envelope`

| Campo | Valor |
| --- | --- |
| Causa | El archivo de estado no es un sobre válido, o su `version` o `algorithm` no coinciden |
| Dónde | `decryptJson` |
| Diagnóstico | Abrir el archivo: debe tener `version`, `algorithm`, `iv`, `tag` y `ciphertext` |
| Solución | Restaurar de una copia |
| Riesgo | 🔴 **Es evidencia.** Si el archivo está corrupto sin explicación, cópialo antes de reemplazarlo y revisa quién tuvo acceso al equipo |

### 1.5 · El descifrado falla con error de `crypto`

| Campo | Valor |
| --- | --- |
| Causa | Clave incorrecta, **o el archivo fue alterado** |
| Dónde | Verificación del tag GCM |
| Diagnóstico | Probar con la clave que se usó al crear el archivo |
| Solución | Usar la clave correcta, o restaurar de copia |
| Riesgo | 🔴 GCM no distingue «clave equivocada» de «archivo manipulado». Trata la segunda posibilidad como real hasta descartarla |

### 1.6 · El lanzador de Windows se detiene pidiendo una clave

| Campo | Valor |
| --- | --- |
| Causa | `config.cmd` fija `DEMO_MODE=false` pero no define la clave |
| Dónde | `packaging/windows/launcher/RootCause-Bitcoin-Defense.cmd` |
| Solución | Ejecutar «Generar clave de datos» y añadir la línea a `config.cmd` |
| Riesgo | Ninguno. **Es un comportamiento correcto**: prefiere no arrancar antes que arrancar sin persistencia cuando se le pidió persistencia |

---

## 2 · Uso de la API

### 2.1 · `403 MUTATION_HEADER_REQUIRED`

| Campo | Valor |
| --- | --- |
| Causa | Falta `x-rootcause-request: 1` en una mutación |
| Dónde | `src/app.js` → `validateMutationRequest` |
| Solución | Añadir la cabecera. El panel lo hace solo |
| Riesgo | **No la quites del servidor.** Es la única protección CSRF del sistema |

### 2.2 · `403 CROSS_SITE_REQUEST_REJECTED`

| Campo | Valor |
| --- | --- |
| Causa | El navegador envió `sec-fetch-site` con un valor cross-site |
| Diagnóstico | Comprobar que se accede por `http://127.0.0.1:8787` y no por otro origen |
| Solución | Usar el origen correcto |
| Riesgo | Si aparece sin explicación, **puede ser un intento real de CSRF**. Merece mirarlo antes de descartarlo |

### 2.3 · `415`

| Campo | Valor |
| --- | --- |
| Causa | Falta `content-type: application/json` |
| Solución | Añadirlo. En `curl`, `-H "content-type: application/json"` |
| Riesgo | Ninguno |

### 2.4 · `422 SECRET_MATERIAL_REJECTED`

| Campo | Valor |
| --- | --- |
| Causa | La carga contiene un campo o un valor con forma de material secreto |
| Dónde | `src/domain/secret-guard.js` |
| Diagnóstico | El mensaje indica **la ruta exacta** del campo, p. ej. `request.signers[0].mnemonic` |
| Solución | Quitar ese campo. La aplicación **no lo necesita** |
| Riesgo | 🔴 **No intentes rodearlo.** Si has llegado a enviar una semilla, considera ese canal —terminal, historial, portapapeles, logs del cliente HTTP— como expuesto |

> **Falso positivo posible:** un campo llamado, por ejemplo, `seedRound` o
> `passphraseHint` se bloquea por contener la subcadena. Es conservador a
> propósito: la respuesta correcta es renombrar el campo, no relajar el guardia.

### 2.5 · `409` al registrar una wallet

| Campo | Valor |
| --- | --- |
| Causa | Ya existe una wallet con esa huella |
| Solución | Usar la existente. **No hay endpoint de edición ni de borrado** |
| Riesgo | 🟡 Si de verdad hay que corregir una wallet mal registrada, hoy la única vía es partir de un estado nuevo |

### 2.6 · `429 RATE_LIMITED`

| Campo | Valor |
| --- | --- |
| Causa | Más de 120 peticiones en un minuto desde la misma dirección |
| Solución | Esperar 60 s, o subir `RATE_LIMIT_PER_MINUTE` |
| Riesgo | 🟡 Subirlo a 5000 o más dispara `BTC-OPSEC-007` |

### 2.7 · `404` al hacer `PATCH` sobre un incidente

| Campo | Valor |
| --- | --- |
| Causa | El identificador no casa con `/^[a-f0-9]{20}$/`, o no existe |
| Diagnóstico | `GET /api/incidents` y copiar el `id` tal cual |
| Solución | Usar el identificador correcto |
| Riesgo | Ninguno |

### 2.8 · `503 Bitcoin Core connector is not configured`

| Campo | Valor |
| --- | --- |
| Causa | `POST /api/node/refresh` sin cliente RPC construido |
| Diagnóstico | Comprobar que el proceso arrancó con `BITCOIN_RPC_URL` accesible |
| Solución | Configurar el nodo y reiniciar |
| Riesgo | Ninguno |

---

## 3 · Bitcoin Core

### 3.1 · `Remote Bitcoin RPC is disabled`

| Campo | Valor |
| --- | --- |
| Causa | `BITCOIN_RPC_URL` apunta fuera de loopback |
| Dónde | `validateRpcUrl` |
| Solución | Usar un túnel SSH hacia `127.0.0.1` |
| Riesgo | 🔴 `ALLOW_REMOTE_RPC=true` es la última opción: las credenciales RPC viajarían por la red y se dispara `BTC-OPSEC-004` |

### 3.2 · `Do not place Bitcoin RPC credentials inside the URL`

| Campo | Valor |
| --- | --- |
| Causa | URL de la forma `http://usuario:clave@host:puerto` |
| Solución | Separar las credenciales en `BITCOIN_RPC_USER` y `BITCOIN_RPC_PASSWORD`, o mejor usar la cookie |
| Riesgo | 🔴 **Si esa URL llegó a existir, la contraseña está en el historial de shell y posiblemente en logs. Rótala** |

### 3.3 · `Invalid Bitcoin Core cookie file`

| Campo | Valor |
| --- | --- |
| Causa | El archivo no contiene `usuario:contraseña` |
| Diagnóstico | Comprobar que el nodo está arrancado y que la ruta apunta al `.cookie` de su directorio de datos |
| Solución | Corregir la ruta |
| Riesgo | Ninguno |

### 3.4 · El nodo aparece «Sin conexión» en el panel

| Campo | Valor |
| --- | --- |
| Causa | Nodo apagado, RPC no habilitado, credenciales incorrectas o timeout |
| Diagnóstico | El campo `node.error` de `GET /api/summary` trae el mensaje exacto |
| Solución | Según el mensaje |
| Riesgo | 🟡 Mientras esté así, `BTC-TX-*` **no puede observar nada**: la aplicación está ciega y lo dice con `BTC-NODE-001` |

### 3.5 · `Bitcoin RPC response is too large`

| Campo | Valor |
| --- | --- |
| Causa | Una respuesta superó 2 MiB |
| Diagnóstico | Suele ser `getpeerinfo` en un nodo con muchísimos peers |
| Solución | Reducir el número de conexiones del nodo |
| Riesgo | 🟡 El límite protege la memoria del proceso; **no lo subas sin entender qué respuesta lo está superando** |

---

## 4 · Hallazgos que sorprenden

### 4.1 · `BTC-KEY-002` en un firmante que sí conozco

| Campo | Valor |
| --- | --- |
| Causa | `firmwareAtSeedCreation` quedó en `"unknown"` porque no se envió |
| Solución | Registrar la wallet con el firmware real |
| Riesgo | 🔴 **No lo rellenes con un valor inventado para silenciar el aviso.** Un dato falso aquí produce un análisis falso sobre unos fondos reales |

### 4.2 · `BTC-CUSTODY-001` en una wallet que no considero de alto valor

| Campo | Valor |
| --- | --- |
| Causa | El saldo declarado supera `HIGH_VALUE_THRESHOLD_SATS`, 0,1 BTC por defecto |
| Solución | Ajustar el umbral a tu política |
| Riesgo | 🟡 **Subirlo silencia también `BTC-OPSEC-006`.** Es una decisión de política, no un ajuste cosmético |

### 4.3 · `BTC-OPSEC-002` en modo demostración

| Campo | Valor |
| --- | --- |
| Causa | Hay saldo declarado y el modo demostración no persiste |
| Solución | Pasar a `DEMO_MODE=false` con clave |
| Riesgo | Ninguno. **Es exactamente lo que la regla pide** |

### 4.4 · `BTC-INTEL-001`: la matriz lleva mucho sin verificar

| Campo | Valor |
| --- | --- |
| Causa | Más de 30 días desde el `verifiedAt` más reciente |
| Solución | Revisar los avisos de cada fabricante del inventario y actualizar `verifiedAt` de lo contrastado |
| Riesgo | 🔴 **Actualizar la fecha sin haber contrastado silencia el aviso sin mejorar la inteligencia.** Es la forma más silenciosa de convertir el panel en una mentira |

### 4.5 · `BTC-OPSEC-008`: la cadena de auditoría no verifica

| Campo | Valor |
| --- | --- |
| Causa | Una entrada no encadena con la anterior: el historial fue modificado |
| Diagnóstico | `GET /api/audit` devuelve `brokenAt` y `reason` |
| Solución | **Preservar el archivo actual antes de tocar nada: es evidencia.** Restaurar de una copia conocida y revisar quién tuvo acceso al equipo |
| Riesgo | 🔴 **Máximo.** No lo «arregles» sobrescribiendo: destruirías la única prueba de que algo pasó |

### 4.6 · El panel muestra menos incidentes de los que hay

| Campo | Valor |
| --- | --- |
| Causa | `GET /api/summary` devuelve **solo los 20 primeros** |
| Solución | `GET /api/incidents` devuelve todos |
| Riesgo | 🟡 Con más de 20 activos, el panel no es la lista completa. Es una limitación conocida |

### 4.7 · Un hallazgo reconocido sigue contando en el riesgo

| Campo | Valor |
| --- | --- |
| Causa | **Comportamiento correcto.** `summary()` cuenta como activos `open` y `acknowledged` |
| Solución | Ninguna. Desaparecerá cuando la condición deje de cumplirse |
| Riesgo | Ninguno. Reconocer documenta que alguien lo vio; **no apaga el problema** |

---

## 5 · Pruebas y CI

### 5.1 · Falla el trabajo `solo-local`

| Campo | Valor |
| --- | --- |
| Causa | Apareció `node_modules`, un lockfile ajeno, una dependencia o un origen remoto |
| Diagnóstico | El mensaje nombra el archivo y el especificador |
| Solución | Retirar la dependencia o el recurso externo |
| Riesgo | 🔴 **No relajes el script.** Es el claim central de distribución del producto |

### 5.2 · Falla el trabajo `documentacion`

| Campo | Valor |
| --- | --- |
| Causa | Un enlace roto, un problema de estilo, o una ficha de regla editada a mano |
| Diagnóstico | `node scripts/check-docs.js` y `node scripts/check-doc-style.js` |
| Solución | Corregir el enlace, o regenerar con `node scripts/generate-rule-docs.js` |
| Riesgo | Ninguno |

### 5.3 · `Las fichas de regla no coinciden con el catálogo`

| Campo | Valor |
| --- | --- |
| Causa | Alguien editó `docs/reglas/` o `landing/reglas.html` a mano |
| Solución | `node scripts/generate-rule-docs.js` y volver a comprometer |
| Riesgo | 🟡 Si el cambio manual era intencionado, hay que llevarlo a `config/rules-catalog.json`, **no al archivo generado** |

### 5.4 · `El plugin no coincide con su fuente en .claude/`

| Campo | Valor |
| --- | --- |
| Causa | Se editó `plugin/`, que es una copia generada |
| Solución | Editar `.claude/` y ejecutar `node scripts/sync-plugin.js` |
| Riesgo | Ninguno |

### 5.5 · `Version desincronizada`

| Campo | Valor |
| --- | --- |
| Causa | `package.json` y la cadena `version` de `src/api/router.js` difieren |
| Solución | Actualizar **los dos** |
| Riesgo | 🟡 Es fácil olvidarlo al subir de versión. El release aborta si el tag tampoco coincide |

### 5.6 · `check-runtime-advisories.js` falla sin red

| Campo | Valor |
| --- | --- |
| Causa | No se pudo descargar la base del Node.js Security WG |
| Solución | Con red, reintentar. Sin red, `--offline-ok` **declara cobertura 0 %** y sale con 0 |
| Riesgo | 🔴 `--offline-ok` **no es un aprobado**. Es una comprobación que no se hizo, y así lo dice |

### 5.7 · Falla el trabajo `app-windows`

| Campo | Valor |
| --- | --- |
| Causa | El empaquetado, el arranque o la comprobación de inventario fallaron |
| Diagnóstico | El mensaje distingue los tres casos |
| Solución | Si dice *«El paquete arranco sin inventario»*, el contenido no viajó dentro: revisar la lista de directorios que copia `build-portable.ps1` |
| Riesgo | 🔴 **Nunca publiques saltándote este paso.** Existe justamente para atrapar el binario que se instala vacío |

---

## 6 · Empaquetado

### 6.1 · `El runtime descargado NO coincide con su hash oficial`

| Campo | Valor |
| --- | --- |
| Causa | La descarga se corrompió, **o fue manipulada** |
| Solución | Reintentar |
| Riesgo | 🔴 **Si se repite, no lo ignores.** Un runtime que no coincide con su hash oficial es exactamente lo que este control existe para detectar |

### 6.2 · `El paquete incluye algo que no debe distribuirse`

| Campo | Valor |
| --- | --- |
| Causa | Apareció `data`, `node_modules`, `.env` o `.git` en la carpeta ensamblada |
| Solución | Limpiar el árbol antes de empaquetar |
| Riesgo | 🔴 **Es el control que impide distribuir tus propios datos o tu clave.** No lo desactives |

### 6.3 · `No se pudo comprimir el paquete portable`

| Campo | Valor |
| --- | --- |
| Causa | `node.exe` sigue bloqueado tras el arranque de verificación, a menudo por el antivirus |
| Solución | El script **ya reintenta cinco veces con tres segundos de espera**. Si aun así falla, cerrar procesos `node` residuales |
| Riesgo | Ninguno |

---

## 7 · Comandos útiles de diagnóstico

```bash
curl -s http://127.0.0.1:8787/api/health
curl -s http://127.0.0.1:8787/api/posture
curl -s http://127.0.0.1:8787/api/audit
```

```bash
node scripts/audit-bitcoin.js --stages=9,10,11
node scripts/audit-bitcoin.js --json
node scripts/check-doc-style.js --json
node scripts/check-history-secrets.js --staged
```

En Windows, comprobar qué proceso ocupa el puerto:

```powershell
Get-NetTCPConnection -LocalPort 8787 | Select-Object OwningProcess, State
```

---

## 8 · Cuándo parar y pedir ayuda

| Situación | Por qué no seguir solo |
| --- | --- |
| `BTC-OPSEC-008` sin explicación | El historial fue modificado. **Preserva el archivo** y revisa el acceso al equipo antes de nada |
| `BTC-TX-002` o `BTC-TX-003` en una wallet real | Es un patrón de extracción activa. Sigue [`../RUNBOOK-MIGRATION.md`](../RUNBOOK-MIGRATION.md) y no improvises |
| Descifrado que falla con la clave correcta | Trata el archivo como manipulado hasta descartarlo |
| El hash del runtime no coincide repetidamente | Puede no ser un problema de red |
| Has enviado una semilla a algún sitio | Considera esa semilla comprometida. **Migrar, no confiar en que no pasó nada** |

---

| Siguiente | |
| --- | --- |
| Riesgos y deuda técnica | [`15-risks-and-technical-debt.md`](15-risks-and-technical-debt.md) |
| Volver al índice | [`README.md`](README.md) |
