import test from "node:test";
import assert from "node:assert/strict";
import {
  appendAuditEntry,
  verifyAuditChain
} from "../src/infrastructure/audit-log.js";

test("verifies an intact audit chain", () => {
  let audit = [];
  audit = appendAuditEntry(audit, { action: "first" });
  audit = appendAuditEntry(audit, { action: "second" });
  assert.equal(verifyAuditChain(audit).valid, true);
});

test("detects modified audit metadata", () => {
  let audit = [];
  audit = appendAuditEntry(audit, { action: "first", metadata: { count: 1 } });
  audit[0].metadata.count = 2;
  const result = verifyAuditChain(audit);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "entry_hash_mismatch");
});
