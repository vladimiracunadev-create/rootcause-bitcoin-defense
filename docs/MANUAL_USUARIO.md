# Manual de usuario

Cómo se usa el producto, pantalla por pantalla. Vale igual para las dos formas
de ejecutarlo, porque **son la misma aplicación**:

| Forma de ejecutarlo | Cómo se arranca | A quién sirve |
|---|---|---|
| **Aplicación de Windows** | Doble clic en el acceso directo | Uso normal, sin saber qué es Node |
| **Panel local (localhost)** | `pnpm start` desde el código | Desarrollo, Linux, macOS, auditoría |

En ambos casos el panel vive en `http://127.0.0.1:8787` y nada sale de tu
máquina. Si no conoces el vocabulario, ten a mano el
[glosario](GLOSARIO.md); si el tema te resulta completamente nuevo, empieza por
[`MANUAL_PARA_NOVATOS.md`](MANUAL_PARA_NOVATOS.md).

---

## Parte 1 — Arrancar

### 1.a Versión Windows

1. Descarga el instalador o el ZIP portable desde
   [Releases](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/releases).
2. **Verifica el hash** contra `SHA256SUMS.txt` antes de ejecutar nada:

   ~~~powershell
   Get-FileHash .\RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe -Algorithm SHA256
   ~~~

3. Instálalo (no pide permisos de administrador) o descomprime el ZIP.
4. Abre **RootCause Bitcoin Defense**. Se abre una ventana de consola y, un
   segundo después, tu navegador en el panel.
5. **Para detenerlo: cierra la ventana de consola.** No hay icono en la bandeja
   ni servicio en segundo plano; cuando la ventana se cierra, no queda nada
   corriendo.

Detalles de instalación, rutas y configuración: [`../docs/WINDOWS-APP.md`](WINDOWS-APP.md).

### 1.b Panel local desde el código

~~~bash
corepack enable
pnpm start
~~~

Abre `http://127.0.0.1:8787`. Funciona igual en Windows, Linux y macOS.

### 1.c Lo que verás la primera vez

Arranca en **modo demostración**: datos ficticios, todo en memoria, nada escrito
en disco. La insignia junto al título lo dice. Es el modo correcto para
aprender: puedes tocar todo sin consecuencias.

---

## Parte 2 — Las cinco vistas

### ◫ Resumen — *Panorama de riesgo*

Lo primero que ves. Tiene tres bloques:

**El anillo de riesgo (0 a 100).**

| Puntaje | Nivel | Qué significa |
|---|---|---|
| 0 | Despejado | Ninguna regla se activó |
| 1–34 | Bajo | Hay algo anotado, nada urgente |
| 35–64 | Medio | Merece una revisión esta semana |
| 65–84 | Alto | Hay un hallazgo grave abierto |
| 85–100 | Crítico | Hay al menos un hallazgo crítico |

El puntaje **no es una probabilidad de robo**. Se calcula tomando el hallazgo
más grave y sumándole un 8 % del peso de cada hallazgo adicional. Sirve para
comparar el mismo inventario a lo largo del tiempo, no para compararte con otro.

**Las métricas.** Wallets, firmantes, incidentes abiertos, críticos, saldo
vigilado y estado del nodo. Un `—` en el nodo significa «no consultado», no
«todo bien».

**Incidentes abiertos.** Los hallazgos vivos, ordenados por severidad.

El botón **Analizar ahora** vuelve a ejecutar las reglas sobre el estado actual.
Es idempotente: un mismo problema no genera un incidente nuevo cada vez, sino
que actualiza el existente (`lastSeenAt`).

### ◇ Custodia — *Wallets y firmantes*

El inventario. Cada tarjeta muestra la huella de la wallet, su tipo
(`single-sig` o `multisig`), el quorum, el saldo vigilado y sus firmantes con la
versión de firmware **con la que se creó la semilla**.

Debajo está el formulario **Registrar wallet watch-only**. Lo que se pide:

