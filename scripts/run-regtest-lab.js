import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../src/config.js";
import { analyzeBitcoinScenario, renderForensicReports } from "../src/domain/bitcoin-forensics.js";

const compose = path.join(PROJECT_ROOT, "labs", "regtest", "compose.yaml");
const outputDir = path.resolve(PROJECT_ROOT, "build", "bitcoin-forensics-regtest");
const keep = process.argv.includes("--keep");

function docker(args, { json = false, quiet = false } = {}) {
  const result = spawnSync("docker", ["compose", "-f", compose, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error || result.status !== 0) throw new Error((result.error?.message || result.stderr || result.stdout).trim());
  if (!quiet && result.stderr.trim()) process.stderr.write(result.stderr);
  const text = result.stdout.trim();
  return json ? JSON.parse(text) : text;
}

function cli(args, wallet = "") {
  const options = ["exec", "-T", "bitcoin", "bitcoin-cli", "-regtest", "-rpcuser=rootcause-lab", "-rpcpassword=regtest-only-password"];
  if (wallet) options.push("-rpcwallet=" + wallet);
  return docker([...options, ...args], { quiet: true });
}

function cliJson(args, wallet = "") {
  return JSON.parse(cli(args, wallet));
}

async function waitForCore() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if (cliJson(["getblockchaininfo"]).chain === "regtest") return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Bitcoin Core did not become ready in 30 seconds.");
}

async function collectTransaction(txid, transactions, seen = new Set()) {
  if (seen.has(txid)) return;
  seen.add(txid);
  const tx = cliJson(["getrawtransaction", txid, "true"]);
  if (tx.blockhash) {
    const header = cliJson(["getblockheader", tx.blockhash]);
    tx.blockheight = header.height;
    tx.blocktime = header.time;
  }
  for (const input of tx.vin || []) if (input.txid) await collectTransaction(input.txid, transactions, seen);
  transactions.push(tx);
}

try {
  if (!keep) docker(["down", "--volumes", "--remove-orphans"], { quiet: true });
  docker(["up", "-d"], { quiet: true });
  await waitForCore();
  if (cliJson(["getblockchaininfo"]).chain !== "regtest") throw new Error("Safety stop: the lab is not connected to regtest.");

  for (const wallet of ["miner", "digital-hot", "digital-cold"]) cli(["createwallet", wallet]);
  const minerAddress = cli(["getnewaddress", "mining"], "miner");
  // Tres coinbases deben superar las 100 confirmaciones antes de financiar
  // los depósitos de 60 y 45 BTC. Con 101 bloques solo madura la primera.
  cli(["generatetoaddress", "103", minerAddress]);
  const spendableMiningBalance = Number(cli(["getbalance"], "miner"));
  if (spendableMiningBalance < 105) {
    throw new Error("Expected at least 105 mature regtest BTC, got " + spendableMiningBalance + ".");
  }

  const hotReceive = cli(["getnewaddress", "customer-deposits"], "digital-hot");
  const coldReserve = cli(["getnewaddress", "cold-reserve"], "digital-cold");
  const approvedVendor = cli(["getnewaddress", "approved-vendor"], "miner");

  const hotDeposit = cli(["sendtoaddress", hotReceive, "60.00000000"], "miner");
  cli(["generatetoaddress", "1", minerAddress]);
  const coldDeposit = cli(["sendtoaddress", coldReserve, "45.00000000"], "miner");
  cli(["generatetoaddress", "1", minerAddress]);
  const withdrawal = cli(["sendtoaddress", approvedVendor, "8.00000000"], "digital-hot");
  cli(["generatetoaddress", "3", minerAddress]);

  const withdrawalTx = cliJson(["getrawtransaction", withdrawal, "true"]);
  let hotChange = "";
  for (const output of withdrawalTx.vout) {
    const address = output.scriptPubKey?.address;
    if (!address || address === approvedVendor) continue;
    const info = cliJson(["getaddressinfo", address], "digital-hot");
    if (info.ismine) hotChange = address;
  }
  if (!hotChange) throw new Error("The lab could not identify the hot-wallet change output.");

  const transactions = [];
  const seen = new Set();
  for (const txid of [hotDeposit, coldDeposit, withdrawal]) await collectTransaction(txid, transactions, seen);
  const chain = cliJson(["getblockchaininfo"]);
  const scenario = {
  company: "DigitalCustody Labs",
  network: chain.chain,
  tipHeight: chain.blocks,
  ledger: { balanceBtc: "100.00000000", asOf: new Date().toISOString() },
  controlledAddresses: [hotReceive, coldReserve, hotChange],
  addressRoles: { [hotReceive]: "hot-receive", [coldReserve]: "cold-reserve", [hotChange]: "change" },
  controls: {
    singleKeyWeakness: false,
    multisig: "2-de-3 en reserva fría (modelo educativo; wallets RPC del lab son desechables)",
    roleSeparation: true,
    withdrawalLimitBtc: "5.00000000",
    addressAllowlisting: true,
    approvalWorkflow: "operador → aprobador → firmantes",
    immutableAudit: true
  },
  transactions
  };
  const analysis = analyzeBitcoinScenario(scenario);
  const reports = renderForensicReports(analysis);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "scenario.json"), JSON.stringify(scenario, null, 2) + "\n", "utf8");
  for (const [name, content] of Object.entries(reports)) await fs.writeFile(path.join(outputDir, name), content, "utf8");
  console.log("DigitalCustody Labs reconciled from regtest data.");
  console.log("Reports: " + outputDir);
  console.log("Difference (sats): " + analysis.differenceSats);
  console.log("Stop the disposable node with: docker compose -f labs/regtest/compose.yaml down --volumes");
} catch (error) {
  console.error("Regtest laboratory failed: " + error.message);
  process.exitCode = 1;
}
