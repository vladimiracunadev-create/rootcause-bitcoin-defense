# Documentación de sistema — RootCause Bitcoin Defense

Estudio completo del repositorio hecho desde cero: qué es el sistema, cómo se
instala, cómo está construido, qué hace cada archivo, cada función y cada regla,
y qué queda sin verificar.

> **Diagnóstico primero. Intervención después.** Este conjunto documenta el
> sistema **tal y como está en el repositorio**, no como se desearía que
> estuviera. Cada afirmación se apoya en un archivo concreto y cada laguna se
> declara como laguna.

---

## 1 · Qué es este directorio y qué no es

`docs/` ya contiene 33 documentos de producto, seguridad y operación escritos por
el proyecto. **Este directorio no los reemplaza ni los repite.** Aporta la capa
que faltaba —el análisis de código a nivel de símbolo— y enlaza a lo existente
donde el tema ya está cubierto.

| Si buscas | Ve a |
| --- | --- |
| Qué hace el producto, para un usuario | [`../MANUAL_USUARIO.md`](../MANUAL_USUARIO.md) |
| El contrato HTTP como referencia de uso | [`../API.md`](../API.md) |
| La especificación funcional de las reglas | [`../HEURISTICAS.md`](../HEURISTICAS.md) y [`../reglas/README.md`](../reglas/README.md) |
| Modelo de amenazas y límites del producto | [`../THREAT_MODEL.md`](../THREAT_MODEL.md), [`../LIMITACIONES.md`](../LIMITACIONES.md) |
| **Qué archivo hace qué y quién llama a quién** | **este directorio** |
| **Firma, parámetros y riesgos de cada función** | **este directorio** |
| **Cómo se sigue una funcionalidad de la UI al disco** | **este directorio** |

---

## 2 · Datos del análisis

| Campo | Valor |
| --- | --- |
| Sistema | RootCause Bitcoin Defense |
| Versión analizada | `0.3.0` (`package.json`) |
| Commit | `acdf4dd` — *ci: deduplicar la puerta de fichas en el workflow de release* |
| Fecha del análisis | 2026-08-26 |
| Rama | `main` |
| Alcance | Todo el árbol excepto `.git/` y `build/` (artefactos generados) |
| Archivos de código analizados | 44 `.js` de primera parte (6096 líneas) |
| Método | Lectura completa del código + ejecución de la suite de pruebas y de los siete validadores del repositorio |

---

## 3 · Tabla de contenidos

| # | Documento | Para quién | Estado |
| ---: | --- | --- | --- |
| 01 | [`01-system-overview.md`](01-system-overview.md) | Cualquiera, incluida persona no técnica | 🟢 Completo |
| 02 | [`02-installation-and-execution.md`](02-installation-and-execution.md) | Quien instala o ejecuta | 🟢 Completo |
| 03 | [`03-architecture.md`](03-architecture.md) | Desarrollador, auditor | 🟢 Completo |
| 04 | [`04-code-map.md`](04-code-map.md) | Desarrollador nuevo | 🟢 Completo |
| 05 | [`05-technical-reference.md`](05-technical-reference.md) | Desarrollador, agente de IA | 🟢 Completo |
| 06 | [`06-deep-code-explanation.md`](06-deep-code-explanation.md) | Quien va a modificar el código | 🟢 Completo |
| 07 | [`07-database.md`](07-database.md) | Auditor, operador | 🟢 Completo (no hay SGBD) |
| 08 | [`08-data-flow.md`](08-data-flow.md) | Auditor, responsable de privacidad | 🟢 Completo |
| 09 | [`09-apis-and-integrations.md`](09-apis-and-integrations.md) | Integrador | 🟢 Completo |
| 10 | [`10-configuration.md`](10-configuration.md) | Operador | 🟢 Completo |
| 11 | [`11-security.md`](11-security.md) | Auditor de seguridad | 🟢 Completo |
| 12 | [`12-testing-and-quality.md`](12-testing-and-quality.md) | Desarrollador | 🟢 Completo |
| 13 | [`13-deployment-and-operations.md`](13-deployment-and-operations.md) | Operador, responsable de release | 🟢 Completo |
| 14 | [`14-troubleshooting.md`](14-troubleshooting.md) | Soporte | 🟢 Completo |
| 15 | [`15-risks-and-technical-debt.md`](15-risks-and-technical-debt.md) | Mantenedor, auditor | 🟢 Completo |
| 16 | [`16-glossary.md`](16-glossary.md) | Todos | 🟢 Completo |
| 17 | [`17-executive-summary.md`](17-executive-summary.md) | Dirección, cliente, evaluador | 🟢 Completo |
| 18 | [`18-new-developer-guide.md`](18-new-developer-guide.md) | Desarrollador que acaba de llegar | 🟢 Completo |
| 19 | [`19-traceability-matrix.md`](19-traceability-matrix.md) | Auditor, QA | 🟢 Completo |

Los mismos documentos en PDF: [`pdf/`](pdf/README.md).

---

## 4 · Convenciones usadas

| Marca | Significado |
| --- | --- |
| 🟢 | Verificado ejecutando algo o leyendo el archivo citado |
| 🟡 | Deuda o limitación conocida, declarada a propósito |
| 🔴 | Problema confirmado |
| ⚪ | **No comprobado.** Nunca equivale a un aprobado |
| *Inferencia* | Conclusión del análisis del código, no una afirmación del repositorio |
| `ruta/archivo.js:120` | Evidencia: archivo y línea donde comprobarlo |

Nombres reales de funciones, clases, variables, endpoints y archivos se
conservan tal cual para que todo sea trazable. **No aparece ningún secreto**: las
claves de ejemplo son marcadores, y los valores reales nunca se transcriben.

---

## 5 · Pendiente de validación humana

Lo que este análisis **no** pudo comprobar, listado sin adornos:

| # | Elemento | Por qué no se pudo verificar |
| ---: | --- | --- |
| 1 | Los avisos de `config/advisories.json` contra la fuente oficial del fabricante | Requiere red y criterio humano; el propio producto lo marca con `BTC-INTEL-001` |
| 2 | El comportamiento del instalador Inno Setup | Requiere compilar con `ISCC.exe`, no disponible en el entorno de análisis |
| 3 | La conexión real con un Bitcoin Core | No hay nodo en el entorno de análisis; se verificó el cliente por sus pruebas |
| 4 | Los workflows de GitHub Actions en ejecución | Se leyeron y se analizaron; no se dispararon |
| 5 | El artefacto publicado en Releases y su firma | Fuera del árbol de trabajo |

Detalle y clasificación por severidad en
[`15-risks-and-technical-debt.md`](15-risks-and-technical-debt.md).

---

| Volver a | |
| --- | --- |
| Índice general de documentación | [`../INDEX.md`](../INDEX.md) |
| README del proyecto | [`../../README.md`](../../README.md) |
