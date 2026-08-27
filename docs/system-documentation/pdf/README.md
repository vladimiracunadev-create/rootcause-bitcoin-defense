# Documentación de sistema en PDF

Los mismos 20 documentos de [`../README.md`](../README.md), compuestos para
leer fuera del navegador o para imprimir.

> **Los Markdown son la fuente única.** Estos PDF se generan desde ellos y no se
> editan a mano: la siguiente ejecución del generador los pisaría. Si algo hay
> que corregir, se corrige en el `.md` y se vuelve a generar.

---

## 1 · Cómo se regeneran

```bash
python scripts/build-docs-pdf.py
```

| Modo | Comando |
| --- | --- |
| Todos los documentos | `python scripts/build-docs-pdf.py` |
| Solo algunos | `python scripts/build-docs-pdf.py --only 03,07,19` |
| Comprobar que existen | `python scripts/build-docs-pdf.py --check` |

**Requisito:** `xhtml2pdf` en el entorno Python de quien genera la
documentación.

```bash
pip install xhtml2pdf
```

Si falta, el script lo dice y sale con código distinto de cero, en vez de dar la
tarea por hecha. **Es una herramienta de documentación, no del producto:** vive
fuera de `src/`, no participa en ningún flujo de la aplicación y no afecta al
claim de cero dependencias, que sigue verificándose en cada build con
`node scripts/check-local-only.js`.

---

## 2 · Los documentos

| # | PDF | Páginas | Contenido |
| ---: | --- | ---: | --- |
| — | [`README.pdf`](README.pdf) | 4 | Índice, datos del análisis y convenciones |
| 01 | [`01-system-overview.pdf`](01-system-overview.pdf) | 7 | Qué es el sistema, incluida la explicación para no técnicos |
| 02 | [`02-installation-and-execution.pdf`](02-installation-and-execution.pdf) | 7 | Instalación, variables y ejecución |
| 03 | [`03-architecture.pdf`](03-architecture.pdf) | 9 | Capas, patrones y siete diagramas |
| 04 | [`04-code-map.pdf`](04-code-map.pdf) | 10 | Inventario de todo el árbol |
| 05 | [`05-technical-reference.pdf`](05-technical-reference.pdf) | 15 | Constantes, endpoints, errores y 25 fichas de función |
| 06 | [`06-deep-code-explanation.pdf`](06-deep-code-explanation.pdf) | 19 | Cómo funciona por dentro, bloque a bloque |
| 07 | [`07-database.pdf`](07-database.pdf) | 11 | Persistencia, diccionario de datos y diagrama entidad-relación |
| 08 | [`08-data-flow.pdf`](08-data-flow.pdf) | 7 | De dónde viene y adónde va cada dato |
| 09 | [`09-apis-and-integrations.pdf`](09-apis-and-integrations.pdf) | 10 | Contrato HTTP e integraciones |
| 10 | [`10-configuration.pdf`](10-configuration.pdf) | 8 | Cada variable y qué rompe configurarla mal |
| 11 | [`11-security.pdf`](11-security.pdf) | 10 | Controles, huecos y resultados verificados |
| 12 | [`12-testing-and-quality.pdf`](12-testing-and-quality.pdf) | 8 | Cobertura medida y pruebas que faltan |
| 13 | [`13-deployment-and-operations.pdf`](13-deployment-and-operations.pdf) | 7 | Construcción, publicación y operación |
| 14 | [`14-troubleshooting.pdf`](14-troubleshooting.pdf) | 10 | Síntoma, causa, diagnóstico y riesgo de la solución |
| 15 | [`15-risks-and-technical-debt.pdf`](15-risks-and-technical-debt.pdf) | 10 | 25 hallazgos clasificados |
| 16 | [`16-glossary.pdf`](16-glossary.pdf) | 8 | Vocabulario del dominio y del sistema |
| 17 | [`17-executive-summary.pdf`](17-executive-summary.pdf) | 6 | Para quien decide |
| 18 | [`18-new-developer-guide.pdf`](18-new-developer-guide.pdf) | 8 | Itinerario de incorporación |
| 19 | [`19-traceability-matrix.pdf`](19-traceability-matrix.pdf) | 23 | 86 filas de interfaz a disco y prueba |

**197 páginas en total**, generadas el 2026-08-26 sobre el commit `acdf4dd`.

---

## 3 · Qué cambia respecto a la versión Markdown

Tres diferencias, y las tres están declaradas a propósito:

| Elemento | En Markdown | En PDF | Por qué |
| --- | --- | --- | --- |
| Diagramas Mermaid | Renderizados por GitHub | **Su código fuente, etiquetado** | Un PDF no ejecuta JavaScript, y renderizarlos exigiría Node, npm y un navegador headless. Por eso cada diagrama va siempre con su explicación en prosa: el PDF se entiende sin la imagen |
| Semáforo 🟢🟡🔴⚪ | Emoji de color | `[OK]`, `[ATENCION]`, `[FALLO]`, `[NO COMPROBADO]` | Las fuentes con las que se compone un PDF no llevan emoji de color. El estado es información, no adorno: se traduce en vez de perderse |
| Tablas de 7 o más columnas | Tabla completa | **Una ficha de campo y valor por fila** | No caben en A4 vertical. Encogerlas hasta que quepan hace que las celdas se derramen unas sobre otras. No se pierde ningún dato |

Ninguna otra cosa cambia: mismo texto, mismas tablas, mismos enlaces —que en el
PDF aparecen subrayados, porque una hoja impresa no se pulsa—.

---

## 4 · Cómo se compone cada PDF

| Elemento | Detalle |
| --- | --- |
| Formato | A4 vertical, márgenes de 2 cm arriba y abajo, 1,6 cm a los lados |
| Portada | Nombre del sistema, título, versión analizada, commit y archivo de origen |
| Índice | Secciones de nivel 2, a dos columnas, en documentos de cuatro secciones o más |
| Pie | Sistema, documento, versión y numeración `página N de M` |
| Fuente | DejaVu Sans y DejaVu Sans Mono, por su cobertura Unicode |
| Tablas | Cabecera repetida al cruzar de página |

Si la fuente DejaVu no está en el sistema, el generador lo dice y cae a
Helvetica, cuya cobertura Latin-1 no incluye el guion largo ni las flechas.

---

| Volver a | |
| --- | --- |
| Índice de la documentación de sistema | [`../README.md`](../README.md) |
| Índice general de documentación | [`../../INDEX.md`](../../INDEX.md) |
