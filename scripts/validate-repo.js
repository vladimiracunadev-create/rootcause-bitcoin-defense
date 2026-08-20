import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PROJECT_ROOT } from "../src/config.js";

const requiredFiles = [
  "README.md",
  "MASTER_PROMPT.md",
  "SECURITY.md",
  "package.json",
  "pnpm-workspace.yaml",
  "config/advisories.json",
  "config/policies.json",
  "src/server.js",
  "src/web/static/index.html",
  "test/rule-engine.test.js"
];

const errors = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (["node_modules", ".git", "data", "build", "coverage"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(target)));
    else results.push(target);
  }
  return results;
}

for (const relativePath of requiredFiles) {
  try {
    await fs.access(path.join(PROJECT_ROOT, relativePath));
  } catch {
    errors.push("Missing required file: " + relativePath);
  }
}

for (const forbidden of ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock"]) {
  try {
    await fs.access(path.join(PROJECT_ROOT, forbidden));
    errors.push("Forbidden package-manager artifact: " + forbidden);
  } catch {}
}

for (const jsonFile of [
  "package.json",
  "config/advisories.json",
  "config/policies.json",
  "src/web/static/manifest.webmanifest"
]) {
  try {
    JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, jsonFile), "utf8"));
  } catch (error) {
    errors.push("Invalid JSON in " + jsonFile + ": " + error.message);
  }
}

const packageDocument = JSON.parse(
  await fs.readFile(path.join(PROJECT_ROOT, "package.json"), "utf8")
);
if (!String(packageDocument.packageManager || "").startsWith("pnpm@")) {
  errors.push("package.json must declare pnpm as packageManager.");
}

// La version que anuncia /api/health tiene que ser la del manifiesto: un
// endpoint de salud que miente sobre su version es peor que no tenerlo.
const routerSource = await fs.readFile(
  path.join(PROJECT_ROOT, "src", "api", "router.js"),
  "utf8"
);
const declaredVersion = routerSource.match(/version:\s*"([^"]+)"/);
if (!declaredVersion) {
  errors.push("src/api/router.js ya no declara una version en /api/health.");
} else if (declaredVersion[1] !== packageDocument.version) {
  errors.push(
    "Version desincronizada: package.json dice " +
      packageDocument.version +
      " y /api/health responde " +
      declaredVersion[1] +
      "."
  );
}

const files = await walk(PROJECT_ROOT);
for (const file of files.filter((entry) => entry.endsWith(".js"))) {
  const check = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });
  if (check.status !== 0) {
    errors.push("JavaScript syntax error in " + path.relative(PROJECT_ROOT, file));
  }
}

const dangerousPatterns = [
  /-----BEGIN (?:EC |RSA )?PRIVATE KEY-----/,
  /\b(?:xprv|tprv)[1-9A-HJ-NP-Za-km-z]{40,}\b/
];
for (const file of files) {
  if (!/\.(?:js|json|md|html|ya?ml|example)$/.test(file)) continue;
  const content = await fs.readFile(file, "utf8");
  if (dangerousPatterns.some((pattern) => pattern.test(content))) {
    errors.push("Potential embedded private material in " + path.relative(PROJECT_ROOT, file));
  }
  if (file.includes(path.sep + "test" + path.sep) && /\.only\s*\(/.test(content)) {
    errors.push("Focused test found in " + path.relative(PROJECT_ROOT, file));
  }
}

if (errors.length) {
  console.error(errors.map((error) => "- " + error).join("\n"));
  process.exit(1);
}

console.log("Repository validation passed for " + files.length + " files.");
