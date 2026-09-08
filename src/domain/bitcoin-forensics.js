const SATOSHIS_PER_BTC = 100000000n;

export function btcToSats(value) {
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(raw)) throw new Error("Invalid BTC amount: " + raw);
  const [whole, fraction = ""] = raw.split(".");
  return BigInt(whole) * SATOSHIS_PER_BTC + BigInt(fraction.padEnd(8, "0"));
}

export function satsToBtc(value) {
  const sats = BigInt(value);
  const sign = sats < 0n ? "-" : "";
  const absolute = sats < 0n ? -sats : sats;
  return sign + (absolute / SATOSHIS_PER_BTC) + "." + String(absolute % SATOSHIS_PER_BTC).padStart(8, "0");
}

function outputAddresses(output) {
  const script = output.scriptPubKey || {};
  if (script.address) return [script.address];
  return Array.isArray(script.addresses) ? script.addresses : [];
}

function outpoint(txid, vout) {
  return txid + ":" + vout;
}

function txTime(tx) {
  const seconds = tx.blocktime ?? tx.time;
  return seconds ? new Date(seconds * 1000).toISOString() : "mempool";
}

function csvCell(value) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? '"' + raw.replaceAll('"', '""') + '"' : raw;
}

function csv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function xml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function selectCoins(utxos, targetSats, feeRateSatsVb = 2n) {
  const target = BigInt(targetSats);
  const rate = BigInt(feeRateSatsVb);
  const ordered = [...utxos].sort((a, b) => Number(BigInt(b.valueSats) - BigInt(a.valueSats)));
  const selected = [];
  let total = 0n;
  for (const utxo of ordered) {
    selected.push(utxo);
    total += BigInt(utxo.valueSats);
    const estimatedVbytes = 10n + BigInt(selected.length) * 68n + 2n * 31n;
    const fee = estimatedVbytes * rate;
    if (total >= target + fee) {
      return { selected, totalSats: total, targetSats: target, estimatedFeeSats: fee, changeSats: total - target - fee };
    }
  }
  throw new Error("Insufficient controlled UTXOs for the requested conceptual selection.");
}

