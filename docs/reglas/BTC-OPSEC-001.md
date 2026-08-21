# BTC-OPSEC-001 — El panel escucha fuera de loopback

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🔴 Crítica · 🟡 Media |
| **Entidad** | Despliegue |
| **Dispara** | `HOST` no es una dirección de loopback. |
| **Umbral** | Cualquier valor distinto de `127.x`, `localhost` o `::1`. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Crítica fuera de contenedor; media dentro, donde el bind abierto es lo normal.

---

## 🧭 Qué significa

La aplicación no tiene autenticación porque asume un único operador en `127.0.0.1`. Con el puerto abierto, cualquiera en la red ve el inventario de wallets y saldos.

**Causa raíz declarada:** El modelo de seguridad del producto asume un único operador en loopback; publicar el puerto invalida ese supuesto.

## 🧾 Evidencia que adjunta

- Host y puerto
- Si el proceso corre en un contenedor

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Volver a `HOST=127.0.0.1`.
2. Si necesitas acceso remoto, usa un túnel SSH en vez de exponer el puerto.
3. En contenedor: comprobar que el mapeo publica en `127.0.0.1:8787:8787`.

## ⚠️ Qué NO significa

- Dentro de un contenedor no es un fallo: quien decide la exposición real es el mapeo de puertos del host. Un detector que grita en el despliegue soportado enseña a ignorarlo.

## 🔍 Cómo comprobarlo

```bash
curl http://127.0.0.1:8787/api/posture
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-004`](BTC-OPSEC-004.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
