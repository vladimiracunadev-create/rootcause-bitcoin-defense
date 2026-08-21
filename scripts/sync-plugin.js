// Mantiene el plugin distribuible sincronizado con lo que se usa aquí.
//
// La fuente de verdad es `.claude/`: el skill, el agente y el comando que este
// repositorio usa de verdad todos los días. `plugin/` es una COPIA GENERADA con
// el manifiesto necesario para instalarlo en otra máquina.
//
// Dos copias que divergen serían un plugin que promete algo distinto de lo que
// el proyecto practica, así que CI regenera y compara: si hay diferencia, el
// build cae.
//
//   node scripts/sync-plugin.js            regenera plugin/
//   node scripts/sync-plugin.js --check    falla si plugin/ no está al día
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";

const check = process.argv.includes("--check");
const source = path.join(PROJECT_ROOT, ".claude");
const target = path.join(PROJECT_ROOT, "plugin");

const COPIES = [
  ["skills/bitcoin-custody-audit/SKILL.md", "skills/bitcoin-custody-audit/SKILL.md"],
  ["agents/bitcoin-security-auditor.md", "agents/bitcoin-security-auditor.md"],
  ["commands/auditar-bitcoin.md", "commands/auditar-bitcoin.md"]
];

const manifest = {
  name: "rootcause-bitcoin-defense",
  description:
    "Auditoría de custodia Bitcoin en 14 etapas: procedencia de claves contra avisos de fabricante, arquitectura de custodia, postura del despliegue y cadena de suministro del artefacto. Nunca pide semillas ni claves privadas.",
  version: JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "package.json"), "utf8")).version,
  author: {
    name: "Vladimir Acuña",
    url: "https://github.com/vladimiracunadev-create"
  },
  homepage: "https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/",
  repository: "https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense",
  license: "MIT",
  keywords: ["bitcoin", "custody", "security", "audit", "watch-only", "incident-response"]
};

const README = `# Plugin: rootcause-bitcoin-defense

Copia generada. **No editar aquí**: la fuente está en \`.claude/\` del
repositorio y se sincroniza con \`node scripts/sync-plugin.js\`.

## Qué instala

| Componente | Qué hace |
| --- | --- |
| Skill \`bitcoin-custody-audit\` | Las 14 etapas de auditoría de custodia Bitcoin |
| Agente \`bitcoin-security-auditor\` | Auditor especializado que nunca pide ni acepta material secreto |
| Comando \`/auditar-bitcoin\` | Ejecuta la auditoría y explica el resultado por bloques |

## Con repositorio y sin repositorio

Dentro de \`rootcause-bitcoin-defense\` el skill tiene ejecutable:
\`node scripts/audit-bitcoin.js\` corre las etapas automatizables y produce el
informe.

Fuera de él **no hay ejecutable**, y eso está declarado a propósito: el agente
aplica las mismas 14 etapas como entrevista y revisión manual. Las etapas 1, 2,
3 y 14 no necesitan ninguna herramienta, solo preguntas bien hechas.

## Regla que hereda de la casa

Una etapa que no puede comprobarse sale **omitida**, nunca aprobada. Un informe
que no declara su cobertura es un informe que miente.
`;

async function copyAll() {
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(path.join(target, ".claude-plugin"), { recursive: true });

  for (const [from, to] of COPIES) {
    const destination = path.join(target, to);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const content = await fs.readFile(path.join(source, from), "utf8");
    await fs.writeFile(
      destination,
      "<!-- Copia generada desde .claude/" +
        from +
        " por scripts/sync-plugin.js. No editar aquí. -->\n" +
        content,
      "utf8"
    );
  }

  await fs.writeFile(
    path.join(target, ".claude-plugin", "plugin.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );
  await fs.writeFile(path.join(target, "README.md"), README, "utf8");
}

if (check) {
  // Se regenera en un directorio temporal y se compara archivo a archivo.
  const differences = [];
  const expected = new Map();

  for (const [from, to] of COPIES) {
    const content = await fs.readFile(path.join(source, from), "utf8");
    expected.set(
      to,
      "<!-- Copia generada desde .claude/" +
        from +
        " por scripts/sync-plugin.js. No editar aquí. -->\n" +
        content
    );
  }
  expected.set(".claude-plugin/plugin.json", JSON.stringify(manifest, null, 2) + "\n");
  expected.set("README.md", README);

  for (const [relative, content] of expected) {
    let actual = null;
    try {
      actual = await fs.readFile(path.join(target, relative), "utf8");
    } catch {
      differences.push("falta " + relative);
      continue;
    }
    if (actual !== content) differences.push("desincronizado " + relative);
  }

  if (differences.length) {
    console.error(
      "El plugin no coincide con su fuente en .claude/:\n" +
        differences.map((entry) => "- " + entry).join("\n") +
        "\nRegenera con: node scripts/sync-plugin.js"
    );
    process.exitCode = 1;
  } else {
    console.log("Plugin sincronizado con .claude/ (" + expected.size + " archivos).");
  }
} else {
  await copyAll();
  console.log("Plugin regenerado en plugin/ desde .claude/");
}
