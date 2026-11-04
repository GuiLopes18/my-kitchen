
import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChefHat,
  Clock3,
  Copy,
  Link2,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { formatarTempo } from "../utils/tempo";
import { formatarIngrediente, formatarDificuldade } from "../utils/formatadoresReceita";

import "./Compartilhamento.css";

// Monta o endereço público da receita
function montarLink(token) {
  const url = new URL(
    window.location.pathname,
    window.location.origin
  );

  url.searchParams.set("compartilhar", token);

  return url.toString();
}

// GERENCIAMENTO DO COMPARTILHAMENTO

export default function CompartilharReceita({ receita }) {
  const dialogRef = useRef(null);

  const [aberto, setAberto] = useState(false);

  const [compartilhamento, setCompartilhamento] =
    useState(null);

  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Abre ou fecha o pop-up
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (aberto && !dialog.open) {
      dialog.showModal();
    }

    if (!aberto && dialog.open) {
      dialog.close();
    }
  }, [aberto]);

  // Consulta o link da receita
  async function abrirCompartilhamento() {
    setAberto(true);
    setCarregando(true);
    setErro("");
    setMensagem("");
    setCompartilhamento(null);

    try {
      const { data, error } = await supabase
        .from("recipe_shares")
        .select("id, token")
        .eq("recipe_id", receita.id)
        .maybeSingle();

      if (error) throw error;

      setCompartilhamento(data);
    } catch (error) {
      setErro(
        "Não foi possível consultar o link: " +
        error.message
      );
    } finally {
      setCarregando(false);
    }
  }

  // Cria um novo link
  async function criarCompartilhamento() {
    if (processando || compartilhamento) return;

    setProcessando(true);
    setErro("");
    setMensagem("");

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario) throw erroUsuario;

      if (!user) {
        throw new Error(
          "Você precisa estar conectado."
        );
      }

      const { data, error } = await supabase
        .from("recipe_shares")
        .insert({
          recipe_id: receita.id,
          user_id: user.id,
        })
        .select("id, token")
        .single();

      if (error) throw error;

      setCompartilhamento(data);
      setMensagem(
        "Link ativado! Agora você pode copiá-lo."
      );
    } catch (error) {
      setErro(
        "Não foi possível criar o link: " +
        error.message
      );
    } finally {
      setProcessando(false);
    }
  }

  // Copia o link
  async function copiarLink() {
    if (!compartilhamento) return;

    const link = montarLink(compartilhamento.token);

    setErro("");
    setMensagem("");

    try {
      await navigator.clipboard.writeText(link);
      setMensagem("Link copiado!");
    } catch {
      setErro(
        "Não foi possível copiar automaticamente. " +
        "Selecione o endereço e use Ctrl + C."
      );
    }
  }

  // Desativa o link
  async function desativarCompartilhamento() {
    if (!compartilhamento || processando) return;

    const confirmou = window.confirm(
      "Deseja desativar o compartilhamento?\n\n" +
      "Quem tiver o link não poderá mais " +
      "abrir esta receita."
    );

    if (!confirmou) return;

    setProcessando(true);
    setErro("");
    setMensagem("");

    try {
      const { error } = await supabase
        .from("recipe_shares")
        .delete()
        .eq("id", compartilhamento.id)
        .select("id")
        .single();

      if (error) throw error;

      setCompartilhamento(null);
      setMensagem(
        "Compartilhamento desativado com sucesso."
      );
    } catch (error) {
      setErro(
        "Não foi possível desativar o link: " +
        error.message
      );
    } finally {
      setProcessando(false);
    }
  }

  const link = compartilhamento
    ? montarLink(compartilhamento.token)
    : "";

  return (
    <>
      {/* Botão dos detalhes da receita */}
      <button
        type="button"
        className="share-botao"
        onClick={abrirCompartilhamento}
      >
        <Share2 size={17} />
        Compartilhar
      </button>

      {/* Pop-up */}
      <dialog
        ref={dialogRef}
        className="share-dialog"
        aria-labelledby="share-titulo"
        onClose={() => setAberto(false)}
      >
        <div className="share-dialog-topo">
          <span className="share-dialog-icone">
            <Share2 size={24} />
          </span>

          <button
            type="button"
            className="share-fechar"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="share-titulo">
          Compartilhar receita
        </h2>

        <p className="share-descricao">
          Envie um link para que outras pessoas
          possam visualizar{" "}
          <strong>{receita.nome}</strong>.
          Suas outras receitas continuarão privadas.
        </p>

        {carregando ? (
          <p className="share-carregando">
            Consultando compartilhamento...
          </p>
        ) : (
          <>
            {!compartilhamento ? (
              <div className="share-estado">
                <Link2 size={26} />

                <strong>
                  Receita ainda não compartilhada
                </strong>

                <p>
                  Crie um link para permitir a
                  visualização desta receita.
                </p>

                <button
                  type="button"
                  className="share-principal"
                  onClick={criarCompartilhamento}
                  disabled={processando}
                >
                  <Link2 size={18} />

                  {processando
                    ? "Criando..."
                    : "Criar link"}
                </button>
              </div>
            ) : (
              <div className="share-link-ativo">
                <p className="share-status">
                  <Check size={17} />
                  Compartilhamento ativo
                </p>

                <label htmlFor="share-link">
                  Link da receita
                </label>

                <input
                  id="share-link"
                  type="text"
                  readOnly
                  value={link}
                  onClick={(evento) =>
                    evento.currentTarget.select()
                  }
                />

                <button
                  type="button"
                  className="share-principal"
                  onClick={copiarLink}
                >
                  <Copy size={18} />
                  Copiar link
                </button>

                <button
                  type="button"
                  className="share-revogar"
                  onClick={desativarCompartilhamento}
                  disabled={processando}
                >
                  <Trash2 size={17} />

                  {processando
                    ? "Desativando..."
                    : "Desativar compartilhamento"}
                </button>
              </div>
            )}
          </>
        )}

        {erro && (
          <p className="share-erro" role="alert">
            {erro}
          </p>
        )}

        {mensagem && (
          <p className="share-sucesso" role="status">
            {mensagem}
          </p>
        )}
      </dialog>
    </>
  );
}

