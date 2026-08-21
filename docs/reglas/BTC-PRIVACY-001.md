# BTC-PRIVACY-001 — Acceso masivo a datos de clientes

| | |
| --- | --- |
| **Familia** | 👤 `BTC-PRIVACY` · Datos personales |
| **Severidad** | 🔴 Crítica · 🟡 Media |
| **Entidad** | Evento de proveedor |
| **Dispara** | Evento de tipo `bulk_customer_data_access`. |
| **Umbral** | El volumen lo declara el evento; la autorización decide la severidad. |
| **Definida en** | [`src/domain/rule-engine.js`](../../src/domain/rule-engine.js) |

> Crítica si el acceso no estaba autorizado; media si lo estaba.

---

## 🧭 Qué significa

Un proveedor o usuario accedió a un volumen de información personal superior al patrón esperado.

**Causa raíz declarada:** Un proveedor o usuario accedió a un volumen de información superior al patrón esperado.

## 🧾 Evidencia que adjunta

- Proveedor
- Número de registros
- Si estaba autorizado
- Momento observado

Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material
secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.

## 🛠️ Remediación

1. Revocar la sesión y preservar los registros de acceso.
2. Verificar minimización, cifrado y vencimiento de datos.
3. No vincular identidad personal con direcciones Bitcoin en el mismo dominio.

## ⚠️ Qué NO significa

- Que no se filtre ni una clave no significa que no haya subido el riesgo: con nombre, teléfono y dirección, el phishing deja de ser genérico.

## 🔍 Cómo comprobarlo

```bash
node scripts/audit-bitcoin.js
```

## 🔗 Reglas relacionadas

- [`BTC-PRIVACY-002`](BTC-PRIVACY-002.md)

---

| Volver a | |
| --- | --- |
| Índice de reglas | [`docs/reglas/README.md`](README.md) |
| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |
| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |
