import crypto from "node:crypto";

const key = crypto.randomBytes(32).toString("base64");
console.log("ROOTCAUSE_DATA_KEY=" + key);
console.error(
  "Store this value in a secret manager or local protected environment file. Do not commit it."
);
