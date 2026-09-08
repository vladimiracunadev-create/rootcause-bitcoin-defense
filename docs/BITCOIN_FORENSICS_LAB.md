# Bitcoin forensics, UTXO y reconciliación

Este laboratorio convierte a **DigitalCustody Labs** en un caso contable reproducible. El libro interno declara 100 BTC, pero la cifra de la cadena se calcula desde salidas no gastadas. Ninguna respuesta está escrita en el analizador.

## Qué implementa

| Área | Evidencia producida |
|---|---|
| Parser Bitcoin | Transacciones decodificadas con `vin`, `vout`, importes exactos en satoshis y scripts de salida |
| Modelo UTXO | Outpoints `txid:vout`, estado gastado/no gastado y saldo como suma de UTXOs |
| Inputs, outputs y fees | Resolución de cada input contra su output anterior; fee = inputs − outputs cuando toda la procedencia está disponible |
| Change | Direcciones controladas clasificadas por rol; el laboratorio consulta `getaddressinfo` para identificar el cambio de la hot wallet |
| Confirmaciones y bloque | Altura, hash, fecha y número de confirmaciones de cada transacción |
| Historia por dirección | Eventos `received`, `spent` y `change` por dirección controlada |
| Grafo y procedencia | Grafo dirigido entre transacciones y procedencia de cada UTXO por outpoint |
| Reconciliación | Libro interno frente a UTXOs controlados y diferencia calculada en satoshis |
| Selección de monedas | Algoritmo conceptual largest-first con fee estimado; no firma ni transmite |

## Ejecutar el caso determinista

Requiere Node.js 22.12 o posterior y no instala dependencias.

```powershell
npm run forensics:demo
```

Lee `examples/digital-custody-labs/scenario.json` y escribe en `build/bitcoin-forensics/`:

- `bitcoin-summary.md`
- `utxo-analysis.csv`
- `transaction-graph.graphml`
- `reconciliation.csv`
- `timeline.md`

El escenario contiene depósitos, un retiro, una salida de cambio, bloques y antecesores. Cambiar `ledger.balanceBtc`, cualquier output o cualquier input cambia automáticamente la conciliación.

## Levantar Bitcoin Core desde cero

Requiere Docker Desktop o Docker Engine con Compose. El comando elimina únicamente el volumen `bitcoin-regtest` declarado por este laboratorio, arranca Bitcoin Core 28.1, crea wallets desechables, mina saldo sin valor económico y produce depósitos y un retiro controlado.

```powershell
npm run lab:regtest
```

El script comprueba `getblockchaininfo.chain === "regtest"` antes de crear wallets. Si la red no es `regtest`, se detiene. Los resultados quedan en `build/bitcoin-forensics-regtest/`, incluido `scenario.json` con la evidencia pública que alimentó el cálculo.

Para conservar una instancia ya levantada al repetir el ejercicio:

```powershell
node scripts/run-regtest-lab.js --keep
```

Para destruir el laboratorio desechable:

```powershell
docker compose -f labs/regtest/compose.yaml down --volumes
```

## Recorrido del caso

DigitalCustody Labs separa una hot wallet de recepción y una reserva fría. El generador crea fondos minados en regtest, deposita en ambas áreas, retira desde la hot wallet y descubre la salida de cambio consultando la pertenencia de las direcciones. El analizador recorre los inputs hacia atrás, construye el conjunto UTXO y compara su suma con los 100 BTC del libro.

La investigación responde con evidencia a estas preguntas:

1. ¿Qué depósitos ingresaron a direcciones controladas?
2. ¿Qué retiro consumió un UTXO y cuánto pagó de fee?
3. ¿Qué output volvió como change?
4. ¿Qué UTXOs siguen disponibles, de qué transacción proceden y cuántas confirmaciones tienen?
5. ¿Coincide su suma con el libro interno a la fecha de corte?

## Custodia y controles

| Control | Diseño enseñado |
|---|---|
| Debilidad single-key | Una sola clave concentra disponibilidad y compromiso; el reporte exige declarar si sigue expuesta |
| Multisig | Reserva 2-de-3 con firmantes independientes como modelo recomendado |
| Separación de roles | Operador prepara, aprobador valida destino y límites, firmantes autorizan |
| Límites de retiro | El manifiesto declara el límite y permite contrastarlo con los outputs observados |
| Allowlist | Los destinos aprobados se separan de las direcciones controladas y de cambio |
| Flujo de aprobación | Operador → aprobador → firmantes, con separación explícita |
| Auditoría inmutable | El producto conserva una cadena hash; el informe registra la evidencia reproducible del laboratorio |

La hot wallet reduce fricción operativa y expone una porción limitada. La cold wallet mantiene la reserva fuera del proceso cotidiano. Multisig distribuye autorización, pero requiere copias verificadas del descriptor, coordinación de recuperación y firmantes en dominios de fallo distintos.

## PSBT seguro

Una PSBT transporta una propuesta sin firmar y los datos que cada firmante necesita para evaluarla. En este laboratorio se usa como objeto educativo: seleccionar UTXOs, comprobar inputs, outputs, change, fee, red, política y aprobaciones antes de que exista una firma.

Checklist de revisión:

1. Confirmar que todos los inputs pertenecen al conjunto UTXO esperado.
2. Comparar cada destino con la allowlist por un canal independiente.
3. Identificar el change mediante descriptor o wallet, no por posición del output.
4. Verificar importe y fee en satoshis.
5. Confirmar red `regtest`, `signet` o `testnet` y política de quorum.
6. Registrar el hash de la propuesta aprobada antes de firmar.

El repositorio no recibe material secreto, no firma PSBT y no transmite transacciones. Bitcoin Core RPC dentro de la aplicación conserva una allowlist de consultas. La generación del escenario se limita al script desechable de regtest.

## Signet y testnet

El parser acepta `signet` y `testnet` para prácticas controladas a partir de snapshots públicos. Esas redes pueden sufrir reorganizaciones, faucets agotados y tiempos variables, por lo que regtest es la referencia reproducible. Ningún ejercicio necesita ni debe usar fondos reales.

## Límites forenses

Una dirección de cambio se demuestra con información de la wallet o del descriptor. Si solo existe información pública, clasificar change es una heurística y debe marcarse como tal. Un fee solo puede calcularse cuando están disponibles todos los outputs anteriores consumidos. La propiedad de una dirección tampoco se deduce de la cadena: la lista controlada es evidencia aportada por la organización.
