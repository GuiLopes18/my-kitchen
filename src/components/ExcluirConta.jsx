
import { useState } from "react";

import {
  AlertTriangle,
  LockKeyhole,
  Trash2,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

import Modal from "./Modal";

import "./ExcluirConta.css";

const FRASE_CONFIRMACAO = "EXCLUIR CONTA";

// EXCLUSÃO DEFINITIVA DA CONTA

function ExcluirConta() {
  // Controle do modal
  const [aberto, setAberto] = useState(false);

  // Confirmações
  const [ciente, setCiente] = useState(false);

  const [
    textoConfirmacao,
    setTextoConfirmacao,
  ] = useState("");

  // Operação
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);

  // Normaliza a frase digitada
  const fraseDigitada = textoConfirmacao
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  // Só libera depois de duas confirmações
  const podeExcluir =
    ciente &&
    fraseDigitada === FRASE_CONFIRMACAO &&
    !excluindo;

  // ABRIR E FECHAR

  function abrirConfirmacao() {
    setCiente(false);
    setTextoConfirmacao("");
    setErro("");
    setConcluido(false);
    setAberto(true);
  }

  function fecharConfirmacao() {
    if (excluindo) return;

    setAberto(false);
    setCiente(false);
    setTextoConfirmacao("");
    setErro("");
  }

  // SOLICITAR EXCLUSÃO AO SERVIDOR

  async function excluirConta() {
    if (!podeExcluir) return;

    setExcluindo(true);
    setErro("");

    try {
      // Obtém a sessão atual
      const {
        data: { session },
        error: erroSessao,
      } = await supabase.auth.getSession();

      if (erroSessao) throw erroSessao;

      if (!session) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      // Solicita a exclusão à Edge Function
      const { data, error } =
        await supabase.functions.invoke(
          "excluir-minha-conta",
          {
            body: {
              confirmacao: FRASE_CONFIRMACAO,
            },
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      // Trata erros enviados pelo Supabase
      if (error) {
        let mensagem =
          error.message ||
          "Erro ao solicitar a exclusão.";

        try {
          const resposta =
            await error.context?.json();

          if (resposta?.erro) {
            mensagem = resposta.erro;
          }
        } catch {
          // Mantém a mensagem original
        }

        throw new Error(mensagem);
      }

      if (!data?.sucesso) {
        throw new Error(
          "O servidor não confirmou a exclusão."
        );
      }

      // O servidor confirmou a exclusão
      setConcluido(true);

    } catch (error) {
      setErro(
        "Não foi possível concluir a exclusão: " +
        error.message
      );

      setExcluindo(false);
      return;
    }

    // ENCERRAR SESSÃO E VOLTAR AO LOGIN

    try {
      const { error: erroSaida } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (erroSaida) {
        console.error(
          "Erro ao limpar sessão local:",
          erroSaida
        );
      }
    } catch (error) {
      console.error(
        "Erro ao encerrar sessão:",
        error
      );
    }

    // Retorna à tela de Login / Cadastro
    window.location.replace("/");
  }

  // INTERFACE

  return (
    <>
      {/* Card da Gerenciamento da conta */}
      <section className="conta-card exclusao-card">
        <div className="exclusao-cabecalho">
          <span className="exclusao-icone">
            <AlertTriangle size={23} />
          </span>

          <div>
            <h2>Gerenciamento da conta</h2>

            <p>
              Gerencie ações permanentes relacionadas à sua conta.
            </p>
          </div>
        </div>

        <div className="exclusao-conteudo">
          <div>
            <h3>Excluir minha conta</h3>

            <p>
              Exclua permanentemente sua conta,
              suas receitas, fotografias e links
              de compartilhamento do My Kitchen.
            </p>
          </div>

          <button
            type="button"
            className="exclusao-botao-iniciar"
            onClick={abrirConfirmacao}
          >
            <Trash2 size={17} />
            Excluir minha conta
          </button>
        </div>
      </section>

      {/* Modal reutilizável */}
      <Modal
        aberto={aberto}
        onFechar={fecharConfirmacao}
        variante="perigo"
        processando={excluindo}
        titulo="Excluir minha conta?"
        descricao={
          "Você está prestes a excluir " +
          "permanentemente sua conta do My Kitchen."
        }
        icone={<AlertTriangle size={27} />}
        acoes={
          <>
            <button
              type="button"
              className="mk-modal-botao-secundario"
              onClick={fecharConfirmacao}
              disabled={excluindo}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="mk-modal-botao-perigo"
              onClick={excluirConta}
              disabled={!podeExcluir}
            >
              {excluindo ? (
                <>
                  <LockKeyhole size={17} />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={17} />
                  Excluir definitivamente
                </>
              )}
            </button>
          </>
        }
      >
        {/* Aviso */}
        <div className="mk-modal-aviso">
          <AlertTriangle size={20} />

          <div>
            <strong>
              Esta ação não poderá ser desfeita.
            </strong>

            <p>
              Todas as suas receitas, fotografias
              armazenadas e links de compartilhamento
              serão removidos.
            </p>

            <p>
              Se você criar outra conta no futuro,
              mesmo utilizando o mesmo e-mail,
              começará com uma coleção vazia.
            </p>
          </div>
        </div>

        {/* Ciência das consequências */}
        <label className="exclusao-ciencia">
          <input
            type="checkbox"
            checked={ciente}
            disabled={excluindo || concluido}
            onChange={(evento) =>
              setCiente(evento.target.checked)
            }
          />

          <span>
            Entendo que minha conta e meus dados
            serão excluídos permanentemente.
          </span>
        </label>

        {/* Frase de confirmação */}
        <div className="exclusao-campo">
          <label htmlFor="exclusao-frase">
            Para confirmar, digite{" "}
            <strong>EXCLUIR CONTA</strong>
          </label>

          <input
            id="exclusao-frase"
            type="text"
            placeholder="Digite EXCLUIR CONTA"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={textoConfirmacao}
            disabled={excluindo || concluido}
            onChange={(evento) =>
              setTextoConfirmacao(
                evento.target.value.toUpperCase()
              )
            }
          />
        </div>

        {/* Erro retornado pelo servidor */}
        {erro && (
          <p
            className="mk-modal-erro"
            role="alert"
          >
            {erro}
          </p>
        )}

        {/* Mensagem de processamento */}
        {excluindo && (
          <p
            className="mk-modal-processando"
            role="status"
          >
            <LockKeyhole size={17} />

            {concluido
              ? "Conta excluída. Encerrando sessão..."
              : "Excluindo sua conta e seus dados..."}
          </p>
        )}
      </Modal>
    </>
  );
}

export default ExcluirConta;
