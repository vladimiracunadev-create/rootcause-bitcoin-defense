# BTC-OPSEC-005 — RPC autenticado con usuario y contraseña

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🟡 Media |
| **Entidad** | Despliegue |
| **Dispara** | Hay `BITCOIN_RPC_USER` o `BITCOIN_RPC_PASSWORD` y no hay `BITCOIN_RPC_COOKIE_FILE`. |
| **Umbral** | Ninguno. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Media.

---

## 🧭 Qué significa

La cookie de Bitcoin Core rota sola y no hay que escribirla en ningún sitio. Una contraseña estática vive en un archivo o en una variable de entorno, que es donde acaban filtrándose las cosas.

**Causa raíz declarada:** Se eligió autenticación estática frente a la cookie que genera el propio nodo.

## 🧾 Evidencia que adjunta

- Método de autenticación en uso

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Configurar `BITCOIN_RPC_COOKIE_FILE` apuntando al `.cookie` del nodo.
2. Retirar `BITCOIN_RPC_USER` y `BITCOIN_RPC_PASSWORD`.

## ⚠️ Qué NO significa

- No implica que la contraseña sea débil: implica que existe escrita en algún sitio.

## 🔍 Cómo comprobarlo

```bash
node --test test/posture.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-004`](BTC-OPSEC-004.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
