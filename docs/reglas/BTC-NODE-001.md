# BTC-NODE-001 — Bitcoin Core no disponible

| | |
| --- | --- |
| **Familia** | 🔗 `BTC-NODE` · Salud de la observación |
| **Severidad** | 🟠 Alta |
| **Entidad** | Nodo |
| **Dispara** | La conexión RPC falla. |
| **Umbral** | Ninguno. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta.

---

## 🧭 Qué significa

El canal de observación no puede validar el estado local de Bitcoin. **No habla de tus fondos: habla de tu capacidad de verlos.**

**Causa raíz declarada:** El canal de observación no puede validar el estado local de Bitcoin.

## 🧾 Evidencia que adjunta

- Punto final configurado
- Momento de la comprobación
- Error devuelto

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Verificar el proceso Bitcoin Core y la autenticación RPC local.
2. No exponer RPC directamente a Internet.

## ⚠️ Qué NO significa

- Mientras esté activo, la vigilancia de gastos está **ciega**: no es que no haya problemas, es que no se pueden ver.
- Corta la evaluación del resto de reglas de nodo: no tendría sentido opinar sobre datos que no existen.

## 🔍 Cómo comprobarlo

```bash
node --test test/rule-engine.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-NODE-003`](BTC-NODE-003.md)
- [`BTC-OPSEC-004`](BTC-OPSEC-004.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