| Campo | Ejemplo | Nota |
|---|---|---|
| Nombre | `Tesorería fría` | Solo para que tú la reconozcas |
| Huella | `D15EA5ED` | 8 caracteres hexadecimales |
| Red | `mainnet` · `testnet` · `signet` · `regtest` | |
| Tipo | `single-sig` · `multisig` | |
| Saldo (sats) | `250000000` | Aproximado, para evaluar el umbral |
| Quorum | `2` de `3` | Debe cuadrar con el número de firmantes |
| Firmante: fabricante, modelo, firmware al crear la semilla, track, origen de entropía | `COLDCARD`, `Mk4`, `5.4.1`, `standard`, `device` | Entre 1 y 5 firmantes |

**Nunca se pide una semilla, una passphrase ni una clave.** Si intentas
enviarlas por la API, la aplicación responde `422 SECRET_MATERIAL_REJECTED` y no
guarda nada. Eso está comprobado en cada build.

Si no sabes qué firmware tenía el dispositivo cuando creaste la semilla,
escribe `unknown`: la aplicación levantará el hallazgo `BTC-KEY-002`, que es
exactamente la respuesta correcta. **Un «no lo sé» registrado vale más que un
dato inventado.**

### △ Incidentes — *Incidentes y evidencia*

La tabla de todo lo detectado. Cada incidente trae:

- **código y severidad** (`BTC-KEY-001`, crítico);
- **explicación** en lenguaje llano;
- **causa raíz**, que es distinta del síntoma;
- **evidencia**: los datos concretos que lo sostienen;
- **remediación**: los pasos, tomados del aviso del fabricante cuando existe.

Puedes marcarlo como **reconocido** (lo estás atendiendo) o **resuelto**. Ambas
acciones quedan escritas en la auditoría con actor y fecha. Un incidente
resuelto que vuelve a detectarse reaparece: la aplicación no te deja tapar un
problema que sigue ahí.

### ◎ Inteligencia — *Inteligencia de vulnerabilidades*

Los avisos de seguridad versionados, con su fecha de publicación, su fecha de
verificación y el rango exacto de modelos y firmware afectados. Hoy incluye el
defecto de entropía de COLDCARD y la filtración logística de Trezor.

**Esta matriz tiene fecha y hay que mantenerla.** Un aviso sin actualizar es una
falsa tranquilidad; por eso cada entrada muestra su `verifiedAt`.

### ⌁ Laboratorio — *Laboratorio de incidentes*

Un botón que simula un gasto no aprobado desde una wallet vigilada, con un txid
ficticio. Sirve para ver el ciclo completo —detección, incidente, evidencia,
runbook— sin usar direcciones, claves ni fondos reales.

Úsalo la primera vez. Entender cómo se ve una alerta **antes** de necesitarla es
la mitad del trabajo.

---

## Parte 3 — Pasar a datos reales

Mientras estés en modo demostración, nada de lo que hagas se guarda. Para usarlo
en serio hacen falta dos cosas: una clave de datos y decirle que salga del modo
demostración.

### 3.a Generar la clave de datos

**Windows:** menú Inicio → *Generar clave de datos*.

**Desde el código:**

~~~bash
pnpm generate:data-key
~~~

Guarda el valor en tu gestor de contraseñas. **No es una clave de Bitcoin y no
controla fondos**, pero si la pierdes, el archivo cifrado no se puede recuperar.

### 3.b Activarla

**Windows** — crea `%LOCALAPPDATA%\RootCause\bitcoin-defense\config.cmd`:

~~~bat
set "DEMO_MODE=false"
set "ROOTCAUSE_DATA_KEY=el-valor-generado"
~~~

**Desde el código:**

~~~bash
DEMO_MODE=false ROOTCAUSE_DATA_KEY="el-valor-generado" pnpm start
~~~

El estado pasa a cifrarse con AES-256-GCM. Si activas `DEMO_MODE=false` sin
clave, la aplicación se niega a arrancar y te explica por qué, en vez de guardar
tus datos en claro.

