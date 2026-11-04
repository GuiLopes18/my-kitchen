
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChefHat,
  CheckCircle2,
  Clock3,
  CookingPot,
  Medal,
  Plus,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { formatarTempo } from "../utils/tempo";

import heroCozinha from "../assets/hero-cozinha.webp";
import estadoVazioLivro from "../assets/estado-vazio-livro.webp";

import "./PaginaInicial.css";

// CONFIGURAÇÕES

const LIMITE_RECENTES = 5;
const TEMPO_RECEITA_RAPIDA = 30;

// CARTÃO DE RECEITA RECENTE

function CardReceitaRecente({ receita, onAbrir }) {
  const preparada = Boolean(receita.ja_cozinhei);

  return (
    <article className="inicio-v2-receita-card">
      {/* IMAGEM */}
      <div className="inicio-v2-receita-imagem">
        {receita.imagem ? (
          <img
            src={receita.imagem}
            alt={receita.nome}
            loading="lazy"
          />
        ) : (
          <div className="inicio-v2-receita-sem-foto">
            <span className="inicio-v2-receita-circulo" />

            <ChefHat
              size={54}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        )}

        {/* SELO DE RECEITA PREPARADA */}
        {preparada && (
          <span className="inicio-v2-receita-preparada">
            <CheckCircle2 size={15} />
            Já preparei
          </span>
        )}
      </div>

      {/* INFORMAÇÕES */}
      <div className="inicio-v2-receita-conteudo">
        <span className="inicio-v2-receita-categoria">
          {receita.categoria || "Sem categoria"}
        </span>

        <h3 title={receita.nome}>
          {receita.nome}
        </h3>

        <div className="inicio-v2-receita-info">
          <span>
            <Clock3 size={15} />
            {formatarTempo(receita.tempo)}
          </span>

          {receita.porcoes != null && (
            <span>
              <Users size={15} />

              {receita.porcoes}{" "}
              {Number(receita.porcoes) === 1
                ? "porção"
                : "porções"}
            </span>
          )}
        </div>

        <button
          type="button"
          className="inicio-v2-receita-abrir"
          onClick={() => onAbrir(receita)}
        >
          Ver receita
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

// CARD DOS INDICADORES

function CardIndicador({
  tipo,
  icone: Icone,
  titulo,
  valor,
  descricao,
}) {
  return (
    <article className={`inicio-v2-indicador ${tipo}`}>
      <span className="inicio-v2-indicador-icone">
        <Icone
          size={24}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </span>

      <div className="inicio-v2-indicador-conteudo">
        <span className="inicio-v2-indicador-titulo">
          {titulo}
        </span>

        <strong className="inicio-v2-indicador-valor">
          {valor}
        </strong>

        <small className="inicio-v2-indicador-descricao">
          {descricao}
        </small>
      </div>
    </article>
  );
}

// ITEM DO PÓDIO

function ItemPodio({ categoria, posicao }) {
  if (!categoria) return null;

  const classe =
    posicao === 1
      ? "primeiro"
      : posicao === 2
        ? "segundo"
        : "terceiro";

  return (
    <div className={`inicio-v2-podio-item ${classe}`}>
      <span className="inicio-v2-podio-simbolo">
        {posicao === 1 ? (
          <Trophy size={23} />
        ) : (
          <Medal size={21} />
        )}
      </span>

      <strong className="inicio-v2-podio-categoria">
        {categoria.nome}
      </strong>

      <div className="inicio-v2-podio-base">
        <span className="inicio-v2-podio-posicao">
          {posicao}º
        </span>

        <strong>
          {categoria.total}
        </strong>

        <small>
          {categoria.total === 1
            ? "receita"
            : "receitas"}
        </small>
      </div>
    </div>
  );
}

// PÁGINA INICIAL

function PaginaInicial({
  receitas = [],
  carregando = false,
  onExplorar,
  onNovaReceita,
  onAbrirReceita,
}) {
  const carrosselRef = useRef(null);

  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  // DADOS DA VISÃO GERAL

  const estatisticas = useMemo(() => {
    const total = receitas.length;

    // Receitas com preparo de até 30 minutos.
    const rapidas = receitas.filter((receita) => {
      const tempo = Number(receita.tempo);

      return (
        Number.isFinite(tempo) &&
        tempo > 0 &&
        tempo <= TEMPO_RECEITA_RAPIDA
      );
    }).length;

    // Receitas já preparadas.
    const preparadas = receitas.filter(
      (receita) => receita.ja_cozinhei === true
    ).length;

    // Contagem das categorias.
    const contagem = new Map();

    receitas.forEach((receita) => {
      const nome =
        receita.categoria?.trim() || "Sem categoria";

      contagem.set(
        nome,
        (contagem.get(nome) || 0) + 1
      );
    });

    const categorias = [...contagem.entries()]
      .map(([nome, quantidade]) => ({
        nome,
        total: quantidade,
      }))
      .sort(
        (a, b) =>
          b.total - a.total ||
          a.nome.localeCompare(b.nome, "pt-BR")
      )
      .slice(0, 3);

    // Receitas mais recentes.
    const recentes = [...receitas]
      .sort((a, b) => {
        const dataA = Date.parse(a.created_at || "") || 0;
        const dataB = Date.parse(b.created_at || "") || 0;

        return dataB - dataA;
      })
      .slice(0, LIMITE_RECENTES);

    return {
      total,
      rapidas,
      preparadas,
      categorias,
      recentes,
    };
  }, [receitas]);

  const {
    total,
    rapidas,
    preparadas,
    categorias,
    recentes,
  } = estatisticas;

  // SORTEAR UMA RECEITA

  function sortearReceita() {
    if (receitas.length === 0) return;

    const indice = Math.floor(
      Math.random() * receitas.length
    );

    onAbrirReceita(receitas[indice]);
  }

  // CONTROLES DO CARROSSEL

  function atualizarCarrossel() {
    const elemento = carrosselRef.current;

    if (!elemento) {
      setPodeVoltar(false);
      setPodeAvancar(false);
      return;
    }

    const margem = 5;

    setPodeVoltar(elemento.scrollLeft > margem);

    setPodeAvancar(
      elemento.scrollLeft + elemento.clientWidth <
        elemento.scrollWidth - margem
    );
  }

  useEffect(() => {
    const quadro = requestAnimationFrame(
      atualizarCarrossel
    );

    window.addEventListener(
      "resize",
      atualizarCarrossel
    );

    return () => {
      cancelAnimationFrame(quadro);

      window.removeEventListener(
        "resize",
        atualizarCarrossel
      );
    };
  }, [recentes.length, carregando]);

  function moverCarrossel(direcao) {
    const elemento = carrosselRef.current;

    if (!elemento) return;

    const card = elemento.querySelector(
      ".inicio-v2-receita-card"
    );

    if (!card) return;

    const largura = card.getBoundingClientRect().width;

    const estilos = window.getComputedStyle(elemento);

    const espacamento =
      parseFloat(estilos.columnGap) || 18;

    elemento.scrollBy({
      left: direcao * (largura + espacamento),
      behavior: "smooth",
    });
  }

  // INTERFACE

  return (
    <div className="inicio-v2">
      {/* ==================================
          1. HERO
      ================================== */}

      <section className="inicio-v2-hero">
        <div className="inicio-v2-container inicio-v2-hero-interno">
          <div className="inicio-v2-hero-texto">
            <span className="inicio-v2-etiqueta">
              SEU LIVRO DE RECEITAS DIGITAL
            </span>

            <h1>
              Suas receitas,
              <span>do seu jeito.</span>
            </h1>

            <p>
              Organize suas receitas favoritas,
              crie novas ideias e monte o seu
              livro de receitas digital,
              sempre à sua maneira.
            </p>

            <button
              type="button"
              className="inicio-v2-botao-principal"
              onClick={onExplorar}
            >
              Explorar receitas
              <ArrowRight size={19} />
            </button>
          </div>

          <div className="inicio-v2-hero-imagem">
            <span className="inicio-v2-hero-manchas" />

            <img
              src={heroCozinha}
              alt="Ilustração de uma panela laranja com ingredientes"
            />
          </div>
        </div>
      </section>

      {/* ==================================
          2. VISÃO GERAL
      ================================== */}

      <section className="inicio-v2-resumo">
        <div className="inicio-v2-container inicio-v2-resumo-interno">
          <div className="inicio-v2-resumo-titulo">
            <span className="inicio-v2-etiqueta">
              SUA COZINHA EM NÚMEROS
            </span>

            <h2>Visão geral</h2>

            <p>
              Um resumo da sua coleção de receitas.
            </p>

            <span className="inicio-v2-detalhe-laranja" />
          </div>

          <div
            className="inicio-v2-indicadores"
            aria-busy={carregando}
          >
            <CardIndicador
              tipo="laranja"
              icone={BookOpen}
              titulo="Receitas cadastradas"
              valor={carregando ? "—" : total}
              descricao="Na sua coleção pessoal"
            />

            <CardIndicador
              tipo="verde"
              icone={Timer}
              titulo="Receitas rápidas"
              valor={carregando ? "—" : rapidas}
              descricao="Prontas em até 30 minutos"
            />

            <CardIndicador
              tipo="bege"
              icone={CheckCircle2}
              titulo="Receitas já preparadas"
              valor={carregando ? "—" : preparadas}
              descricao="Pratos que você já cozinhou"
            />
          </div>
        </div>
      </section>

      {/* ==================================
          3. DESTAQUES
      ================================== */}

      <div className="inicio-v2-corpo">
        <section
          className="inicio-v2-container inicio-v2-destaques"
          aria-label="Destaques da sua cozinha"
        >
          {/* TOP 3 CATEGORIAS */}
          <article className="inicio-v2-podio-card">
            <div className="inicio-v2-card-cabecalho">
              <span className="inicio-v2-card-icone">
                <Trophy size={24} />
              </span>

              <div>
                <h2>Top 3 categorias</h2>

                <p>
                  Os tipos de receita mais
                  cadastrados por você.
                </p>
              </div>
            </div>

            {carregando ? (
              <p className="inicio-v2-mensagem-card">
                Carregando categorias...
              </p>
            ) : categorias.length === 0 ? (
              <div className="inicio-v2-podio-vazio">
                <ChefHat size={42} />

                <p>
                  Suas categorias favoritas
                  aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={
                    "inicio-v2-podio-itens " +
                    (
                      categorias.length === 1
                        ? "unico"
                        : categorias.length === 2
                          ? "duplo"
                          : ""
                    )
                  }
                >
                  {categorias[1] && (
                    <ItemPodio
                      categoria={categorias[1]}
                      posicao={2}
                    />
                  )}

                  <ItemPodio
                    categoria={categorias[0]}
                    posicao={1}
                  />

                  {categorias[2] && (
                    <ItemPodio
                      categoria={categorias[2]}
                      posicao={3}
                    />
                  )}
                </div>

                {categorias.length < 3 && (
                  <p className="inicio-v2-podio-observacao">
                    O pódio cresce conforme você
                    cadastra receitas de novas categorias.
                  </p>
                )}
              </>
            )}
          </article>

          {/* SUGESTÃO ALEATÓRIA */}
          <article className="inicio-v2-sorteio-card">
            <CookingPot
              className="inicio-v2-sorteio-decoracao"
              size={180}
              strokeWidth={1}
              aria-hidden="true"
            />

            <div className="inicio-v2-sorteio-conteudo">
              <span className="inicio-v2-card-icone">
                <UtensilsCrossed size={23} />
              </span>

              <span className="inicio-v2-etiqueta">
                UMA IDEIA PARA HOJE
              </span>

              <h2>O que cozinhar hoje?</h2>

              <p>
                Está sem ideia do que preparar?
                Deixe o My Kitchen escolher
                uma receita da sua coleção.
              </p>

              <button
                type="button"
                className="inicio-v2-botao-principal"
                onClick={sortearReceita}
                disabled={carregando || total === 0}
              >
                <Shuffle size={18} />
                Surpreenda-me
                <ArrowRight size={17} />
              </button>

              <small>
                {total === 0
                  ? "Cadastre uma receita para começar."
                  : total === 1
                    ? "Sorteio entre sua receita cadastrada."
                    : `Sorteio entre suas ${total} receitas cadastradas.`}
              </small>
            </div>
          </article>
        </section>

        {/* ==================================
            4. ÚLTIMAS RECEITAS
        ================================== */}

        <section className="inicio-v2-container inicio-v2-ultimas">
          <div className="inicio-v2-ultimas-cabecalho">
            <div>
              <span className="inicio-v2-etiqueta">
                ADICIONADAS RECENTEMENTE
              </span>

              <h2>Últimas receitas</h2>

              <p>
                Suas últimas receitas cadastradas.
              </p>
            </div>

            <div className="inicio-v2-ultimas-acoes">
              {!carregando && recentes.length >= 3 && (
                <div className="inicio-v2-setas">
                  <button
                    type="button"
                    aria-label="Ver receitas anteriores"
                    title="Anterior"
                    disabled={!podeVoltar}
                    onClick={() =>
                      moverCarrossel(-1)
                    }
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <button
                    type="button"
                    aria-label="Ver próximas receitas"
                    title="Próxima"
                    disabled={!podeAvancar}
                    onClick={() =>
                      moverCarrossel(1)
                    }
                  >
                    <ArrowRight size={19} />
                  </button>
                </div>
              )}

              {total > 0 && (
                <button
                  type="button"
                  className="inicio-v2-ver-todas"
                  onClick={onExplorar}
                >
                  Ver todas
                  <ArrowRight size={17} />
                </button>
              )}
            </div>
          </div>

          {carregando ? (
            <div
              className="inicio-v2-carregando"
              role="status"
            >
              Carregando suas receitas...
            </div>
          ) : total === 0 ? (
            /* COLEÇÃO VAZIA */
            <div className="inicio-v2-vazio">
              <img
                src={estadoVazioLivro}
                alt="Ilustração de um livro de receitas"
              />

              <div>
                <h3>Sua cozinha começa aqui!</h3>

                <p>
                  Cadastre sua primeira receita
                  e comece a construir seu livro digital.
                </p>

                <button
                  type="button"
                  className="inicio-v2-botao-principal"
                  onClick={onNovaReceita}
                >
                  <Plus size={18} />
                  Cadastrar primeira receita
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                "inicio-v2-recentes-layout " +
                (
                  recentes.length === 1
                    ? "uma"
                    : recentes.length === 2
                      ? "duas"
                      : "varias"
                )
              }
            >
              {/* CARROSSEL */}
              <div
                ref={carrosselRef}
                className="inicio-v2-carrossel"
                role="region"
                aria-label="Receitas recentes"
                tabIndex={
                  recentes.length >= 3
                    ? 0
                    : undefined
                }
                onScroll={atualizarCarrossel}
              >
                {recentes.map((receita) => (
                  <CardReceitaRecente
                    key={receita.id}
                    receita={receita}
                    onAbrir={onAbrirReceita}
                  />
                ))}
              </div>

              {/* COMPLEMENTO PARA UMA RECEITA */}
              {recentes.length === 1 && (
                <aside className="inicio-v2-convite">
                  <span className="inicio-v2-convite-icone">
                    <Sparkles size={29} />
                  </span>

                  <span className="inicio-v2-etiqueta">
                    SUA COLEÇÃO ESTÁ COMEÇANDO
                  </span>

                  <h3>
                    Mais receitas, mais histórias.
                  </h3>

                  <p>
                    Seu primeiro prato já tem
                    um lugar especial. Continue
                    registrando suas descobertas
                    na cozinha.
                  </p>

                  <button
                    type="button"
                    className="inicio-v2-convite-botao"
                    onClick={onNovaReceita}
                  >
                    <Plus size={18} />
                    Adicionar outra receita
                  </button>

                  <ChefHat
                    className="inicio-v2-convite-decoracao"
                    size={145}
                    strokeWidth={1}
                    aria-hidden="true"
                  />
                </aside>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PaginaInicial;
