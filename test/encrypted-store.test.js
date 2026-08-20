import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  EncryptedFileStore,
  decryptJson,
  encryptJson
} from "../src/infrastructure/encrypted-store.js";

test("encrypts and decrypts state using AES-256-GCM", () => {
  const key = crypto.randomBytes(32);
  const state = { wallets: [{ fingerprint: "A1B2C3D4" }], incidents: [] };
  const envelope = encryptJson(state, key);
  assert.equal(envelope.algorithm, "aes-256-gcm");
  assert.notEqual(envelope.ciphertext, JSON.stringify(state));
  assert.deepEqual(decryptJson(envelope, key), state);
});

test("rejects decryption with a different key", () => {
  const envelope = encryptJson({ value: 42 }, crypto.randomBytes(32));
  assert.throws(() => decryptJson(envelope, crypto.randomBytes(32)));
});

test("persists encrypted state atomically without plaintext metadata", async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rcbd-store-"));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "state.enc.json");
  const key = crypto.randomBytes(32);
  const store = new EncryptedFileStore(file, key, { wallets: [] });
  const state = { wallets: [{ name: "Sensitive treasury metadata" }] };
  await store.save(state);
  assert.deepEqual(await store.load(), state);
  const raw = await fs.readFile(file, "utf8");
  assert.equal(raw.includes("Sensitive treasury metadata"), false);
});
