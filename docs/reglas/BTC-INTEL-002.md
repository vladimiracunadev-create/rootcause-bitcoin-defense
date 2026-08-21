# BTC-INTEL-002 — Sin matriz de avisos cargada

| | |
| --- | --- |
| **Familia** | 🗓️ `BTC-INTEL` · La inteligencia tiene fecha |
| **Severidad** | 🟠 Alta |
| **Entidad** | Matriz de avisos |
| **Dispara** | `config/advisories.json` vacío o ilegible. |
| **Umbral** | Cero avisos cargados. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Alta.

---

## 🧭 Qué significa

No hay nada con lo que contrastar la procedencia de las claves: la detección principal del producto queda desactivada.

**Causa raíz declarada:** El archivo de avisos está vacío o no se pudo leer.

## 🧾 Evidencia que adjunta

- Número de avisos cargados

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Restaurar `config/advisories.json` desde el repositorio.
2. Verificar cada entrada contra la fuente oficial del fabricante.

## ⚠️ Qué NO significa

- Un panel sin avisos no está «limpio»: está desarmado.

## 🔍 Cómo comprobarlo

```bash
node --test test/attack-patterns.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-INTEL-001`](BTC-INTEL-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
