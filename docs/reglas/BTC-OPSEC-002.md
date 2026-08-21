# BTC-OPSEC-002 — Inventario con saldo declarado en modo demostración

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🟡 Media |
| **Entidad** | Despliegue |
| **Dispara** | `DEMO_MODE=true` mientras el inventario declara saldo mayor que cero. |
| **Umbral** | Un solo satoshi declarado basta. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Media.

---

## 🧭 Qué significa

El modo demostración mantiene todo en memoria: al cerrar la aplicación se pierde lo registrado.

**Causa raíz declarada:** La persistencia cifrada está desactivada mientras se registran datos que se quieren conservar.

## 🧾 Evidencia que adjunta

- Modo de arranque
- Saldo total declarado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Generar una clave de datos con `pnpm generate:data-key`.
2. Arrancar con `DEMO_MODE=false` y `ROOTCAUSE_DATA_KEY` definida.

## ⚠️ Qué NO significa

- No es un fallo de seguridad: es el aviso de que estás usando el modo equivocado para lo que quieres hacer.

## 🔍 Cómo comprobarlo

```bash
curl http://127.0.0.1:8787/api/posture
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-003`](BTC-OPSEC-003.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
