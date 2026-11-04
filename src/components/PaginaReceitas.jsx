
import { useMemo, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CakeSlice,
  ChefHat,
  CheckCircle2,
  Circle,
  Clock3,
  CookingPot,
  FolderOpen,
  GlassWater,
  LayoutGrid,
  Lightbulb,
  Martini,
  Plus,
  Salad,
  Search,
  Soup,
  Tags,
  UtensilsCrossed,
  Users,
  Wheat,
  X,
} from "lucide-react";

import { formatarTempo } from "../utils/tempo";
import { filtrarReceitas } from "../utils/filtrosReceitas";
import { CATEGORIAS } from "../config/receitas";

import estadoVazioLivro from "../assets/estado-vazio-livro.webp";

import "./PaginaReceitas.css";

// CATEGORIAS DISPONÍVEIS

// Mantém as mesmas categorias do formulário
// de criação e edição de receitas.
// ÍCONES DAS CATEGORIAS

const ICONES_CATEGORIAS = {
  Todas: LayoutGrid,
  "Pratos principais": UtensilsCrossed,
  "Entradas e aperitivos": Salad,
  Sobremesas: CakeSlice,
  "Pães e massas": Wheat,
  Acompanhamentos: CookingPot,
  Molhos: Soup,
  "Bebidas não alcoólicas": GlassWater,
  "Drinks alcoólicos": Martini,
};

// OPÇÕES DE RECEITAS PREPARADAS

const OPCOES_PREPARO = [
  {
    valor: "todas",
    nome: "Todas",
    Icone: LayoutGrid,
  },
  {
    valor: "preparadas",
    nome: "Já preparei",
    Icone: CheckCircle2,
  },
  {
    valor: "nao-preparadas",
    nome: "Ainda não preparei",
    Icone: Circle,
  },
];

// FILTRO DE CATEGORIA

function FiltroCategoria({
  nome,
  selecionado,
  onClick,
}) {
  const Icone = ICONES_CATEGORIAS[nome] || Tags;

  return (
    <button
      type="button"
      className={
        selecionado
          ? "colecao-v2-categoria ativa"
          : "colecao-v2-categoria"
      }
      aria-pressed={selecionado}
      onClick={onClick}
    >
      <Icone
        size={17}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>{nome}</span>
    </button>
  );
}

// FILTRO DE RECEITAS PREPARADAS

function FiltroPreparo({
  opcao,
  selecionado,
  onClick,
}) {
  const Icone = opcao.Icone;

  return (
    <button
      type="button"
      className={
        selecionado
          ? "colecao-v2-preparo-opcao ativa"
          : "colecao-v2-preparo-opcao"
      }
      aria-pressed={selecionado}
      onClick={onClick}
    >
      <Icone
        size={17}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>{opcao.nome}</span>
    </button>
  );
}

// CARD DA RECEITA

function CardReceita({
  receita,
  onAbrir,
}) {
  const tags = Array.isArray(receita.tags)
    ? receita.tags
    : [];

  const preparada = Boolean(receita.ja_cozinhei);

  return (
    <article className="colecao-v2-card">
      {/* FOTOGRAFIA */}
      <button
        type="button"
        className="colecao-v2-card-imagem"
        onClick={() => onAbrir(receita)}
        aria-label={`Ver receita ${receita.nome}`}
      >
        {receita.imagem ? (
          <img
            src={receita.imagem}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="colecao-v2-card-sem-foto">
            <span className="colecao-v2-card-circulo" />

            <ChefHat
              size={54}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </span>
        )}

        {preparada && (
          <span className="colecao-v2-card-selo">
            <CheckCircle2 size={15} />
            Já preparei
          </span>
        )}
      </button>

      {/* INFORMAÇÕES */}
      <div className="colecao-v2-card-conteudo">
        <span className="colecao-v2-card-categoria">
          {receita.categoria || "Sem categoria"}
        </span>

        <h3 title={receita.nome}>
          {receita.nome}
        </h3>

        <div className="colecao-v2-card-dados">
          <span>
            <Clock3 size={15} />
            {formatarTempo(receita.tempo)}
          </span>

          {receita.dificuldade && (
            <>
              <span
                className="colecao-v2-card-ponto"
                aria-hidden="true"
              >
                •
              </span>

              <span>{receita.dificuldade}</span>
            </>
          )}

          {receita.porcoes != null && (
            <>
              <span
                className="colecao-v2-card-ponto"
                aria-hidden="true"
              >
                •
              </span>

              <span>
                <Users size={15} />

                {receita.porcoes}{" "}
                {Number(receita.porcoes) === 1
                  ? "porção"
                  : "porções"}
              </span>
            </>
          )}
        </div>

        {/* TAGS */}
        {tags.length > 0 && (
          <div className="colecao-v2-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag}>
                {tag}
              </span>
            ))}

            {tags.length > 3 && (
              <span>
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* ABRIR RECEITA */}
        <button
          type="button"
          className="colecao-v2-card-botao"
          onClick={() => onAbrir(receita)}
        >
          Ver receita
          <ArrowRight size={17} />
        </button>
      </div>
    </article>
  );
}

