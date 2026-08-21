import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCorrelations,
  evaluateIntel,
  evaluateWallet
} from "../src/domain/rule-engine.js";

const NOW = "2026-08-20T12:00:00.000Z";

function stateWith(overrides = {}) {
  return {
    wallets: [],
    approvals: [],
    observedTransactions: [],
    privacyEvents: [],
    incidents: [],
    audit: [],
    ...overrides
  };
}

const treasury = {
  id: "wallet-1",
  name: "Tesorería fría",
  fingerprint: "D15EA5ED",
  walletType: "single-sig",
  balanceSats: 100000000,
  signers: [{ vendor: "COLDCARD", model: "Mk4", firmwareAtSeedCreation: "5.6.1", seedOrigin: "device" }]
};

// ── BTC-TX-002 · barrido ─────────────────────────────────────────────────────
test("detecta un barrido: un gasto sin aprobar que se lleva casi todo el saldo", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      observedTransactions: [
        {
          txid: "a".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          valueSats: 98000000,
          observedAt: NOW
        }
      ]
    }),
    { now: NOW }
  );
  const finding = findings.find((entry) => entry.code === "BTC-TX-002");
  assert.ok(finding, "debía detectar el barrido");
  assert.equal(finding.severity, "critical");
  assert.equal(finding.evidence.valueSats, 98000000);
});

test("un pago parcial no se confunde con un barrido", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      observedTransactions: [
        {
          txid: "b".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          valueSats: 1000000,
          observedAt: NOW
        }
      ]
    }),
    { now: NOW }
  );
  assert.equal(findings.filter((entry) => entry.code === "BTC-TX-002").length, 0);
});

// ── BTC-TX-003 · ráfaga ──────────────────────────────────────────────────────
test("detecta una ráfaga de gastos sin aprobar en la misma wallet", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      observedTransactions: [
        {
          txid: "c".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          observedAt: "2026-08-20T12:00:00.000Z"
        },
        {
          txid: "d".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          observedAt: "2026-08-20T12:12:00.000Z"
        }
      ]
    }),
    { now: NOW }
  );
  const finding = findings.find((entry) => entry.code === "BTC-TX-003");
  assert.ok(finding, "debía detectar la ráfaga");
  assert.equal(finding.evidence.events, 2);
});

test("dos gastos separados en el tiempo no son una ráfaga", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      observedTransactions: [
        {
          txid: "e".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          observedAt: "2026-08-19T08:00:00.000Z"
        },
        {
          txid: "f".repeat(64),
          walletId: "wallet-1",
          spendsWatchedWallet: true,
          approvalHash: null,
          observedAt: "2026-08-20T12:00:00.000Z"
        }
      ]
    }),
    { now: NOW }
  );
  assert.equal(findings.filter((entry) => entry.code === "BTC-TX-003").length, 0);
});

// ── BTC-PRIVACY-002 · correlación proveedor ↔ inventario ─────────────────────
test("correlaciona una filtración con el fabricante de tus firmantes", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      privacyEvents: [
        { id: "event-1", type: "bulk_customer_data_access", vendor: "coldcard", recordCount: 5000 }
      ]
    }),
    { now: NOW }
  );
  const finding = findings.find((entry) => entry.code === "BTC-PRIVACY-002");
  assert.ok(finding, "debía correlacionar la filtración con el inventario");
  assert.equal(finding.evidence.signersFromVendor, 1);
});

test("una filtración de un fabricante que no usas no genera hallazgo", () => {
  const findings = evaluateCorrelations(
    stateWith({
      wallets: [treasury],
      privacyEvents: [
        { id: "event-2", type: "bulk_customer_data_access", vendor: "OtroFabricante", recordCount: 10 }
      ]
    }),
    { now: NOW }
  );
  assert.equal(findings.filter((entry) => entry.code === "BTC-PRIVACY-002").length, 0);
});

// ── BTC-INTEL-001 · inteligencia con fecha ───────────────────────────────────
test("avisa cuando la matriz de avisos lleva demasiado sin verificarse", () => {
  const advisories = [{ id: "BTC-ADV-X", verifiedAt: "2026-01-01T00:00:00Z" }];
  const findings = evaluateIntel(advisories, { now: NOW, advisoryMaxAgeDays: 30 });
  const finding = findings.find((entry) => entry.code === "BTC-INTEL-001");
  assert.ok(finding, "debía marcar la inteligencia vieja");
  assert.equal(finding.severity, "high");
  assert.ok(finding.evidence.ageDays > 90);
});

test("una matriz verificada hace poco no genera hallazgo", () => {
  const advisories = [{ id: "BTC-ADV-X", verifiedAt: "2026-08-15T00:00:00Z" }];
  assert.equal(evaluateIntel(advisories, { now: NOW, advisoryMaxAgeDays: 30 }).length, 0);
});

test("una matriz vacía es un hallazgo, no un silencio", () => {
  const findings = evaluateIntel([], { now: NOW });
  assert.equal(findings[0].code, "BTC-INTEL-002");
});

// ── BTC-CUSTODY-003 · quorum sin margen ──────────────────────────────────────
test("detecta un multisig N-de-N", () => {
  const findings = evaluateWallet(
    {
      id: "wallet-2",
      name: "Bóveda 3-de-3",
      fingerprint: "C0FFEE01",
      walletType: "multisig",
      balanceSats: 500000000,
      quorum: { required: 3, total: 3, independentVendors: 3 },
      signers: [
        { vendor: "COLDCARD", model: "Mk4", firmwareAtSeedCreation: "5.6.1", seedOrigin: "device" },
        { vendor: "Trezor", model: "Model T", firmwareAtSeedCreation: "2.8.9", seedOrigin: "device" },
        { vendor: "BitBox", model: "02", firmwareAtSeedCreation: "9.20.0", seedOrigin: "device" }
      ]
    },
    { advisories: [], highValueThresholdSats: 10000000, now: NOW }
  );
  const finding = findings.find((entry) => entry.code === "BTC-CUSTODY-003");
  assert.ok(finding, "debía detectar el quorum sin margen");
  assert.equal(finding.severity, "high");
});

test("un 2-de-3 no genera el hallazgo de quorum sin margen", () => {
  const findings = evaluateWallet(
    {
      id: "wallet-3",
      name: "Bóveda 2-de-3",
      fingerprint: "C0FFEE02",
      walletType: "multisig",
      balanceSats: 500000000,
      quorum: { required: 2, total: 3, independentVendors: 3 },
      signers: [
        { vendor: "COLDCARD", model: "Mk4", firmwareAtSeedCreation: "5.6.1", seedOrigin: "device" },
        { vendor: "Trezor", model: "Model T", firmwareAtSeedCreation: "2.8.9", seedOrigin: "device" },
        { vendor: "BitBox", model: "02", firmwareAtSeedCreation: "9.20.0", seedOrigin: "device" }
      ]
    },
    { advisories: [], highValueThresholdSats: 10000000, now: NOW }
  );
  assert.equal(findings.filter((entry) => entry.code === "BTC-CUSTODY-003").length, 0);
});
