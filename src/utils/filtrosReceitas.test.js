import assert from "node:assert/strict";
import test from "node:test";
import { filtrarReceitas, normalizarTexto } from "./filtrosReceitas.js";

const receitas = [
  { nome: "Pão integral", categoria: "Pães e massas", tags: ["Caseira"], ja_cozinhei: true },
  { nome: "Macarrão", categoria: "Pratos principais", tags: ["Rápido"], ja_cozinhei: false },
  { nome: "Pão de queijo", categoria: "Pães e massas", tags: [], ja_cozinhei: false },
];

test("a pesquisa ignora acentos e maiúsculas", () => {
  assert.equal(normalizarTexto(" PÃO "), "pao");
  assert.equal(filtrarReceitas(receitas, { busca: "paO" }).length, 2);
});

test("filtros combinam categoria e status", () => {
  const encontrados = filtrarReceitas(receitas, {
    categoria: "Pães e massas", preparo: "preparadas",
  });
  assert.deepEqual(encontrados.map((r) => r.nome), ["Pão integral"]);
  assert.equal(filtrarReceitas(receitas, {
    categoria: "Pratos principais", preparo: "preparadas",
  }).length, 0);
});

test("também busca pelas tags", () => {
  const encontrados = filtrarReceitas(receitas, { busca: "rapido", preparo: "nao-preparadas" });
  assert.deepEqual(encontrados.map((r) => r.nome), ["Macarrão"]);
});
