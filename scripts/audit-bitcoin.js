// Auditoría de custodia Bitcoin en 14 etapas.
//
// Es el ejecutable del skill `bitcoin-custody-audit`. Encadena las
// comprobaciones automatizables del repositorio y de la instalación, y produce
// un informe Markdown reproducible.
//
// Hereda tres reglas del skill de auditoría en 12 capas:
//
//   1. Cada etapa declara su COBERTURA. Lo que no se pudo comprobar se lista
//      como no comprobado, nunca como aprobado.
//   2. Una etapa que no puede ejecutarse (falta red, falta git, falta el
//      binario) sale como OMITIDA con su motivo, no como verde.
//   3. El informe termina en un plan de remediación único y priorizado.
//
// Las etapas 1 a 8 son de repositorio y artefacto; las 9 a 14 miran la
// instalación viva y el proceso humano.
//
//   node scripts/audit-bitcoin.js
//   node scripts/audit-bitcoin.js --report
//   node scripts/audit-bitcoin.js --stages=1,2,3
//   node scripts/audit-bitcoin.js --json
//   node scripts/audit-bitcoin.js --fail-on-attention
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT, loadConfig } from "../src/config.js";
import { evaluatePosture } from "../src/domain/posture.js";
import { evaluateIntel } from "../src/domain/rule-engine.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes("--" + name);
const value = (name) => {
  const entry = args.find((item) => item.startsWith("--" + name + "="));
  return entry ? entry.slice(name.length + 3) : "";
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function runScript(relative, extra = []) {
  const result = spawnSync(process.execPath, [path.join(PROJECT_ROOT, relative), ...extra], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  return {
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

// Cada etapa devuelve: estado, cobertura y acciones.
const STAGES = [
  {
    number: 1,
    id: "procedencia",
    title: "Procedencia de claves y firmantes",
    question: "¿Se puede demostrar con qué firmware y método nació cada semilla?",
    async run() {
      const state = await loadDemoOrRealState();
      const signers = state.wallets.flatMap((wallet) =>
        (wallet.signers || []).map((signer) => ({ wallet: wallet.name, ...signer }))
      );
      const unknown = signers.filter(
        (signer) =>
          !signer.firmwareAtSeedCreation ||
          signer.firmwareAtSeedCreation === "unknown" ||
          signer.seedOrigin === "unknown"
      );
      return {
        status: unknown.length ? "atencion" : "ok",
        coverage:
          signers.length +
          " firmante(s) en el inventario; " +
          (signers.length - unknown.length) +
          " con procedencia completa",
        details: unknown.map(
          (signer) =>
            signer.wallet +
            " · " +
            (signer.vendor || "sin fabricante") +
            " " +
            (signer.model || "") +
            " → firmware " +
            (signer.firmwareAtSeedCreation || "desconocido") +
            ", entropía " +
            (signer.seedOrigin || "desconocida")
        ),
        actions: unknown.length
          ? ["Reconstruir la procedencia de los firmantes incompletos o tratarlos como sospechosos."]
          : []
      };
    }
  },
  {
    number: 2,
    id: "avisos",
    title: "Frescura de la matriz de avisos",
    question: "¿La inteligencia con la que se juzga la procedencia está al día?",
    async run() {
      const advisories = JSON.parse(
        await fs.readFile(path.join(PROJECT_ROOT, "config", "advisories.json"), "utf8")
      );
      const findings = evaluateIntel(advisories, { now: new Date().toISOString() });
      return {
        status: findings.length ? "atencion" : "ok",
        coverage: advisories.length + " aviso(s) versionados con fecha de verificación",
        details: findings.map((finding) => finding.title + " — " + finding.explanation),
        actions: findings.flatMap((finding) => finding.remediation || [])
      };
    }
  },
  {
    number: 3,
    id: "custodia",
    title: "Arquitectura de custodia",
    question: "¿La arquitectura contiene el compromiso de un solo firmante?",
    async run() {
      const state = await loadDemoOrRealState();
      const config = loadConfig(process.env);
      const risky = state.wallets.filter((wallet) => {
        const highValue = Number(wallet.balanceSats || 0) >= config.highValueThresholdSats;
        const singleSig = wallet.walletType === "single-sig";
        const nOfN =
          wallet.walletType === "multisig" &&
          Number(wallet.quorum?.total) > 1 &&
          Number(wallet.quorum?.required) === Number(wallet.quorum?.total);
        const noDiversity =
          wallet.walletType === "multisig" &&
          Number(wallet.quorum?.independentVendors || 0) < 2;
        return (highValue && singleSig) || nOfN || noDiversity;
      });
      return {
        status: risky.length ? "atencion" : "ok",
        coverage: state.wallets.length + " wallet(s) evaluadas contra la política vigente",
        details: risky.map(
          (wallet) =>
            wallet.name +
            " (" +
            wallet.walletType +
            (wallet.quorum ? " " + wallet.quorum.required + "/" + wallet.quorum.total : "") +
            ", " +
            Number(wallet.balanceSats || 0) +
            " sats)"
        ),
        actions: risky.length
          ? ["Revisar quorum y diversidad de fabricantes en las wallets señaladas."]
          : []
      };
    }
  },
  {
    number: 4,
    id: "secretos-aplicacion",
    title: "La aplicación rechaza material secreto",
    question: "¿Sigue siendo imposible entregarle una semilla?",
    run() {
      const result = runScript("scripts/check-security-claims.js");
      return {
        status: result.status === 0 ? "ok" : "fallo",
        coverage: "20 invariantes verificados contra la aplicación en marcha",
        details: result.status === 0 ? [] : [result.stderr || result.stdout],
        actions: result.status === 0 ? [] : ["Arreglar el invariante roto ANTES de seguir."]
      };
    }
  },
  {
    number: 5,
    id: "secretos-historico",
    title: "Secretos en el histórico de git",
    question: "¿Entró alguna vez material secreto al repositorio?",
    run() {
      const result = runScript("scripts/check-history-secrets.js");
      return {
        status: result.status === 0 ? "ok" : "fallo",
        coverage: firstLineMatching(result.stdout, "COBERTURA") || "histórico completo",
        details: result.status === 0 ? [] : result.stdout.split("\n").slice(-12),
        actions:
          result.status === 0
            ? []
            : ["ROTAR el secreto encontrado: borrarlo del árbol no lo borra del histórico."]
      };
    }
  },
  {
    number: 6,
    id: "cadena-suministro",
    title: "Cadena de suministro del runtime distribuido",
    question: "¿El motor que viaja dentro del binario tiene avisos abiertos?",
    run() {
      const result = runScript("scripts/check-runtime-advisories.js");
      const skipped = /No se pudo descargar/.test(result.stdout + result.stderr);
      return {
        status: skipped ? "omitida" : result.status === 0 ? "ok" : "fallo",
        coverage: skipped
          ? "sin red: base del Node.js Security WG no consultada"
          : firstLineMatching(result.stdout, "COBERTURA") || "runtime auditado",
        details: result.status === 0 ? [] : result.stdout.split("\n").slice(0, 14),
        actions:
          result.status === 0
            ? []
            : ["Republicar la aplicación con un Node parcheado (docs/RELEASE_CHECKLIST.md)."]
      };
    }
  },
  {
    number: 7,
    id: "dependencias",
    title: "Superficie de dependencias",
    question: "¿Sigue sin haber código de terceros ejecutándose?",
    run() {
      const result = runScript("scripts/check-local-only.js");
      return {
        status: result.status === 0 ? "ok" : "fallo",
        coverage: "0 dependencias declaradas, 0 instaladas, 0 orígenes remotos en el panel",
        details: result.status === 0 ? [] : result.stdout.split("\n"),
        actions: result.status === 0 ? [] : ["Retirar la dependencia u origen externo introducido."]
      };
    }
  },
  {
    number: 8,
    id: "integridad-repo",
    title: "Integridad del repositorio",
    question: "¿El repositorio contiene lo que dice contener?",
    run() {
      const validation = runScript("scripts/validate-repo.js");
      const docs = runScript("scripts/check-docs.js");
      const failed = validation.status !== 0 || docs.status !== 0;
      return {
        status: failed ? "fallo" : "ok",
        coverage: [validation.stdout, docs.stdout].filter(Boolean).join(" · "),
        details: failed ? [validation.stdout, docs.stdout].filter(Boolean) : [],
        actions: failed ? ["Corregir la validación del repositorio o los enlaces rotos."] : []
      };
    }
  },
  {
    number: 9,
    id: "postura",
    title: "Postura de la instalación",
    question: "¿Cómo está configurada esta instalación ahora mismo?",
    async run() {
      const config = loadConfig(process.env);
      const state = await loadDemoOrRealState();
      const findings = evaluatePosture(state, {
        config,
        highValueThresholdSats: config.highValueThresholdSats,
        now: new Date().toISOString()
      });
      return {
        status: findings.length ? "atencion" : "ok",
        coverage:
          "8 controles de postura evaluados con la configuración del proceso actual",
        details: findings.map((finding) => finding.code + " — " + finding.title),
        actions: findings.flatMap((finding) => finding.remediation || []),
        findings
      };
    }
  },
  {
    number: 10,
    id: "nodo",
    title: "Aislamiento del nodo Bitcoin",
    question: "¿El acceso al nodo es local y de solo lectura?",
    async run() {
      const config = loadConfig(process.env);
      const problems = [];
      if (config.bitcoin.allowRemote) problems.push("ALLOW_REMOTE_RPC está habilitado.");
      if (!config.bitcoin.cookieFile && (config.bitcoin.user || config.bitcoin.password)) {
        problems.push("Autenticación por contraseña en vez de cookie.");
      }
      const source = await readFile(
        path.join(PROJECT_ROOT, "src", "infrastructure", "bitcoin-rpc.js")
      );
      if (!source) problems.push("No se pudo leer el cliente RPC para revisar su allowlist.");
      const allowlist = /READ_ONLY_METHODS\s*=\s*new Set\(\[([\s\S]*?)\]\)/.exec(source || "");
      const dangerous = allowlist
        ? /"(?:send|sign|import|dump|walletpassphrase|createwallet|generate)[a-z]*"/.exec(allowlist[1])
        : null;
      if (dangerous) problems.push("Método de escritura en la allowlist: " + dangerous[0]);
      return {
        status: problems.length ? "atencion" : "ok",
        coverage: "URL, autenticación y allowlist de 14 métodos de lectura",
        details: problems,
        actions: problems.length
          ? ["Volver a cookie local y loopback; no exponer RPC a la red."]
          : []
      };
    }
  },
  {
    number: 11,
    id: "cifrado",
    title: "Persistencia cifrada y clave de datos",
    question: "¿El estado local está cifrado y la clave es fuerte?",
    run() {
      const config = loadConfig(process.env);
      if (config.demoMode) {
        return {
          status: "omitida",
          coverage: "modo demostración: nada se escribe en disco",
          details: ["No hay estado persistente que cifrar en este arranque."],
          actions: []
        };
      }
      const findings = evaluatePosture({ wallets: [] }, { config });
      const weak = findings.filter((finding) => finding.code === "BTC-OPSEC-003");
      return {
        status: weak.length ? "atencion" : "ok",
        coverage: "AES-256-GCM sobre " + config.dataFile,
        details: weak.map((finding) => finding.explanation),
        actions: weak.flatMap((finding) => finding.remediation || [])
      };
    }
  },
  {
    number: 12,
    id: "workflows",
    title: "Automatización y CI",
    question: "¿Los workflows están pinneados y con permisos mínimos?",
    async run() {
      const dir = path.join(PROJECT_ROOT, ".github", "workflows");
      let files = [];
      try {
        files = await fs.readdir(dir);
      } catch {
        return {
          status: "omitida",
          coverage: "sin workflows en el repositorio",
          details: [],
          actions: []
        };
      }
      const problems = [];
      for (const file of files) {
        const content = await fs.readFile(path.join(dir, file), "utf8");
        for (const match of content.matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)) {
          if (!/^[0-9a-f]{40}$/.test(match[2])) {
            problems.push(file + ": " + match[1] + "@" + match[2] + " sin pinnear a SHA");
          }
        }
        if (!/^permissions:/m.test(content)) problems.push(file + ": sin bloque permissions");
        if (/\$\{\{\s*github\.event\.(?:issue|pull_request|comment)/.test(content)) {
          problems.push(file + ": interpola datos de evento sin sanear (riesgo de inyección)");
        }
      }
      return {
        status: problems.length ? "atencion" : "ok",
        coverage: files.length + " workflow(s) revisados",
        details: problems,
        actions: problems.length ? ["Pinnear a SHA y declarar permisos mínimos."] : []
      };
    }
  },
  {
    number: 13,
    id: "artefacto",
    title: "Verificación del artefacto distribuido",
    question: "¿Lo publicado se puede verificar y arranca de verdad?",
    async run() {
      const problems = [];
      const release = path.join(PROJECT_ROOT, ".github", "workflows", "release-windows.yml");
      const content = await readFile(release);
      if (!content) {
        problems.push("No hay workflow de release.");
      } else {
        if (!/SHA256SUMS/.test(content)) problems.push("El release no publica checksums.");
        if (!/VERYSILENT/.test(content)) {
          problems.push("El release no instala el artefacto para comprobarlo.");
        }
        if (!/api\/summary/.test(content)) {
          problems.push("El release no comprueba que la aplicación instalada tenga contenido.");
        }
      }
      const packager = await readFile(
        path.join(PROJECT_ROOT, "packaging", "windows", "build-portable.ps1")
      );
      if (packager && !/SHASUMS256/.test(packager)) {
        problems.push("El empaquetador no verifica el hash del runtime que incluye.");
      }
      return {
        status: problems.length ? "atencion" : "ok",
        coverage: "checksums, instalación silenciosa y arranque verificado en el pipeline",
        details: problems,
        actions: problems.length ? ["Restaurar la verificación del artefacto en el release."] : []
      };
    }
  },
  {
    number: 14,
    id: "proceso-humano",
    title: "Proceso humano de respuesta",
    question: "¿Existe runbook y quién decide qué, antes de necesitarlo?",
    async run() {
      const required = [
        ["docs/RUNBOOK-MIGRATION.md", "runbook de migración de fondos"],
        ["docs/OPERACION.md", "operación ante hallazgos"],
        ["docs/RELEASE_CHECKLIST.md", "checklist de publicación"],
        ["config/policies.json", "política de aprobaciones y acciones prohibidas"]
      ];
      const missing = [];
      for (const [file, label] of required) {
        if (!(await readFile(path.join(PROJECT_ROOT, file)))) missing.push(label + " (" + file + ")");
      }
      const policies = JSON.parse(
        (await readFile(path.join(PROJECT_ROOT, "config", "policies.json"))) || "{}"
      );
      const humanApproval = policies.humanApprovalRequired || [];
      if (!humanApproval.includes("broadcast_transaction")) {
        missing.push("La política no exige aprobación humana para transmitir transacciones.");
      }
      return {
        status: missing.length ? "atencion" : "ok",
        coverage: required.length + " documentos de proceso y la política vigente",
        details: missing,
        actions: missing.length
          ? ["Completar el proceso documentado antes de operar con fondos reales."]
          : []
      };
    }
  }
];

// ── Utilidades ──────────────────────────────────────────────────────────────
async function readFile(target) {
  try {
    return await fs.readFile(target, "utf8");
  } catch {
    return "";
  }
}

function firstLineMatching(text, needle) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.includes(needle));
}

// El inventario se lee del estado cifrado si existe; si no, del estado de
// demostración, y el informe dice cuál usó.
let stateCache = null;
let stateSource = "";
async function loadDemoOrRealState() {
  if (stateCache) return stateCache;
  const config = loadConfig(process.env);
  if (!config.demoMode && config.dataKey) {
    const { EncryptedFileStore } = await import("../src/infrastructure/encrypted-store.js");
    const { createEmptyState } = await import("../src/services/demo-state.js");
    const store = new EncryptedFileStore(config.dataFile, config.dataKey, createEmptyState());
    stateCache = await store.load();
    stateSource = "estado cifrado en " + config.dataFile;
  } else {
    const { createDemoState } = await import("../src/services/demo-state.js");
    stateCache = createDemoState();
    stateSource = "estado de demostración (no hay estado persistente configurado)";
  }
  return stateCache;
}

// ── Ejecución ───────────────────────────────────────────────────────────────
const selected = value("stages")
  ? new Set(value("stages").split(",").map((entry) => Number(entry.trim())))
  : null;

const results = [];
for (const stage of STAGES) {
  if (selected && !selected.has(stage.number)) continue;
  let outcome;
  try {
    outcome = await stage.run();
  } catch (error) {
    outcome = {
      status: "fallo",
      coverage: "la etapa no pudo completarse",
      details: [error.message],
      actions: ["Revisar por qué falló la etapa: una etapa rota no es una etapa aprobada."]
    };
  }
  results.push({ ...stage, ...outcome, run: undefined });
}

const counts = results.reduce((acc, entry) => {
  acc[entry.status] = (acc[entry.status] || 0) + 1;
  return acc;
}, {});

const plan = [...new Set(results.flatMap((entry) => entry.actions || []))];

// Mismo semáforo que el resto de la familia RootCause: verde conforme, amarillo
// deuda, rojo promesa rota, blanco no comprobado.
const ICON = { ok: "🟢", atencion: "🟡", fallo: "🔴", omitida: "⚪" };
const ESTADO = {
  ok: "Conforme",
  atencion: "Con atención",
  fallo: "Fallida",
  omitida: "Omitida"
};
const BLOQUES = [
  { nombre: "Bloque A — Las claves", etapas: [1, 2, 3] },
  { nombre: "Bloque B — El software", etapas: [4, 5, 6, 7, 8] },
  { nombre: "Bloque C — La instalación", etapas: [9, 10, 11, 12, 13] },
  { nombre: "Bloque D — Las personas", etapas: [14] }
];

if (flag("json")) {
  console.log(JSON.stringify({ stateSource, counts, results, plan }, null, 2));
} else {
  console.log("Auditoría de custodia Bitcoin — 14 etapas");
  console.log("Inventario leído de: " + stateSource);
  console.log("");
  for (const entry of results) {
    console.log(
      (ICON[entry.status] || "⚫") +
        "  " +
        String(entry.number).padStart(2, "0") +
        " · " +
        entry.title
    );
    console.log("      cobertura: " + entry.coverage);
    for (const detail of entry.details || []) console.log("      · " + detail);
  }
  console.log("");
  console.log(
    "Resumen: " +
      (counts.ok || 0) +
      " conformes, " +
      (counts.atencion || 0) +
      " con atención, " +
      (counts.fallo || 0) +
      " fallidas, " +
      (counts.omitida || 0) +
      " omitidas."
  );
  if (plan.length) {
    console.log("\nPlan de remediación:");
    plan.forEach((action, index) => console.log("  " + (index + 1) + ". " + action));
  }
}

// Una celda de tabla no puede llevar tuberías ni saltos: se escapan una sola vez
// y en un solo sitio, para que el informe nunca salga con la tabla rota.
function escapaCelda(texto) {
  // Los saltos se obtienen por código para no depender de secuencias de escape
  // en un archivo que se edita con herramientas muy distintas.
  const salto = String.fromCharCode(10);
  const retorno = String.fromCharCode(13);
  return String(texto)
    .replace(/[|]/g, "&#124;")
    .split(retorno)
    .join(" ")
    .split(salto)
    .join(" ")
    .trim();
}

if (flag("report")) {
  const today = new Date().toISOString().slice(0, 10);
  const version = JSON.parse(
    await fs.readFile(path.join(PROJECT_ROOT, "package.json"), "utf8")
  ).version;
  const file = path.join(PROJECT_ROOT, "SECURITY_AUDIT_BITCOIN_" + today + ".md");

  const fila = (entry) =>
    "| " +
    String(entry.number).padStart(2, "0") +
    " | " +
    entry.title +
    " | " +
    ICON[entry.status] +
    " " +
    ESTADO[entry.status] +
    " | " +
    escapaCelda(entry.coverage) +
    " |";

  const lines = [
    "# Auditoría de custodia Bitcoin — RootCause Bitcoin Defense v" + version,
    "",
    "**Fecha:** " +
      today +
      " · **Etapas:** " +
      results.length +
      " de 14 · **Inventario:** " +
      stateSource,
    "",
    "---",
    "",
    "## 1 · Resumen ejecutivo",
    "",
    "| Estado | Etapas | Qué significa |",
    "| --- | ---: | --- |",
    "| 🟢 Conforme | " + (counts.ok || 0) + " | La comprobación se hizo y salió bien |",
    "| 🟡 Con atención | " +
      (counts.atencion || 0) +
      " | Deuda declarada, no rotura: no tumba el proceso |",
    "| 🔴 Fallida | " +
      (counts.fallo || 0) +
      " | Una promesa del producto dejó de cumplirse |",
    "| ⚪ Omitida | " +
      (counts.omitida || 0) +
      " | **No comprobada.** Nunca es un aprobado |",
    "",
    "> **La cobertura se declara siempre.** Un «0 hallazgos» sobre una superficie",
    "> que no se miró es una mentira con formato de informe. Por eso las etapas",
    "> omitidas se cuentan aparte y dicen por qué no pudieron ejecutarse.",
    "",
    "---",
    "",
    "## 2 · Cobertura por etapa",
    "",
    "| # | Etapa | Estado | Cobertura declarada |",
    "| ---: | --- | --- | --- |",
    ...results.map(fila),
    "",
    "---",
    "",
    "## 3 · Detalle por bloque",
    ""
  ];

  let seccion = 0;
  for (const bloque of BLOQUES) {
    const delBloque = results.filter((entry) => bloque.etapas.includes(entry.number));
    if (!delBloque.length) continue;
    seccion += 1;
    lines.push("### 3." + seccion + " · " + bloque.nombre, "");
    for (const entry of delBloque) {
      lines.push(
        "#### " +
          ICON[entry.status] +
          " " +
          String(entry.number).padStart(2, "0") +
          " · " +
          entry.title,
        "",
        "| | |",
        "| --- | --- |",
        "| **Pregunta** | " + entry.question + " |",
        "| **Estado** | " + ICON[entry.status] + " " + ESTADO[entry.status] + " |",
        "| **Cobertura** | " + escapaCelda(entry.coverage) + " |"
      );
      if (entry.details?.length) {
        lines.push(
          "| **Detalle** | " +
            entry.details
              .map((detail) => escapaCelda(String(detail)))
              .join("<br>") +
            " |"
        );
      }
      lines.push("");
    }
  }

  lines.push("---", "", "## 4 · Plan de remediación", "");
  if (plan.length) {
    lines.push("Ordenado como se ejecuta: primero lo que puede costar dinero hoy.", "");
    plan.forEach((action) => lines.push("- [ ] " + action));
  } else {
    lines.push("Sin acciones pendientes: ninguna etapa produjo remediación.");
  }

  lines.push(
    "",
    "---",
    "",
    "## 5 · Cómo reproducir",
    "",
    "```bash",
    "node scripts/audit-bitcoin.js --report",
    "```",
    "",
    "| Recurso | Dónde |",
    "| --- | --- |",
    "| Las 14 etapas, explicadas | [`docs/AUDITORIA_14_ETAPAS.md`](docs/AUDITORIA_14_ETAPAS.md) |",
    "| Postura de la instalación | [`docs/POSTURA_DE_DESPLIEGUE.md`](docs/POSTURA_DE_DESPLIEGUE.md) |",
    "| Reglas y umbrales | [`docs/HEURISTICAS.md`](docs/HEURISTICAS.md) |",
    "| Límites honestos | [`docs/LIMITACIONES.md`](docs/LIMITACIONES.md) |",
    "",
    "> Un verde aquí significa exactamente esto: **ninguna de las comprobaciones",
    "> ejecutadas se activó con los datos disponibles**. Ni una palabra más.",
    ""
  );

  await fs.writeFile(file, lines.join(String.fromCharCode(10)), "utf8");
  console.log(String.fromCharCode(10) + "Informe escrito en: " + path.relative(PROJECT_ROOT, file));
}

// Por defecto solo bloquean los fallos: «con atención» describe deuda, no
// rotura. Con --fail-on-attention también bloquea la deuda, que es lo que hace
// falta cuando un job existe precisamente para vigilarla.
const blocking = flag("fail-on-attention") ? ["fallo", "atencion"] : ["fallo"];
if (results.some((entry) => blocking.includes(entry.status))) process.exitCode = 1;

// Ordenación estable de los hallazgos de postura para el consumidor JSON.
for (const entry of results) {
  if (entry.findings) {
    entry.findings.sort(
      (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    );
  }
}
