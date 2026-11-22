import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alternarDia,
  crearHabito,
  fechaISO,
  mejorRacha,
  porcentaje,
  rachaActual,
  sumarDias,
  ultimosDias,
  validarImportacion,
} from "../src/habitos.js";

const HOY = "2026-03-02";
const conDias = (dias, creado = "2026-01-01") => ({ id: "x", nombre: "Leer", color: "#000", creado, dias });

test("fechaISO usa la fecha local", () => {
  assert.equal(fechaISO(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("sumarDias cruza meses y años bisiestos", () => {
  assert.equal(sumarDias("2026-02-28", 1), "2026-03-01");
  assert.equal(sumarDias("2028-02-28", 1), "2028-02-29");
  assert.equal(sumarDias("2026-01-01", -1), "2025-12-31");
});

test("ultimosDias devuelve n días terminando hoy", () => {
  assert.deepEqual(ultimosDias(HOY, 3), ["2026-02-28", "2026-03-01", "2026-03-02"]);
});

test("crearHabito valida el nombre", () => {
  const h = crearHabito("  Correr  ", "#f00", HOY);
  assert.equal(h.nombre, "Correr");
  assert.equal(h.creado, HOY);
  assert.throws(() => crearHabito("   ", "#f00"));
  assert.throws(() => crearHabito("x".repeat(41), "#f00"));
});

test("alternarDia marca y desmarca sin modificar el original", () => {
  const h = conDias([]);
  const marcado = alternarDia(h, HOY);
  assert.deepEqual(marcado.dias, [HOY]);
  assert.deepEqual(h.dias, []);
  assert.deepEqual(alternarDia(marcado, HOY).dias, []);
});

test("marcar un día anterior a la creación adelanta la fecha de inicio", () => {
  const h = alternarDia(conDias([], HOY), "2026-02-27");
  assert.equal(h.creado, "2026-02-27");
  assert.equal(alternarDia(h, HOY).creado, "2026-02-27");
});

test("rachaActual cuenta hasta hoy o desde ayer", () => {
  assert.equal(rachaActual(conDias(["2026-02-28", "2026-03-01", HOY]), HOY), 3);
  assert.equal(rachaActual(conDias(["2026-02-28", "2026-03-01"]), HOY), 2);
  assert.equal(rachaActual(conDias(["2026-02-27"]), HOY), 0);
});

test("mejorRacha encuentra el tramo más largo", () => {
  const dias = ["2026-01-01", "2026-01-02", "2026-01-10", "2026-01-11", "2026-01-12", "2026-01-20"];
  assert.equal(mejorRacha(conDias(dias)), 3);
  assert.equal(mejorRacha(conDias([])), 0);
});

test("porcentaje ignora los días antes de crear el hábito", () => {
  const h = conDias(["2026-03-01", HOY], "2026-02-27");
  assert.equal(porcentaje(h, HOY, 30), 50); // 2 de 4 días
  assert.equal(porcentaje(conDias([], "2026-04-01"), HOY), 0);
});

test("validarImportacion acepta datos válidos y limpia duplicados", () => {
  const [h] = validarImportacion([{ ...conDias([HOY, HOY, "2026-03-01"]), extra: 1 }]);
  assert.deepEqual(h.dias, ["2026-03-01", HOY]);
  assert.equal("extra" in h, false);
});

test("validarImportacion rechaza datos inválidos", () => {
  assert.throws(() => validarImportacion({}));
  assert.throws(() => validarImportacion([{ nombre: "x" }]));
  assert.throws(() => validarImportacion([conDias(["2026/03/01"])]));
});
