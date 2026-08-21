import crypto from "node:crypto";
import { appendAuditEntry, verifyAuditChain } from "../infrastructure/audit-log.js";
import { assertNoSecretMaterial } from "../domain/secret-guard.js";
import { evaluateState } from "../domain/rule-engine.js";
import { evaluatePosture } from "../domain/posture.js";
import { countBySeverity, riskLevel, riskScore } from "../domain/risk.js";

const NETWORKS = new Set(["mainnet", "signet", "regtest", "testnet4"]);
const WALLET_TYPES = new Set(["single-sig", "multisig"]);
const STATUSES = new Set(["active", "migration-required", "quarantined", "retired"]);
const SEED_ORIGINS = new Set(["device", "dice", "external", "unknown"]);

function text(value, name, maximum = 120) {
  const result = String(value || "").trim();
  if (!result || result.length > maximum) {
    const error = new Error(name + " is required and must be at most " + maximum + " characters.");
    error.statusCode = 400;
    throw error;
  }
  return result;
}

function integer(value, name, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum || result > maximum) {
    const error = new Error(name + " must be an integer between " + minimum + " and " + maximum + ".");
    error.statusCode = 400;
    throw error;
  }
  return result;
}

function enumValue(value, name, allowed) {
  if (!allowed.has(value)) {
    const error = new Error(name + " has an unsupported value.");
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function fingerprint(value, name = "fingerprint") {
  const result = String(value || "").trim().toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(result)) {
    const error = new Error(name + " must contain exactly eight hexadecimal characters.");
    error.statusCode = 400;
    throw error;
  }
  return result;
}

function txHash(value, name) {
  const result = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(result)) {
    const error = new Error(name + " must contain exactly 64 hexadecimal characters.");
    error.statusCode = 400;
    throw error;
  }
  return result;
}

function normalizeSigner(input, index) {
  return {
    id: crypto.randomUUID(),
    label: text(input.label || "Firmante " + (index + 1), "signer.label", 80),
    fingerprint: fingerprint(input.fingerprint, "signer.fingerprint"),
    vendor: text(input.vendor, "signer.vendor", 80),
    model: text(input.model, "signer.model", 80),
    firmwareAtSeedCreation: text(
      input.firmwareAtSeedCreation || "unknown",
      "signer.firmwareAtSeedCreation",
      40
    ),
    firmwareTrack: text(input.firmwareTrack || "standard", "signer.firmwareTrack", 30),
    seedOrigin: enumValue(
      input.seedOrigin || "unknown",
      "signer.seedOrigin",
      SEED_ORIGINS
    ),
    createdAt: input.createdAt
      ? new Date(input.createdAt).toISOString()
      : new Date().toISOString()
  };
}

function normalizeWallet(input) {
  assertNoSecretMaterial(input);
  const walletType = enumValue(input.walletType, "walletType", WALLET_TYPES);
  const signers = Array.isArray(input.signers)
    ? input.signers.map(normalizeSigner)
    : [];
  if (signers.length < 1 || signers.length > 5) {
    const error = new Error("signers must contain between one and five public signer records.");
    error.statusCode = 400;
    throw error;
  }

  const required = integer(
    input.quorum?.required ?? (walletType === "single-sig" ? 1 : 2),
    "quorum.required",
    1,
    5
  );
  const total = integer(
    input.quorum?.total ?? signers.length,
    "quorum.total",
    1,
    5
  );
  if (required > total || total !== signers.length) {
    const error = new Error("quorum must match the signer list and required cannot exceed total.");
    error.statusCode = 400;
    throw error;
  }

  const vendors = new Set(signers.map((signer) => signer.vendor.toLowerCase()));
  return {
    id: crypto.randomUUID(),
    name: text(input.name, "name"),
    fingerprint: fingerprint(input.fingerprint),
    network: enumValue(input.network || "mainnet", "network", NETWORKS),
    walletType,
    balanceSats: integer(input.balanceSats || 0, "balanceSats"),
    status: enumValue(input.status || "active", "status", STATUSES),
    quorum: {
      required,
      total,
      independentVendors: vendors.size
    },
    signers,
    tags: Array.isArray(input.tags)
      ? input.tags.slice(0, 10).map((tag) => text(tag, "tag", 30))
      : []
  };
}

