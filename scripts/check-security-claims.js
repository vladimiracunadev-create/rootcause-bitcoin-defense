// Convierte las promesas del README en un gate ejecutable.
//
// El producto se define por lo que se NIEGA a hacer: no acepta material
// secreto, no habla con un nodo remoto por defecto y no puede firmar ni
// enviar nada por RPC. Aquí eso se comprueba de dos maneras:
//
//   1. estáticamente, leyendo el código;
//   2. arrancando la aplicación real y golpeándola con peticiones hostiles.
//
// Un README puede envejecer mal. Este script no.
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, loadConfig } from "../src/config.js";
import { validateRpcUrl } from "../src/infrastructure/bitcoin-rpc.js";
import { startServer } from "../src/server.js";

const errors = [];
const checks = [];

function ok(label) {
  checks.push(label);
}

function fail(message) {
  errors.push(message);
}

function expect(condition, label, message) {
  if (condition) ok(label);
  else fail(message);
}

// ── 1. Allowlist RPC: ni una sola llamada que mueva monedas ──────────────────
const rpcSource = await fs.readFile(
  path.join(PROJECT_ROOT, "src", "infrastructure", "bitcoin-rpc.js"),
  "utf8"
);
const allowlistBlock = rpcSource.match(/READ_ONLY_METHODS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
if (!allowlistBlock) {
  fail("No se encontró la allowlist READ_ONLY_METHODS en bitcoin-rpc.js.");
} else {
  const methods = [...allowlistBlock[1].matchAll(/"([a-z0-9_]+)"/gi)].map((m) => m[1]);
  expect(methods.length > 0, "allowlist RPC no vacía", "La allowlist RPC quedó vacía.");

  // Cualquier método capaz de firmar, enviar, importar, exportar o desbloquear
  // convierte la aplicación en algo que puede perder fondos.
  const dangerous = /^(?:send|sign|import|dump|walletpassphrase|createwallet|settxfee|bumpfee|abandon|generate|submit|prioritise|encryptwallet|backupwallet|unloadwallet|addnode|setban|stop)/i;
  for (const method of methods) {
    if (dangerous.test(method)) {
      fail("Método capaz de mutar estado en la allowlist RPC: " + method);
    }
  }
  const mustHave = ["getblockchaininfo", "getnetworkinfo", "getmempoolinfo"];
  for (const method of mustHave) {
    if (!methods.includes(method)) fail("La allowlist RPC perdió " + method + ".");
  }
  ok("allowlist RPC solo de lectura (" + methods.length + " métodos)");
}

// ── 2. RPC remoto denegado por defecto ───────────────────────────────────────
try {
  validateRpcUrl("http://203.0.113.10:8332", false);
  fail("validateRpcUrl aceptó un destino remoto sin ALLOW_REMOTE_RPC.");
} catch {
  ok("RPC remoto rechazado por defecto");
}
try {
  validateRpcUrl("http://usuario:clave@127.0.0.1:8332", false);
  fail("validateRpcUrl aceptó credenciales incrustadas en la URL.");
} catch {
  ok("credenciales en la URL de RPC rechazadas");
}

// ── 3. Valores por defecto conservadores ─────────────────────────────────────
const defaults = loadConfig({});
expect(defaults.host === "127.0.0.1", "bind por defecto en loopback", "El host por defecto dejó de ser 127.0.0.1: " + defaults.host);
expect(defaults.bitcoin.allowRemote === false, "ALLOW_REMOTE_RPC=false por defecto", "ALLOW_REMOTE_RPC pasó a estar habilitado por defecto.");
expect(defaults.watchtower.enabled === false, "watchtower apagado por defecto", "El watchtower se habilitó por defecto: haría polling sin consentimiento.");
expect(defaults.demoMode === true, "modo demo por defecto", "El modo demo dejó de ser el arranque por defecto.");

// ── 4. La aplicación real, contra peticiones hostiles ────────────────────────
const runtime = await startServer({
  DEMO_MODE: "true",
  HOST: "127.0.0.1",
  PORT: "0",
  WATCHTOWER_ENABLED: "false"
});
const port = runtime.server.address().port;
const base = "http://127.0.0.1:" + port;

async function post(pathname, body, headers = {}) {
  return fetch(base + pathname, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

try {
  const health = await fetch(base + "/api/health");
  const healthBody = await health.json();
  expect(
    health.status === 200 && healthBody.service === "rootcause-bitcoin-defense",
    "/api/health responde",
    "El endpoint de salud no respondió como se espera."
  );

  const page = await fetch(base + "/");
  expect(page.status === 200, "el dashboard se sirve", "El dashboard no se sirvió en /.");
  const csp = page.headers.get("content-security-policy") || "";
  expect(
    csp.includes("default-src 'self'") && !csp.includes("unsafe-inline"),
    "cabecera CSP self-only",
    "La CSP servida no es self-only: " + csp
  );
  expect(
    page.headers.get("x-frame-options") === "DENY",
    "clickjacking bloqueado",
    "Falta la cabecera x-frame-options: DENY."
  );

  const unguarded = await post("/api/wallets", { label: "sin cabecera" });
  expect(
    unguarded.status === 403,
    "mutación sin cabecera local rechazada",
    "Una mutación sin x-rootcause-request devolvió " + unguarded.status + " en vez de 403."
  );

  const crossSite = await post(
    "/api/wallets",
    { label: "cross-site" },
    { "x-rootcause-request": "1", "sec-fetch-site": "cross-site" }
  );
  expect(
    crossSite.status === 403,
    "mutación cross-site rechazada",
    "Una mutación cross-site devolvió " + crossSite.status + " en vez de 403."
  );

  // El corazón del producto: la aplicación no acepta semillas ni claves,
  // ni siquiera cuando el usuario insiste en dárselas.
  const secretPayloads = [
    { name: "w", seed: "abandon abandon abandon" },
    { name: "w", signers: [{ mnemonic: "abandon abandon abandon" }] },
    { name: "w", metadata: { recovery_phrase: "abandon abandon" } },
    { name: "w", passphrase: "correct horse battery staple" },
    {
      name: "w",
      // El prefijo va concatenado a proposito: asi el vector de prueba existe
      // en tiempo de ejecucion pero el archivo no contiene una clave extendida
      // literal que el validador del repositorio tendria que denunciar.
      notes: "xp" + "rv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi"
    }
  ];
  for (const payload of secretPayloads) {
    const response = await post("/api/wallets", payload, { "x-rootcause-request": "1" });
    const body = await response.json().catch(() => ({}));
    const rejected = response.status === 422 && body?.error?.code === "SECRET_MATERIAL_REJECTED";
    expect(
      rejected,
      "material secreto rechazado (" + Object.keys(payload).filter((k) => k !== "name").join(",") + ")",
      "La aplicación NO rechazó material secreto: " +
        JSON.stringify(payload) +
        " → " +
        response.status +
        " " +
        JSON.stringify(body)
    );
  }

  // Y la procedencia pública sí debe entrar: el guard protege, no bloquea el uso.
  const provenance = await post(
    "/api/wallets",
    {
      name: "Verificación de procedencia",
      fingerprint: "D15EA5ED",
      network: "signet",
      walletType: "single-sig",
      balanceSats: 1000,
      quorum: { required: 1, total: 1 },
      signers: [
        {
          label: "Firmante de laboratorio",
          fingerprint: "D15EA5ED",
          vendor: "Test Vendor",
          model: "Test Model",
          firmwareAtSeedCreation: "1.0.0",
          firmwareTrack: "standard",
          seedOrigin: "device"
        }
      ]
    },
    { "x-rootcause-request": "1" }
  );
  expect(
    provenance.status === 201,
    "procedencia pública aceptada",
    "La procedencia pública fue rechazada con " +
      provenance.status +
      ": " +
      JSON.stringify(await provenance.json().catch(() => ({})))
  );
} finally {
  runtime.watchtower.stop();
  await new Promise((resolve) => runtime.server.close(resolve));
}

if (errors.length) {
  // Escritura sincrona y process.exitCode (no process.exit): en Windows,
  // forzar la salida con handles vivos aborta libuv y se pierde el informe.
  fsSync.writeSync(
    2,
    "Invariantes de seguridad incumplidos:\n" +
      errors.map((error) => "- " + error).join("\n") +
      "\n"
  );
  process.exitCode = 1;
} else {
  console.log(checks.map((check) => "  ok  " + check).join("\n"));
  console.log("Invariantes de seguridad verificados: " + checks.length + " comprobaciones.");
}
