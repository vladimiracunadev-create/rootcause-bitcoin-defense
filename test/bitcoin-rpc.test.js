import test from "node:test";
import assert from "node:assert/strict";
import {
  BitcoinRpcClient,
  validateRpcUrl
} from "../src/infrastructure/bitcoin-rpc.js";

const config = {
  url: "http://127.0.0.1:8332",
  user: "observer",
  password: "test-only",
  cookieFile: "",
  allowRemote: false,
  timeoutMs: 1000
};

test("rejects remote RPC unless explicitly enabled", () => {
  assert.throws(() => validateRpcUrl("http://203.0.113.10:8332", false));
  assert.doesNotThrow(() => validateRpcUrl("http://127.0.0.1:8332", false));
});

test("rejects RPC methods outside the read-only allowlist", async () => {
  const client = new BitcoinRpcClient(config, async () => {
    throw new Error("fetch should not run");
  });
  await assert.rejects(() => client.call("sendtoaddress", []), /read-only allowlist/);
});

test("creates a normalized node snapshot", async () => {
  const results = [
    {
      chain: "regtest",
      blocks: 12,
      headers: 12,
      initialblockdownload: false,
      verificationprogress: 1,
      bestblockhash: "abc",
      warnings: []
    },
    { connections: 2, warnings: [] },
    {
      size: 4,
      usage: 1024,
      maxmempool: 300000000,
      mempoolminfee: 0.00001
    },
    [{ network: "ipv4" }, { network: "onion" }]
  ];
  const fakeFetch = async () =>
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: results.shift() }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  const snapshot = await new BitcoinRpcClient(config, fakeFetch).snapshot();
  assert.equal(snapshot.connected, true);
  assert.equal(snapshot.chain, "regtest");
  assert.equal(snapshot.peerCount, 2);
});
