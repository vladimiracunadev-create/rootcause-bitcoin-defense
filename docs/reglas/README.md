# Reglas incluidas — una ficha por cada una

Las 26 reglas del motor, cada una con su documento: qué la dispara, con qué
umbral, qué evidencia adjunta, cómo se remedia y —sobre todo— **qué NO
significa** cuando salta.

> **Generado desde [`config/rules-catalog.json`](../../config/rules-catalog.json).**
> No se edita a mano: una prueba comprueba que el catálogo y el motor tienen
> exactamente los mismos códigos, así que una regla sin ficha rompe el build.

| Familia | Qué mira |
| --- | --- |
| 🔑 `BTC-KEY` · Procedencia de la semilla | De dónde vino la clave y si se puede demostrar. |
| 🏛️ `BTC-CUSTODY` · Arquitectura de custodia | Si la arquitectura contiene el compromiso de un firmante. |
| 💸 `BTC-TX` · Gasto observado | Movimientos que no coinciden con ninguna aprobación registrada. |
| 🔗 `BTC-NODE` · Salud de la observación | Si la aplicación está viendo la realidad o está ciega. |
| 👤 `BTC-PRIVACY` · Datos personales | La superficie de una wallet incluye a quien la usa. |
| 🗓️ `BTC-INTEL` · La inteligencia tiene fecha | Un verde sobre avisos sin revisar es una tranquilidad falsa. |
| 🖥️ `BTC-OPSEC` · Postura de la instalación | La herramienta con la que miras tus claves también se audita. |

---

## 🔑 BTC-KEY — Procedencia de la semilla

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-KEY-001`](BTC-KEY-001.md) | Semilla creada con firmware afectado | 🔴 Crítica |
| [`BTC-KEY-002`](BTC-KEY-002.md) | Firmware de creación desconocido | 🟠 Alta · 🟡 Media |
| [`BTC-KEY-003`](BTC-KEY-003.md) | Origen de entropía desconocido | 🟡 Media |

---

## 🏛️ BTC-CUSTODY — Arquitectura de custodia

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-CUSTODY-001`](BTC-CUSTODY-001.md) | Fondos de alto valor dependen de una sola clave | 🔴 Crítica |
| [`BTC-CUSTODY-002`](BTC-CUSTODY-002.md) | Multisig sin diversidad de implementación | 🟠 Alta · 🟡 Media |
| [`BTC-CUSTODY-003`](BTC-CUSTODY-003.md) | Quorum sin tolerancia a fallos (N-de-N) | 🟠 Alta · 🟡 Media |

---

## 💸 BTC-TX — Gasto observado

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-TX-001`](BTC-TX-001.md) | Gasto observado sin aprobación conocida | 🔴 Crítica |
| [`BTC-TX-002`](BTC-TX-002.md) | Barrido del saldo de una wallet vigilada | 🔴 Crítica |
| [`BTC-TX-003`](BTC-TX-003.md) | Varios gastos sin aprobación en ventana corta | 🔴 Crítica |

---

## 🔗 BTC-NODE — Salud de la observación

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-NODE-001`](BTC-NODE-001.md) | Bitcoin Core no disponible | 🟠 Alta |
| [`BTC-NODE-002`](BTC-NODE-002.md) | Nodo todavía no sincronizado | 🟡 Media |
| [`BTC-NODE-003`](BTC-NODE-003.md) | Nodo sin peers | 🟠 Alta |
| [`BTC-NODE-004`](BTC-NODE-004.md) | Presión elevada de mempool | 🟡 Media |

---

## 👤 BTC-PRIVACY — Datos personales

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-PRIVACY-001`](BTC-PRIVACY-001.md) | Acceso masivo a datos de clientes | 🔴 Crítica · 🟡 Media |
| [`BTC-PRIVACY-002`](BTC-PRIVACY-002.md) | El proveedor filtrado fabrica tus firmantes | 🟠 Alta |

---

## 🗓️ BTC-INTEL — La inteligencia tiene fecha

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-INTEL-001`](BTC-INTEL-001.md) | Matriz de avisos sin verificar | 🟡 Media · 🟠 Alta |
| [`BTC-INTEL-002`](BTC-INTEL-002.md) | Sin matriz de avisos cargada | 🟠 Alta |
| [`BTC-INTEL-003`](BTC-INTEL-003.md) | Avisos sin fecha de verificación | 🟡 Media |

---

## 🖥️ BTC-OPSEC — Postura de la instalación

| Regla | Detecta | Severidad |
| --- | --- | --- |
| [`BTC-OPSEC-001`](BTC-OPSEC-001.md) | El panel escucha fuera de loopback | 🔴 Crítica · 🟡 Media |
| [`BTC-OPSEC-002`](BTC-OPSEC-002.md) | Inventario con saldo declarado en modo demostración | 🟡 Media |
| [`BTC-OPSEC-003`](BTC-OPSEC-003.md) | Clave de datos por debajo del mínimo recomendado | 🟠 Alta · 🟡 Media |
| [`BTC-OPSEC-004`](BTC-OPSEC-004.md) | RPC de Bitcoin Core remoto habilitado | 🟠 Alta |
| [`BTC-OPSEC-005`](BTC-OPSEC-005.md) | RPC autenticado con usuario y contraseña | 🟡 Media |
| [`BTC-OPSEC-006`](BTC-OPSEC-006.md) | Watchtower apagado con wallets de alto valor | 🟡 Media |
| [`BTC-OPSEC-007`](BTC-OPSEC-007.md) | Límites de petición por encima de lo razonable | ⚪ Baja |
| [`BTC-OPSEC-008`](BTC-OPSEC-008.md) | La cadena de auditoría no verifica | 🔴 Crítica |

---

## 🌐 Versión publicada

Las mismas fichas, en la página del producto:
[reglas](https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/reglas.html).
