# BTC-OPSEC-007 — Límites de petición por encima de lo razonable

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | ⚪ Baja |
| **Entidad** | Despliegue |
| **Dispara** | `RATE_LIMIT_PER_MINUTE >= 5000` o `REQUEST_BODY_LIMIT_BYTES >= 1 MiB`. |
| **Umbral** | 5.000 peticiones por minuto o 1 MiB de cuerpo. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Baja.

---

## 🧭 Qué significa

Amplía la superficie de abuso local sin aportar nada al uso normal del panel.

**Causa raíz declarada:** Configuración explícita por encima de los valores por defecto.

## 🧾 Evidencia que adjunta

- Límite de tasa y de cuerpo configurados

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Volver a los valores por defecto: 120 por minuto y 64 KiB.

## ⚠️ Qué NO significa

- Es baja a propósito: describe holgura innecesaria, no una puerta abierta.

## 🔍 Cómo comprobarlo

```bash
curl http://127.0.0.1:8787/api/posture
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-001`](BTC-OPSEC-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
