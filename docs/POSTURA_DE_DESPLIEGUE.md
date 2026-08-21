# Postura de despliegue

La aplicación se audita a sí misma. Las familias `BTC-KEY`, `BTC-CUSTODY` y
`BTC-TX` miran las wallets del operador; la familia **`BTC-OPSEC`** mira la
instalación: dónde escucha, si cifra, cómo habla con el nodo, si vigila y si su
propio registro sigue íntegro.

Es la diferencia entre «tus claves tienen un problema» y «la herramienta con la
que miras tus claves tiene un problema». La segunda no suele mirarla nadie.

## ⚡ Cómo se consulta

```bash
curl http://127.0.0.1:8787/api/posture
```

La postura se calcula **en el momento**, con la configuración del proceso que
está corriendo: no se guarda en disco porque no describe el estado, describe el
arranque. También entra en el análisis general, así que sus hallazgos aparecen
junto a los demás en el panel y en `/api/summary`.

```json
{
  "deployment": {
    "mode": "persistent",
    "host": "127.0.0.1",
    "watchtowerEnabled": true,
    "remoteRpcAllowed": false,
    "rpcAuth": "cookie"
  },
  "risk": { "score": 0, "level": "clear", "counts": { "critical": 0 } },
  "findings": []
}
```

## 🚦 Los ocho controles

| Código | Control | Severidad |
| --- | --- | --- |
| `BTC-OPSEC-001` | El panel escucha fuera de loopback | 🔴 Crítica · 🟡 media en contenedor |
| `BTC-OPSEC-002` | Inventario con saldo en modo demostración | 🟡 Media |
| `BTC-OPSEC-003` | Clave de datos por debajo del mínimo | 🟠 Alta bajo 64 bits · 🟡 media hasta 128 |
| `BTC-OPSEC-004` | RPC remoto habilitado | 🟠 Alta |
| `BTC-OPSEC-005` | RPC con usuario y contraseña en vez de cookie | 🟡 Media |
| `BTC-OPSEC-006` | Watchtower apagado con wallets de alto valor | 🟡 Media |
| `BTC-OPSEC-007` | Límites de petición relajados | ⚪ Baja |
| `BTC-OPSEC-008` | La cadena de auditoría no verifica | 🔴 Crítica |


### `BTC-OPSEC-001` · El panel escucha fuera de loopback

**Crítico** fuera de contenedor · **medio** dentro.

El producto no tiene autenticación porque asume un único operador en `127.0.0.1`.
Con `HOST=0.0.0.0`, cualquiera en la red ve el inventario de wallets y saldos.

Dentro de un contenedor el bind abierto es lo normal y quien decide la
exposición real es el mapeo de puertos: por eso la severidad baja y la
remediación cambia — hay que comprobar que el mapeo publique en
`127.0.0.1:8787:8787`, como hace el `compose.yaml` del repositorio.

### `BTC-OPSEC-002` · Inventario con saldo en modo demostración

**Medio.** El modo demostración mantiene todo en memoria. Si estás registrando
wallets con saldo declarado, al cerrar la aplicación se pierde el trabajo.
No es un fallo de seguridad; es el aviso de que estás usando el modo equivocado.

### `BTC-OPSEC-003` · Clave de datos por debajo del mínimo

**Alto** por debajo de 64 bits · **medio** entre 64 y 128.

La entropía se estima por la longitud efectiva y el alfabeto realmente usado, de
modo que una clave larga pero repetitiva (`aaaa…`) no puntúa como larga. El
generador del proyecto produce 256 bits; cualquier cosa por debajo de 128
significa que la clave se escribió a mano.

### `BTC-OPSEC-004` · RPC remoto habilitado

**Alto.** `ALLOW_REMOTE_RPC=true` desactiva una defensa que existe por una razón
documentada por el propio Bitcoin Core: el RPC concede control significativo
sobre el nodo y no debe exponerse a la red. La alternativa correcta es un túnel
hacia `127.0.0.1`.

### `BTC-OPSEC-005` · RPC autenticado con usuario y contraseña

**Medio.** La cookie de Bitcoin Core rota sola y no hay que escribirla en ningún
sitio. Una contraseña estática vive en un archivo de configuración o en una
variable de entorno, que es exactamente donde acaban filtrándose las cosas.

### `BTC-OPSEC-006` · Watchtower apagado con wallets de alto valor

**Medio.** Hay wallets por encima del umbral de política y nadie está observando
el nodo. Un gasto fuera de política no se detectaría hasta el siguiente análisis
manual, que puede ser dentro de una semana.

### `BTC-OPSEC-007` · Límites de petición relajados

**Bajo.** Un límite de tasa a partir de 5.000/minuto o un cuerpo de 1 MiB o más
amplían la superficie de abuso local sin aportar nada al uso normal del panel.

### `BTC-OPSEC-008` · La cadena de auditoría no verifica

**Crítico.** Una entrada del registro no encadena con la anterior: el historial
se modificó después de escribirse. La primera acción no es arreglar nada, es
**preservar el archivo**: es evidencia.

## ⚖️ Cómo se comporta ante la duda

Tres decisiones deliberadas, todas en la misma dirección:

- **Sin configuración, sin hallazgos.** `evaluatePosture` devuelve una lista
  vacía si no recibe configuración: nunca inventa un diagnóstico sobre algo que
  no ha visto.
- **El contenedor no es un fallo.** Ver `BTC-OPSEC-001`. Un detector que grita en
  el despliegue soportado enseña a la gente a ignorarlo.
- **La postura no se persiste.** Se recalcula en cada consulta. Un hallazgo de
  postura de ayer no dice nada sobre el arranque de hoy.

## 🔄 Reevaluación al cambiar

Desde la versión 0.3.0, **cualquier cambio de inventario vuelve a disparar el
análisis completo**, incluida la postura: registrar una wallet, observar una
transacción o registrar un evento de privacidad recalculan los hallazgos y
dejan una entrada `auto_rescan` en la auditoría con el motivo.

Antes, el panel podía quedarse desactualizado hasta que alguien pulsara
*Analizar*. Un inventario que cambia y un panel que no se entera es un panel que
miente durante ese intervalo.

## 🔗 Relación con la auditoría de 14 etapas

Las etapas 9 y 11 de [`AUDITORIA_14_ETAPAS.md`](AUDITORIA_14_ETAPAS.md) son
exactamente estos controles, ejecutados desde la línea de comandos en vez de
desde la API:

```bash
node scripts/audit-bitcoin.js --stages=9,11
```
