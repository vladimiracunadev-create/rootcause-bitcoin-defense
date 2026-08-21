---
description: Audita la custodia Bitcoin en 14 etapas y deja un informe con plan de remediación
argument-hint: "[--report] [--stages=1,2,3] [contra qué instalación]"
allowed-tools: Bash(node scripts/*), Read, Grep, Glob, WebFetch
---

Ejecuta la auditoría de custodia Bitcoin de este repositorio y explícame el
resultado.

Argumentos recibidos: $ARGUMENTS

Pasos:

1. Ejecuta `node scripts/audit-bitcoin.js --json` (añade `--report` si te lo
   piden en los argumentos, y `--stages=` si acotan etapas).
2. Resume el estado por bloques: claves (1-3), software (4-8), instalación
   (9-13) y personas (14).
3. Para cada etapa **fallida o con atención**, di qué significa en términos de
   riesgo real para los fondos, no en términos de la herramienta.
4. Presenta el plan de remediación priorizado por urgencia: primero lo que puede
   costar dinero hoy, después la deuda estructural.
5. Declara explícitamente qué quedó **sin comprobar** y por qué. Una etapa
   omitida no es una etapa aprobada.
6. Si alguna etapa señala inteligencia vieja (`BTC-INTEL-001`), ofrece
   contrastar la matriz de avisos con las fuentes oficiales de los fabricantes
   que aparezcan en el inventario.

No pidas nunca semillas, passphrases ni claves privadas: la auditoría no las
necesita y la aplicación las rechaza.
