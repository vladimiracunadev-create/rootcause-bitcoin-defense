// Genera un documento por regla y su versión para GitHub Pages.
//
// Fuente única: `config/rules-catalog.json`. De ahí salen:
//
//   docs/reglas/<CODIGO>.md   ficha de cada regla, en el formato de la casa
//   docs/reglas/README.md     índice de las 26
//   landing/reglas.html       la misma información, publicada en Pages
//
// Nada de esto se edita a mano. Si se editara, la siguiente ejecución lo
// pisaría y `--check` habría fallado antes en CI. El motivo es el de siempre en
// este repositorio: dos copias de la misma verdad divergen, y una ficha de
// regla que no coincide con la regla es peor que no tener ficha.
//
//   node scripts/generate-rule-docs.js
//   node scripts/generate-rule-docs.js --check
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";

const check = process.argv.includes("--check");
const NL = String.fromCharCode(10);

const catalog = JSON.parse(
  await fs.readFile(path.join(PROJECT_ROOT, "config", "rules-catalog.json"), "utf8")
);

const SEVERIDAD = {
  critical: { emoji: "🔴", texto: "Crítica" },
  high: { emoji: "🟠", texto: "Alta" },
  medium: { emoji: "🟡", texto: "Media" },
  low: { emoji: "⚪", texto: "Baja" },
  info: { emoji: "🔵", texto: "Informativa" }
};

function severidad(valor) {
  return valor
    .split("|")
    .map((parte) => {
      const dato = SEVERIDAD[parte.trim()] || { emoji: "⚫", texto: parte };
      return dato.emoji + " " + dato.texto;
    })
    .join(" · ");
}

function familiaDe(rule) {
  return catalog.families[rule.code.split("-").slice(0, 2).join("-")];
}

// ── Documento por regla ──────────────────────────────────────────────────────
function fichaMarkdown(rule) {
  const familia = familiaDe(rule);
  const lineas = [
    "# " + rule.code + " — " + rule.title,
    "",
    "| | |",
    "| --- | --- |",
    "| **Familia** | " + familia.emoji + " `" + rule.code.split("-").slice(0, 2).join("-") + "` · " + familia.title + " |",
    "| **Severidad** | " + severidad(rule.severity) + " |",
    "| **Entidad** | " + rule.entity + " |",
    "| **Dispara** | " + rule.trigger + " |",
    "| **Umbral** | " + rule.threshold + " |",
    "| **Definida en** | [`" + rule.source + "`](../../" + rule.source + ") |",
    "",
    "> " + rule.severityNote,
    "",
    "---",
    "",
    "## 🧭 Qué significa",
    "",
    rule.meaning,
    "",
    "**Causa raíz declarada:** " + rule.rootCause,
    "",
    "## 🧾 Evidencia que adjunta",
    "",
    ...rule.evidence.map((entrada) => "- " + entrada),
    "",
    "Toda la evidencia es pública: huellas, metadatos y fechas. **Nunca material",
    "secreto** — pasa por `redactForAudit` antes de escribirse en la auditoría.",
    "",
    "## 🛠️ Remediación",
    "",
    ...rule.remediation.map((entrada, indice) => indice + 1 + ". " + entrada),
    "",
    "## ⚠️ Qué NO significa",
    "",
    ...rule.notMeaning.map((entrada) => "- " + entrada)
  ];

  if (rule.falsePositive) {
    lineas.push("", "## 🟡 Falso positivo esperable", "", rule.falsePositive);
  }

  lineas.push(
    "",
    "## 🔍 Cómo comprobarlo",
    "",
    "```bash",
    rule.verify,
    "```",
    ""
  );

  if (rule.related?.length) {
    lineas.push(
      "## 🔗 Reglas relacionadas",
      "",
      ...rule.related.map((codigo) => "- [`" + codigo + "`](" + codigo + ".md)"),
      ""
    );
  }

  lineas.push(
    "---",
    "",
    "| Volver a | |",
    "| --- | --- |",
    "| Índice de reglas | [`docs/reglas/README.md`](README.md) |",
    "| Especificación completa | [`docs/HEURISTICAS.md`](../HEURISTICAS.md) |",
    "| Qué se detecta y qué no | [`docs/DETECCION_AMENAZAS.md`](../DETECCION_AMENAZAS.md) |",
    ""
  );

  return lineas.join(NL);
}

