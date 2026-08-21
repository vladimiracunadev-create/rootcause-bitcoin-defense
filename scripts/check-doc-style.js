// Estilo visual de la documentación RootCause.
//
// Los cuatro repositorios de la familia comparten un lenguaje visual: un único
// H1 con subtítulo tras guion largo, secciones numeradas con `N ·`, tablas con
// cabecera, semáforo 🟢🟡🔴⚪ para los estados y notas destacadas en cita.
//
// Que eso se mantenga no puede depender de que alguien se acuerde. Aquí se
// comprueba lo que es objetivamente comprobable; el resto —el tono, la
// honestidad de lo que se afirma— sigue siendo cosa de quien escribe.
//
//   node scripts/check-doc-style.js
//   node scripts/check-doc-style.js --json
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";

// `.claude/` son definiciones de herramienta con frontmatter, no documentación;
// `plugin/` es copia generada de ellas; el changelog tiene su propio formato
// establecido. Ninguno se rige por estas convenciones.
const IGNORED = new Set([
  "node_modules",
  ".git",
  "data",
  "build",
  "coverage",
  "plugin",
  ".claude"
]);
const EXENTOS = new Set(["CHANGELOG.md"]);
const json = process.argv.includes("--json");

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(target)));
    else if (entry.name.endsWith(".md")) results.push(target);
  }
  return results;
}

const problems = [];
const files = (await walk(PROJECT_ROOT)).sort();
const indexContent = await fs
  .readFile(path.join(PROJECT_ROOT, "docs", "INDEX.md"), "utf8")
  .catch(() => "");

// Índices de subdirectorio, cargados una vez.
const subIndexes = new Map();
for (const file of files) {
  const relative = path.relative(PROJECT_ROOT, file).split(path.sep).join("/");
  const partes = relative.split("/");
  if (partes[0] === "docs" && partes.length > 2 && partes.at(-1) === "README.md") {
    subIndexes.set(
      partes.slice(1, -1).join("/"),
      await fs.readFile(file, "utf8")
    );
  }
}

