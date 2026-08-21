# BTC-NODE-002 — Nodo todavía no sincronizado

| | |
| --- | --- |
| **Familia** | 🔗 `BTC-NODE` · Salud de la observación |
| **Severidad** | 🟡 Media |
| **Entidad** | Nodo |
| **Dispara** | `initialBlockDownload` verdadero **o** `verificationProgress < 0,999`. |
| **Umbral** | 99,9 % de progreso de verificación. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Media.

---

## 🧭 Qué significa

La observación de transacciones puede estar incompleta o atrasada.

**Causa raíz declarada:** La observación de transacciones puede estar incompleta o atrasada.

## 🧾 Evidencia que adjunta

- Bloques y cabeceras
- Progreso de verificación

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Esperar la sincronización completa antes de tomar decisiones de custodia.
2. Revisar disco, CPU, reloj y conectividad si el progreso se detiene.

## ⚠️ Qué NO significa

- Un nodo sincronizando no está roto: está trabajando. La regla evita que se confíe en sus respuestas mientras tanto.

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
