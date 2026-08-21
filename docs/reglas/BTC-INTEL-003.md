# BTC-INTEL-003 — Avisos sin fecha de verificación

| | |
| --- | --- |
| **Familia** | 🗓️ `BTC-INTEL` · La inteligencia tiene fecha |
| **Severidad** | 🟡 Media |
| **Entidad** | Matriz de avisos |
| **Dispara** | Ninguna entrada declara `verifiedAt` ni `publishedAt` con formato de fecha válido. |
| **Umbral** | Ninguna fecha utilizable en toda la matriz. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Media.

---

## 🧭 Qué significa

La matriz existe pero no registra su propia frescura, así que nadie puede saber si está al día.

**Causa raíz declarada:** La matriz no registra su propia frescura.

## 🧾 Evidencia que adjunta

- Número de avisos sin fecha

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Añadir `verifiedAt` a cada aviso al revisarlo.

## ⚠️ Qué NO significa

- No cuestiona el contenido de los avisos, sino la posibilidad de saber cuándo se comprobaron.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=2
```

## 🔗 Reglas relacionadas

- [`BTC-INTEL-001`](BTC-INTEL-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
