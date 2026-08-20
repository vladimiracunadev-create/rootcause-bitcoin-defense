# Heurísticas: especificación de las reglas

Las once reglas del motor, con su condición exacta, su severidad, la evidencia
que adjuntan y —lo más importante— **qué no significan**. Fuente:
[`src/domain/rule-engine.js`](../src/domain/rule-engine.js).

Una regla aquí no es una alarma: es una afirmación causal que debe poder
defenderse con la evidencia que adjunta.

---

## Cómo se construye un hallazgo

Cada activación produce un objeto con:

| Campo | Contenido |
|---|---|
| `id` | `sha256(código \| entidad \| discriminante)`, 20 caracteres. **Determinista**: el mismo problema produce el mismo id en cada análisis, así que no se duplican incidentes |
| `code` | `BTC-KEY-001`, `BTC-CUSTODY-002`… |
| `severity` | `critical` · `high` · `medium` · `low` · `info` |
| `title` | Una línea |
| `explanation` | Qué ocurre, en lenguaje llano |
| `rootCause` | **Por qué** ocurre. Distinto del síntoma |
| `evidence` | Datos concretos, siempre públicos |
| `remediation` | Pasos. Del aviso del fabricante cuando existe |

El `id` determinista es lo que permite que `POST /api/scan` sea idempotente: un
problema que sigue ahí actualiza su `lastSeenAt` en vez de crear un incidente
nuevo cada vez que pulsas *Analizar*.

## Puntaje de riesgo

Definido en [`src/domain/risk.js`](../src/domain/risk.js):

| Severidad | Peso |
|---|---|
| `critical` | 100 |
| `high` | 75 |
| `medium` | 45 |
| `low` | 20 |
| `info` | 5 |

~~~text
puntaje = min(100, redondear(peso_máximo + Σ(otros_pesos × 0,08)))
~~~

Se toma el hallazgo más grave y se le suma un 8 % de cada uno de los demás.
Cinco problemas medianos **no** equivalen a uno crítico, y eso es deliberado: la
gravedad no se acumula linealmente.

| Puntaje | Nivel |
|---|---|
| 0 | `clear` |
| 1–34 | `low` |
| 35–64 | `medium` |
| 65–84 | `high` |
| 85–100 | `critical` |

**El puntaje no es una probabilidad.** Sirve para comparar el mismo inventario
en el tiempo.

---

## Familia BTC-KEY — procedencia de la semilla

### `BTC-KEY-001` · Semilla creada con firmware afectado

- **Severidad:** `critical`, siempre.
- **Condición:** un firmante coincide con un aviso activo de
  `config/advisories.json`: mismo fabricante, modelo en la lista, canal
  (`standard`/`edge`) coincidente y `firmwareAtSeedCreation` dentro del rango
  afectado.
- **Comparación de versiones:** numérica por componentes, con sufijos de
  fabricante (`5.4.1`, `6.6.0X`, `1.5.0Q`) — ver
  [`src/domain/firmware.js`](../src/domain/firmware.js). Se comparan números, no
  cadenas: `4.10.0` es mayor que `4.9.0`.
- **Discriminante:** `advisoryId + firmante`, de modo que dos avisos distintos
  sobre el mismo firmante son dos hallazgos.
- **Evidencia:** huellas de wallet y firmante, fabricante, modelo, firmware al
  crear la semilla, canal, id del aviso.
- **Qué NO significa:** no significa que tus fondos se hayan movido, ni que
  vayan a moverse hoy. Significa que la semilla nació de un proceso con un
  defecto publicado.
- **Trampa habitual:** actualizar el firmware **no** cierra este hallazgo, y no
  debe cerrarlo. La semilla ya existente sigue siendo la que es.

### `BTC-KEY-002` · Firmware de creación desconocido

- **Severidad:** `high` si la wallet supera el umbral de alto valor; `medium` si
  no.
- **Condición:** `firmwareAtSeedCreation` ausente o igual a `unknown`.
- **Por qué existe:** la ausencia de dato **es** un hallazgo. Si no puedes
  demostrar con qué firmware nació una clave, no puedes descartar ningún aviso
  presente ni futuro.
- **Qué NO significa:** no acusa al dispositivo. Acusa a la trazabilidad.

### `BTC-KEY-003` · Origen de entropía desconocido

- **Severidad:** `medium`.
- **Condición:** `seedOrigin === "unknown"`. Valores válidos: `device`, `dice`,
  `external`, `unknown`.
- **Remediación:** documentar si la semilla la generó el dispositivo, se importó
  o se creó con una fuente independiente.
- **Advertencia explícita en la remediación:** no se puede inferir la calidad de
  la entropía observando direcciones públicas.

---

## Familia BTC-CUSTODY — arquitectura de custodia

### `BTC-CUSTODY-001` · Fondos de alto valor dependen de una sola clave

- **Severidad:** `critical`.
- **Condición:** `balanceSats >= highValueThresholdSats` **y**
  `walletType === "single-sig"`.
- **Umbral:** `HIGH_VALUE_THRESHOLD_SATS`, por defecto `10 000 000` sats
  (0,1 BTC). Configurable por entorno y en `config/policies.json`.
