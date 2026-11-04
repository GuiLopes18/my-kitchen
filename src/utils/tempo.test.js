import assert from "node:assert/strict";
import test from "node:test";
import { calcularTempo, formatarTempo, separarTempo } from "./tempo.js";

test("calcula horas e minutos validamente", () => {
  assert.equal(calcularTempo("1", "30"), 90);
  assert.equal(calcularTempo("0", "1"), 1);
  assert.equal(calcularTempo("24", "0"), 1440);
});

test("rejeita tempo inválido", () => {
  assert.equal(calcularTempo("0", "0"), null);
  assert.equal(calcularTempo("24", "30"), null);
  assert.equal(calcularTempo("1", "60"), null);
  assert.equal(calcularTempo("abc", "10"), null);
});

test("converte minutos para exibição e edição", () => {
  assert.deepEqual(separarTempo(90), { horas: "1", minutos: "30" });
  assert.equal(formatarTempo(90), "1 h 30 min");
  assert.equal(formatarTempo(60), "1 h");
  assert.equal(formatarTempo(25), "25 min");
});
