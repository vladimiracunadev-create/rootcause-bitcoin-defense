// Cliente RPC de Bitcoin Core, deliberadamente incapaz de mover fondos.
//
// Dos defensas independientes, y ninguna es opcional:
//
//   1. `READ_ONLY_METHODS` es una allowlist, no una lista negra: lo que no
//      figura, no se llama. Un metodo capaz de firmar o enviar no puede
//      colarse por olvido, tendria que anadirlo alguien a mano.
//   2. `validateRpcUrl` rechaza destinos que no sean loopback salvo que se
//      habilite ALLOW_REMOTE_RPC explicitamente, y rechaza siempre las
//      credenciales incrustadas en la URL, que acaban en logs e historiales.
//
// `scripts/check-security-claims.js` lee esta allowlist en cada build y falla
// si aparece cualquier metodo capaz de mutar estado. Es el mismo control que un
// grep del workflow de CI, por duplicado y a proposito.
//
// `snapshot()` nunca lanza: un nodo caido es un dato del sistema -lo recoge la
// regla BTC-NODE-001-, no una excepcion que deba tumbar el analisis.
import fs from "node:fs/promises";
import net from "node:net";

const READ_ONLY_METHODS = new Set([
  "getbestblockhash",
  "getblockchaininfo",
  "getblockcount",
  "getmempoolentry",
  "getmempoolinfo",
  "getnetworkinfo",
  "getpeerinfo",
  "getrawmempool",
  "gettxout",
  "getwalletinfo",
  "estimatesmartfee"
]);

function isLoopback(hostname) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (normalized === "localhost" || normalized === "::1") return true;
  if (net.isIP(normalized) === 4) return normalized.startsWith("127.");
  return false;
}

export function validateRpcUrl(value, allowRemote = false) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Bitcoin RPC must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("Do not place Bitcoin RPC credentials inside the URL.");
  }
  if (!allowRemote && !isLoopback(url.hostname)) {
    throw new Error(
      "Remote Bitcoin RPC is disabled. Use localhost, a private tunnel or explicit ALLOW_REMOTE_RPC=true."
    );
  }
  return url;
}

async function credentials(config) {
  if (config.cookieFile) {
    const cookie = (await fs.readFile(config.cookieFile, "utf8")).trim();
    if (!cookie.includes(":")) throw new Error("Invalid Bitcoin Core cookie file.");
    return cookie;
  }
  if (config.user || config.password) return config.user + ":" + config.password;
  return "";
}

export class BitcoinRpcClient {
  constructor(config, fetchImplementation = globalThis.fetch) {
    this.config = config;
    this.fetch = fetchImplementation;
    this.url = validateRpcUrl(config.url, config.allowRemote);
    this.nextId = 1;
  }

  endpointLabel() {
    return this.url.protocol + "//" + this.url.host;
  }

  async call(method, params = []) {
    if (!READ_ONLY_METHODS.has(method)) {
      throw new Error("RPC method is not in the read-only allowlist: " + method);
    }
    const auth = await credentials(this.config);
    const headers = {
      "content-type": "application/json",
      accept: "application/json"
    };
    if (auth) {
      headers.authorization = "Basic " + Buffer.from(auth, "utf8").toString("base64");
    }

    const response = await this.fetch(this.url, {
      method: "POST",
      redirect: "error",
      headers,
      signal: AbortSignal.timeout(this.config.timeoutMs),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.nextId++,
        method,
        params
      })
    });

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 2097152) throw new Error("Bitcoin RPC response is too large.");
    const raw = await response.text();
    if (raw.length > 2097152) throw new Error("Bitcoin RPC response is too large.");
    if (!response.ok) throw new Error("Bitcoin RPC returned HTTP " + response.status + ".");
    const payload = JSON.parse(raw);
    if (payload.error) {
      throw new Error(
        "Bitcoin RPC error " + payload.error.code + ": " + payload.error.message
      );
    }
    return payload.result;
  }

  async snapshot() {
    const checkedAt = new Date().toISOString();
    try {
      const blockchain = await this.call("getblockchaininfo");
      const network = await this.call("getnetworkinfo");
      const mempool = await this.call("getmempoolinfo");
      const peers = await this.call("getpeerinfo");

      return {
        connected: true,
        endpoint: this.endpointLabel(),
        checkedAt,
        chain: blockchain.chain,
        blocks: blockchain.blocks,
        headers: blockchain.headers,
        initialBlockDownload: blockchain.initialblockdownload,
        verificationProgress: blockchain.verificationprogress,
        bestBlockHash: blockchain.bestblockhash,
        warnings: blockchain.warnings || network.warnings || [],
        connections: network.connections,
        peerNetworks: [...new Set(peers.map((peer) => peer.network))],
        peerCount: peers.length,
        mempoolTransactions: mempool.size,
        mempoolUsageBytes: mempool.usage,
        mempoolMaxBytes: mempool.maxmempool,
        mempoolMinFee: mempool.mempoolminfee
      };
    } catch (error) {
      return {
        connected: false,
        endpoint: this.endpointLabel(),
        checkedAt,
        error: error.message
      };
    }
  }
}
