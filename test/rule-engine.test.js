import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateNode,
  evaluateState,
  evaluateTransaction
} from "../src/domain/rule-engine.js";
import { createDemoState } from "../src/services/demo-state.js";

const advisories = [
  {
    id: "BTC-ADV-2026-COLDCARD-ENTROPY",
    vendor: "COLDCARD",
    affected: [
      {
        models: ["Mk3"],
        track: "standard",
        minInclusive: "4.0.1",
        maxInclusive: "4.1.9"
      }
    ],
    mitigation: ["Migrate to a newly generated seed."]
  }
];

test("finds vulnerable firmware and single-sig concentration in demo state", () => {
  const findings = evaluateState(createDemoState(), {
    advisories,
    highValueThresholdSats: 10000000
  });
  const codes = new Set(findings.map((finding) => finding.code));
  assert.equal(codes.has("BTC-KEY-001"), true);
  assert.equal(codes.has("BTC-CUSTODY-001"), true);
});

test("flags an unapproved watched transaction", () => {
  const event = {
    txid: "a".repeat(64),
    walletId: "wallet-1",
    spendsWatchedWallet: true,
    approvalHash: null,
    observedAt: new Date().toISOString()
  };
  assert.equal(evaluateTransaction(event, [])[0].code, "BTC-TX-001");
});

test("does not flag a transaction with a known approval hash", () => {
  const hash = "b".repeat(64);
  const event = {
    txid: "a".repeat(64),
    walletId: "wallet-1",
    spendsWatchedWallet: true,
    approvalHash: hash,
    observedAt: new Date().toISOString()
  };
  assert.deepEqual(evaluateTransaction(event, [{ hash }]), []);
});

test("detects an unavailable node", () => {
  const findings = evaluateNode({
    connected: false,
    endpoint: "http://127.0.0.1:8332",
    error: "connection refused",
    checkedAt: new Date().toISOString()
  });
  assert.equal(findings[0].code, "BTC-NODE-001");
});