### 3.c Conectar tu nodo (opcional)

Solo si tienes Bitcoin Core en la misma máquina. Lo preferible es la cookie:

~~~bat
set "BITCOIN_RPC_URL=http://127.0.0.1:8332"
set "BITCOIN_RPC_COOKIE_FILE=C:\Users\tu-usuario\AppData\Roaming\Bitcoin\.cookie"
set "WATCHTOWER_ENABLED=true"
~~~

La aplicación solo puede invocar 11 métodos de lectura. Cualquier método de
firma, envío o desbloqueo se rechaza **antes** de hacer la petición. El
watchtower está apagado por defecto: no consulta nada hasta que tú lo enciendes.

---

## Parte 4 — Qué hacer cuando algo se pone rojo

El detalle está en [`OPERACION.md`](OPERACION.md), pero el resumen es corto:

| Hallazgo | Lo primero |
|---|---|
| `BTC-KEY-001` — firmware afectado | **Deja de generar direcciones nuevas** en esa wallet. Actualizar el firmware no repara la semilla. Planifica migración con [`RUNBOOK-MIGRATION.md`](RUNBOOK-MIGRATION.md). |
| `BTC-KEY-002/003` — procedencia desconocida | No es una emergencia. Reconstruye el historial; si no puedes demostrarlo, trátalo como sospechoso. |
| `BTC-CUSTODY-001` — todo bajo una sola clave | Migrar a multisig con fabricantes distintos, con calma y con transacción de prueba. |
| `BTC-CUSTODY-002` — multisig sin diversidad | Sustituye firmantes hasta tener al menos dos fabricantes independientes. |
| `BTC-TX-001` — gasto sin aprobación | Es el caso urgente. Preserva evidencia, deniega nuevas autorizaciones, verifica en un segundo nodo y asume que la clave puede estar comprometida. |
| `BTC-NODE-*` | Problema de observación, no de tus fondos. Revisa el nodo. |
| `BTC-PRIVACY-001` | Revoca sesión, preserva registros y espera phishing dirigido. |

**Regla que no se salta nunca:** ninguna migración de fondos se hace solo con lo
que dice una pantalla. Se verifica en dispositivos independientes y se prueba
con una cantidad pequeña primero.

---

## Parte 5 — Preguntas que salen siempre

**¿Esto guarda mis bitcoins?** No. No hay fondos dentro. Es un inventario y un
detector.

**¿Puede robarme si lo instalo?** Nunca recibe material secreto, y el panel no
puede pedir nada a un servidor externo: la CSP lo prohíbe y CI lo verifica en
cada cambio. Lee [`POLITICA_DE_PRIVACIDAD_LOCAL.md`](POLITICA_DE_PRIVACIDAD_LOCAL.md).

**¿Necesito un nodo?** No. Sin nodo funcionan el inventario, los avisos y las
reglas de custodia; las reglas `BTC-NODE-*` y la vigilancia de gastos requieren
nodo.

**¿Puede cancelar una transacción?** No. Nadie puede. Una transacción confirmada
es definitiva.

**¿Sirve para saber si mi semilla es débil mirando mi dirección?** No, y
desconfía de quien diga lo contrario. Hace falta procedencia verificable.

**¿Funciona sin Internet?** Sí, y es lo esperable. Solo necesita red si conectas
un nodo remoto por túnel, cosa que está desactivada por defecto.

**¿Y si quiero borrarlo todo?** Desinstala o borra la carpeta, y borra a mano
`%LOCALAPPDATA%\RootCause\bitcoin-defense`. Se conserva a propósito al
desinstalar: borrar estado cifrado sin preguntar sería una pérdida irreversible.

---

Siguientes lecturas: [`OPERACION.md`](OPERACION.md) para el día a día,
[`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) si algo no arranca y
[`LIMITACIONES.md`](LIMITACIONES.md) para saber exactamente dónde termina lo que
este producto puede prometer.
