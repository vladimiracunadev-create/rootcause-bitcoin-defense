# Estrategia de pruebas

Qué se prueba, por qué esas cosas y no otras, y cómo reproducir en local
exactamente lo que corre en CI.

La idea que gobierna todo el archivo: **este producto se define por lo que se
niega a hacer**, así que las pruebas más valiosas no comprueban que algo
funcione, sino que algo sigue siendo imposible.

---

## Las siete puertas

| Puerta | Comando | Naturaleza |
|---|---|---|
| Validación del repositorio | `node scripts/validate-repo.js` | Estructural |
| Claim solo-local | `node scripts/check-local-only.js` | Estructural |
| Coherencia documental | `node scripts/check-docs.js` | Estructural |
| Estilo visual de la documentación | `node scripts/check-doc-style.js` | Estructural |
| Fichas de regla sincronizadas | `node scripts/generate-rule-docs.js --check` | Estructural |
| Fichas de regla al día | `node scripts/generate-rule-docs.js --check` | Estructural |
| Pruebas | `node --test` | Unitarias e integración |
| Invariantes de seguridad | `node scripts/check-security-claims.js` | **Ejecuta la aplicación real** |

Las siete, en orden, con un solo comando:

~~~bash
pnpm check
~~~

---

## Pruebas automatizadas (`node --test`)

69 pruebas, sin framework externo, repartidas en 13 archivos:

| Archivo | Cubre |
|---|---|
| `test/incident-lifecycle.test.js` | El ciclo de vida completo de un incidente —conservación del historial, supervivencia del reconocimiento, resolución automática y reapertura— y la reparación de un estado al que le falten colecciones |
| `test/api.test.js` | Salud y resumen, cabecera de mutación obligatoria, rechazo de campos secretos, registro de procedencia pública y re-análisis |
| `test/rule-engine.test.js` | Firmware vulnerable y concentración single-sig en el estado demo; gasto no aprobado; gasto con aprobación conocida (**el caso que NO debe saltar**); nodo no disponible |
| `test/firmware.test.js` | Parseo de versiones con sufijos de fabricante, comparación numérica, coincidencia por modelo y canal |
| `test/secret-guard.test.js` | Campos prohibidos a cualquier profundidad, procedencia pública aceptada, redacción para auditoría |
| `test/encrypted-store.test.js` | Cifrado y descifrado AES-256-GCM, fallo con clave distinta, escritura atómica sin metadatos en claro |
| `test/audit-log.test.js` | Cadena de hashes íntegra y detección de una entrada modificada |
| `test/bitcoin-rpc.test.js` | Rechazo de RPC remoto, rechazo de métodos fuera de la allowlist, normalización del snapshot |
| `test/bitcoin-forensics.test.js` | Cantidades exactas, conjunto UTXO, change, fees, historia, reconciliación dinámica, cinco artefactos y selección conceptual de monedas |
| `test/desktop-launch.test.js` | El navegador no se abre sin petición explícita ni con bind no-loopback |
| `test/posture.test.js` | Los ocho controles `BTC-OPSEC`: bind, modo demostración, clave débil, RPC remoto y estático, watchtower, auditoría rota, y el matiz del contenedor |
| `test/attack-patterns.test.js` | Barrido, ráfaga, correlación proveedor↔inventario, frescura de la matriz y quorum N-de-N — cada uno con su caso que **no** debe activarse |
| `test/rules-catalog.test.js` | Que el catálogo de reglas y el motor tengan **exactamente** los mismos códigos, y que ninguna ficha se publique sin umbral, evidencia, remediación ni la sección «qué NO significa» |

### El patrón de las parejas

Casi toda regla se prueba dos veces: **una vez que debe activarse y otra que no
debe**. Un motor de reglas que solo se prueba con casos positivos acaba
disparando ante todo, y un detector que grita siempre es indistinguible de uno
apagado.

Ejemplos: `BTC-TX-001` se prueba con un gasto sin aprobación (salta) y con uno
con `approvalHash` conocido (no salta); el guardia de secretos se prueba
rechazando `mnemonic` y aceptando `firmwareAtSeedCreation`, que son campos
parecidos de nombre y opuestos de naturaleza.

---

## Invariantes de seguridad (la puerta que importa)

`scripts/check-security-claims.js` no lee el código: **lo ejecuta**. Levanta el
servidor en un puerto libre y lo golpea con peticiones hostiles.

