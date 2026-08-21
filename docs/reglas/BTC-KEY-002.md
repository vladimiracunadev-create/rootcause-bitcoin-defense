# BTC-KEY-002 — Firmware de creación desconocido

| | |
| --- | --- |
| **Familia** | 🔑 `BTC-KEY` · Procedencia de la semilla |
| **Severidad** | 🟠 Alta · 🟡 Media |
| **Entidad** | Wallet |
| **Dispara** | `firmwareAtSeedCreation` ausente o igual a `unknown` en algún firmante. |
| **Umbral** | `HIGH_VALUE_THRESHOLD_SATS` decide la severidad, no la activación. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta si la wallet supera el umbral de alto valor; media si no.

---

## 🧭 Qué significa

**La ausencia de dato es el hallazgo.** Si no puedes demostrar con qué firmware nació una clave, no puedes descartar ningún aviso presente ni futuro.

**Causa raíz declarada:** Falta trazabilidad del ciclo de vida de la clave.

## 🧾 Evidencia que adjunta

- Huella de la wallet y del firmante
- Fabricante y modelo, si constan

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Reconstruir la procedencia desde registros verificables.
2. Si no puede demostrarse, migrar hacia firmantes con procedencia documentada.

## ⚠️ Qué NO significa

- No acusa al dispositivo: acusa a la trazabilidad.
- Registrar `unknown` es la respuesta correcta cuando no se sabe. Un dato inventado da una tranquilidad falsa.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=1
```

## 🔗 Reglas relacionadas

- [`BTC-KEY-001`](BTC-KEY-001.md)
- [`BTC-KEY-003`](BTC-KEY-003.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
