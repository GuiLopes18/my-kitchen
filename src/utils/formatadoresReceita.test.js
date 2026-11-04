import assert from "node:assert/strict";
import test from "node:test";
import { formatarIngrediente, formatarDificuldade } from "./formatadoresReceita.js";
import { CATEGORIAS, DIFICULDADES, normalizarDificuldade } from "../config/receitas.js";

test("ingredientes aceitam estrutura antiga e atual", () => {
  assert.equal(formatarIngrediente("sal a gosto"), "sal a gosto");
  assert.equal(formatarIngrediente({ quantidade: "2", unidade: "unidade(s)", nome: "ovos" }), "2 ovos");
  assert.equal(formatarIngrediente({ quantidade: "200", unidade: "g", nome: "farinha" }), "200 g de farinha");
  assert.equal(formatarIngrediente({ quantidade: "", unidade: "sem unidade", nome: "sal" }), "sal");
  assert.equal(formatarIngrediente(null), "");
});

test("valores de dificuldade antigos continuam legíveis", () => {
  assert.equal(normalizarDificuldade("Média"), "Médio");
  assert.equal(formatarDificuldade("Média"), "Médio");
  assert.equal(DIFICULDADES.length, 5);
  assert.equal(CATEGORIAS.length, 8);
});