export function analyzeBitcoinScenario(scenario) {
  if (scenario.network !== "regtest" && scenario.network !== "signet" && scenario.network !== "testnet") {
    throw new Error("Forensic labs only accept regtest, signet or testnet data.");
  }
  const controlled = new Set(scenario.controlledAddresses || []);
  const roles = scenario.addressRoles || {};
  const transactions = scenario.transactions || [];
  const outputs = new Map();
  const spent = new Set();

  for (const tx of transactions) {
    for (const output of tx.vout || []) {
      outputs.set(outpoint(tx.txid, output.n), {
        txid: tx.txid,
        vout: output.n,
        valueSats: btcToSats(output.value),
        addresses: outputAddresses(output),
        tx
      });
    }
  }
  for (const tx of transactions) {
    for (const input of tx.vin || []) if (input.txid !== undefined) spent.add(outpoint(input.txid, input.vout));
  }

  const records = [];
  const addressHistory = new Map();
  const touch = (address, entry) => {
    if (!addressHistory.has(address)) addressHistory.set(address, []);
    addressHistory.get(address).push(entry);
  };

  for (const tx of transactions) {
    const inputRefs = (tx.vin || []).filter((input) => input.txid !== undefined).map((input) => outputs.get(outpoint(input.txid, input.vout)));
    const knownInputs = inputRefs.filter(Boolean);
    const inputTotal = knownInputs.reduce((sum, input) => sum + input.valueSats, 0n);
    const outputTotal = (tx.vout || []).reduce((sum, output) => sum + btcToSats(output.value), 0n);
    const controlledInputs = knownInputs.filter((input) => input.addresses.some((address) => controlled.has(address)));
    const controlledOutputs = (tx.vout || []).flatMap((output) =>
      outputAddresses(output).filter((address) => controlled.has(address)).map((address) => ({ address, output, valueSats: btcToSats(output.value) }))
    );
    const externalOutputs = (tx.vout || []).flatMap((output) =>
      outputAddresses(output).filter((address) => !controlled.has(address)).map((address) => ({ address, output, valueSats: btcToSats(output.value) }))
    );
    const feeSats = knownInputs.length === inputRefs.length && inputRefs.length ? inputTotal - outputTotal : null;
    let kind = "external";
    if (controlledInputs.length && externalOutputs.length) kind = "withdrawal";
    else if (!controlledInputs.length && controlledOutputs.length) kind = "deposit";
    else if (controlledInputs.length && controlledOutputs.length) kind = "internal";

    for (const input of controlledInputs) {
      for (const address of input.addresses.filter((item) => controlled.has(item))) touch(address, { txid: tx.txid, direction: "spent", valueSats: input.valueSats });
    }
    for (const output of controlledOutputs) touch(output.address, { txid: tx.txid, direction: roles[output.address] === "change" ? "change" : "received", valueSats: output.valueSats });

    records.push({
      txid: tx.txid,
      parents: (tx.vin || []).filter((input) => input.txid !== undefined).map((input) => input.txid),
      kind,
      time: txTime(tx),
      blockhash: tx.blockhash || "mempool",
      blockheight: tx.blockheight ?? null,
      confirmations: tx.confirmations ?? 0,
      feeSats,
      controlledInputSats: controlledInputs.reduce((sum, input) => sum + input.valueSats, 0n),
      controlledOutputSats: controlledOutputs.reduce((sum, output) => sum + output.valueSats, 0n),
      externalOutputSats: externalOutputs.reduce((sum, output) => sum + output.valueSats, 0n)
    });
  }

  const utxos = [...outputs.values()]
    .filter((output) => !spent.has(outpoint(output.txid, output.vout)))
    .flatMap((output) => output.addresses.filter((address) => controlled.has(address)).map((address) => ({
      txid: output.txid,
      vout: output.vout,
      address,
      role: roles[address] || "receive",
      valueSats: output.valueSats,
      confirmations: output.tx.confirmations ?? 0,
      blockheight: output.tx.blockheight ?? null,
      blockhash: output.tx.blockhash || "mempool",
      receivedAt: txTime(output.tx)
    })))
    .sort((a, b) => a.txid.localeCompare(b.txid) || a.vout - b.vout);

  const chainBalanceSats = utxos.reduce((sum, item) => sum + item.valueSats, 0n);
  const ledgerBalanceSats = btcToSats(scenario.ledger.balanceBtc);
  return {
    company: scenario.company,
    network: scenario.network,
    tipHeight: scenario.tipHeight,
    ledgerBalanceSats,
    chainBalanceSats,
    differenceSats: chainBalanceSats - ledgerBalanceSats,
    transactionFeesSats: records.filter((record) => record.controlledInputSats > 0n && record.feeSats !== null).reduce((sum, record) => sum + record.feeSats, 0n),
    transactions: records,
    utxos,
    addressHistory: [...addressHistory.entries()].map(([address, history]) => ({ address, role: roles[address] || "receive", history })),
    controls: scenario.controls || {}
  };
}

