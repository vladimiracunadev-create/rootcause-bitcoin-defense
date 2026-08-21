# BTC-TX-001 — Gasto observado sin aprobación conocida

| | |
| --- | --- |
| **Familia** | 💸 `BTC-TX` · Gasto observado |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Transacción |
| **Dispara** | El evento marca `spendsWatchedWallet` y su `approvalHash` no coincide con ninguna aprobación registrada. |
| **Umbral** | Ninguno: sin aprobación registrada, todo gasto es un hallazgo. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica.

---

## 🧭 Qué significa

La cadena recibió una transacción válida fuera del flujo de autorización que tú registraste.

**Causa raíz declarada:** La cadena recibió una transacción válida fuera del flujo de autorización registrado.

## 🧾 Evidencia que adjunta

- Txid
- Wallet afectada
- Momento de observación y fuente

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Denegar nuevas autorizaciones al servicio de firma.
2. Preservar evidencia y verificar el estado en nodos independientes.
3. Activar el plan de migración para los UTXO todavía no gastados.

## ⚠️ Qué NO significa

- No afirma que sea un robo. Afirma que **nadie registró la aprobación**.
- Si el gasto era legítimo, registra la aprobación y corrige el proceso: no silencies la regla.

## 🟡 Falso positivo esperable

Un gasto legítimo que nadie registró. Es el precio correcto: preferimos preguntar por un gasto legítimo que callar ante uno que no lo es.

## 🔍 Cómo comprobarlo

```bash
node scripts/check-security-claims.js
```

## 🔗 Reglas relacionadas

- [`BTC-TX-002`](BTC-TX-002.md)
- [`BTC-TX-003`](BTC-TX-003.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
