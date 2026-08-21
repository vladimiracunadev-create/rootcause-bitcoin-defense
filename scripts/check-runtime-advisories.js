// Capa de cadena de suministro para un repositorio sin dependencias.
//
// Este proyecto no instala paquetes de terceros, así que un scan de CVE sobre
// `node_modules` diría «0 vulnerabilidades» y sería verdad — y también sería
// engañoso. El código ajeno que SÍ se distribuye es el motor Node.js que viaja
// dentro de la aplicación de Windows.
//
// Aquí se audita exactamente eso: se contrasta cada versión de Node en juego
// contra la base de vulnerabilidades del Node.js Security Working Group.
//
// Regla de honestidad, heredada del skill de auditoría en 12 capas: el informe
// declara siempre su COBERTURA. Sin red no hay datos, y sin datos no se
// devuelve verde: se dice que no se pudo auditar.
//
//   node scripts/check-runtime-advisories.js
//   node scripts/check-runtime-advisories.js --version=22.23.2
//   node scripts/check-runtime-advisories.js --json
//   node scripts/check-runtime-advisories.js --offline-ok   (solo en local)
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";

const DB_URL =
  "https://raw.githubusercontent.com/nodejs/security-wg/main/vuln/core/index.json";
const TIMEOUT_MS = 20000;

const args = process.argv.slice(2);
const flag = (name) => args.includes("--" + name);
const values = (name) =>
  args
    .filter((entry) => entry.startsWith("--" + name + "="))
    .map((entry) => entry.slice(name.length + 3));

// ── Comparación de versiones ────────────────────────────────────────────────
// Subconjunto deliberado de semver: el que realmente usa la base del Security
// WG (`22.x`, `^24.17.0`, `<18.20.5`, `>=20.0.0 <20.18.1`). No se pretende
// implementar semver completo: se pretende no equivocarse en lo que sí se usa.
function parseVersion(value) {
  const cleaned = String(value).trim().replace(/^v/, "");
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}

function compare(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1;
  }
  return 0;
}

function satisfiesComparator(version, token) {
  const trimmed = token.trim();
  if (!trimmed) return true;

  const wildcard = trimmed.match(/^(\d+)(?:\.(\d+))?\.(?:x|\*)$/i);
  if (wildcard) {
    if (version[0] !== Number(wildcard[1])) return false;
    if (wildcard[2] !== undefined && version[1] !== Number(wildcard[2])) return false;
    return true;
  }

  const operatorMatch = trimmed.match(/^(>=|<=|>|<|=|\^|~)?\s*(.+)$/);
  if (!operatorMatch) return false;
  const operator = operatorMatch[1] || "=";
  const target = parseVersion(operatorMatch[2]);
  if (!target) return false;
  const result = compare(version, target);

  switch (operator) {
    case ">=":
      return result >= 0;
    case "<=":
      return result <= 0;
    case ">":
      return result > 0;
    case "<":
      return result < 0;
    case "^":
      // ^22.23.0 → >=22.23.0 <23.0.0
      return result >= 0 && version[0] === target[0];
    case "~":
      // ~22.23.0 → >=22.23.0 <22.24.0
      return result >= 0 && version[0] === target[0] && version[1] === target[1];
    default:
      return result === 0;
  }
}

function satisfiesRange(version, range) {
  const text = String(range || "").trim();
  if (!text) return false;
  // Normaliza "<= 4.1.2" a "<=4.1.2" para poder separar por espacios.
  const normalized = text.replace(/(>=|<=|>|<|=|\^|~)\s+/g, "$1");
  return normalized
    .split("||")
    .some((clause) =>
      clause
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .every((token) => satisfiesComparator(version, token))
    );
}

// ── Versiones a auditar ─────────────────────────────────────────────────────
async function versionsUnderAudit() {
  const found = new Map();

  const add = (raw, origin, gating) => {
    const parsed = parseVersion(raw);
    if (!parsed) return;
    const key = parsed.join(".");
    const entry = found.get(key) || { version: parsed, origins: [], gating: false };
    if (!entry.origins.includes(origin)) entry.origins.push(origin);
    entry.gating = entry.gating || gating;
    found.set(key, entry);
  };

  // El runtime que ejecuta la comprobación es informativo salvo que se pida lo
  // contrario: en CI, el Node del runner no es el Node que se distribuye, y
  // teñir de rojo por él escondería el dato que sí importa.
  add(process.version, "runtime que ejecuta esta comprobación", flag("include-current"));
  for (const explicit of values("version")) add(explicit, "indicada por parámetro", true);

  // Cualquier paquete ya construido declara su runtime en BUILD-INFO.json.
  const buildDir = path.join(PROJECT_ROOT, "build");
  if (fs.existsSync(buildDir)) {
    const stack = [buildDir];
    while (stack.length) {
      const current = stack.pop();
      let entries = [];
      try {
        entries = await fsp.readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const target = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(target);
        else if (entry.name === "BUILD-INFO.json") {
          try {
            // Los paquetes de la 0.2.0 se escribieron con BOM: se tolera al
            // leer, aunque el empaquetador ya no lo genere.
            const raw = (await fsp.readFile(target, "utf8")).replace(/^\uFEFF/, "");
            const info = JSON.parse(raw);
            if (info.nodeVersion) {
              add(
                info.nodeVersion,
                "empaquetado en " + path.relative(PROJECT_ROOT, target),
                true
              );
            }
          } catch {
            /* un BUILD-INFO ilegible se reporta como cobertura perdida, no como verde */
            process.stderr.write(
              "  aviso: BUILD-INFO.json ilegible en " + path.relative(PROJECT_ROOT, target) + "\n"
            );
          }
        }
      }
    }
  }

  const all = [...found.values()];
  // Si nadie declaró una versión a auditar, el runtime local pasa a bloquear:
  // una ejecución suelta tiene que poder decir «tu Node está viejo».
  if (!all.some((entry) => entry.gating)) all.forEach((entry) => { entry.gating = true; });
  return all;
}