// PÁGINA PÚBLICA DA RECEITA

export function ReceitaCompartilhada({ token }) {
  const [receita, setReceita] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Consulta a Edge Function sem exigir login
  useEffect(() => {
    let ativo = true;
    const controlador = new AbortController();

    async function carregarReceita() {
      setCarregando(true);
      setErro("");

      try {
        const urlSupabase =
          import.meta.env.VITE_SUPABASE_URL;

        const chavePublica =
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const resposta = await fetch(
          `${urlSupabase}/functions/v1/receita-publica`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: chavePublica,
            },
            body: JSON.stringify({ token }),
            signal: controlador.signal,
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.erro ||
            "Não foi possível abrir a receita."
          );
        }

        if (ativo) {
          setReceita(dados.receita);
        }
      } catch (error) {
        if (ativo && error.name !== "AbortError") {
          setErro(error.message);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarReceita();

    return () => {
      ativo = false;
      controlador.abort();
    };
  }, [token]);

  return (
    <div className="share-pagina">
      {/* Cabeçalho público */}
      <header className="share-cabecalho-publico">
        <a href="/" className="share-marca">
          <ChefHat size={25} />
          My Kitchen
        </a>

        <span>Receita compartilhada</span>
      </header>

      <main className="share-conteudo-publico">
        {carregando ? (
          <div className="share-resultado">
            <BookOpen size={42} />
            <p>Carregando receita...</p>
          </div>
        ) : erro || !receita ? (
          <div className="share-resultado">
            <BookOpen size={48} />

            <h1>Receita indisponível</h1>

            <p>
              {erro ||
                "Esse link não está mais disponível."}
            </p>

            <a href="/">
              <ArrowLeft size={17} />
              Ir para o My Kitchen
            </a>
          </div>
        ) : (
          <article className="share-receita-publica">
            <span className="share-etiqueta">
              {receita.categoria}
            </span>

            <h1>{receita.nome}</h1>

            {receita.descricao && (
              <p className="share-resumo">
                {receita.descricao}
              </p>
            )}

            {/* Dados com tempo formatado */}
            <div className="share-dados">
              <span>
                <Clock3 size={19} />
                {formatarTempo(receita.tempo)}
              </span>

              <span>
                <ChefHat size={19} />
                {formatarDificuldade(receita.dificuldade)}
              </span>

              {receita.porcoes != null && (
                <span>
                  <Users size={19} />

                  {receita.porcoes}{" "}
                  {receita.porcoes === 1
                    ? "porção"
                    : "porções"}
                </span>
              )}
            </div>

            {/* Fotografia */}
            {receita.imagem && (
              <img
                className="share-foto"
                src={receita.imagem}
                alt={receita.nome}
              />
            )}

            {/* Ingredientes e preparo */}
            <div className="share-grade">
              <section className="share-bloco">
                <h2>Ingredientes</h2>

                <ul>
                  {(receita.ingredientes || []).map(
                    (ingrediente, indice) => (
                      <li key={indice}>
                        {formatarIngrediente(ingrediente)}
                      </li>
                    )
                  )}
                </ul>
              </section>

              <section className="share-bloco">
                <h2>Modo de preparo</h2>

                <ol>
                  {(receita.preparo || []).map(
                    (passo, indice) => (
                      <li key={indice}>
                        {passo}
                      </li>
                    )
                  )}
                </ol>
              </section>
            </div>

            {(receita.tags || []).length > 0 && (
              <div className="share-tags">
                {receita.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            <a href="/" className="share-visitar">
              <ArrowLeft size={17} />
              Conhecer o My Kitchen
            </a>
          </article>
        )}
      </main>

      <footer className="share-rodape">
        My Kitchen — Suas receitas, do seu jeito.
      </footer>
    </div>
  );
}
