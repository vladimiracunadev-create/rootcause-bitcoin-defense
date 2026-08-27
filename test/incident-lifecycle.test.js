// Ciclo de vida de un incidente.
//
// `mergeIncidents` es la funcion que decide, en cada analisis, que hallazgo es
// nuevo, cual es el mismo de siempre, cual se da por resuelto y que pasa si un
// problema reaparece. Es tambien la que decide cuanto tiempo lleva abierto un
// incidente, que es lo que un respondedor mira primero.
//
// Una regresion aqui no rompe nada visible: simplemente los incidentes empiezan
// a resolverse solos, o a perder su historial, y nadie se entera hasta que hace
// falta. Por eso se prueba directamente y no solo a traves de la API.
import assert from "node:assert/strict";
import test from "node:test";
import { DefenseService, mergeIncidents } from "../src/services/defense-service.js";
import { MemoryStore } from "../src/infrastructure/encrypted-store.js";
import { loadConfig } from "../src/config.js";

const AYER = "2026-08-25T10:00:00.000Z";
const HOY = "2026-08-26T10:00:00.000Z";
const MANANA = "2026-08-27T10:00:00.000Z";

function hallazgo(id, overrides = {}) {
  return {
    id,
    code: "BTC-KEY-002",
    severity: "medium",
    title: "Firmware de creación desconocido",
    explanation: "explicación",
    rootCause: "causa",
    evidence: {},
    remediation: [],
    entityType: "wallet",
    entityId: "wallet-" + id,
    status: "open",
    detectedAt: HOY,
    ...overrides
  };
}

// ── Aparicion ────────────────────────────────────────────────────────────────

test("un hallazgo nuevo nace abierto y con las dos fechas iguales", () => {
  const [incidente] = mergeIncidents([], [hallazgo("aaa")], HOY);
  assert.equal(incidente.status, "open");
  assert.equal(incidente.createdAt, HOY);
  assert.equal(incidente.lastSeenAt, HOY);
});

// ── Persistencia del historial ───────────────────────────────────────────────

test("un hallazgo que sigue activo conserva createdAt y actualiza lastSeenAt", () => {
  const previo = mergeIncidents([], [hallazgo("aaa")], AYER);
  const [incidente] = mergeIncidents(previo, [hallazgo("aaa")], HOY);

  // Lo que importa saber de un incidente es desde cuando existe el problema,
  // no desde cuando se miro por ultima vez.
  assert.equal(incidente.createdAt, AYER, "createdAt debe sobrevivir al reanálisis");
  assert.equal(incidente.lastSeenAt, HOY);
  assert.equal(incidente.status, "open");
});

test("reconocer un incidente sobrevive a los reanálisis siguientes", () => {
  const abierto = mergeIncidents([], [hallazgo("aaa")], AYER);
  const reconocido = abierto.map((entrada) => ({
    ...entrada,
    status: "acknowledged",
    acknowledgedAt: AYER,
    acknowledgedBy: "operadora"
  }));

  const [incidente] = mergeIncidents(reconocido, [hallazgo("aaa")], HOY);

  assert.equal(incidente.status, "acknowledged", "reconocer no debe deshacerse solo");
  assert.equal(incidente.acknowledgedAt, AYER);
  assert.equal(incidente.acknowledgedBy, "operadora");
  assert.equal(incidente.lastSeenAt, HOY);
});

// ── Resolucion automatica ────────────────────────────────────────────────────

test("un hallazgo que deja de detectarse pasa a resuelto", () => {
  const abierto = mergeIncidents([], [hallazgo("aaa")], AYER);
  const [incidente] = mergeIncidents(abierto, [], HOY);

  assert.equal(incidente.status, "resolved");
  assert.equal(incidente.resolvedAt, HOY);
  assert.equal(incidente.createdAt, AYER, "el historial no se pierde al resolver");
});

test("un incidente reconocido que desaparece también se resuelve", () => {
  const reconocido = mergeIncidents([], [hallazgo("aaa")], AYER).map((entrada) => ({
    ...entrada,
    status: "acknowledged"
  }));
  const [incidente] = mergeIncidents(reconocido, [], HOY);

  assert.equal(incidente.status, "resolved");
  assert.equal(incidente.resolvedAt, HOY);
});

test("un incidente ya resuelto no se vuelve a resolver ni pierde su fecha", () => {
  const resuelto = mergeIncidents(mergeIncidents([], [hallazgo("aaa")], AYER), [], HOY);
  assert.equal(resuelto[0].resolvedAt, HOY);

  const [incidente] = mergeIncidents(resuelto, [], MANANA);

  // Sin la guarda de estado, cada analisis reescribiria resolvedAt y se
  // perderia cuando dejo de darse el problema de verdad.
  assert.equal(incidente.status, "resolved");
  assert.equal(incidente.resolvedAt, HOY, "resolvedAt debe conservar su valor original");
});

// ── Reaparicion ──────────────────────────────────────────────────────────────