function mergeIncidents(existing, findings, now) {
  const byId = new Map(existing.map((incident) => [incident.id, incident]));
  const activeIds = new Set(findings.map((finding) => finding.id));

  for (const finding of findings) {
    const previous = byId.get(finding.id);
    byId.set(finding.id, {
      ...finding,
      createdAt: previous?.createdAt || now,
      lastSeenAt: now,
      status: previous?.status === "acknowledged" ? "acknowledged" : "open",
      acknowledgedAt: previous?.acknowledgedAt,
      acknowledgedBy: previous?.acknowledgedBy
    });
  }

  for (const [id, incident] of byId) {
    if (!activeIds.has(id) && ["open", "acknowledged"].includes(incident.status)) {
      byId.set(id, { ...incident, status: "resolved", resolvedAt: now });
    }
  }

  return [...byId.values()].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export class DefenseService {
  constructor({ store, config, advisories, policies, bitcoinClient = null }) {
    this.store = store;
    this.config = config;
    this.advisories = advisories;
    this.policies = policies;
    this.bitcoinClient = bitcoinClient;
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    const state = await this.store.load();
    if (!Array.isArray(state.incidents)) state.incidents = [];
    if (!Array.isArray(state.audit)) state.audit = [];
    if (!state.audit.length) {
      state.audit = appendAuditEntry(state.audit, {
        action: "application_initialized",
        metadata: { demoMode: this.config.demoMode }
      });
    }
    const findings = this.evaluate(state);
    state.incidents = mergeIncidents(state.incidents, findings, new Date().toISOString());
    state.updatedAt = new Date().toISOString();
    await this.store.save(state);
  }

  evaluate(state, now = new Date().toISOString()) {
    return evaluateState(state, {
      advisories: this.advisories,
      highValueThresholdSats: this.config.highValueThresholdSats,
      // La postura de despliegue necesita la configuración viva y el estado de
      // la cadena de auditoría: la aplicación también se audita a sí misma.
      config: this.config,
      auditVerification: verifyAuditChain(state.audit || []),
      advisoryMaxAgeDays: this.policies?.advisoryMaxAgeDays || 30,
      now
    });
  }

  // Reevaluar después de CADA cambio, no solo cuando alguien pulsa «Analizar».
  // Un inventario que cambia y un panel que no se entera es un panel que miente
  // hasta el próximo análisis manual.
  rescanAfterChange(state, actor, reason) {
    const now = new Date().toISOString();
    const findings = this.evaluate(state, now);
    const before = state.incidents.length;
    state.incidents = mergeIncidents(state.incidents, findings, now);
    state.audit = appendAuditEntry(state.audit, {
      actor,
      action: "auto_rescan",
      metadata: {
        reason,
        findings: findings.length,
        incidentsBefore: before,
        incidentsAfter: state.incidents.length
      }
    });
    return findings;
  }

  async mutate(mutator) {
    const operation = this.writeQueue.then(async () => {
      const state = await this.store.load();
      const result = await mutator(state);
      state.updatedAt = new Date().toISOString();
      await this.store.save(state);
      return result;
    });
    this.writeQueue = operation.catch(() => {});
    return operation;
  }

  async summary() {
    const state = await this.store.load();
    const active = state.incidents.filter((incident) =>
      ["open", "acknowledged"].includes(incident.status)
    );
    const score = riskScore(active);
    const totalSats = state.wallets.reduce(
      (sum, wallet) => sum + Number(wallet.balanceSats || 0),
      0
    );
    return {
      generatedAt: new Date().toISOString(),
      mode: this.config.demoMode ? "demo" : "persistent",
      risk: {
        score,
        level: riskLevel(score),
        counts: countBySeverity(active)
      },
      totals: {
        wallets: state.wallets.length,
        signers: state.wallets.reduce(
          (sum, wallet) => sum + (wallet.signers?.length || 0),
          0
        ),
        activeIncidents: active.length,
        watchedSats: totalSats
      },
      wallets: state.wallets,
      incidents: state.incidents.slice(0, 20),
      node: state.node,
      audit: verifyAuditChain(state.audit)
    };
  }

  // La postura se calcula en el momento: depende de la configuración con la que
  // corre el proceso, no de lo que se guardó en disco.
  async posture() {
    const state = await this.store.load();
    const now = new Date().toISOString();
    const findings = evaluatePosture(state, {
      config: this.config,
      highValueThresholdSats: this.config.highValueThresholdSats,
      auditVerification: verifyAuditChain(state.audit || []),
      now
    });
    const score = riskScore(findings);
    return {
      generatedAt: now,
      deployment: {
        mode: this.config.demoMode ? "demo" : "persistent",
        host: this.config.host,
        port: this.config.port,
        watchtowerEnabled: this.config.watchtower.enabled,
        remoteRpcAllowed: this.config.bitcoin.allowRemote,
        rpcAuth: this.config.bitcoin.cookieFile
          ? "cookie"
          : this.config.bitcoin.user || this.config.bitcoin.password
            ? "password"
            : "sin credenciales"
      },
      risk: { score, level: riskLevel(score), counts: countBySeverity(findings) },
      findings
    };
  }

  async wallets() {
    return (await this.store.load()).wallets;
  }

  async addWallet(input, actor = "local-user") {
    const wallet = normalizeWallet(input);
    return this.mutate(async (state) => {
      if (state.wallets.some((entry) => entry.fingerprint === wallet.fingerprint)) {
        const error = new Error("A wallet with that fingerprint already exists.");
        error.statusCode = 409;
        throw error;
      }
      state.wallets.push(wallet);
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "wallet_registered",
        entityType: "wallet",
        entityId: wallet.id,
        metadata: {
          fingerprint: wallet.fingerprint,
          walletType: wallet.walletType,
          signerCount: wallet.signers.length
        }
      });
      this.rescanAfterChange(state, actor, "wallet_registered");
      return wallet;
    });
  }

  async scan(actor = "system") {
    return this.mutate(async (state) => {
      const now = new Date().toISOString();
      const findings = this.evaluate(state);
      state.incidents = mergeIncidents(state.incidents, findings, now);
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "risk_scan_completed",
        metadata: {
          findings: findings.length,
          counts: countBySeverity(findings)
        }
      });
      return {
        scannedAt: now,
        findings: findings.length,
        counts: countBySeverity(findings),
        incidents: state.incidents
      };
    });
  }

  async incidents() {
    return (await this.store.load()).incidents;
  }

  async updateIncident(id, status, actor = "local-user") {
    if (!["acknowledged", "resolved"].includes(status)) {
      const error = new Error("Unsupported incident status.");
      error.statusCode = 400;
      throw error;
    }
    return this.mutate(async (state) => {
      const index = state.incidents.findIndex((incident) => incident.id === id);
      if (index < 0) {
        const error = new Error("Incident not found.");
        error.statusCode = 404;
        throw error;
      }
      const timestamp = new Date().toISOString();
      state.incidents[index] = {
        ...state.incidents[index],
        status,
        ...(status === "acknowledged"
          ? { acknowledgedAt: timestamp, acknowledgedBy: actor }
          : { resolvedAt: timestamp, resolvedBy: actor })
      };
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "incident_" + status,
        entityType: "incident",
        entityId: id
      });
      return state.incidents[index];
    });
  }

  async approvePolicyHash(input, actor = "local-user") {
    assertNoSecretMaterial(input);
    const hash = txHash(input.hash, "hash");
    return this.mutate(async (state) => {
      const approval = {
        id: crypto.randomUUID(),
        hash,
        label: text(input.label || "PSBT aprobada", "label", 120),
        createdAt: new Date().toISOString(),
        expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
        actor
      };
      state.approvals.push(approval);
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "policy_hash_approved",
        entityType: "approval",
        entityId: approval.id,
        metadata: { hash }
      });
      return approval;
    });
  }

  async observeTransaction(input, actor = "watchtower") {
    assertNoSecretMaterial(input);
    const event = {
      id: crypto.randomUUID(),
      txid: txHash(input.txid, "txid"),
      walletId: text(input.walletId, "walletId", 80),
      spendsWatchedWallet: input.spendsWatchedWallet !== false,
      // Opcional: sin importe no se puede distinguir un pago de un vaciado.
      valueSats: input.valueSats === undefined ? null : integer(input.valueSats, "valueSats", 0),
      approvalHash: input.approvalHash
        ? txHash(input.approvalHash, "approvalHash")
        : null,
      source: text(input.source || "manual", "source", 30),
      observedAt: new Date().toISOString()
    };
    return this.mutate(async (state) => {
      state.observedTransactions.push(event);
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "transaction_observed",
        entityType: "transaction",
        entityId: event.txid,
        metadata: {
          walletId: event.walletId,
          approved: Boolean(event.approvalHash)
        }
      });
      const findings = this.evaluate(state);
      state.incidents = mergeIncidents(
        state.incidents,
        findings,
        new Date().toISOString()
      );
      return event;
    });
  }

  async observePrivacyEvent(input, actor = "vendor-monitor") {
    assertNoSecretMaterial(input);
    if (input.type !== "bulk_customer_data_access") {
      const error = new Error("Unsupported privacy event type.");
      error.statusCode = 400;
      throw error;
    }
    const event = {
      id: crypto.randomUUID(),
      type: input.type,
      vendor: text(input.vendor, "vendor", 120),
      recordCount: integer(input.recordCount, "recordCount", 1),
      authorized: input.authorized === true,
      observedAt: new Date().toISOString()
    };
    return this.mutate(async (state) => {
      state.privacyEvents.push(event);
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "privacy_event_observed",
        entityType: "vendor-event",
        entityId: event.id,
        metadata: {
          vendor: event.vendor,
          recordCount: event.recordCount,
          authorized: event.authorized
        }
      });
      const findings = this.evaluate(state);
      state.incidents = mergeIncidents(
        state.incidents,
        findings,
        new Date().toISOString()
      );
      return event;
    });
  }

  async refreshNode(actor = "watchtower") {
    if (!this.bitcoinClient) {
      const error = new Error("Bitcoin Core connector is not configured.");
      error.statusCode = 503;
      throw error;
    }
    const snapshot = await this.bitcoinClient.snapshot();
    return this.mutate(async (state) => {
      state.node = snapshot;
      state.audit = appendAuditEntry(state.audit, {
        actor,
        action: "bitcoin_node_checked",
        entityType: "node",
        entityId: "bitcoin-core",
        metadata: {
          connected: snapshot.connected,
          chain: snapshot.chain,
          blocks: snapshot.blocks
        }
      });
      return snapshot;
    });
  }

  async advisoriesList() {
    return this.advisories;
  }

  async policiesDocument() {
    return this.policies;
  }

  async audit() {
    const state = await this.store.load();
    return {
      verification: verifyAuditChain(state.audit),
      entries: state.audit.slice().reverse().slice(0, 200)
    };
  }
}
