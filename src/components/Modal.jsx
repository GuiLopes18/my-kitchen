
import { useEffect, useId, useRef } from "react";

import { X } from "lucide-react";

import "./Modal.css";

// MODAL REUTILIZÁVEL

function Modal({
  aberto,
  onFechar,
  titulo,
  descricao = "",
  icone = null,
  variante = "padrao",
  processando = false,
  children,
  acoes = null,
}) {
  const dialogRef = useRef(null);

  // IDs únicos para acessibilidade
  const tituloId = useId();
  const descricaoId = useId();

  // Sincroniza o estado React com o dialog
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

  // Fecha o dialog se o componente for desmontado
  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  // Trata Esc e outras solicitações de fechamento
  function cancelarPeloNavegador(evento) {
    evento.preventDefault();

    if (!processando) {
      onFechar?.();
    }
  }

  // Fecha pelo botão X
  function fecharPeloBotao() {
    if (processando) return;

    onFechar?.();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`mk-modal mk-modal-${variante}`}
      aria-labelledby={tituloId}
      aria-describedby={
        descricao ? descricaoId : undefined
      }
      onCancel={cancelarPeloNavegador}
    >
      {/* Cabeçalho */}
      <div className="mk-modal-topo">
        {icone && (
          <span className="mk-modal-icone">
            {icone}
          </span>
        )}

        <button
          type="button"
          className="mk-modal-fechar"
          aria-label="Fechar janela"
          onClick={fecharPeloBotao}
          disabled={processando}
          autoFocus
        >
          <X size={20} />
        </button>
      </div>

      {/* Título */}
      <h2
        id={tituloId}
        className="mk-modal-titulo"
      >
        {titulo}
      </h2>

      {/* Descrição opcional */}
      {descricao && (
        <p
          id={descricaoId}
          className="mk-modal-descricao"
        >
          {descricao}
        </p>
      )}

      {/* Conteúdo definido por quem usa o modal */}
      <div className="mk-modal-corpo">
        {children}
      </div>

      {/* Botões definidos por quem usa o modal */}
      {acoes && (
        <div className="mk-modal-acoes">
          {acoes}
        </div>
      )}
    </dialog>
  );
}

export default Modal;
