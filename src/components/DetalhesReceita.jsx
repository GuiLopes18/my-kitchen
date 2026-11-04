
import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChefHat,
  Circle,
  Clock3,
  Expand,
  NotebookPen,
  Pencil,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { formatarTempo } from "../utils/tempo";
import { formatarIngrediente, formatarDificuldade } from "../utils/formatadoresReceita";

import * as ModuloCompartilhamento from "./CompartilharReceita";

import "./DetalhesReceita.css";

// COMPONENTE DE COMPARTILHAMENTO

// Compatível com exportação nomeada ou padrão.
const CompartilharReceita =
  ModuloCompartilhamento.CompartilharReceita ||
  ModuloCompartilhamento.default;

// FUNÇÕES AUXILIARES

// DETALHES DA RECEITA

function DetalhesReceita({
  receita,
  onVoltar,
  onEditar,
  onExcluir,
  onAlternarCozinhei,
  excluindo = false,
  atualizandoCozinhei = false,
}) {
  // ESTADOS

  const [ingredientesMarcados, setIngredientesMarcados] =
    useState([]);

  // NOVO: CONTROLA A FOTOGRAFIA AMPLIADA
  const [imagemAmpliada, setImagemAmpliada] =
    useState(false);

  const dialogoImagemRef = useRef(null);

  // DADOS DA RECEITA

  const ingredientes = Array.isArray(
    receita.ingredientes
  )
    ? receita.ingredientes
    : [];

  const preparo = Array.isArray(receita.preparo)
    ? receita.preparo
    : [];

  const tags = Array.isArray(receita.tags)
    ? receita.tags
    : [];

  const jaCozinhei = Boolean(receita.ja_cozinhei);

  const observacoes =
    typeof receita.observacoes === "string"
      ? receita.observacoes.trim()
      : "";

  // AMPLIAR E FECHAR FOTOGRAFIA

  // Utilizamos o elemento nativo <dialog>.
  // Ele já oferece suporte à tecla Esc,
  // foco e comportamento de janela modal.
  useEffect(() => {
    const dialogo = dialogoImagemRef.current;

    if (!dialogo) {
      return;
    }

    if (imagemAmpliada && !dialogo.open) {
      dialogo.showModal();
    }

    if (!imagemAmpliada && dialogo.open) {
      dialogo.close();
    }
  }, [imagemAmpliada]);

  function abrirImagem() {
    if (!receita.imagem) {
      return;
    }

    setImagemAmpliada(true);
  }

  function fecharImagem() {
    setImagemAmpliada(false);
  }

  // MARCAR INGREDIENTES

  function alternarIngrediente(indice) {
    setIngredientesMarcados((anteriores) =>
      anteriores.includes(indice)
        ? anteriores.filter(
            (item) => item !== indice
          )
        : [...anteriores, indice]
    );
  }

  const quantidadeMarcada =
    ingredientesMarcados.filter(
      (indice) => indice < ingredientes.length
    ).length;

  // MARCAR RECEITA COMO PREPARADA

  function alternarStatusPreparo() {
    if (
      !onAlternarCozinhei ||
      atualizandoCozinhei ||
      excluindo
    ) {
      return;
    }

    onAlternarCozinhei();
  }

  // INTERFACE

  return (
    <article className="detalhes-receita">
      {/* ==================================
          1. TOPO E AÇÕES
      ================================== */}

      <div className="detalhes-topo">
        <button
          type="button"
          className="detalhes-voltar"
          onClick={onVoltar}
        >
          <ArrowLeft size={19} />
          Voltar para minhas receitas
        </button>

        <div className="detalhes-acoes">
          {/* COMPARTILHAR */}
          {CompartilharReceita && (
            <div className="detalhes-compartilhamento">
              <CompartilharReceita receita={receita} />
            </div>
          )}

          {/* EDITAR */}
          {onEditar && (
            <button
              type="button"
              className="detalhes-botao-editar"
              onClick={onEditar}
              disabled={excluindo}
            >
              <Pencil size={17} />
              Editar receita
            </button>
          )}

          {/* EXCLUIR */}
          {onExcluir && (
            <button
              type="button"
              className="detalhes-botao-excluir"
              onClick={onExcluir}
              disabled={excluindo}
            >
              <Trash2 size={17} />

              {excluindo
                ? "Excluindo..."
                : "Excluir receita"}
            </button>
          )}
        </div>
      </div>

      {/* ==================================
          2. CARD PRINCIPAL DA RECEITA
      ================================== */}

      <section className="detalhes-hero">
        {/* ==================================
            FOTOGRAFIA
        ================================== */}

        {receita.imagem ? (
          <button
            type="button"
            className="detalhes-imagem detalhes-imagem-interativa"
            onClick={abrirImagem}
            aria-label={`Ampliar fotografia da receita ${receita.nome}`}
            title="Clique para ampliar a fotografia"
          >
            <img
              src={receita.imagem}
              alt={receita.nome}
            />

            <span className="detalhes-imagem-ampliar">
              <Expand size={17} />
              Ampliar foto
            </span>
          </button>
        ) : (
          <div
            className="detalhes-imagem detalhes-imagem-vazia"
            aria-label="Receita sem fotografia"
          >
            <ChefHat
              size={75}
              strokeWidth={1.3}
              aria-hidden="true"
            />
          </div>
        )}

        {/* ==================================
            INFORMAÇÕES PRINCIPAIS
        ================================== */}

        <div className="detalhes-cabecalho">
          <span className="detalhes-categoria">
            {receita.categoria || "Sem categoria"}
          </span>

          <h1>{receita.nome}</h1>

          {receita.descricao && (
            <p className="detalhes-descricao">
              {receita.descricao}
            </p>
          )}

          {/* TEMPO, DIFICULDADE E PORÇÕES */}
          <div className="detalhes-metadados">
            <span>
              <Clock3 size={18} />
              {formatarTempo(receita.tempo)}
            </span>

            <span>
              <UtensilsCrossed size={18} />
              {formatarDificuldade(
                receita.dificuldade
              )}
            </span>

            {receita.porcoes != null && (
              <span>
                <Users size={18} />

                {receita.porcoes}{" "}
                {Number(receita.porcoes) === 1
                  ? "porção"
                  : "porções"}
              </span>
            )}
          </div>

          {/* ==================================
              STATUS DE PREPARO
          ================================== */}

          <div
            className={
              jaCozinhei
                ? "detalhes-preparo preparada"
                : "detalhes-preparo pendente"
            }
          >
            <div className="detalhes-preparo-informacao">
              <span className="detalhes-preparo-icone">
                {jaCozinhei ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <ChefHat size={21} />
                )}
              </span>

              <div aria-live="polite">
                <strong>
                  {jaCozinhei
                    ? "Receita já preparada"
                    : "Ainda não preparei"}
                </strong>

                <small>
                  {jaCozinhei
                    ? "Você já cozinhou este prato."
                    : "Marque quando experimentar esta receita."}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="detalhes-preparo-botao"
              onClick={alternarStatusPreparo}
              disabled={
                !onAlternarCozinhei ||
                atualizandoCozinhei ||
                excluindo
              }
              aria-pressed={jaCozinhei}
            >
              {jaCozinhei ? (
                <>
                  <Circle size={17} />

                  {atualizandoCozinhei
                    ? "Atualizando..."
                    : "Desmarcar como preparada"}
                </>
              ) : (
                <>
                  <Check size={17} />

                  {atualizandoCozinhei
                    ? "Atualizando..."
                    : "Marcar como preparada"}
                </>
              )}
            </button>
          </div>

          {/* TAGS */}
          {tags.length > 0 && (
            <div className="detalhes-tags">
              {tags.map((tag, indice) => (
                <span key={`${tag}-${indice}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================
          3. INGREDIENTES E PREPARO
      ================================== */}

      <div className="detalhes-conteudo">
        {/* INGREDIENTES */}
        <section className="detalhes-card">
          <div className="detalhes-card-titulo">
            <h2>Ingredientes</h2>

            <small>
              {quantidadeMarcada}/{ingredientes.length}
              {" "}marcados
            </small>
          </div>

          <p className="detalhes-ajuda">
            Marque os ingredientes conforme
            separá-los para o preparo.
          </p>

          <ul className="detalhes-ingredientes">
            {ingredientes.map(
              (ingrediente, indice) => {
                const marcado =
                  ingredientesMarcados.includes(indice);

                return (
                  <li key={indice}>
                    <label
                      className={
                        marcado
                          ? "detalhes-ingrediente marcado"
                          : "detalhes-ingrediente"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() =>
                          alternarIngrediente(indice)
                        }
                      />

                      <span>
                        {formatarIngrediente(
                          ingrediente
                        )}
                      </span>
                    </label>
                  </li>
                );
              }
            )}
          </ul>
        </section>

        {/* MODO DE PREPARO */}
        <section className="detalhes-card">
          <div className="detalhes-card-titulo">
            <h2>Modo de preparo</h2>

            <small>
              {preparo.length}{" "}
              {preparo.length === 1
                ? "passo"
                : "passos"}
            </small>
          </div>

          <ol className="detalhes-passos">
            {preparo.map((passo, indice) => {
              const texto =
                typeof passo === "string"
                  ? passo
                  : passo?.texto || "";

              return (
                <li
                  className="detalhes-passo"
                  key={indice}
                >
                  <span className="detalhes-passo-numero">
                    {indice + 1}
                  </span>

                  <p>{texto}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* ==================================
          4. OBSERVAÇÕES
      ================================== */}

      {observacoes && (
        <section className="detalhes-observacoes">
          <div className="detalhes-observacoes-titulo">
            <NotebookPen size={22} />

            <h2>Observações</h2>
          </div>

          <p>{observacoes}</p>
        </section>
      )}

      {/* ==================================
          5. FOTOGRAFIA AMPLIADA
      ================================== */}

      {receita.imagem && (
        <dialog
          ref={dialogoImagemRef}
          className="detalhes-lightbox"
          aria-label={`Fotografia ampliada da receita ${receita.nome}`}
          onClose={() => setImagemAmpliada(false)}
          onClick={(evento) => {
            // Fecha ao clicar fora do conteúdo.
            if (
              evento.target === evento.currentTarget
            ) {
              fecharImagem();
            }
          }}
        >
          <div className="detalhes-lightbox-conteudo">
            <button
              type="button"
              className="detalhes-lightbox-fechar"
              onClick={fecharImagem}
              aria-label="Fechar fotografia ampliada"
              title="Fechar"
            >
              <X size={23} />
            </button>

            <img
              src={receita.imagem}
              alt={`Fotografia ampliada de ${receita.nome}`}
              className="detalhes-lightbox-imagem"
            />
          </div>
        </dialog>
      )}
    </article>
  );
}

export default DetalhesReceita;
