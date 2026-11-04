/** Ignora acentos e diferenças entre maiúsculas e minúsculas na busca. */
export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/**
 * Os filtros são combinados por E: a receita deve atender à busca,
 * à categoria e à situação de preparo ao mesmo tempo.
 */
export function filtrarReceitas(receitas, { busca = "", categoria = "Todas", preparo = "todas" } = {}) {
  const pesquisa = normalizarTexto(busca);

  return receitas.filter((receita) => {
    const nome = normalizarTexto(receita.nome);
    const tags = Array.isArray(receita.tags) ? receita.tags : [];
    const correspondeBusca = nome.includes(pesquisa) || tags.some((tag) =>
      normalizarTexto(tag).includes(pesquisa)
    );
    const correspondeCategoria = categoria === "Todas" || receita.categoria === categoria;
    const preparada = receita.ja_cozinhei === true;
    const correspondePreparo = preparo === "todas"
      || (preparo === "preparadas" && preparada)
      || (preparo === "nao-preparadas" && !preparada);

    return correspondeBusca && correspondeCategoria && correspondePreparo;
  });
}
