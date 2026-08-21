# Agente de seguridad Bitcoin y plugin

El conocimiento de este repositorio existe en cuatro formas, en orden creciente
de autonomía. Es deliberado: **cada nivel se apoya en el anterior y ninguno
inventa nada que el anterior no verifique.**

| Nivel | Forma | Dónde vive | Qué aporta |
|---|---|---|---|
| 1 | Workflows de CI | `.github/workflows/` | Vigilancia continua sin intervención |
| 2 | Skill de 14 etapas | `.claude/skills/bitcoin-custody-audit/` | Procedimiento reproducible con ejecutable |
| 3 | Agente y comando | `.claude/agents/`, `.claude/commands/` | Criterio aplicado a casos que no encajan en un script |
| 4 | Funcionalidad del producto | `src/domain/posture.js`, `/api/posture` | La aplicación se audita a sí misma, sin nadie delante |

## Nivel 3 — el agente

`bitcoin-security-auditor` es un auditor especializado **exclusivamente** en
custodia Bitcoin. Ejecuta las 14 etapas cuando hay repositorio y las aplica como
entrevista cuando no lo hay.

### Sus reglas innegociables

1. **Nunca pide ni acepta material secreto.** Si el usuario ofrece una semilla,
   la rechaza y explica que no la necesita. Si detecta que ya la escribió en
   algún sitio, la trata como comprometida: la recomendación es **rotar**.
2. **Nunca firma ni transmite.** Describe el procedimiento; la ejecución es
   humana y con verificación en dispositivos independientes.
3. **Nunca afirma que algo está limpio sin haberlo comprobado.** «No comprobado»
   es una respuesta legítima; «parece correcto» no lo es.
4. **Distingue síntoma de causa raíz.**
5. **No promete lo imposible**: no se revierte una transacción confirmada ni se
   deduce la entropía de una semilla mirando una dirección.

### Errores que tiene prohibidos

- Dar por cerrado un `BTC-KEY-001` porque el usuario actualizó el firmware.
- Tratar la falta de datos como ausencia de problema.
- Recomendar mover fondos con prisa.
- Sugerir que el usuario introduzca su frase en cualquier herramienta —incluida
  cualquiera escrita por él mismo.

### El comando

`/auditar-bitcoin` ejecuta la auditoría y explica el resultado por bloques
—claves, software, instalación, personas—, traduciendo cada hallazgo a riesgo
real para los fondos en vez de a jerga de la herramienta.

## El plugin

`plugin/` empaqueta el skill, el agente y el comando para instalarlos en otra
máquina o en otro repositorio.

```text
plugin/
  .claude-plugin/plugin.json
  skills/bitcoin-custody-audit/SKILL.md
  agents/bitcoin-security-auditor.md
  commands/auditar-bitcoin.md
  README.md
```

### Es una copia generada, y se verifica

La fuente de verdad es `.claude/`: lo que este repositorio usa de verdad todos
los días. `plugin/` se regenera desde ahí:

```bash
node scripts/sync-plugin.js          # regenera
node scripts/sync-plugin.js --check  # falla si divergen
```

El job `plugin` de `security-audit.yml` corre la comprobación en cada push.
**Un plugin que promete algo que el proyecto no practica es peor que no
publicarlo**, y dos copias editables a mano divergen siempre.

### Con repositorio y sin repositorio

Dentro de `rootcause-bitcoin-defense`, el skill tiene ejecutable:
`node scripts/audit-bitcoin.js` corre las etapas automatizables.

Fuera de él **no hay ejecutable, y está declarado a propósito**. El agente
aplica las mismas 14 etapas como entrevista y revisión manual; las etapas 1, 2,
3 y 14 no necesitan ninguna herramienta, solo preguntas bien hechas. Prometer un
comando que no existiría sería exactamente el tipo de afirmación sin cobertura
que todo este trabajo intenta evitar.

## Relación con el skill genérico de 12 capas

`security-audit` audita **el repositorio**: dependencias, CVE, SAST, contenedor,
secretos. `bitcoin-custody-audit` audita **la custodia**: de dónde vienen las
claves, qué las puede romper y si la instalación que las vigila está bien puesta.

No se solapan: se encadenan. El orden natural es primero el genérico sobre el
repositorio y después el de dominio sobre la custodia. La correspondencia capa a
capa está en [`AUDITORIA_14_ETAPAS.md`](AUDITORIA_14_ETAPAS.md).

## Por qué cuatro niveles y no uno

Porque cada uno falla de una manera distinta y se cubren entre ellos:

- Un **workflow** no se olvida, pero solo comprueba lo que alguien programó.
- Un **skill** es reproducible, pero necesita que alguien lo invoque.
- Un **agente** se adapta a lo que no encaja en un script, pero puede
  equivocarse: por eso sus reglas están escritas y sus afirmaciones deben
  apoyarse en comprobaciones ejecutables.
- La **funcionalidad del producto** vigila sin nadie delante, pero solo ve lo
  que la instalación le muestra.

Ninguno de los cuatro es de fiar por sí solo. Los cuatro juntos, con sus límites
declarados, sí lo son razonablemente.