test("un problema que reaparece vuelve a abrirse conservando su origen", () => {
  const resuelto = mergeIncidents(mergeIncidents([], [hallazgo("aaa")], AYER), [], HOY);
  const [incidente] = mergeIncidents(resuelto, [hallazgo("aaa")], MANANA);

  assert.equal(incidente.status, "open", "volver a detectarse debe reabrir el incidente");
  assert.equal(incidente.createdAt, AYER, "sigue siendo el mismo problema de siempre");
  assert.equal(incidente.lastSeenAt, MANANA);
});

test("un incidente reconocido que desaparece y vuelve NO conserva el reconocimiento", () => {
  const reconocido = mergeIncidents([], [hallazgo("aaa")], AYER).map((entrada) => ({
    ...entrada,
    status: "acknowledged"
  }));
  const resuelto = mergeIncidents(reconocido, [], HOY);
  const [incidente] = mergeIncidents(resuelto, [hallazgo("aaa")], MANANA);

  // Es lo correcto: se reconocio una situacion que se dio por cerrada. Que el
  // problema vuelva es informacion nueva y tiene que volver a mirarse.
  assert.equal(incidente.status, "open");
});

// ── Varios incidentes a la vez ───────────────────────────────────────────────

test("mantiene unos incidentes y resuelve otros en el mismo análisis", () => {
  const previo = mergeIncidents([], [hallazgo("aaa"), hallazgo("bbb")], AYER);
  const actual = mergeIncidents(previo, [hallazgo("aaa"), hallazgo("ccc")], HOY);

  const porId = new Map(actual.map((entrada) => [entrada.id, entrada]));
  assert.equal(porId.size, 3);
  assert.equal(porId.get("aaa").status, "open", "sigue activo");
  assert.equal(porId.get("aaa").createdAt, AYER);
  assert.equal(porId.get("bbb").status, "resolved", "desapareció");
  assert.equal(porId.get("ccc").status, "open", "es nuevo");
  assert.equal(porId.get("ccc").createdAt, HOY);
});

test("el resultado se ordena por lastSeenAt descendente", () => {
  const previo = mergeIncidents([], [hallazgo("aaa")], AYER);
  const actual = mergeIncidents(previo, [hallazgo("bbb")], HOY);

  // El panel muestra los veinte primeros: el orden decide que ve el operador.
  assert.deepEqual(
    actual.map((entrada) => entrada.id),
    ["bbb", "aaa"]
  );
});

test("no muta el array de incidentes que recibe", () => {
  const previo = mergeIncidents([], [hallazgo("aaa")], AYER);
  const copia = structuredClone(previo);
  mergeIncidents(previo, [], HOY);
  assert.deepEqual(previo, copia, "mergeIncidents no debe mutar su entrada");
});

// ── Identidad del hallazgo ───────────────────────────────────────────────────

test("dos hallazgos con el mismo id son el mismo incidente", () => {
  const previo = mergeIncidents([], [hallazgo("aaa", { severity: "medium" })], AYER);
  const [incidente] = mergeIncidents(
    previo,
    [hallazgo("aaa", { severity: "high", title: "Título actualizado" })],
    HOY
  );

  // El contenido se refresca con el hallazgo nuevo; el historial, no.
  assert.equal(incidente.severity, "high");
  assert.equal(incidente.title, "Título actualizado");
  assert.equal(incidente.createdAt, AYER);
});

// ── R-03: un estado incompleto no debe impedir el arranque ───────────────────

test("initialize repara las colecciones que falten en el estado", async () => {
  // Un estado escrito a mano, migrado de otra version o truncado. Antes de la
  // correccion, `evaluateState` lanzaba un TypeError sobre `state.wallets` y la
  // aplicacion no arrancaba.
  const incompleto = { schemaVersion: 1, createdAt: AYER, updatedAt: AYER, node: null };
  const store = new MemoryStore(incompleto);
  const service = new DefenseService({
    store,
    config: loadConfig({}),
    advisories: [],
    policies: {},
    bitcoinClient: null
  });

  await service.initialize();
  const state = await store.load();

  for (const coleccion of [
    "wallets",
    "incidents",
    "approvals",
    "observedTransactions",
    "privacyEvents",
    "audit"
  ]) {
    assert.ok(
      Array.isArray(state[coleccion]),
      coleccion + " debía quedar reparada como array"
    );
  }
  assert.equal(state.audit[0].action, "application_initialized");
});

test("initialize no destruye las colecciones que sí venían en el estado", async () => {
  const conDatos = {
    schemaVersion: 1,
    wallets: [],
    incidents: [],
    approvals: [{ id: "una", hash: "a".repeat(64), label: "previa" }],
    observedTransactions: [],
    privacyEvents: [],
    audit: [],
    node: null
  };
  const store = new MemoryStore(conDatos);
  const service = new DefenseService({
    store,
    config: loadConfig({}),
    advisories: [],
    policies: {},
    bitcoinClient: null
  });

  await service.initialize();
  const state = await store.load();

  assert.equal(state.approvals.length, 1);
  assert.equal(state.approvals[0].label, "previa");
});