// PAINEL LATERAL DA COLEÇÃO

function PainelColecao({
  total,
  preparadas,
  quantidadeCategorias,
  categoriaPrincipal,
}) {
  const percentual =
    total > 0
      ? Math.round((preparadas / total) * 100)
      : 0;

  return (
    <aside
      className="colecao-v2-lateral"
      aria-label="Resumo da coleção"
    >
      {/* RESUMO */}
      <section className="colecao-v2-resumo">
        <div className="colecao-v2-resumo-titulo">
          <span className="colecao-v2-resumo-icone">
            <BookOpen size={22} />
          </span>

          <div>
            <h2>Seu livro em números</h2>

            <p>
              Um resumo da sua cozinha.
            </p>
          </div>
        </div>

        <div className="colecao-v2-resumo-lista">
          <div className="colecao-v2-resumo-item">
            <span className="colecao-v2-resumo-item-icone laranja">
              <BookOpen size={19} />
            </span>

            <span>
              Receitas cadastradas
            </span>

            <strong>{total}</strong>
          </div>

          <div className="colecao-v2-resumo-item">
            <span className="colecao-v2-resumo-item-icone verde">
              <CheckCircle2 size={19} />
            </span>

            <span>
              Já preparadas
            </span>

            <strong>{preparadas}</strong>
          </div>

          <div className="colecao-v2-resumo-item">
            <span className="colecao-v2-resumo-item-icone bege">
              <FolderOpen size={19} />
            </span>

            <span>
              Categorias utilizadas
            </span>

            <strong>{quantidadeCategorias}</strong>
          </div>
        </div>

        {/* PROGRESSO DAS RECEITAS PREPARADAS */}
        <div className="colecao-v2-progresso">
          <div className="colecao-v2-progresso-texto">
            <span>Receitas já preparadas</span>

            <strong>{percentual}%</strong>
          </div>

          <div
            className="colecao-v2-progresso-barra"
            role="progressbar"
            aria-label="Percentual de receitas já preparadas"
            aria-valuenow={percentual}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              style={{
                width: `${percentual}%`,
              }}
            />
          </div>

          <small>
            {preparadas} de {total}{" "}
            {total === 1
              ? "receita preparada"
              : "receitas preparadas"}
          </small>
        </div>

        {categoriaPrincipal && (
          <div className="colecao-v2-categoria-favorita">
            <span>Categoria mais cadastrada</span>

            <strong>
              {categoriaPrincipal}
            </strong>
          </div>
        )}
      </section>

      {/* DICA */}
      <section className="colecao-v2-dica">
        <span className="colecao-v2-dica-icone">
          <Lightbulb size={23} />
        </span>

        <h2>Uma dica para sua cozinha</h2>

        <p>
          Use a opção <strong>Já preparei</strong>{" "}
          para acompanhar os pratos que
          você já preparou.
        </p>
      </section>
    </aside>
  );
}

// PÁGINA MINHAS RECEITAS

