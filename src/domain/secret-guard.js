const EXTENDED_PRIVATE_KEY = /\b(?:xprv|tprv)[1-9A-HJ-NP-Za-km-z]{40,}\b/;
const WIF_PRIVATE_KEY = /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/;
const PUBLIC_PROVENANCE_FIELDS = new Set([
  "seedorigin",
  "seedcreatedat",
  "firmwareatseedcreation"
]);

function isForbiddenKey(key) {
  const compact = String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (PUBLIC_PROVENANCE_FIELDS.has(compact)) return false;
  return [
    "seed",
    "mnemonic",
    "privatekey",
    "xprv",
    "tprv",
    "passphrase",
    "recoveryphrase",
    "recoverywords",
    "walletbackup",
    "wif"
  ].some((token) => compact.includes(token));
}

export class SecretMaterialError extends Error {
  constructor(message = "Secret key material is not accepted by this application.") {
    super(message);
    this.name = "SecretMaterialError";
    this.statusCode = 422;
    this.code = "SECRET_MATERIAL_REJECTED";
  }
}

export function assertNoSecretMaterial(value, path = "request") {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    if (EXTENDED_PRIVATE_KEY.test(value) || WIF_PRIVATE_KEY.test(value)) {
      throw new SecretMaterialError("Private-key-like material was rejected.");
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertNoSecretMaterial(entry, path + "[" + index + "]")
    );
    return;
  }

  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (isForbiddenKey(key)) {
        throw new SecretMaterialError(
          "Forbidden secret field rejected at " + path + "." + key
        );
      }
      assertNoSecretMaterial(entry, path + "." + key);
    }
  }
}

export function redactForAudit(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (EXTENDED_PRIVATE_KEY.test(value) || WIF_PRIVATE_KEY.test(value)) {
      return "[REDACTED]";
    }
    return value.length > 512 ? value.slice(0, 512) + "…" : value;
  }
  if (Array.isArray(value)) return value.map(redactForAudit);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isForbiddenKey(key) ? "[REDACTED]" : redactForAudit(entry)
      ])
    );
  }
  return value;
}
