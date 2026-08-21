# BTC-OPSEC-008 — La cadena de auditoría no verifica

| | |
| --- | --- |
| **Familia** | 🖥️ `BTC-OPSEC` · Postura de la instalación |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Despliegue |
| **Dispara** | Una entrada del registro no encadena con el hash de la anterior. |
| **Umbral** | Una sola entrada rota. |
| **Definida en** | [`src/domain/posture.js`](../../src/domain/posture.js) |

> Crítica.

---

## 🧭 Qué significa

El historial fue modificado después de escribirse, por manipulación del archivo de estado o por corrupción del almacenamiento.

**Causa raíz declarada:** Manipulación del archivo de estado o corrupción del almacenamiento.

## 🧾 Evidencia que adjunta

- Entrada donde se rompe la cadena
- Número de entradas verificadas

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Preservar el archivo actual antes de tocar nada: es evidencia.
2. Restaurar desde una copia conocida y revisar quién tuvo acceso al equipo.

## ⚠️ Qué NO significa

- La primera acción no es arreglar: es preservar. Un registro alterado es el indicio, no el problema.

## 🔍 Cómo comprobarlo

```bash
node --test test/audit-log.test.js
```

## 🔗 Reglas relacionadas

- [`BTC-OPSEC-001`](BTC-OPSEC-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