function PaginaReceitas({
  receitas = [],
  carregando = false,
  onNovaReceita,
  onAbrirReceita,
}) {
  // ESTADOS DOS FILTROS

  const [busca, setBusca] = useState("");

  const [categoria, setCategoria] =
    useState("Todas");

  const [filtroPreparo, setFiltroPreparo] =
    useState("todas");

  // TODAS AS CATEGORIAS

  const categorias = useMemo(() => {
    // Também mantém compatibilidade com
    // categorias antigas, caso existam.
    const categoriasExtras = [
      ...new Set(
        receitas
          .map((receita) => receita.categoria)
          .filter(
            (item) =>
              item &&
              !CATEGORIAS.includes(item)
          )
      ),
    ].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    return [
      "Todas",
      ...CATEGORIAS,
      ...categoriasExtras,
    ];
  }, [receitas]);

  const categoriaAtiva =
    categorias.includes(categoria)
      ? categoria
      : "Todas";

  // COMBINAR TODOS OS FILTROS

  const receitasFiltradas = useMemo(() => filtrarReceitas(receitas, {
    busca,
    categoria: categoriaAtiva,
    preparo: filtroPreparo,
  }), [receitas, busca, categoriaAtiva, filtroPreparo]);

  // ESTATÍSTICAS DA COLEÇÃO

  const estatisticas = useMemo(() => {
    const total = receitas.length;

    const preparadas = receitas.filter(
      (receita) =>
        receita.ja_cozinhei === true
    ).length;

    const contagemCategorias = new Map();

    receitas.forEach((receita) => {
      if (!receita.categoria) return;

      contagemCategorias.set(
        receita.categoria,
        (
          contagemCategorias.get(
            receita.categoria
          ) || 0
        ) + 1
      );
    });

    const categoriaPrincipal = [
      ...contagemCategorias.entries(),
    ]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          a[0].localeCompare(b[0], "pt-BR")
      )[0]?.[0] || "";

    return {
      total,
      preparadas,
      quantidadeCategorias:
        contagemCategorias.size,
      categoriaPrincipal,
    };
  }, [receitas]);

  const {
    total,
    preparadas,
    quantidadeCategorias,
    categoriaPrincipal,
  } = estatisticas;

  // VERIFICAR FILTROS ATIVOS

  const filtrosAtivos =
    busca.trim() !== "" ||
    categoriaAtiva !== "Todas" ||
    filtroPreparo !== "todas";

  // LIMPAR TODOS OS FILTROS

  function limparFiltros() {
    setBusca("");
    setCategoria("Todas");
    setFiltroPreparo("todas");
  }

  // MENSAGEM PARA RESULTADOS VAZIOS

  const categoriaSemReceitas =
    categoriaAtiva !== "Todas" &&
    !receitas.some(
      (receita) =>
        receita.categoria === categoriaAtiva
    );

  function obterMensagemVazia() {
    if (total === 0) {
      return {
        titulo: "Seu livro começa aqui!",
        descricao:
          "Cadastre sua primeira receita e comece a organizar seus pratos favoritos.",
      };
    }

    if (categoriaSemReceitas) {
      return {
        titulo: "Nenhuma receita nesta categoria",
        descricao:
          "Você ainda não possui receitas nesta categoria. Escolha outra categoria ou limpe os filtros.",
      };
    }

    if (filtroPreparo === "preparadas") {
      return {
        titulo: "Nenhuma receita preparada encontrada",
        descricao:
          "Não encontramos receitas já preparadas que correspondam aos filtros selecionados.",
      };
    }

    if (filtroPreparo === "nao-preparadas") {
      return {
        titulo: "Nenhuma receita pendente encontrada",
        descricao:
          "Não encontramos receitas ainda não preparadas que correspondam aos filtros selecionados.",
      };
    }

    return {
      titulo: "Nenhuma receita encontrada",
      descricao:
        "Tente pesquisar outro nome ou selecionar filtros diferentes.",
    };
  }

  const mensagemVazia = obterMensagemVazia();

  // INTERFACE

  return (
    <section className="colecao-v2">
      <div className="colecao-v2-container">
        {/* ==================================
            1. CABEÇALHO
        ================================== */}

        <div className="colecao-v2-cabecalho">
          <div className="colecao-v2-cabecalho-conteudo">
            <span className="colecao-v2-etiqueta">
              SUA COLEÇÃO
            </span>

            <h1>Minhas receitas</h1>

            <p>
              Todos os seus pratos favoritos,
              organizados em um só lugar.
            </p>
          </div>

          <button
            type="button"
            className="colecao-v2-botao-principal"
            onClick={onNovaReceita}
          >
            <Plus size={18} />
            Nova receita
          </button>

          <ChefHat
            className="colecao-v2-cabecalho-decoracao"
            size={165}
            strokeWidth={1}
            aria-hidden="true"
          />
        </div>

        {/* ==================================
            2. PAINEL DE FILTROS
        ================================== */}

        <section
          className="colecao-v2-filtros"
          aria-label="Pesquisa e filtros de receitas"
        >
          {/* TÍTULO E LIMPAR FILTROS */}
          <div className="colecao-v2-filtros-cabecalho">
            <label htmlFor="colecao-buscar-receita">
              Pesquisar receitas
            </label>

            {filtrosAtivos && (
              <button
                type="button"
                className="colecao-v2-limpar"
                onClick={limparFiltros}
              >
                <X size={16} />
                Limpar filtros
              </button>
            )}
          </div>

          {/* PESQUISA */}
          <div className="colecao-v2-filtros-topo">
            <div className="colecao-v2-busca">
              <div className="colecao-v2-busca-campo">
                <Search
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="colecao-buscar-receita"
                  type="search"
                  placeholder="Pesquise pelo nome ou por uma tag..."
                  value={busca}
                  onChange={(evento) =>
                    setBusca(evento.target.value)
                  }
                />

                {busca !== "" && (
                  <button
                    type="button"
                    aria-label="Limpar pesquisa"
                    onClick={() => setBusca("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <span
              className="colecao-v2-total"
              role="status"
              aria-live="polite"
            >
              {carregando
                ? "Carregando..."
                : `${receitasFiltradas.length} ${
                    receitasFiltradas.length === 1
                      ? "receita encontrada"
                      : "receitas encontradas"
                  }`}
            </span>
          </div>

          <div className="colecao-v2-filtros-divisor" />

          {/* ==================================
              CATEGORIAS
          ================================== */}

          <div className="colecao-v2-filtros-grupo">
            <span className="colecao-v2-filtros-rotulo">
              Categorias
            </span>

            <div
              className="colecao-v2-categorias"
              role="group"
              aria-label="Filtrar receitas por categoria"
            >
              {categorias.map((item) => (
                <FiltroCategoria
                  key={item}
                  nome={item}
                  selecionado={
                    categoriaAtiva === item
                  }
                  onClick={() =>
                    setCategoria(item)
                  }
                />
              ))}
            </div>
          </div>

          <div className="colecao-v2-filtros-divisor secundario" />

          {/* ==================================
              RECEITAS PREPARADAS
          ================================== */}

          <div className="colecao-v2-filtros-grupo">
            <span className="colecao-v2-filtros-rotulo">
              Receitas preparadas
            </span>

            <div
              className="colecao-v2-preparo-opcoes"
              role="group"
              aria-label="Filtrar pelo status de preparo"
            >
              {OPCOES_PREPARO.map((opcao) => (
                <FiltroPreparo
                  key={opcao.valor}
                  opcao={opcao}
                  selecionado={
                    filtroPreparo === opcao.valor
                  }
                  onClick={() =>
                    setFiltroPreparo(opcao.valor)
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==================================
            3. COLEÇÃO E PAINEL LATERAL
        ================================== */}

        <div className="colecao-v2-distribuicao">
          <div className="colecao-v2-principal">
            {/* TÍTULO DA COLEÇÃO */}
            <div className="colecao-v2-lista-cabecalho">
              <div>
                <span className="colecao-v2-etiqueta">
                  SEU LIVRO DIGITAL
                </span>

                <h2>Sua coleção</h2>
              </div>
            </div>

            {/* CARREGAMENTO */}
            {carregando ? (
              <div
                className="colecao-v2-estado"
                role="status"
              >
                <ChefHat size={42} />

                <h3>
                  Carregando suas receitas...
                </h3>

                <p>
                  Organizando seu livro digital.
                </p>
              </div>
            ) : receitasFiltradas.length > 0 ? (
              /* LISTA DE RECEITAS */
              <div className="colecao-v2-grade">
                {receitasFiltradas.map((receita) => (
                  <CardReceita
                    key={receita.id}
                    receita={receita}
                    onAbrir={onAbrirReceita}
                  />
                ))}
              </div>
            ) : (
              /* NENHUMA RECEITA ENCONTRADA */
              <div className="colecao-v2-estado">
                {total === 0 ? (
                  <img
                    src={estadoVazioLivro}
                    alt="Ilustração de livro de receitas"
                  />
                ) : (
                  <Search size={44} />
                )}

                <h3>{mensagemVazia.titulo}</h3>

                <p>{mensagemVazia.descricao}</p>

                <button
                  type="button"
                  onClick={
                    total === 0
                      ? onNovaReceita
                      : limparFiltros
                  }
                >
                  {total === 0 ? (
                    <>
                      <Plus size={17} />
                      Cadastrar receita
                    </>
                  ) : (
                    <>
                      <X size={17} />
                      Limpar filtros
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ==================================
              PAINEL LATERAL
          ================================== */}

          <PainelColecao
            total={total}
            preparadas={preparadas}
            quantidadeCategorias={
              quantidadeCategorias
            }
            categoriaPrincipal={
              categoriaPrincipal
            }
          />
        </div>
      </div>
    </section>
  );
}

export default PaginaReceitas;
