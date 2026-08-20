import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { createApplication } from "../src/app.js";
import { PROJECT_ROOT } from "../src/config.js";
import { MemoryStore } from "../src/infrastructure/encrypted-store.js";
import { createDemoState } from "../src/services/demo-state.js";
import { DefenseService } from "../src/services/defense-service.js";

async function fixture() {
  const config = {
    demoMode: true,
    bodyLimitBytes: 65536,
    rateLimitPerMinute: 1000,
    highValueThresholdSats: 10000000
  };
  const advisories = [
    {
      id: "BTC-ADV-TEST",
      vendor: "COLDCARD",
      affected: [
        {
          models: ["Mk3"],
          track: "standard",
          minInclusive: "4.0.1",
          maxInclusive: "4.1.9"
        }
      ],
      mitigation: ["Migrate."]
    }
  ];
  const service = new DefenseService({
    store: new MemoryStore(createDemoState()),
    config,
    advisories,
    policies: {},
    bitcoinClient: null
  });
  await service.initialize();
  const application = createApplication({
    service,
    config,
    staticRoot: path.join(PROJECT_ROOT, "src", "web", "static")
  });
  const server = http.createServer(application);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    server,
    baseUrl: "http://127.0.0.1:" + address.port
  };
}

test("serves health and summary endpoints", async (context) => {
  const { server, baseUrl } = await fixture();
  context.after(() => server.close());
  const health = await fetch(baseUrl + "/api/health");
  assert.equal(health.status, 200);
  const summary = await (await fetch(baseUrl + "/api/summary")).json();
  assert.equal(summary.mode, "demo");
  assert.equal(summary.totals.wallets, 2);
  assert.ok(summary.risk.score > 0);
});

test("requires the local mutation header", async (context) => {
  const { server, baseUrl } = await fixture();
  context.after(() => server.close());
  const response = await fetch(baseUrl + "/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(response.status, 403);
});

test("rejects secret fields before wallet registration", async (context) => {
  const { server, baseUrl } = await fixture();
  context.after(() => server.close());
  const response = await fetch(baseUrl + "/api/wallets", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rootcause-request": "1"
    },
    body: JSON.stringify({ name: "Unsafe", mnemonic: "must never be accepted" })
  });
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, "SECRET_MATERIAL_REJECTED");
});

test("registers public signer provenance and rescans", async (context) => {
  const { server, baseUrl } = await fixture();
  context.after(() => server.close());
  const response = await fetch(baseUrl + "/api/wallets", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rootcause-request": "1"
    },
    body: JSON.stringify({
      name: "Signet laboratory",
      fingerprint: "D15EA5ED",
      network: "signet",
      walletType: "single-sig",
      balanceSats: 1000,
      quorum: { required: 1, total: 1 },
      signers: [
        {
          label: "Laboratory signer",
          fingerprint: "D15EA5ED",
          vendor: "Test Vendor",
          model: "Test Model",
          firmwareAtSeedCreation: "1.0.0",
          firmwareTrack: "standard",
          seedOrigin: "device"
        }
      ]
    })
  });
  assert.equal(response.status, 201);
  const summary = await (await fetch(baseUrl + "/api/summary")).json();
  assert.equal(summary.totals.wallets, 3);
});
