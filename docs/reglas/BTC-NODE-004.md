# BTC-NODE-004 — Presión elevada de mempool

| | |
| --- | --- |
| **Familia** | 🔗 `BTC-NODE` · Salud de la observación |
| **Severidad** | 🟡 Media |
| **Entidad** | Nodo |
| **Dispara** | `mempoolUsageBytes / mempoolMaxBytes >= 0,9`. |
| **Umbral** | 90 % del máximo configurado. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Media.

---

## 🧭 Qué significa

Transacciones de menor tarifa pueden ser expulsadas del mempool local.

**Causa raíz declarada:** Transacciones de menor tarifa pueden ser expulsadas del mempool local.

## 🧾 Evidencia que adjunta

- Uso y máximo del mempool
- Tarifa mínima vigente

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Revisar la política de tarifas **sin modificarla automáticamente**.
2. Correlacionar cualquier transacción desaparecida con reemplazos o expulsión.

## ⚠️ Qué NO significa

- Una transacción que desaparece del mempool no está «perdida»: puede haber sido expulsada o reemplazada.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=10
```

## 🔗 Reglas relacionadas

- [`BTC-NODE-002`](BTC-NODE-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
