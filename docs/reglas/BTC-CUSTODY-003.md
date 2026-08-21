# BTC-CUSTODY-003 — Quorum sin tolerancia a fallos (N-de-N)

| | |
| --- | --- |
| **Familia** | 🏛️ `BTC-CUSTODY` · Arquitectura de custodia |
| **Severidad** | 🟠 Alta · 🟡 Media |
| **Entidad** | Wallet |
| **Dispara** | `walletType === "multisig"`, `quorum.total > 1` y `quorum.required === quorum.total`. |
| **Umbral** | Cualquier N-de-N con N mayor que uno. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta si es de alto valor; media si no.

---

## 🧭 Qué significa

Un 3-de-3 no reparte el riesgo: lo multiplica. Sigue haciendo falta comprometer todas las claves para robar, pero basta **perder una** para que los fondos queden irrecuperables.

**Causa raíz declarada:** El quorum no reserva margen para la pérdida de un firmante, que es el incidente más frecuente en custodia propia.

## 🧾 Evidencia que adjunta

- Huella de la wallet
- Quorum declarado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Migrar a un quorum con margen, por ejemplo 2 de 3.
2. Verificar que existe copia de seguridad comprobada de cada descriptor y de cada firmante.

## ⚠️ Qué NO significa

- No es un problema de robo, es un problema de pérdida. Es la configuración que más fondos ha congelado para siempre.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=3
```

## 🔗 Reglas relacionadas

- [`BTC-CUSTODY-002`](BTC-CUSTODY-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
