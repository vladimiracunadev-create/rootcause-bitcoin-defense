# Integración con RootCause

## Decisión

No incorporar este repositorio copiándolo completo dentro de RootCause. Trátalo
como una implementación de referencia del dominio Bitcoin.

Primero inspecciona el RootCause existente y mapea capacidades.

| Capacidad de esta referencia | Componente RootCause esperado |
| --- | --- |
| BitcoinRpcClient | collector o adapter |
| Firmware matcher | normalizador o enrichment |
| evaluateState | motor de reglas |
| findingId y mergeIncidents | correlador |
| evidence | evidence bundle |
| remediation | safe-action catalog |
| audit-log | auditoría existente |
| dashboard | vista de dominio |
| IA opcional | adapter IA existente |

## Secuencia

### 1. Descubrimiento

- leer instrucciones del repositorio;
- identificar stack;
- revisar cambios no comprometidos;
- localizar interfaces públicas;
- ejecutar pruebas actuales;
- documentar puntos de extensión.

### 2. Contratos

Crear o adaptar eventos:

~~~json
{
  "domain": "bitcoin",
  "source": "bitcoin-core-rpc",
  "entityType": "node",
  "entityId": "node-primary",
  "observedAt": "2026-08-20T00:00:00Z",
  "payload": {}
}
~~~

Y hallazgos:

~~~json
{
  "domain": "bitcoin",
  "code": "BTC-KEY-001",
  "severity": "critical",
  "entityType": "wallet",
  "entityId": "wallet-id",
  "rootCause": "firmware affected at seed creation",
  "evidence": {},
  "remediation": []
}
~~~

Reutiliza el contrato RootCause real si ya existe.

### 3. Adapter Bitcoin Core

- desplegar junto al nodo;
- cookie auth;
- allowlist;
- localhost;
- snapshot versionado;
- backoff;
- telemetría de fallos;
- sin métodos de escritura.

### 4. Pack de reglas

Importar las reglas como datos o clases según el motor existente. No dupliques
el lifecycle de incidentes.

### 5. Evidencia

Guardar:

- versión y hash del advisory;
- timestamp;
- fingerprint;
- fabricante, modelo y firmware;
- resultado RPC relevante;
- txid y outpoints cuando corresponda;
- hash de la política aprobada;
- decisiones humanas.

No guardar:

- seed;
- passphrase;
- PSBT completa;
- xprv;
- PIN;
- cookie RPC.

### 6. Acciones seguras

Conectar el catálogo a RootCause:

- disable-deposit-address-generation;
- deny-policy-authorization;
- revoke-application-session;
- capture-evidence;
- notify-operator;
- prepare-unsigned-migration-plan.

El ejecutor debe exigir aprobación para cualquier paso que acerque el sistema a
una firma o transmisión.

### 7. Dashboard

Reusar el sistema visual de RootCause. Incorporar:

- riesgo Bitcoin;
- wallets;
- firmantes;
- advisory;
- cadena causal;
- nodo;
- incidentes;
- runbook.

## Compatibilidad

Esta referencia usa Node.js sin dependencias para ser portable. No obliga al
RootCause existente a usar Node. Si RootCause está construido en otro stack:

- conserva el stack;
- porta contratos y reglas;
- reutiliza tests como vectores;
- mantén advisories como datos;
- documenta diferencias.

## Estrategia de migración

1. Ejecutar esta referencia en regtest.
2. Probar reglas con fixtures.
3. Portar adapter y eventos.
4. Portar reglas sin acciones.
5. Comparar hallazgos entre ambas implementaciones.
6. Activar dashboard.
7. Activar acciones de solo contención.
8. Realizar ejercicio de incidente.
9. Revisar antes de mainnet.

## Criterio de finalización

La integración está completa cuando RootCause:

- detecta el fixture COLDCARD vulnerable;
- no marca la versión corregida;
- explica la cadena causal;
- conserva evidencia;
- no acepta secretos;
- no escribe en Bitcoin Core;
- funciona sin IA;
- pasa las pruebas existentes y nuevas.
