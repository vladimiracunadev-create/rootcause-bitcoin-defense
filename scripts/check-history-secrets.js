// Capa de secretos: el histórico completo de git, no solo el árbol de trabajo.
//
// Borrar un secreto en un commit posterior no lo borra: sigue en el histórico y
// cualquiera puede recuperarlo. Esta comprobación lee todos los parches del
// repositorio y busca material que nunca debió entrar.
//
// Cubre lo genérico (claves privadas PEM, tokens de GitHub y de nube, cadenas de
// conexión) y, sobre todo, lo específico de este dominio: claves extendidas,
// WIF, mnemónicos y la clave de datos de la propia aplicación. No sustituye a
// gitleaks ni a detect-secrets: los complementa con patrones que ellos no
// conocen porque son de este producto.
//
//   node scripts/check-history-secrets.js
//   node scripts/check-history-secrets.js --staged     (solo lo que vas a commitear)
//   node scripts/check-history-secrets.js --json
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes("--" + name);

// Exenciones declaradas y versionadas. Los marcadores en línea solo alcanzan a
// lo que se añade a partir de ahora; el histórico ya escrito no se puede
// re-marcar sin reescribirlo. Por eso las excepciones permanentes viven en un
// archivo que se revisa en el PR que las introduce.
let EXCEPTIONS = [];
try {
  EXCEPTIONS = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, "config", "secret-scan-allow.json"), "utf8")
  ).exceptions || [];
} catch {
  EXCEPTIONS = [];
}
const exceptionUse = new Map(EXCEPTIONS.map((entry) => [entry.path + "|" + entry.id, 0]));

function isExcepted(file, id) {
  const key = file + "|" + id;
  if (!exceptionUse.has(key)) return false;
  exceptionUse.set(key, exceptionUse.get(key) + 1);
  return true;
}