- **Causa raíz declarada:** la arquitectura no contiene el compromiso de un
  único firmante.
- **Qué NO significa:** single-sig no es «inseguro» en abstracto. La regla habla
  de **concentración por encima de un umbral que tú defines**.

### `BTC-CUSTODY-002` · Multisig sin diversidad de implementación

- **Severidad:** `high` si es de alto valor; `medium` si no.
- **Condición:** `walletType === "multisig"` y `quorum.independentVendors < 2`.
  El número de fabricantes independientes se calcula al registrar la wallet,
  contando fabricantes distintos entre los firmantes.
- **Causa raíz:** un fallo común de firmware podría afectar a varios firmantes a
  la vez, y entonces el quorum no protege de nada.
- **El caso que persigue:** un 2-de-3 con tres dispositivos del mismo modelo y
  el mismo firmware. Sobre el papel hay tres llaves; en la práctica hay un solo
  punto de fallo.

---

## Familia BTC-TX — gasto observado

### `BTC-TX-001` · Gasto observado sin aprobación conocida

- **Severidad:** `critical`.
- **Condición:** el evento marca `spendsWatchedWallet` **y** su `approvalHash`
  no coincide con ninguna aprobación registrada en `state.approvals`.
- **Modelo:** la aplicación no decide si una transacción es «legítima». Compara
  contra las aprobaciones que **tú** registraste por `POST /api/approvals`. Sin
  aprobación registrada, todo gasto es un hallazgo.
- **Falso positivo esperable:** un gasto legítimo que nadie registró. Es el
  precio de la regla, y es el precio correcto: preferimos preguntar por un gasto
  legítimo que callar ante uno que no lo es.
- **Evidencia:** txid, wallet, momento de observación, fuente.

---

## Familia BTC-NODE — salud de la observación

Estas cuatro reglas **no hablan de tus fondos**: hablan de si la aplicación está
viendo la realidad o está ciega.

### `BTC-NODE-001` · Bitcoin Core no disponible

- **Severidad:** `high`.
- **Condición:** la conexión RPC falla.
- **Corta el resto:** si el nodo no responde, no se evalúan las demás reglas de
  nodo. No tendría sentido opinar sobre datos que no existen.

### `BTC-NODE-002` · Nodo todavía no sincronizado

- **Severidad:** `medium`.
- **Condición:** `initialBlockDownload` verdadero **o**
  `verificationProgress < 0.999`.

### `BTC-NODE-003` · Nodo sin peers

- **Severidad:** `high`.
- **Condición:** `connections === 0`.
- **Por qué es `high` y no `medium`:** un nodo aislado puede mostrar una punta
  antigua y hacerte creer que no ha pasado nada.

### `BTC-NODE-004` · Presión elevada de mempool

- **Severidad:** `medium`.
- **Condición:** `mempoolUsageBytes / mempoolMaxBytes >= 0,9`.
- **Remediación:** revisar la política de tarifas **sin modificarla
  automáticamente**, y correlacionar cualquier transacción desaparecida con un
  reemplazo o una expulsión del mempool.

---

## Familia BTC-PRIVACY — datos personales

### `BTC-PRIVACY-001` · Acceso masivo a datos de clientes

- **Severidad:** `critical` si el acceso no estaba autorizado; `medium` si lo
  estaba.
- **Condición:** evento de tipo `bulk_customer_data_access`.
- **Por qué está en un producto de Bitcoin:** el incidente de Trezor de agosto
  de 2026 no expuso ni una clave, y aun así elevó el riesgo real de sus
  usuarios: con nombre, teléfono y dirección, el phishing deja de ser genérico y
  pasa a ser creíble.
- **Remediación:** revocar sesión, preservar registros, revisar minimización y
  vencimiento, y **no guardar identidad personal y titularidad de wallet en el
  mismo dominio de confianza**.

---

## Lo que deliberadamente NO se detecta

Para que el mapa sea honesto, conviene decir qué no hay:

- **Análisis de cadena o de UTXO.** No se examina la historia de las monedas.
- **Detección de reutilización de direcciones.** Anotado en el roadmap.
- **Verificación de descriptores.** Requiere soporte de descriptores.
- **Nonces débiles en firmas históricas.** Exigiría análisis criptográfico de
  transacciones pasadas; queda explícitamente fuera de alcance.
- **Cualquier juicio sobre la entropía real de una semilla a partir de datos
  públicos.** No es una limitación de implementación: no se puede.

El mapa completo de alcance está en
[`DETECCION_AMENAZAS.md`](DETECCION_AMENAZAS.md) y los límites en
[`LIMITACIONES.md`](LIMITACIONES.md).

---

## Añadir una regla

1. Escríbela en `src/domain/rule-engine.js` devolviendo `makeFinding(...)` con
   causa raíz y remediación **reales**; una regla sin remediación es ruido.
2. Añade su caso en `test/rule-engine.test.js`, con un caso que la active y otro
   que **no** la active. El segundo importa tanto como el primero.
3. Documenta el código nuevo en este archivo y en la tabla del `README.md`.
4. `pnpm check` debe seguir en verde.
