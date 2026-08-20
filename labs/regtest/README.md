# Laboratorio regtest

Regtest permite probar incidentes sin valor real ni dependencia de mainnet.

## Objetivos

- nodo desconectado;
- nodo sin peers;
- sincronización simulada;
- transacción aprobada;
- gasto no aprobado;
- presión de mempool;
- migración entre descriptors;
- reorg controlado.

## Configuración

Copia bitcoin.conf a un directorio de datos exclusivo para laboratorio. No uses
el mismo directorio que mainnet.

Inicia Bitcoin Core según tu instalación y crea bloques hacia una dirección de
regtest controlada por el laboratorio.

Configura la aplicación:

~~~bash
BITCOIN_RPC_URL="http://127.0.0.1:18443" \
BITCOIN_RPC_COOKIE_FILE="/ruta/regtest/.cookie" \
WATCHTOWER_ENABLED=true \
pnpm start
~~~

## Seguridad

- usa wallets de laboratorio;
- no importes seeds reales;
- no reutilices direcciones;
- no expongas RPC;
- elimina el entorno al terminar;
- conserva únicamente fixtures públicos ficticios.

## Simulación por API

El ejemplo examples/event-unauthorized-spend.json usa un txid ficticio.

~~~bash
curl -X POST http://127.0.0.1:8787/api/observe/transaction \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data @examples/event-unauthorized-spend.json
~~~

Para una fase posterior, el lab debe crear una transacción regtest real, derivar
el txid y enviarlo como evento sin entregar claves a RootCause.