Comprobaciones estáticas:

1. La allowlist RPC no contiene ningún método capaz de firmar, enviar, importar,
   exportar, desbloquear o parar el nodo.
2. Sigue conteniendo los métodos de lectura imprescindibles.
3. `validateRpcUrl` rechaza un destino remoto sin permiso explícito.
4. `validateRpcUrl` rechaza credenciales incrustadas en la URL.
5. Los valores por defecto siguen siendo conservadores: bind loopback, RPC
   remoto desactivado, watchtower apagado, modo demostración.

Comprobaciones con la aplicación en marcha:

6. `/api/health` responde y se identifica.
7. El panel se sirve.
8. La cabecera CSP servida es `self`, sin `unsafe-inline`.
9. `x-frame-options: DENY`.
10. Una mutación sin cabecera local recibe `403`.
11. Una mutación `sec-fetch-site: cross-site` recibe `403`.
12–16. Cinco cargas con material secreto —`seed`, `mnemonic` anidado dentro de
    un firmante, `recovery_phrase` en metadatos, `passphrase` y una cadena con
    forma de `xprv` en un campo de notas libre— reciben `422
    SECRET_MATERIAL_REJECTED`.
17. Una carga de procedencia **pública** se acepta con `201`, para probar que el
    guardia protege sin bloquear el uso legítimo.

Total: 20 comprobaciones. Si alguna falla, el informe nombra el invariante
exacto.

> **Este fallo no se arregla nunca ajustando la prueba.** Si un invariante cae,
> o el código cambió indebidamente o la promesa del README dejó de ser cierta.

---

## Verificación del artefacto de Windows

Un binario que compila y pesa lo esperado puede instalarse vacío. La cadena de
verificación tiene tres eslabones, y ninguno se fía del anterior:

| Momento | Qué se hace | Qué detecta |
|---|---|---|
| **Al empaquetar** | `build-portable.ps1` arranca la aplicación con el `node.exe` empaquetado y corre los invariantes | Un paquete al que le falte código o configuración |
| **En cada push** | El job `app-windows` ejecuta el lanzador `.cmd` real y pide `/api/health`, el panel y `/api/summary` | Un lanzador roto o una app que abre sin inventario |
| **En cada release** | Se instala el `.exe` en silencio y se arranca la aplicación **instalada** | Un instalador que copia mal o deja fuera archivos |

La comprobación `totals.wallets >= 1` es deliberada: es el fallo clásico —todo
verde, aplicación instalada, y al abrirla no hay nada dentro.

---

## Reproducir el CI en local

~~~bash
# Lo mismo que corre el job "calidad"
node scripts/validate-repo.js && node --test

# Lo mismo que corre "solo-local"
node scripts/check-local-only.js

# Lo mismo que corre "invariantes"
node scripts/check-security-claims.js

# Lo mismo que corre "documentacion"
node scripts/check-docs.js
~~~

~~~powershell
# Lo mismo que corre "app-windows"
powershell -File packaging/windows/make-icon.ps1
powershell -File packaging/windows/build-portable.ps1
~~~

Y los workflows en sí:

~~~bash
actionlint .github/workflows/*.yml
~~~

---

## Qué NO se prueba automáticamente

Honestidad también aquí:

- **La conexión real con Bitcoin Core.** Las pruebas usan un `fetch` simulado.
  Para probar contra un nodo de verdad está el laboratorio `regtest`.
- **La interfaz del panel.** No hay pruebas de navegador; el panel se revisa a
  mano. Su superficie es pequeña y no tiene lógica de decisión: las reglas viven
  en el servidor.
- **El instalador en Windows 10.** CI usa `windows-latest`.
- **La exactitud de la matriz de avisos.** Ningún test puede saber si un aviso
  del fabricante cambió; eso es tarea humana y periódica
  ([`OPERACION.md`](OPERACION.md)).

---

## Añadir pruebas

1. Un archivo por módulo, en `test/`, con `node:test` y `node:assert/strict`.
2. Sin dependencias. Sin excepciones.
3. Para una regla nueva, escribe **las dos pruebas**: la que activa y la que no.
4. Nada de `test.only`: `validate-repo.js` lo detecta y rompe el build.
5. Si la prueba toca una promesa pública del producto, su sitio es
   `check-security-claims.js`, no `test/`. Ahí es donde miran quienes auditan.
