# Plugin: rootcause-bitcoin-defense

Copia generada. **No editar aquí**: la fuente está en `.claude/` del
repositorio y se sincroniza con `node scripts/sync-plugin.js`.

## Qué instala

| Componente | Qué hace |
| --- | --- |
| Skill `bitcoin-custody-audit` | Las 14 etapas de auditoría de custodia Bitcoin |
| Agente `bitcoin-security-auditor` | Auditor especializado que nunca pide ni acepta material secreto |
| Comando `/auditar-bitcoin` | Ejecuta la auditoría y explica el resultado por bloques |

## Con repositorio y sin repositorio

Dentro de `rootcause-bitcoin-defense` el skill tiene ejecutable:
`node scripts/audit-bitcoin.js` corre las etapas automatizables y produce el
informe.

Fuera de él **no hay ejecutable**, y eso está declarado a propósito: el agente
aplica las mismas 14 etapas como entrevista y revisión manual. Las etapas 1, 2,
3 y 14 no necesitan ninguna herramienta, solo preguntas bien hechas.

## Regla que hereda de la casa

Una etapa que no puede comprobarse sale **omitida**, nunca aprobada. Un informe
que no declara su cobertura es un informe que miente.
