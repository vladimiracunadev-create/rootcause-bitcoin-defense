import test from "node:test";
import assert from "node:assert/strict";
import {
  advisoryAffectsWallet,
  compareFirmwareVersions,
  parseFirmwareVersion
} from "../src/domain/firmware.js";

test("parses numeric firmware and vendor suffixes", () => {
  assert.deepEqual(parseFirmwareVersion("v6.6.0QX"), {
    raw: "v6.6.0QX",
    numbers: [6, 6, 0],
    suffix: "qx"
  });
});

test("compares firmware versions numerically", () => {
  assert.equal(compareFirmwareVersions("4.1.9", "4.2.0"), -1);
  assert.equal(compareFirmwareVersions("5.10.0", "5.6.0"), 1);
  assert.equal(compareFirmwareVersions("1.5.0Q", "1.5.0Q"), 0);
});

test("matches model, track and affected range", () => {
  const advisory = {
    vendor: "COLDCARD",
    affected: [
      {
        models: ["Mk3"],
        track: "standard",
        minInclusive: "4.0.1",
        maxInclusive: "4.1.9"
      }
    ]
  };
  assert.equal(
    advisoryAffectsWallet(advisory, {
      vendor: "coldcard",
      model: "Mk3",
      firmwareTrack: "standard",
      firmwareAtSeedCreation: "4.1.9"
    }),
    true
  );
  assert.equal(
    advisoryAffectsWallet(advisory, {
      vendor: "COLDCARD",
      model: "Mk3",
      firmwareTrack: "standard",
      firmwareAtSeedCreation: "4.2.0"
    }),
    false
  );
});
