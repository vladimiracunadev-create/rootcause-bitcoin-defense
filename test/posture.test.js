import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { estimateKeyStrengthBits, evaluatePosture } from "../src/domain/posture.js";
import { loadConfig } from "../src/config.js";

const emptyState = { wallets: [], incidents: [], audit: [], observedTransactions: [], privacyEvents: [] };

function configWith(env) {
  return loadConfig(env);
}

test("una instalación con los valores por defecto no produce hallazgos de postura", () => {
  const findings = evaluatePosture(emptyState, { config: configWith({}) });
  assert.equal(findings.length, 0);
});

test("detecta un panel escuchando fuera de loopback", () => {
  const findings = evaluatePosture(emptyState, { config: configWith({ HOST: "0.0.0.0" }) });
  const finding = findings.find((entry) => entry.code === "BTC-OPSEC-001");
  assert.ok(finding, "debía detectar el bind abierto");
  assert.equal(finding.severity, "critical");
  assert.equal(finding.evidence.host, "0.0.0.0");
});

test("detecta RPC remoto habilitado y autenticación por contraseña", () => {
  const config = configWith({
    ALLOW_REMOTE_RPC: "true",
    BITCOIN_RPC_URL: "http://203.0.113.10:8332",
    BITCOIN_RPC_USER: "operador",
    BITCOIN_RPC_PASSWORD: "una-contraseña"
  });
  const codes = evaluatePosture(emptyState, { config }).map((entry) => entry.code);
  assert.ok(codes.includes("BTC-OPSEC-004"), "RPC remoto");
  assert.ok(codes.includes("BTC-OPSEC-005"), "credenciales estáticas en vez de cookie");
});

test("detecta una clave de datos débil y acepta una generada", () => {
  const weak = evaluatePosture(emptyState, {
    config: configWith({ DEMO_MODE: "false", ROOTCAUSE_DATA_KEY: "clave123" })
  });
  const finding = weak.find((entry) => entry.code === "BTC-OPSEC-003");
  assert.ok(finding, "debía marcar la clave débil");

  const strong = evaluatePosture(emptyState, {
    config: configWith({
      DEMO_MODE: "false",
      ROOTCAUSE_DATA_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64")
    })
  });
  assert.equal(
    strong.filter((entry) => entry.code === "BTC-OPSEC-003").length,
    0,
    "una clave de 256 bits no debe marcarse"
  );
});

test("la entropía estimada distingue una clave larga y repetitiva de una real", () => {
  assert.ok(estimateKeyStrengthBits("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") < 64);
  assert.ok(estimateKeyStrengthBits("") === 0);
  assert.ok(
    estimateKeyStrengthBits(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64")) >=
      128
  );
});

test("avisa cuando el watchtower está apagado habiendo alto valor", () => {
  const state = {
    ...emptyState,
    wallets: [{ id: "w1", name: "Tesorería", balanceSats: 500000000, signers: [] }]
  };
  const findings = evaluatePosture(state, {
    config: configWith({ WATCHTOWER_ENABLED: "false" }),
    highValueThresholdSats: 10000000
  });
  assert.ok(findings.some((entry) => entry.code === "BTC-OPSEC-006"));
});

test("marca la cadena de auditoría rota como crítica", () => {
  const findings = evaluatePosture(emptyState, {
    config: configWith({}),
    auditVerification: { valid: false, brokenAt: "id-roto", reason: "entry_hash_mismatch" }
  });
  const finding = findings.find((entry) => entry.code === "BTC-OPSEC-008");
  assert.ok(finding);
  assert.equal(finding.severity, "critical");
});

test("sin configuración no inventa hallazgos", () => {
  assert.deepEqual(evaluatePosture(emptyState, {}), []);
});

test("dentro de un contenedor, el bind abierto se matiza en vez de gritar", () => {
  const findings = evaluatePosture(emptyState, {
    config: configWith({ HOST: "0.0.0.0", ROOTCAUSE_CONTAINERIZED: "true" })
  });
  const finding = findings.find((entry) => entry.code === "BTC-OPSEC-001");
  assert.ok(finding, "sigue habiendo hallazgo");
  assert.equal(finding.severity, "medium", "pero no es crítico dentro del contenedor");
  assert.match(finding.remediation.join(" "), /127\.0\.0\.1:8787:8787/);
});
