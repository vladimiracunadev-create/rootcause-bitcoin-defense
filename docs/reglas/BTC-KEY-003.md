# BTC-KEY-003 — Origen de entropía desconocido

| | |
| --- | --- |
| **Familia** | 🔑 `BTC-KEY` · Procedencia de la semilla |
| **Severidad** | 🟡 Media |
| **Entidad** | Wallet |
| **Dispara** | `seedOrigin === "unknown"`. Valores válidos: `device`, `dice`, `external`, `unknown`. |
| **Umbral** | Ninguno: un solo firmante basta. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Media.

---

## 🧭 Qué significa

La aplicación desconoce cómo se creó la semilla: si la generó el dispositivo, se importó o se creó con una fuente independiente.

**Causa raíz declarada:** No existe evidencia suficiente sobre el origen de entropía.

## 🧾 Evidencia que adjunta

- Huella de la wallet y del firmante

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Documentar el método real de generación.
2. No inferir la calidad de la entropía observando solamente direcciones públicas.

## ⚠️ Qué NO significa

- No dice que la entropía sea mala. Dice que nadie puede afirmar que sea buena.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=1
```

## 🔗 Reglas relacionadas

- [`BTC-KEY-002`](BTC-KEY-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
