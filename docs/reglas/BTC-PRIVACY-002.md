# BTC-PRIVACY-002 — El proveedor filtrado fabrica tus firmantes

| | |
| --- | --- |
| **Familia** | 👤 `BTC-PRIVACY` · Datos personales |
| **Severidad** | 🟠 Alta |
| **Entidad** | Evento de proveedor |
| **Dispara** | El `vendor` de un evento de privacidad coincide, sin distinguir mayúsculas, con el fabricante de algún firmante del inventario. |
| **Umbral** | Una sola coincidencia basta. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta.

---

## 🧭 Qué significa

Correlaciona la filtración con **tu** inventario: la diferencia entre «hubo una filtración en un fabricante» y «hubo una filtración en el fabricante de dos de tus firmantes».

**Causa raíz declarada:** La identidad del titular y la titularidad del dispositivo quedaron en el mismo dominio de confianza de un tercero.

## 🧾 Evidencia que adjunta

- Proveedor y número de registros
- Cuántos firmantes tuyos son de ese fabricante

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Tratar como fraude cualquier comunicación urgente que mencione tu dispositivo.
2. Verificar siempre por un canal oficial abierto por ti, nunca por un enlace recibido.
3. Recordar que ningún fabricante pide la frase de recuperación.

## ⚠️ Qué NO significa

- No implica que tus claves estén comprometidas. Implica que quien te escriba puede saber qué dispositivo tienes.

## 🔍 Cómo comprobarlo

```bash
node --test test/attack-patterns.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-PRIVACY-001`](BTC-PRIVACY-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
