# BTC-TX-003 — Varios gastos sin aprobación en ventana corta

| | |
| --- | --- |
| **Familia** | 💸 `BTC-TX` · Gasto observado |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Wallet |
| **Dispara** | Dos o más gastos sin aprobación de la **misma wallet** dentro de una ventana de 60 minutos. |
| **Umbral** | 60 minutos, configurable en el contexto de evaluación. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica.

---

## 🧭 Qué significa

Un gasto sin registrar es un error de proceso; una ráfaga es extracción activa.

**Causa raíz declarada:** Una ráfaga de gastos no autorizados indica extracción activa, no un error de registro puntual.

## 🧾 Evidencia que adjunta

- Huella de la wallet
- Número de eventos en la ventana
- Primer y último momento observados

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Cortar cualquier autorización automática ahora.
2. Preservar evidencia y activar el runbook de migración.
3. No esperar a que termine la ráfaga para actuar.

## ⚠️ Qué NO significa

- No sustituye a `BTC-TX-001`: cada gasto sigue generando el suyo. Esta regla añade el patrón temporal.

## 🔍 Cómo comprobarlo

```bash
node --test test/attack-patterns.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-TX-001`](BTC-TX-001.md)
- [`BTC-TX-002`](BTC-TX-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
