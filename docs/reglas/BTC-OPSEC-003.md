# BTC-OPSEC-003 — Clave de datos por debajo del mínimo recomendado

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🟠 Alta · 🟡 Media |
| **Entidad** | Despliegue |
| **Dispara** | En modo persistente, la entropía estimada de `ROOTCAUSE_DATA_KEY` es menor que 128 bits. |
| **Umbral** | 128 bits estimados. El generador del proyecto produce 256. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Alta por debajo de 64 bits; media entre 64 y 128.

---

## 🧭 Qué significa

La entropía se estima por la longitud efectiva y el alfabeto realmente usado, de modo que una clave larga pero repetitiva no puntúa como larga.

**Causa raíz declarada:** La clave se escribió a mano en vez de generarse.

## 🧾 Evidencia que adjunta

- Bits estimados
- Mínimo recomendado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Regenerar con `pnpm generate:data-key` y volver a cifrar el estado.
2. Guardarla en un gestor de contraseñas, nunca junto al archivo de datos.

## ⚠️ Qué NO significa

- La estimación no mide calidad criptográfica: detecta el caso real, que es alguien escribiendo `clave123` en un archivo de configuración.

## 🔍 Cómo comprobarlo

```bash
node --test test/posture.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-002`](BTC-OPSEC-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