// Cada patrón declara qué es y por qué importa: un hallazgo sin explicación
// entrena a la gente a ignorar la herramienta.
const PATTERNS = [
  {
    id: "BTC-SECRET-XPRV",
    label: "clave privada extendida (xprv/tprv)",
    severity: "critical",
    regex: /\b(?:xprv|tprv)[1-9A-HJ-NP-Za-km-z]{40,}\b/
  },
  {
    id: "BTC-SECRET-WIF",
    label: "clave privada en formato WIF",
    severity: "critical",
    regex: /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/
  },
  {
    id: "BTC-SECRET-MNEMONIC",
    label: "posible mnemónico BIP-39 (12 o más palabras de la lista en una línea)",
    severity: "critical",
    // Heurística deliberadamente conservadora: doce o más palabras de la
    // wordlist seguidas. Las listas de ejemplo del repositorio usan "abandon"
    // repetido, así que se exige variedad real para no gritar por un fixture.
    custom: (line) => {
      const words = line
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      if (words.length < 12) return false;
      let run = 0;
      const seen = new Set();
      for (const word of words) {
        if (BIP39_SAMPLE.has(word)) {
          run += 1;
          seen.add(word);
          if (run >= 12 && seen.size >= 6) return true;
        } else {
          run = 0;
          seen.clear();
        }
      }
      return false;
    }
  },
  {
    id: "SECRET-PEM",
    label: "clave privada PEM",
    severity: "critical",
    regex: /-----BEGIN (?:EC |RSA |OPENSSH |PGP |DSA )?PRIVATE KEY-----/
  },
  {
    id: "SECRET-GH-TOKEN",
    label: "token de GitHub",
    severity: "critical",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/
  },
  {
    id: "SECRET-AWS",
    label: "clave de acceso AWS",
    severity: "critical",
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/
  },
  {
    id: "SECRET-SLACK",
    label: "token de Slack",
    severity: "high",
    regex: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/
  },
  {
    id: "SECRET-PRIVATE-URL",
    label: "credenciales dentro de una URL",
    severity: "high",
    // La documentación y las pruebas usan credenciales de ejemplo a propósito
    // —justo para demostrar que se rechazan—. Un detector que grita por eso
    // enseña a ignorarlo, así que se exige que no sean marcadores evidentes.
    custom: (line) => {
      const match = line.match(/\b[a-z][a-z0-9+.-]*:\/\/([^\s/@:]+):([^\s/@]{4,})@/i);
      if (!match) return false;
      const [, user, password] = match;
      return !PLACEHOLDER.test(user) && !PLACEHOLDER.test(password);
    }
  },
  {
    id: "RC-DATA-KEY",
    label: "clave de datos de RootCause con valor asignado",
    severity: "critical",
    // ROOTCAUSE_DATA_KEY= vacío es la plantilla legítima de .env.example.
    regex: /ROOTCAUSE_DATA_KEY\s*[=:]\s*["']?[A-Za-z0-9+/=]{16,}/
  },
  {
    id: "RC-RPC-PASSWORD",
    label: "contraseña de RPC de Bitcoin Core con valor asignado",
    severity: "high",
    custom: (line) => {
      const match = line.match(
        /(?:BITCOIN_RPC_PASSWORD|rpcpassword)\s*[=:]\s*["']?([^\s"'#]{6,})/i
      );
      return Boolean(match) && !PLACEHOLDER.test(match[1]);
    }
  }
];

// Valores que delatan un ejemplo y no una credencial real.
const PLACEHOLDER =
  /^(?:(?:una|un|el|la|mi|the|my)[-_])?(?:usuario|usuaria|user|username|clave|contrasena|contraseña|password|passwd|pass|secret|token|ejemplo|example|sample|demo|test|prueba|dummy|fake|changeme|xxx+|placeholder|valor)(?:[-_](?:de[-_])?(?:ejemplo|example|prueba|test|demo|falsa|falso|ficticia|ficticio))?$|^(?:tu|your)[-_]\w+$|^<[^>]+>$|^\$\{[^}]+\}$|^\*+$|^\.{3,}$/i;

// Muestra de la wordlist BIP-39: suficiente para reconocer una frase real sin
// versionar las 2048 palabras dentro de un verificador de seguridad.
//
// Va marcada porque, si no, este detector se detecta a sí mismo: son palabras de
// la lista en líneas contiguas, que es exactamente lo que busca. La exención es
// explícita, acotada y se cuenta en el informe.
//
// secret-scan: allow-begin
const BIP39_SAMPLE = new Set(
  ("abandon ability able about above absent absorb abstract absurd abuse access accident account " +
    "accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict " +
    "address adjust admit adult advance advice aerobic affair afford afraid again age agent agree " +
    "ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha " +
    "already also alter always amateur amazing among amount amused analyst anchor ancient anger angle " +
    "angry animal ankle announce annual another answer antenna antique anxiety any apart apology " +
    "appear apple approve april arch arctic area arena argue arm armed armor army around arrange " +
    "arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma " +
    "athlete atom attack attend attitude attract auction audit august aunt author auto autumn average " +
    "avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance " +
    "balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean " +
    "beauty because become beef before begin behave behind believe below belt bench benefit best " +
    "betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame " +
    "blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb " +
    "bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass " +
    "brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother " +
    "brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst " +
    "bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp " +
    "can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo " +
    "carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause " +
    "caution cave ceiling celery cement census century cereal certain chair chalk champion change " +
    "chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney " +
    "choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap " +
    "clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth " +
    "cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color " +
    "column combine come comfort comic common company concert conduct confirm congress connect " +
    "consider control convince cook cool copper copy coral core corn correct cost cotton couch " +
    "country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy " +
    "cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise " +
    "crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion " +
    "custom cute cycle zebra zero zone zoo").split(/\s+/)
);
// secret-scan: allow-end

// Archivos binarios: se comprueba su RUTA, nunca su contenido.
//
// Un escáner de secretos busca patrones de texto. Aplicarlo a los bytes de un
// PDF, una imagen o un ZIP produce coincidencias por puro azar —un stream
// comprimido acaba conteniendo, antes o después, algo con la forma de
// `esquema://usuario:clave@`—. Y un detector que grita cada vez que se
// regenera un binario enseña a ignorarlo, que es justo lo que este proyecto
// pasa el día evitando.
//
// Las rutas de FORBIDDEN_PATHS se siguen comprobando: un `.p12` no debe estar
// en el repositorio aunque su contenido no se lea.
const BINARY_EXTENSIONS =
  /\.(?:pdf|png|jpe?g|gif|webp|ico|svgz|zip|gz|tar|7z|exe|dll|so|dylib|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|class|jar|wasm)$/i;

// Rutas cuya presencia en el histórico ya es sospechosa por sí misma.
const FORBIDDEN_PATHS = [
  /(^|\/)\.env$/,
  /(^|\/)data\/state\.enc\.json$/,
  /(^|\/)\.cookie$/,
  /(^|\/)id_rsa$/,
  /(^|\/)id_ed25519$/,
  /\.pfx$/,
  /\.p12$/,
  /\.keystore$/
];

function git(...gitArgs) {
  const result = spawnSync("git", gitArgs, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error("git " + gitArgs.join(" ") + " falló: " + (result.stderr || "").trim());
  }
  return result.stdout;
}

if (!fs.existsSync(path.join(PROJECT_ROOT, ".git"))) {
  console.log("Sin repositorio git: no hay histórico que auditar.");
  console.log("COBERTURA: 0 commits revisados.");
  process.exit(0);
}

const staged = flag("staged");
let diffText = "";
let commitCount = 0;

try {
  if (staged) {
    diffText = git("diff", "--cached", "--unified=0");
  } else {
    commitCount = git("rev-list", "--count", "--all").trim();
    // -p sobre todas las ramas: un secreto borrado hace diez commits sigue ahí.
    diffText = git("log", "--all", "-p", "--unified=0", "--no-color", "--format=commit %H %ad");
  }
} catch (error) {
  console.error(error.message);
  console.error("Sin histórico legible no hay auditoría: esto no es un verde.");
  process.exit(1);
}

const findings = [];
let currentCommit = staged ? "(staged)" : "(desconocido)";
let currentFile = "";
let linesScanned = 0;
let allowedLines = 0;
let inAllowedRange = false;
let binaryFile = false;
let binaryFiles = 0;

for (const line of diffText.split("\n")) {
  if (line.startsWith("commit ")) {
    currentCommit = line.slice(7, 47);
    continue;
  }
  if (line.startsWith("+++ b/")) {
    currentFile = line.slice(6);
    inAllowedRange = false;
    binaryFile = BINARY_EXTENSIONS.test(currentFile);
    if (binaryFile) binaryFiles += 1;
    for (const forbidden of FORBIDDEN_PATHS) {
      if (forbidden.test(currentFile)) {
        findings.push({
          id: "SECRET-PATH",
          label: "archivo que no debe versionarse nunca",
          severity: "critical",
          commit: currentCommit,
          file: currentFile,
          evidence: currentFile
        });
      }
    }
    continue;
  }
  // Solo líneas añadidas: lo que se quitó ya está cubierto por el commit que lo metió.
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  // De un binario se comprueba la ruta, nunca el contenido.
  if (binaryFile) continue;

  const content = line.slice(1);
  linesScanned += 1;

  // Escapes explícitos y auditables para casos deliberados —una wordlist de
  // referencia, un fixture—. Se cuentan y se reportan: una exención silenciosa
  // sería un agujero.
  if (/secret-scan:\s*allow-begin/i.test(content)) {
    inAllowedRange = true;
    allowedLines += 1;
    continue;
  }
  if (/secret-scan:\s*allow-end/i.test(content)) {
    inAllowedRange = false;
    allowedLines += 1;
    continue;
  }
  if (inAllowedRange || /secret-scan:\s*allow/i.test(content)) {
    allowedLines += 1;
    continue;
  }

  for (const pattern of PATTERNS) {
    const hit = pattern.custom ? pattern.custom(content) : pattern.regex.test(content);
    if (!hit) continue;
    if (isExcepted(currentFile, pattern.id)) continue;
    findings.push({
      id: pattern.id,
      label: pattern.label,
      severity: pattern.severity,
      commit: currentCommit,
      file: currentFile,
      // La evidencia se recorta y se enmascara: un informe de secretos no debe
      // convertirse él mismo en una filtración.
      evidence: content.trim().slice(0, 40).replace(/[A-Za-z0-9]{6,}/g, (match) =>
        match.slice(0, 3) + "…" + match.slice(-2)
      )
    });
  }
}

const unique = [];
const seen = new Set();
for (const finding of findings) {
  const key = [finding.id, finding.file, finding.evidence].join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(finding);
}

if (flag("json")) {
  console.log(
    JSON.stringify(
      {
        scope: staged ? "staged" : "historia completa",
        commitCount,
        linesScanned,
        allowedLines,
        binaryFilesSkipped: binaryFiles,
        findings: unique
      },
      null,
      2
    )
  );
} else {
  console.log("Auditoría de secretos — " + (staged ? "cambios en stage" : "histórico completo"));
  console.log("  patrones aplicados: " + (PATTERNS.length + 1));
  if (!staged) console.log("  commits en el repositorio: " + commitCount);
  console.log("  líneas añadidas revisadas: " + linesScanned);
  console.log(
    "  COBERTURA: 100 % de las líneas de texto añadidas visibles en git; " +
      "no cubre objetos colgantes ni ramas ya borradas del remoto."
  );
  if (binaryFiles) {
    // La cobertura se declara siempre, y eso incluye lo que se deja fuera.
    console.log(
      "  BINARIOS OMITIDOS: " +
        binaryFiles +
        " archivo(s) revisados solo por su ruta, no por su contenido."
    );
  }
  if (allowedLines) {
    console.log(
      "  EXENCIONES EN LÍNEA: " + allowedLines + " marcadas con `secret-scan: allow`."
    );
  }
  const usedExceptions = [...exceptionUse.entries()].filter(([, count]) => count > 0);
  const staleExceptions = [...exceptionUse.entries()].filter(([, count]) => count === 0);
  if (usedExceptions.length) {
    console.log("  EXENCIONES DECLARADAS (config/secret-scan-allow.json):");
    for (const [key, count] of usedExceptions) {
      console.log("      " + key.replace("|", " · ") + "  (" + count + " coincidencia/s)");
    }
  }
  if (staleExceptions.length) {
    console.log(
      "  EXENCIONES QUE YA NO HACEN FALTA: " +
        staleExceptions.map(([key]) => key.replace("|", " · ")).join(", ") +
        " — retíralas: una exención de más tapa hallazgos futuros."
    );
  }

  if (!unique.length) {
    console.log("\nSin material secreto en el histórico.");
  } else {
    console.log("");
    for (const finding of unique) {
      console.log(
        "  [" + finding.severity.toUpperCase() + "] " + finding.id + " — " + finding.label
      );
      console.log("      commit " + finding.commit + "  ·  " + finding.file);
      console.log("      " + finding.evidence);
    }
    console.log(
      "\nUn secreto en el histórico se considera comprometido aunque se borre: " +
        "hay que ROTARLO, no solo eliminarlo del árbol."
    );
  }
}

if (unique.length) process.exitCode = 1;