// ── Base de vulnerabilidades ────────────────────────────────────────────────
async function fetchDatabase() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(DB_URL, { signal: controller.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Informe ─────────────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };

const targets = await versionsUnderAudit();

let database;
try {
  database = await fetchDatabase();
} catch (error) {
  const message =
    "No se pudo descargar la base del Node.js Security WG: " + error.message;
  if (flag("offline-ok")) {
    console.log(message);
    console.log("COBERTURA: 0 % — auditoría de runtime NO realizada (--offline-ok).");
    process.exit(0);
  }
  console.error(message);
  console.error(
    "Sin datos no hay auditoría: esto no es un verde, es una comprobación que no pudo hacerse."
  );
  process.exit(1);
}

const advisories = Object.entries(database).map(([id, entry]) => ({ id, ...entry }));
const findings = [];

for (const target of targets) {
  for (const advisory of advisories) {
    const affected =
      satisfiesRange(target.version, advisory.vulnerable) &&
      !satisfiesRange(target.version, advisory.patched);
    if (!affected) continue;
    findings.push({
      version: target.version.join("."),
      origins: target.origins,
      gating: target.gating,
      id: advisory.id,
      cve: Array.isArray(advisory.cve) ? advisory.cve.join(", ") : advisory.cve || "sin CVE",
      severity: (advisory.severity || "unknown").toLowerCase(),
      patched: advisory.patched,
      overview: (advisory.overview || "").split("\n")[0].slice(0, 160),
      ref: advisory.ref || ""
    });
  }
}

findings.sort(
  (a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
    a.version.localeCompare(b.version)
);

if (flag("json")) {
  console.log(
    JSON.stringify(
      {
        auditedVersions: targets.map((target) => ({
          version: target.version.join("."),
          origins: target.origins,
          gating: target.gating
        })),
        advisoriesEvaluated: advisories.length,
        findings
      },
      null,
      2
    )
  );
} else {
  console.log("Auditoría del runtime distribuido (Node.js Security WG)");
  console.log("  avisos evaluados: " + advisories.length);
  for (const target of targets) {
    console.log(
      "  versión auditada: v" +
        target.version.join(".") +
        (target.gating ? "  [bloquea]  (" : "  [informativa]  (") +
        target.origins.join("; ") +
        ")"
    );
  }
  // La cobertura se declara siempre, haya hallazgos o no.
  console.log(
    "  COBERTURA: " +
      targets.length +
      " versión(es) de Node contrastadas contra la base oficial; 0 dependencias npm que auditar."
  );

  if (!findings.length) {
    console.log("\nSin avisos aplicables a las versiones auditadas.");
  } else {
    console.log("");
    for (const finding of findings) {
      console.log(
        "  [" +
          finding.severity.toUpperCase() +
          "] v" +
          finding.version +
          (finding.gating ? " " : " (informativo) ") +
          "— " +
          finding.cve
      );
      console.log("      " + finding.overview);
      console.log("      corregido en: " + finding.patched);
      if (finding.ref) console.log("      " + finding.ref);
    }
  }
}

const blocking = findings.filter((finding) => finding.gating);
const informational = findings.length - blocking.length;

if (informational) {
  console.log(
    "\n" +
      informational +
      " aviso(s) afectan al runtime que ejecuta esta comprobacion, no al que se " +
      "distribuye. Informativo: actualiza tu Node local cuando puedas."
  );
}

if (blocking.length) {
  process.stderr.write(
    "\n" +
      blocking.length +
      " aviso(s) afectan al runtime que SE DISTRIBUYE. " +
      "Republicar la aplicación con un Node parcheado (docs/RELEASE_CHECKLIST.md).\n"
  );
  process.exitCode = 1;
}
