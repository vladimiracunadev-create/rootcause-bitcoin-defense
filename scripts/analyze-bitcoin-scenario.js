import fs from "node:fs/promises";
import path from "node:path";
import { analyzeBitcoinScenario, renderForensicReports } from "../src/domain/bitcoin-forensics.js";

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const prefix = "--" + name + "=";
  return args.find((item) => item.startsWith(prefix))?.slice(prefix.length) || fallback;
};
const input = path.resolve(value("input", "examples/digital-custody-labs/scenario.json"));
const output = path.resolve(value("output", "build/bitcoin-forensics"));
const scenario = JSON.parse(await fs.readFile(input, "utf8"));
const analysis = analyzeBitcoinScenario(scenario);
const reports = renderForensicReports(analysis);
await fs.mkdir(output, { recursive: true });
for (const [name, content] of Object.entries(reports)) await fs.writeFile(path.join(output, name), content, "utf8");
console.log(JSON.stringify({
  company: analysis.company,
  network: analysis.network,
  ledgerBtc: scenario.ledger.balanceBtc,
  controlledUtxosBtc: String(analysis.chainBalanceSats / 100000000n) + "." + String(analysis.chainBalanceSats % 100000000n).padStart(8, "0"),
  differenceSats: analysis.differenceSats.toString(),
  reports: Object.keys(reports).map((name) => path.join(output, name))
}, null, 2));
