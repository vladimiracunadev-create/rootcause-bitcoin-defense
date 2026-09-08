# Política de privacidad local

Qué datos toca este producto, dónde quedan y qué garantías son **verificables en
el código** en vez de prometidas en un texto legal.

Resumen en una línea: no hay servidor, no hay cuenta, no hay telemetría, y los
datos más sensibles del dominio —las claves— nunca entran.

---

## 1. Datos que el producto NUNCA acepta

| Categoría | Comportamiento |
|---|---|
| Semillas y frases de recuperación | Rechazadas con `422` |
| Passphrases BIP-39 | Rechazadas |
| Claves privadas (`xprv`, `tprv`, WIF) | Rechazadas por nombre de campo **y** por patrón |
| Copias de respaldo de wallet | Rechazadas |

La comprobación (`src/domain/secret-guard.js`) normaliza el nombre del campo
—quita separadores y mayúsculas— y recorre el JSON a cualquier profundidad, así
que `Seed_Words`, `recovery-phrase`, `walletBackup` o un `mnemonic` escondido
dentro de un firmante caen igual. Además detecta cadenas con **forma** de clave
extendida o WIF en cualquier campo de texto libre.

Verificable ahora mismo:

~~~bash
curl -i -X POST http://127.0.0.1:8787/api/wallets \
  -H "content-type: application/json" -H "x-rootcause-request: 1" \
  --data '{"name":"x","mnemonic":"esto no debe aceptarse"}'
# → 422 SECRET_MATERIAL_REJECTED
~~~

---

## 2. Datos que el producto sí guarda

Solo lo que tú escribes, y todo es público o metadato:

| Dato | Ejemplo | Sensibilidad |
|---|---|---|
| Nombre de wallet | `Tesorería fría` | Elegido por ti |
| Huella | `D15EA5ED` | Pública, no permite gastar |
| Red y tipo | `mainnet`, `multisig` | Metadato |
| Saldo declarado | `250000000` sats | **Lo escribes tú**; no se deriva de la cadena |
| Procedencia del firmante | `COLDCARD`, `Mk4`, `5.4.1`, `standard`, `device` | Metadato de fabricación |
| Incidentes y evidencia | Códigos, fechas, huellas | Derivado de lo anterior |
| Auditoría | Actor, acción, momento, hash | Actor por defecto: `local-user` |

**Este conjunto no permite mover fondos, pero sí dice mucho de ti**: cuántas
wallets tienes, cuánto valor declaras y qué dispositivos usas. Trátalo como
información sensible aunque no sean claves. De ahí el cifrado y el bind en
loopback.

---

## 3. Dónde quedan

| Modo | Dónde | Cifrado |
|---|---|---|
| Demostración (por defecto) | Solo en memoria | No hace falta: nada toca el disco |
| Persistente (`DEMO_MODE=false`) | `DATA_DIR/state.enc.json` | AES-256-GCM |
| Windows | `%LOCALAPPDATA%\RootCause\bitcoin-defense\data` | AES-256-GCM |

La clave la generas tú y no se escribe junto a los datos. El archivo se escribe
de forma atómica y sin metadatos en claro; hay una prueba que lo comprueba
(`test/encrypted-store.test.js`).

**Borrado:** desinstalar no toca la carpeta de datos —borrar estado cifrado sin
preguntar sería una pérdida irreversible—. Para eliminarlo todo, borra esa
carpeta a mano.

---

## 4. Qué sale de tu máquina

**Nada, en funcionamiento normal.**

| Destino | Cuándo | Control |
|---|---|---|
| `127.0.0.1:8332` (tu nodo) | Solo si lo configuras | 14 métodos de lectura, allowlist |
| Un nodo remoto | Solo con `ALLOW_REMOTE_RPC=true` explícito | Desactivado por defecto |
| Cualquier otro destino | **Nunca** | No existe el código |

No hay analítica, ni informes de errores, ni comprobación de actualizaciones, ni
fuentes remotas, ni CDN. El panel se sirve desde el propio proceso con esta
cabecera:

~~~text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'none'
~~~

`connect-src 'self'` significa que el panel no puede pedir nada a ningún otro
origen aunque alguien inyectara código que lo intentara.

---

## 5. Cómo se verifica todo esto

No hace falta creer en este documento:

~~~bash
# Cero dependencias, cero orígenes remotos, CSP intacta
node scripts/check-local-only.js

# 20 invariantes, con la aplicación arrancada de verdad
node scripts/check-security-claims.js
~~~

Ambos corren en cada push. Si alguien añadiera una dependencia, un CDN, una
llamada saliente o abriera la CSP, el build falla y ese cambio no entra en
`main`.

Y a mano, que es la verificación definitiva: corta la red y usa la aplicación.
Funciona igual, salvo la consulta a tu nodo local.

---

## 6. Lo que la auditoría registra

Cada mutación deja una entrada encadenada por hash: actor, acción, tipo y id de
entidad, momento y metadatos. Los metadatos pasan por `redactForAudit`, que
sustituye por `[REDACTED]` cualquier campo prohibido y recorta cadenas largas.

Es decir: **ni siquiera el registro de auditoría puede acabar conteniendo
material secreto**, aunque alguien lo intentara colar por una ruta imprevista.

---

## 7. Qué NO protege esta política

- **Tu equipo.** Si está comprometido con malware, nada de lo anterior te
  protege: quien controla la máquina ve lo que tú ves.
- **La red local, si cambias `HOST`.** Con `0.0.0.0` expones el inventario a
  cualquiera en tu red. No hay autenticación porque el producto asume loopback.
- **Copias de seguridad que hagas tú.** Si copias `state.enc.json` a la nube,
  viaja cifrado, pero la clave sigue siendo tu responsabilidad.
- **Lo que tú publiques.** Si pegas la salida de `/api/summary` en un issue,
  estás publicando tu inventario.

---

## 8. Marco legal

MIT, sin garantías (ver [`LICENCIA_Y_DECISION.md`](LICENCIA_Y_DECISION.md)). Al
no haber tratamiento de datos por parte de terceros ni transferencia a ningún
servidor, no hay encargado de tratamiento ni transferencia internacional que
declarar: **el único responsable de los datos eres tú, en tu máquina**.

Si usas el producto dentro de una organización con datos de clientes —el caso de
`BTC-PRIVACY-001`—, tus obligaciones son las de tu jurisdicción, y este producto
no las cambia; solo te ayuda a detectar accesos anómalos.
