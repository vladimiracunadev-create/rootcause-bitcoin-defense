# BTC-CUSTODY-001 — Fondos de alto valor dependen de una sola clave

| | |
| --- | --- |
| **Familia** | 🏛️ `BTC-CUSTODY` · Arquitectura de custodia |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Wallet |
| **Dispara** | `balanceSats >= highValueThresholdSats` **y** `walletType === "single-sig"`. |
| **Umbral** | `HIGH_VALUE_THRESHOLD_SATS`, por defecto 10.000.000 sats (0,1 BTC). Lo defines tú. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica.

---

## 🧭 Qué significa

Una sola firma puede gastar todos los fondos de esa wallet. Comprometer una clave es perderlo todo.

**Causa raíz declarada:** La arquitectura no contiene el compromiso de un único firmante.

## 🧾 Evidencia que adjunta

- Huella de la wallet
- Saldo declarado y umbral aplicado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Migrar a una política multisig con firmantes independientes.
2. Separar fabricantes, ubicaciones y procesos de generación de claves.

## ⚠️ Qué NO significa

- Single-sig no es «inseguro» en abstracto: la regla habla de **concentración por encima de un umbral que tú eliges**.
- Si asumes el riesgo conscientemente, sube el umbral de forma explícita en vez de convivir con un rojo que dejas de mirar.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=3
```

## 🔗 Reglas relacionadas

- [`BTC-CUSTODY-002`](BTC-CUSTODY-002.md)
- [`BTC-CUSTODY-003`](BTC-CUSTODY-003.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
