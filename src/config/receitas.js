/**
 * Opções compartilhadas entre cadastro e filtros.
 * Manter aqui evita que uma categoria exista em uma tela, mas falte na outra.
 */
export const CATEGORIAS = [
  "Pratos principais",
  "Entradas e aperitivos",
  "Sobremesas",
  "Pães e massas",
  "Acompanhamentos",
  "Molhos",
  "Bebidas não alcoólicas",
  "Drinks alcoólicos",
];

export const DIFICULDADES = [
  "Muito fácil",
  "Fácil",
  "Médio",
  "Difícil",
  "Muito difícil",
];

export const TAGS_DISPONIVEIS = [
  "Vegano", "Vegetariano", "Sem glúten", "Sem lactose",
  "Rápido", "Econômico", "Air fryer", "Picante", "Caseira",
];

export const UNIDADES = [
  "unidade(s)", "g", "kg", "ml", "L", "xícara(s)",
  "colher(es) de sopa", "colher(es) de chá", "sem unidade",
];

// Receitas antigas podem trazer "Média". No formulário usamos "Médio".
export function normalizarDificuldade(valor) {
  return valor === "Média" ? "Médio" : valor || "Fácil";
}
