# BTC-TX-002 — Barrido del saldo de una wallet vigilada

| | |
| --- | --- |
| **Familia** | 💸 `BTC-TX` · Gasto observado |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Transacción |
| **Dispara** | Un gasto sin aprobación cuyo `valueSats` alcanza el **90 % o más** del saldo declarado de la wallet. |
| **Umbral** | 90 % del saldo. Requiere que el evento traiga `valueSats`. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica.

---

## 🧭 Qué significa

Ese patrón es el de un vaciado, no el de un pago. Cambia la urgencia respecto a `BTC-TX-001`.

**Causa raíz declarada:** Quien firmó controla la clave y está retirando el saldo completo, no gastando una parte.

## 🧾 Evidencia que adjunta

- Txid y huella de la wallet
- Importe movido y saldo declarado
- Porcentaje del saldo que se lleva

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Asumir clave comprometida y preservar evidencia antes de tocar nada.
2. Migrar de inmediato los UTXO que todavía no se han gastado.
3. Verificar el txid en un segundo nodo independiente.

## ⚠️ Qué NO significa

- Sin `valueSats` la regla **no se activa**: sin importe no se puede distinguir un pago de un vaciado, y prefiere callar a inventar.

## 🔍 Cómo comprobarlo

```bash
node --test test/attack-patterns.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-TX-001`](BTC-TX-001.md)
- [`BTC-TX-003`](BTC-TX-003.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
