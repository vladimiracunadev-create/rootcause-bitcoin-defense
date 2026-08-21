# BTC-KEY-001 — Semilla creada con firmware afectado

| | |
| --- | --- |
| **Familia** | 🔑 `BTC-KEY` · Procedencia de la semilla |
| **Severidad** | 🔴 Crítica |
| **Entidad** | Wallet |
| **Dispara** | Un firmante coincide con un aviso activo: mismo fabricante, modelo en la lista, canal (`standard`/`edge`) coincidente y `firmwareAtSeedCreation` dentro del rango afectado. |
| **Umbral** | El rango exacto que declare el aviso en `config/advisories.json`. Las versiones se comparan numéricamente por componentes, con sufijos de fabricante: `4.10.0` es mayor que `4.9.0`. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica, siempre. No depende del saldo.

---

## 🧭 Qué significa

La semilla nació de un proceso con un defecto publicado. El atacante no necesita robar nada: reconstruye la clave y firma una transacción perfectamente válida.

**Causa raíz declarada:** La procedencia criptográfica de la semilla depende de una versión de firmware incluida en un aviso crítico.

## 🧾 Evidencia que adjunta

- Huella de la wallet y del firmante
- Fabricante, modelo y canal
- Firmware con el que se creó la semilla
- Identificador del aviso que coincidió

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Dejar de emitir direcciones de recepción en esa wallet.
2. Crear una semilla nueva con firmware corregido o un firmante independiente.
3. Verificar huella y dirección en la pantalla del dispositivo, no en la del ordenador.
4. Migrar con una transacción de prueba pequeña antes del resto.
5. Tratar la semilla antigua como comprometida de forma permanente.

## ⚠️ Qué NO significa

- No significa que los fondos se hayan movido, ni que vayan a moverse hoy.
- **Actualizar el firmware NO cierra este hallazgo**, y no debe cerrarlo: la semilla ya existente sigue siendo la que es.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js --stages=1,2
```

## 🔗 Reglas relacionadas

- [`BTC-KEY-002`](BTC-KEY-002.md)
- [`BTC-INTEL-001`](BTC-INTEL-001.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
