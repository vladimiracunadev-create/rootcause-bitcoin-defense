# BTC-INTEL-001 — Matriz de avisos sin verificar

| | |
| --- | --- |
| **Familia** | 🗓️ `BTC-INTEL` · La inteligencia tiene fecha |
| **Severidad** | 🟡 Media · 🟠 Alta |
| **Entidad** | Matriz de avisos |
| **Dispara** | El `verifiedAt` más reciente de `config/advisories.json` supera `advisoryMaxAgeDays`. |
| **Umbral** | 30 días por defecto, configurable en `config/policies.json`. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Media pasado el plazo; alta pasado el triple.

---

## 🧭 Qué significa

Un hallazgo ausente puede significar que la inteligencia está vieja, no que no haya problema.

**Causa raíz declarada:** La matriz de avisos se mantiene a mano y no se ha contrastado con las fuentes oficiales dentro del plazo definido.

## 🧾 Evidencia que adjunta

- Fecha de la última verificación
- Días transcurridos y plazo aplicado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Revisar los avisos de seguridad de cada fabricante presente en el inventario.
2. Actualizar `verifiedAt` de cada entrada contrastada.
3. Registrar los avisos nuevos antes de dar por bueno un panel en verde.

## ⚠️ Qué NO significa

- No dice que exista un aviso nuevo que te afecte. Dice que **nadie ha mirado**, y que por tanto el verde no significa lo que parece.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=2 --fail-on-attention
```

## 🔗 Reglas relacionadas

- [`BTC-INTEL-002`](BTC-INTEL-002.md)
- [`BTC-KEY-001`](BTC-KEY-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
