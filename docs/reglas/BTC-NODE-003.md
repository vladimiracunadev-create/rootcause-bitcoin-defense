# BTC-NODE-003 — Nodo sin peers

| | |
| --- | --- |
| **Familia** | 🔗 `BTC-NODE` · Salud de la observación |
| **Severidad** | 🟠 Alta |
| **Entidad** | Nodo |
| **Dispara** | `connections === 0`. |
| **Umbral** | Cero conexiones P2P. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta, y no media a propósito.

---

## 🧭 Qué significa

La observación local está aislada de la red Bitcoin.

**Causa raíz declarada:** La observación local está aislada de la red Bitcoin.

## 🧾 Evidencia que adjunta

- Número de conexiones

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Comprobar cortafuegos, DNS, proxy, Tor o configuración P2P.
2. Comparar la altura con un segundo nodo controlado.

## ⚠️ Qué NO significa

- Es alta porque **un nodo aislado puede mostrar una punta antigua** y hacerte creer que no ha pasado nada.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=10
```

## 🔗 Reglas relacionadas

- [`BTC-NODE-001`](BTC-NODE-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