// ── Índice de reglas ─────────────────────────────────────────────────────────
function indiceMarkdown() {
  const lineas = [
    "# Reglas incluidas — una ficha por cada una",
    "",
    "Las " +
      catalog.rules.length +
      " reglas del motor, cada una con su documento: qué la dispara, con qué",
    "umbral, qué evidencia adjunta, cómo se remedia y —sobre todo— **qué NO",
    "significa** cuando salta.",
    "",
    "> **Generado desde [`config/rules-catalog.json`](../../config/rules-catalog.json).**",
    "> No se edita a mano: una prueba comprueba que el catálogo y el motor tienen",
    "> exactamente los mismos códigos, así que una regla sin ficha rompe el build.",
    "",
    "| Familia | Qué mira |",
    "| --- | --- |",
    ...Object.entries(catalog.families).map(
      ([codigo, familia]) =>
        "| " + familia.emoji + " `" + codigo + "` · " + familia.title + " | " + familia.summary + " |"
    ),
    ""
  ];

  for (const [codigoFamilia, familia] of Object.entries(catalog.families)) {
    const reglas = catalog.rules.filter((rule) => rule.code.startsWith(codigoFamilia + "-"));
    if (!reglas.length) continue;
    lineas.push(
      "---",
      "",
      "## " + familia.emoji + " " + codigoFamilia + " — " + familia.title,
      "",
      "| Regla | Detecta | Severidad |",
      "| --- | --- | --- |",
      ...reglas.map(
        (rule) =>
          "| [`" +
          rule.code +
          "`](" +
          rule.code +
          ".md) | " +
          rule.title +
          " | " +
          severidad(rule.severity) +
          " |"
      ),
      ""
    );
  }

  lineas.push(
    "---",
    "",
    "## 🌐 Versión publicada",
    "",
    "Las mismas fichas, en la página del producto:",
    "[reglas](https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/reglas.html).",
    ""
  );

  return lineas.join(NL);
}