export function renderForensicReports(analysis) {
  const controls = [
    ["Debilidad de clave única", analysis.controls.singleKeyWeakness === false ? "controlada" : "expuesta"],
    ["Multisig", analysis.controls.multisig || "no documentado"],
    ["Separación de roles", analysis.controls.roleSeparation ? "sí" : "no"],
    ["Límite de retiro", analysis.controls.withdrawalLimitBtc ? analysis.controls.withdrawalLimitBtc + " BTC" : "no definido"],
    ["Allowlist de direcciones", analysis.controls.addressAllowlisting ? "sí" : "no"],
    ["Flujo de aprobación", analysis.controls.approvalWorkflow || "no definido"],
    ["Auditoría inmutable", analysis.controls.immutableAudit ? "sí" : "no"]
  ];
  const summary = `# Bitcoin forensic summary — ${analysis.company}\n\n` +
    `Red: **${analysis.network}** · altura observada: **${analysis.tipHeight}**\n\n` +
    `| Magnitud | BTC |\n|---|---:|\n` +
    `| Libro interno | ${satsToBtc(analysis.ledgerBalanceSats)} |\n` +
    `| UTXOs controlados | ${satsToBtc(analysis.chainBalanceSats)} |\n` +
    `| Diferencia cadena − libro | ${satsToBtc(analysis.differenceSats)} |\n` +
    `| Fees pagadas por retiros controlados | ${satsToBtc(analysis.transactionFeesSats)} |\n\n` +
    `El resultado se calculó recorriendo ${analysis.transactions.length} transacciones y ${analysis.utxos.length} UTXOs no gastados; no está codificado como respuesta fija.\n\n` +
    `## Historia de direcciones controladas\n\n| Dirección | Rol | Eventos |\n|---|---|---:|\n` +
    analysis.addressHistory.map((entry) => `| \`${entry.address}\` | ${entry.role} | ${entry.history.length} |`).join("\n") + `\n\n` +
    `## Controles de custodia\n\n| Control | Estado |\n|---|---|\n` + controls.map(([name, state]) => `| ${name} | ${state} |`).join("\n") +
    `\n\n## Lectura segura\n\nLa selección de monedas y PSBT se estudian como construcción y revisión de una propuesta sin firmar. El laboratorio no recibe semillas, no firma, no transmite y no usa fondos reales.\n`;

  const utxoCsv = csv([
    ["txid", "vout", "address", "role", "value_btc", "confirmations", "block_height", "block_hash", "received_at", "provenance"],
    ...analysis.utxos.map((item) => [item.txid, item.vout, item.address, item.role, satsToBtc(item.valueSats), item.confirmations, item.blockheight ?? "", item.blockhash, item.receivedAt, item.txid + ":" + item.vout])
  ]);
  const reconciliation = csv([
    ["company", "ledger_btc", "controlled_utxos_btc", "difference_btc", "status"],
    [analysis.company, satsToBtc(analysis.ledgerBalanceSats), satsToBtc(analysis.chainBalanceSats), satsToBtc(analysis.differenceSats), analysis.differenceSats === 0n ? "reconciled" : "difference_found"]
  ]);
  const timeline = `# Timeline — ${analysis.company}\n\n| Fecha | Confirmaciones | Tipo | Txid | Entradas controladas | Salidas controladas | Fee |\n|---|---:|---|---|---:|---:|---:|\n` +
    analysis.transactions.sort((a, b) => a.time.localeCompare(b.time)).map((tx) => `| ${tx.time} | ${tx.confirmations} | ${tx.kind} | \`${tx.txid}\` | ${satsToBtc(tx.controlledInputSats)} | ${satsToBtc(tx.controlledOutputSats)} | ${tx.feeSats === null ? "desconocida" : satsToBtc(tx.feeSats)} |`).join("\n") + "\n";
  const nodes = analysis.transactions.map((tx) => `    <node id="${xml(tx.txid)}"><data key="kind">${xml(tx.kind)}</data></node>`).join("\n");
  const known = new Set(analysis.transactions.map((tx) => tx.txid));
  const edges = analysis.transactions.flatMap((tx) => tx.parents.map((source) => ({ source, target: tx.txid })));
  const graphml = `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n  <key id="kind" for="node" attr.name="kind" attr.type="string"/>\n  <graph id="bitcoin-transactions" edgedefault="directed">\n${nodes}\n${edges.filter((edge) => known.has(edge.source)).map((edge, index) => `    <edge id="e${index}" source="${xml(edge.source)}" target="${xml(edge.target)}"/>`).join("\n")}\n  </graph>\n</graphml>\n`;
  return { "bitcoin-summary.md": summary, "utxo-analysis.csv": utxoCsv, "transaction-graph.graphml": graphml, "reconciliation.csv": reconciliation, "timeline.md": timeline };
}
