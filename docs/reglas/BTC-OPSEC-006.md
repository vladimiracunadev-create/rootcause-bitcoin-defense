# BTC-OPSEC-006 — Watchtower apagado con wallets de alto valor

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🟡 Media |
| **Entidad** | Despliegue |
| **Dispara** | Existe al menos una wallet por encima del umbral de alto valor y `WATCHTOWER_ENABLED=false`. |
| **Umbral** | `HIGH_VALUE_THRESHOLD_SATS`. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Media.

---

## 🧭 Qué significa

Nadie está observando el nodo: un gasto fuera de política no se detectaría hasta el próximo análisis manual.

**Causa raíz declarada:** La vigilancia periódica está desactivada.

## 🧾 Evidencia que adjunta

- Estado del watchtower
- Umbral de alto valor aplicado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Arrancar con `WATCHTOWER_ENABLED=true`.
2. Comprobar que el nodo responde para que la vigilancia sea real.

## ⚠️ Qué NO significa

- Encender el watchtower sin nodo disponible no vigila nada: comprueba también `BTC-NODE-001`.

## 🔍 Cómo comprobarlo

```bash
node --test test/posture.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-NODE-001`](BTC-NODE-001.md)
- [`BTC-TX-001`](BTC-TX-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
