import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { PROJECT_ROOT } from "../src/config.js";

// El catálogo documenta las reglas y el motor las ejecuta. Si divergen, la
// documentación miente sobre el producto —que es justo lo que este repositorio
// pasa el día intentando que no ocurra—.
const catalog = JSON.parse(
  await fs.readFile(path.join(PROJECT_ROOT, "config", "rules-catalog.json"), "utf8")
);

async function codigosDelMotor() {
  const codigos = new Set();
  for (const archivo of ["rule-engine.js", "posture.js"]) {
    const fuente = await fs.readFile(
      path.join(PROJECT_ROOT, "src", "domain", archivo),
      "utf8"
    );
    for (const match of fuente.matchAll(/code:\s*"(BTC-[A-Z]+-\d+)"/g)) {
      codigos.add(match[1]);
    }
  }
  return codigos;
}

test("toda regla del motor tiene ficha en el catálogo", async () => {
  const motor = await codigosDelMotor();
  const catalogados = new Set(catalog.rules.map((rule) => rule.code));
  const sinFicha = [...motor].filter((codigo) => !catalogados.has(codigo)).sort();
  assert.deepEqual(
    sinFicha,
    [],
    "reglas que el motor emite y nadie documentó: " + sinFicha.join(", ")
  );
});

test("toda ficha del catálogo corresponde a una regla real", async () => {
  const motor = await codigosDelMotor();
  const fantasmas = catalog.rules
    .map((rule) => rule.code)
    .filter((codigo) => !motor.has(codigo))
    .sort();
  assert.deepEqual(
    fantasmas,
    [],
    "fichas de reglas que el motor no emite: " + fantasmas.join(", ")
  );
});

test("cada ficha declara lo que hace falta para poder defenderla", () => {
  const obligatorios = [
    "title",
    "severity",
    "entity",
    "trigger",
    "threshold",
    "meaning",
    "rootCause",
    "verify",
    "source"
  ];
  for (const rule of catalog.rules) {
    for (const campo of obligatorios) {
      assert.ok(
        typeof rule[campo] === "string" && rule[campo].trim().length > 0,
        rule.code + " sin " + campo
      );
    }
    assert.ok(rule.evidence?.length, rule.code + " sin evidencia declarada");
    assert.ok(rule.remediation?.length, rule.code + " sin remediación");
    // La sección más importante: una regla que no dice qué NO significa acaba
    // interpretándose como algo que no es.
    assert.ok(rule.notMeaning?.length, rule.code + " sin la sección «qué NO significa»");
  }
});

test("las severidades usan el vocabulario del proyecto", () => {
  const validas = new Set(["critical", "high", "medium", "low", "info"]);
  for (const rule of catalog.rules) {
    for (const parte of rule.severity.split("|")) {
      assert.ok(validas.has(parte.trim()), rule.code + " con severidad inválida: " + parte);
    }
  }
});

test("cada familia del catálogo tiene al menos una regla", () => {
  for (const familia of Object.keys(catalog.families)) {
    const reglas = catalog.rules.filter((rule) => rule.code.startsWith(familia + "-"));
    assert.ok(reglas.length > 0, "familia declarada y vacía: " + familia);
  }
});

test("las reglas relacionadas existen", () => {
  const codigos = new Set(catalog.rules.map((rule) => rule.code));
  for (const rule of catalog.rules) {
    for (const relacionada of rule.related || []) {
      assert.ok(
        codigos.has(relacionada),
        rule.code + " enlaza a una regla inexistente: " + relacionada
      );
    }
  }
});
