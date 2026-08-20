import test from "node:test";
import assert from "node:assert/strict";
import {
  SecretMaterialError,
  assertNoSecretMaterial,
  redactForAudit
} from "../src/domain/secret-guard.js";

test("rejects forbidden secret fields at any depth", () => {
  assert.throws(
    () => assertNoSecretMaterial({ signer: { mnemonic: "not accepted" } }),
    SecretMaterialError
  );
  assert.throws(
    () => assertNoSecretMaterial({ private_key: "not accepted" }),
    SecretMaterialError
  );
  assert.throws(
    () => assertNoSecretMaterial({ mnemonicPhrase: "not accepted" }),
    SecretMaterialError
  );
  assert.throws(
    () => assertNoSecretMaterial({ bip39Passphrase: "not accepted" }),
    SecretMaterialError
  );
});

test("accepts public provenance metadata", () => {
  assert.doesNotThrow(() =>
    assertNoSecretMaterial({
      fingerprint: "A1B2C3D4",
      vendor: "COLDCARD",
      firmwareAtSeedCreation: "4.1.9",
      seedOrigin: "device"
    })
  );
});

test("redacts forbidden audit fields", () => {
  assert.deepEqual(redactForAudit({ seed: "value", safe: "metadata" }), {
    seed: "[REDACTED]",
    safe: "metadata"
  });
});
