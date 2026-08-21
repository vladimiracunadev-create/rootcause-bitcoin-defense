# BTC-OPSEC-004 — RPC de Bitcoin Core remoto habilitado

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🟠 Alta |
| **Entidad** | Despliegue |
| **Dispara** | `ALLOW_REMOTE_RPC=true`. |
| **Umbral** | Ninguno: la bandera activa el hallazgo. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Alta.

---

## 🧭 Qué significa

Se desactivó una defensa que existe por una razón documentada por el propio Bitcoin Core: el RPC concede control significativo sobre el nodo y no debe exponerse a la red.

**Causa raíz declarada:** La defensa por defecto contra destinos remotos está desactivada explícitamente.

## 🧾 Evidencia que adjunta

- URL configurada
- Estado de la bandera

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Usar un túnel hacia `127.0.0.1` y volver a `ALLOW_REMOTE_RPC=false`.
2. Confirmar que el nodo no acepta RPC desde Internet.

## ⚠️ Qué NO significa

- La allowlist de once métodos de lectura sigue vigente: esto amplía el canal, no los permisos.

## 🔍 Cómo comprobarlo

```bash
node --test test/posture.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-005`](BTC-OPSEC-005.md)
- [`BTC-NODE-001`](BTC-NODE-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