for (const file of files) {
  const relative = path.relative(PROJECT_ROOT, file).split(path.sep).join("/");
  if (EXENTOS.has(relative)) continue;
  const content = await fs.readFile(file, "utf8");
  const lines = content.split(/\r?\n/);
  const report = (line, message) => problems.push({ file: relative, line, message });

  // ── Estructura de encabezados ──────────────────────────────────────────────
  let inFence = false;
  let fenceLanguageMissing = 0;
  const headings = [];
  let tableRows = 0;

  lines.forEach((text, index) => {
    const number = index + 1;

    const fence = text.match(/^\s*(```|~~~)(.*)$/);
    if (fence) {
      if (!inFence) {
        inFence = fence[1];
        if (!fence[2].trim()) fenceLanguageMissing = number;
      } else if (text.trim().startsWith(inFence)) {
        inFence = false;
      }
      return;
    }
    if (inFence) return;

    const heading = text.match(/^(#{1,6})\s+(.*)$/);
    if (heading) headings.push({ level: heading[1].length, text: heading[2], line: number });

    if (/^\s*\|/.test(text)) tableRows += 1;
    if (/\t/.test(text)) report(number, "usa tabulación: la casa indenta con espacios");
    if (/[ ]+$/.test(text)) report(number, "espacios al final de línea");
  });

  if (inFence) report(lines.length, "bloque de código sin cerrar");
  if (fenceLanguageMissing) {
    report(fenceLanguageMissing, "bloque de código sin lenguaje declarado (```bash, ```json…)");
  }

  const h1 = headings.filter((entry) => entry.level === 1);
  if (h1.length === 0) report(1, "sin encabezado H1");
  if (h1.length > 1) report(h1[1].line, "más de un H1: el documento debe tener un solo título");
  if (h1.length && headings[0].level !== 1) {
    report(headings[0].line, "el primer encabezado no es el H1");
  }
  for (const heading of headings) {
    if (heading.level > 4) {
      report(heading.line, "encabezado de nivel " + heading.level + ": la casa no baja de H4");
    }
  }

  // ── Tablas bien formadas ───────────────────────────────────────────────────
  // Una fila de cabecera sin su separador se renderiza como texto suelto: es el
  // error de formato que más veces ha roto un documento de esta familia.
  inFence = false;
  lines.forEach((text, index) => {
    const fence = text.match(/^\s*(```|~~~)/);
    if (fence) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const isRow = /^\s*\|/.test(text);
    const previousIsRow = index > 0 && /^\s*\|/.test(lines[index - 1]);
    const nextLine = lines[index + 1] || "";
    if (isRow && !previousIsRow && !/^\s*\|[\s:|-]+\|\s*$/.test(nextLine)) {
      report(index + 1, "tabla sin fila separadora debajo de la cabecera");
    }
  });

  // ── Los documentos de docs/ viven en un índice ─────────────────────────────
  //
  // En la raíz de docs/, ese índice es INDEX.md. En un subdirectorio —las 26
  // fichas de regla, por ejemplo— es el README.md del propio subdirectorio, que
  // a su vez tiene que aparecer en INDEX.md. Así ninguna cadena queda suelta.
  if (relative.startsWith("docs/") && relative !== "docs/INDEX.md") {
    const name = relative.slice("docs/".length);
    const partes = name.split("/");
    if (partes.length === 1) {
      if (indexContent && !indexContent.includes(name)) {
        report(1, "no aparece en docs/INDEX.md: un documento que nadie enlaza no existe");
      }
    } else if (partes.at(-1) !== "README.md") {
      const indiceLocal = subIndexes.get(partes.slice(0, -1).join("/")) || "";
      if (!indiceLocal.includes(partes.at(-1))) {
        report(
          1,
          "no aparece en docs/" + partes.slice(0, -1).join("/") + "/README.md"
        );
      }
    } else if (indexContent && !indexContent.includes(name)) {
      report(1, "el índice del subdirectorio no aparece en docs/INDEX.md");
    }
  }

  // ── Firma visual de la familia RootCause en el README ─────────────────────
  //
  // Los cuatro repositorios se reconocen a simple vista por lo mismo: el banner
  // ASCII en caja doble, la fila de badges, la línea de enlaces destacados y el
  // lema. Si eso se pierde, el repositorio deja de parecer parte de la familia.
  if (relative === "README.md") {
    if (!/╔═+╗[\s\S]*ROOTCAUSE|╔═+╗[\s\S]*█/.test(content)) {
      report(1, "sin el banner ASCII en caja doble de la familia RootCause");
    }
    const badges = content.match(/\[!\[[^\]]*\]\(https:\/\/[^)]+\)\]\([^)]+\)/g) || [];
    if (badges.length < 6) {
      report(1, "menos de seis badges: la familia muestra CI, licencia, plataforma y claims");
    }
    if (!content.includes("Manual de usuario →")) {
      report(1, "sin la línea de enlaces destacados (producto · descarga · manual)");
    }
    if (!/>\s\*\*Diagnóstico primero\. Intervención después\.\*\*/.test(content)) {
      report(1, "sin el lema de la familia: «Diagnóstico primero. Intervención después.»");
    }
  }

  // ── Densidad mínima de estructura ──────────────────────────────────────────
  // No es capricho tipográfico: en esta familia la información que se consulta
  // deprisa —estados, umbrales, comandos— va en tabla, no en párrafo.
  if (lines.length > 60 && tableRows === 0) {
    report(1, "documento largo sin una sola tabla: revisa si algo debería tabularse");
  }
}

if (json) {
  console.log(JSON.stringify({ files: files.length, problems }, null, 2));
} else if (problems.length) {
  console.error("Estilo de documentación — " + problems.length + " problema(s):");
  for (const problem of problems) {
    console.error("- " + problem.file + ":" + problem.line + " · " + problem.message);
  }
} else {
  console.log(
    "Estilo de documentación verificado en " +
      files.length +
      " documentos: un H1, tablas con cabecera, bloques con lenguaje y todo docs/ indexado."
  );
}

if (problems.length) process.exitCode = 1;
