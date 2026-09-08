import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { analyzeBitcoinScenario, btcToSats, renderForensicReports, selectCoins } from "../src/domain/bitcoin-forensics.js";

const fixture = JSON.parse(await fs.readFile(new URL("../examples/digital-custody-labs/scenario.json", import.meta.url), "utf8"));

test("parses BTC exactly without floating point", () => {
  assert.equal(btcToSats("51.99990000"), 5199990000n);
  assert.throws(() => btcToSats("0.000000001"));
});

test("derives UTXOs, change, fees, history and reconciliation from transactions", () => {
  const result = analyzeBitcoinScenario(fixture);
  assert.equal(result.chainBalanceSats, 9699990000n);
  assert.equal(result.differenceSats, -300010000n);
  assert.equal(result.transactionFeesSats, 10000n);
  assert.equal(result.utxos.length, 2);
  assert.equal(result.utxos.find((utxo) => utxo.role === "change").valueSats, 5199990000n);
  assert.equal(result.transactions.find((tx) => tx.txid.startsWith("cccc")).kind, "withdrawal");
  assert.equal(result.addressHistory.find((entry) => entry.role === "hot-receive").history.length, 2);
});

test("does not hardcode the reconciliation answer", () => {
  const changed = structuredClone(fixture);
  changed.ledger.balanceBtc = "96.99990000";
  assert.equal(analyzeBitcoinScenario(changed).differenceSats, 0n);
});

test("rejects mainnet and creates all five forensic artifacts", () => {
  assert.throws(() => analyzeBitcoinScenario({ ...fixture, network: "mainnet" }), /only accept/);
  const reports = renderForensicReports(analyzeBitcoinScenario(fixture));
  assert.deepEqual(Object.keys(reports).sort(), ["bitcoin-summary.md", "reconciliation.csv", "timeline.md", "transaction-graph.graphml", "utxo-analysis.csv"]);
  assert.match(reports["transaction-graph.graphml"], /source="aaaaaaaa.*target="cccc/);
});

test("provides a conceptual coin selection without signing", () => {
  const result = analyzeBitcoinScenario(fixture);
  const selection = selectCoins(result.utxos, 4000000000n, 2n);
  assert.equal(selection.selected.length, 1);
  assert(selection.changeSats > 0n);
});