// ── Versión para GitHub Pages ────────────────────────────────────────────────
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Markdown mínimo: negritas, código y enlaces. Es todo lo que usa el catálogo,
// y una dependencia para esto sería exactamente lo que este proyecto no hace.
function enriquecer(texto) {
  return escaparHtml(texto)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function reglasHtml() {
  const tarjetas = [];
  for (const [codigoFamilia, familia] of Object.entries(catalog.families)) {
    const reglas = catalog.rules.filter((rule) => rule.code.startsWith(codigoFamilia + "-"));
    if (!reglas.length) continue;
    tarjetas.push(
      '      <section class="familia">',
      "        <p class=\"eyebrow\">" + familia.emoji + " " + codigoFamilia + "</p>",
      "        <h2>" + escaparHtml(familia.title) + "</h2>",
      "        <p class=\"lead\">" + escaparHtml(familia.summary) + "</p>",
      '        <div class="grid">'
    );
    for (const rule of reglas) {
      tarjetas.push(
        '          <article class="card regla" id="' + rule.code + '">',
        '            <p class="eyebrow"><code>' + rule.code + "</code> · " + severidad(rule.severity) + "</p>",
        "            <h3>" + escaparHtml(rule.title) + "</h3>",
        "            <p>" + enriquecer(rule.meaning) + "</p>",
        '            <p class="dispara"><strong>Dispara:</strong> ' + enriquecer(rule.trigger) + "</p>",
        '            <p class="nosignifica"><strong>No significa:</strong> ' + enriquecer(rule.notMeaning[0]) + "</p>",
        "          </article>"
      );
    }
    tarjetas.push("        </div>", "      </section>");
  }

  return [
    "<!DOCTYPE html>",
    '<html lang="es">',
    "",
    "<head>",
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '  <meta name="description"',
    '    content="Las ' +
      catalog.rules.length +
      ' reglas de RootCause Bitcoin Defense: qué dispara cada una, con qué umbral, qué evidencia adjunta y qué NO significa cuando salta." />',
    '  <meta property="og:title" content="Reglas — RootCause Bitcoin Defense" />',
    '  <meta property="og:description"',
    '    content="Procedencia de claves, arquitectura de custodia, gasto observado, salud del nodo, privacidad, frescura de la inteligencia y postura del despliegue." />',
    '  <meta property="og:type" content="website" />',
    '  <meta property="og:url" content="https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/reglas.html" />',
    "  <title>Reglas — RootCause Bitcoin Defense</title>",
    '  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />',
    '  <link rel="stylesheet" href="assets/style.css" />',
    "</head>",
    "",
    "<body>",
    "",
    '  <header class="nav">',
    '    <div class="nav-inner">',
    '      <span class="nav-logo"><span aria-hidden="true">₿</span> RootCause Bitcoin Defense</span>',
    '      <nav class="nav-links">',
    '        <a href="index.html">Inicio</a>',
    '        <a href="index.html#problema">El problema</a>',
    '        <a href="index.html#prueba">La prueba</a>',
    '        <a href="reglas.html">Reglas</a>',
    '        <a href="index.html#instalar">Instalar</a>',
    '        <a class="btn-nav" href="https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense">Ver en GitHub</a>',
    "      </nav>",
    "    </div>",
    "  </header>",
    "",
    '  <section class="hero hero-compacto">',
    '    <div class="inner">',
    '      <p class="eyebrow">Catálogo de detección</p>',
    "      <h1>" + catalog.rules.length + " reglas, y lo que cada una <em>no</em> significa</h1>",
    '      <p class="lead">',
    "        Cada regla es una afirmación causal que debe poder defenderse con la",
    "        evidencia que adjunta. Por eso todas declaran su umbral, su evidencia y",
    "        sus límites: una alerta sin siguiente paso entrena a ignorar alertas.",
    "      </p>",
    '      <div class="badges">',
    '        <span class="badge on">🔴 Crítica</span>',
    '        <span class="badge">🟠 Alta</span>',
    '        <span class="badge">🟡 Media</span>',
    '        <span class="badge">⚪ Baja</span>',
    "      </div>",
    "    </div>",
    "  </section>",
    "",
    '  <div class="inner">',
    ...tarjetas,
    "  </div>",
    "",
    "  <footer>",
    '    <div class="inner">',
    "      <div>",
    "        <strong>RootCause Bitcoin Defense</strong> · MIT · Vladimir Acuña<br />",
    "        Generado desde <code>config/rules-catalog.json</code>: la misma fuente que la documentación.",
    "      </div>",
    "      <div>",
    '        <a href="https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/blob/main/docs/reglas/README.md">Fichas completas</a> ·',
    '        <a href="https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/blob/main/docs/HEURISTICAS.md">Especificación</a> ·',
    '        <a href="https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/blob/main/docs/LIMITACIONES.md">Limitaciones</a>',
    "      </div>",
    "    </div>",
    "  </footer>",
    "",
    "</body>",
    "",
    "</html>",
    ""
  ].join(NL);
}

// ── Escritura o verificación ─────────────────────────────────────────────────
const salidas = new Map();
for (const rule of catalog.rules) {
  salidas.set(path.join("docs", "reglas", rule.code + ".md"), fichaMarkdown(rule));
}
salidas.set(path.join("docs", "reglas", "README.md"), indiceMarkdown());
salidas.set(path.join("landing", "reglas.html"), reglasHtml());

if (check) {
  const diferencias = [];
  for (const [relativo, contenido] of salidas) {
    let actual = null;
    try {
      actual = await fs.readFile(path.join(PROJECT_ROOT, relativo), "utf8");
    } catch {
      diferencias.push("falta " + relativo);
      continue;
    }
    if (actual !== contenido) diferencias.push("desincronizado " + relativo);
  }
  if (diferencias.length) {
    console.error(
      "Las fichas de regla no coinciden con el catálogo:" +
        NL +
        diferencias.map((entrada) => "- " + entrada).join(NL) +
        NL +
        "Regenera con: node scripts/generate-rule-docs.js"
    );
    process.exitCode = 1;
  } else {
    console.log(
      "Fichas de regla sincronizadas con el catálogo (" + salidas.size + " archivos)."
    );
  }
} else {
  await fs.mkdir(path.join(PROJECT_ROOT, "docs", "reglas"), { recursive: true });
  for (const [relativo, contenido] of salidas) {
    await fs.writeFile(path.join(PROJECT_ROOT, relativo), contenido, "utf8");
  }
  console.log(
    "Generadas " +
      catalog.rules.length +
      " fichas, su índice y la página publicada, desde config/rules-catalog.json"
  );
}
