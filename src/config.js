// Configuracion del proceso: una sola lectura del entorno, congelada.
//
// Todo el resto del programa recibe este objeto y no vuelve a mirar
// `process.env`. Eso importa por dos motivos: la postura de despliegue
// (`domain/posture.js`) audita la configuracion VIVA, y si media aplicacion
// leyera variables por su cuenta esa auditoria estaria mirando otra cosa que la
// que de verdad gobierna el proceso.
//
// Los valores por defecto son deliberadamente conservadores -loopback, modo
// demostracion, sin RPC remoto, sin vigilancia- y `check-security-claims.js`
// los verifica en cada build: abrir el producto tiene que ser siempre un acto
// explicito de quien lo despliega, nunca un descuido.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(SOURCE_DIR, "..");

function parseBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function parseInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

export function loadConfig(env = process.env) {
  const demoMode = parseBoolean(env.DEMO_MODE, true);
  const dataDir = path.resolve(env.DATA_DIR || path.join(PROJECT_ROOT, "data"));

  // Dentro de un contenedor, escuchar en 0.0.0.0 es lo normal: quien decide la
  // exposición real es el mapeo de puertos del host. La postura tiene que
  // saberlo para no dar por abierta una instalación que no lo está.
  const containerized = parseBoolean(
    env.ROOTCAUSE_CONTAINERIZED,
    fs.existsSync("/.dockerenv") || fs.existsSync("/run/.containerenv")
  );

  return Object.freeze({
    host: env.HOST || "127.0.0.1",
    containerized,
    port: parseInteger(env.PORT, 8787, 0, 65535),
    demoMode,
    dataDir,
    dataFile: path.join(dataDir, "state.enc.json"),
    dataKey: env.ROOTCAUSE_DATA_KEY || "",
    bodyLimitBytes: parseInteger(env.REQUEST_BODY_LIMIT_BYTES, 65536, 1024, 1048576),
    rateLimitPerMinute: parseInteger(env.RATE_LIMIT_PER_MINUTE, 120, 10, 10000),
    highValueThresholdSats: parseInteger(
      env.HIGH_VALUE_THRESHOLD_SATS,
      10000000,
      1,
      Number.MAX_SAFE_INTEGER
    ),
    bitcoin: Object.freeze({
      url: env.BITCOIN_RPC_URL || "http://127.0.0.1:8332",
      user: env.BITCOIN_RPC_USER || "",
      password: env.BITCOIN_RPC_PASSWORD || "",
      cookieFile: env.BITCOIN_RPC_COOKIE_FILE || "",
      allowRemote: parseBoolean(env.ALLOW_REMOTE_RPC, false),
      timeoutMs: parseInteger(env.BITCOIN_RPC_TIMEOUT_MS, 5000, 500, 60000)
    }),
    watchtower: Object.freeze({
      enabled: parseBoolean(env.WATCHTOWER_ENABLED, false),
      intervalMs: parseInteger(env.WATCHTOWER_INTERVAL_MS, 15000, 5000, 3600000)
    })
  });
}

export function assertProductionConfig(config) {
  if (!config.demoMode && !config.dataKey) {
    throw new Error(
      "ROOTCAUSE_DATA_KEY is required when DEMO_MODE=false. Run pnpm generate:data-key."
    );
  }
}
