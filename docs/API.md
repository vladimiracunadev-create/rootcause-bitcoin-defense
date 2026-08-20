# API

Base local: http://127.0.0.1:8787

Las respuestas son JSON. Las mutaciones exigen:

~~~text
content-type: application/json
x-rootcause-request: 1
~~~

El encabezado reduce solicitudes cross-site accidentales. No es autenticación.

## GET /api/health

Estado del proceso.

## GET /api/summary

Devuelve riesgo, totales, wallets, incidentes, nodo y verificación de auditoría.

## GET /api/wallets

Lista metadatos públicos.

## POST /api/wallets

Registra una wallet. Ejemplo seguro en examples/wallets.sample.json.

Campos:

| Campo | Requerido | Regla |
| --- | --- | --- |
| name | sí | 1 a 120 caracteres |
| fingerprint | sí | ocho hex |
| network | sí | mainnet, signet, regtest o testnet4 |
| walletType | sí | single-sig o multisig |
| balanceSats | sí | entero no negativo |
| quorum | sí | coincide con signers |
| signers | sí | uno a cinco |

Campos prohibidos producen HTTP 422.

## POST /api/scan

Ejecuta reglas, actualiza lastSeen y resuelve hallazgos desaparecidos.

~~~bash
curl -X POST http://127.0.0.1:8787/api/scan \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"
~~~

## GET /api/incidents

Lista el historial.

## PATCH /api/incidents/:id

Body:

~~~json
{
  "status": "acknowledged"
}
~~~

También acepta resolved. Un scan posterior reabre un hallazgo resuelto si la
condición continúa; acknowledged se conserva mientras siga activo.

## GET /api/advisories

Devuelve la matriz local fechada.

## GET /api/policies

Catálogo de acciones permitidas, aprobadas y prohibidas.

## GET /api/audit

Devuelve hasta 200 entradas y el resultado de verificación hash-chain.

## POST /api/approvals

Registra solamente un hash SHA-256 de la política o PSBT revisada. No envíes la
PSBT.

~~~json
{
  "hash": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "label": "Pago proveedor aprobado"
}
~~~

## POST /api/observe/transaction

Informa un gasto observado:

~~~json
{
  "txid": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "walletId": "wallet-id",
  "spendsWatchedWallet": true,
  "source": "zmq"
}
~~~

Si no incluye approvalHash conocido, crea BTC-TX-001.

## POST /api/node/refresh

Consulta el Bitcoin Core configurado.

## POST /api/observe/privacy

Informa una lectura masiva observada en un proveedor:

~~~json
{
  "type": "bulk_customer_data_access",
  "vendor": "Proveedor de laboratorio",
  "recordCount": 12000,
  "authorized": false
}
~~~

Una lectura no autorizada crea BTC-PRIVACY-001.

## Errores

~~~json
{
  "error": {
    "code": "REQUEST_REJECTED",
    "message": "Explicación segura"
  }
}
~~~

Los errores internos no devuelven stack ni credenciales.

## Endpoints que no deben agregarse

- seed import;
- private-key import;
- walletpassphrase;
- signrawtransaction;
- sendrawtransaction automático;
- sendtoaddress;
- dumpwallet;
- backup upload;
- PSBT raw storage.
