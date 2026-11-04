/**
 * Converte a estrutura salva no Supabase em texto para exibição.
 * A mesma regra vale para detalhes privados e receitas compartilhadas.
 */
export function formatarIngrediente(ingrediente) {
  if (typeof ingrediente === "string") return ingrediente;
  if (!ingrediente || typeof ingrediente !== "object") return "";

  const quantidade = String(ingrediente.quantidade ?? "").trim();
  const unidade = String(ingrediente.unidade ?? "").trim();
  const nome = String(ingrediente.nome ?? "").trim();

  if (!unidade || unidade === "sem unidade" || unidade === "unidade(s)") {
    return [quantidade, nome].filter(Boolean).join(" ");
  }

  // Ex.: "200 g de farinha" ou "2 xícara(s) de leite".
  return [quantidade, unidade, nome ? `de ${nome}` : ""]
    .filter(Boolean)
    .join(" ");
}

export function formatarDificuldade(valor) {
  return valor === "Média" ? "Médio" : valor || "Não informada";
}
