# BTC-CUSTODY-002 — Multisig sin diversidad de implementación

| | |
| --- | --- |
| **Familia** | 🏛️ `BTC-CUSTODY` · Arquitectura de custodia |
| **Severidad** | 🟠 Alta · 🟡 Media |
| **Entidad** | Wallet |
| **Dispara** | `walletType === "multisig"` y `quorum.independentVendors < 2`. |
| **Umbral** | Menos de dos fabricantes independientes entre los firmantes. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta si es de alto valor; media si no.

---

## 🧭 Qué significa

El quorum existe, pero un fallo común de firmware podría afectar a varios firmantes a la vez. Sobre el papel hay tres llaves; en la práctica hay un solo punto de fallo.

**Causa raíz declarada:** Una falla común de firmware podría afectar a varios firmantes.

## 🧾 Evidencia que adjunta

- Huella de la wallet
- Quorum completo con el recuento de fabricantes independientes

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Distribuir el quorum entre implementaciones y fabricantes independientes.
2. Generar cada semilla mediante un proceso separado.

## ⚠️ Qué NO significa

- No dice que el multisig esté mal formado: dice que no protege de lo que dice proteger.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=3
```

## 🔗 Reglas relacionadas

- [`BTC-CUSTODY-001`](BTC-CUSTODY-001.md)
- [`BTC-KEY-001`](BTC-KEY-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
