
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  LockKeyhole,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

import ExcluirConta from "./ExcluirConta";
import IconeGoogle from "./ui/IconeGoogle";

import "./Conta.css";

const BUCKET_PERFIL = "profile-photos";

const TAMANHO_MAXIMO_FOTO = 3 * 1024 * 1024;

const TIPOS_FOTO = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// FUNÇÕES AUXILIARES

// Recupera o nome que aparece no perfil.
function obterNome(usuario) {
  const dados = usuario?.user_metadata || {};

  return (
    dados.full_name ||
    dados.name ||
    dados.user_name ||
    usuario?.email?.split("@")[0] ||
    ""
  );
}

// Identifica os provedores da conta.
function possuiProvedor(usuario, provedor) {
  const identidades = usuario?.identities || [];

  const provedores =
    usuario?.app_metadata?.providers || [];

  return (
    identidades.some(
      (identidade) =>
        identidade.provider === provedor
    ) ||
    provedores.includes(provedor) ||
    usuario?.app_metadata?.provider === provedor
  );
}

// Retorna uma mensagem amigável.
function mensagemErroConta(erro) {
  const codigo = String(
    erro?.code || ""
  ).toLowerCase();

  const texto = String(
    erro?.message || ""
  ).toLowerCase();

  if (
    texto.includes("bucket not found") ||
    texto.includes("row-level security") ||
    texto.includes("permission denied")
  ) {
    return (
      "Não foi possível acessar o armazenamento " +
      "da foto. Verifique as configurações do Supabase."
    );
  }

  if (
    codigo === "weak_password" ||
    texto.includes("password should")
  ) {
    return "Escolha uma senha mais forte.";
  }

  if (
    codigo === "reauthentication_needed" ||
    codigo === "reauthentication_not_valid"
  ) {
    return (
      "Por segurança, entre novamente na sua " +
      "conta antes de alterar a senha."
    );
  }

  if (erro?.status === 429) {
    return (
      "Muitas tentativas em pouco tempo. " +
      "Tente novamente mais tarde."
    );
  }

  if (!navigator.onLine) {
    return (
      "Você está sem conexão com a internet. " +
      "Verifique sua rede e tente novamente."
    );
  }

  return (
    "Não foi possível salvar suas alterações. " +
    "Tente novamente."
  );
}

// MEU PERFIL

export function Perfil({
  usuario,
  onVoltar,
  onUsuarioAtualizado,
}) {
  const inputFotoRef = useRef(null);

  const dadosUsuario =
    usuario?.user_metadata || {};

  // Informações do usuário.
  const [nome, setNome] = useState(
    () => obterNome(usuario)
  );

  // Fotografia selecionada.
  const [
    fotoSelecionada,
    setFotoSelecionada,
  ] = useState(null);

  const [urlPrevia, setUrlPrevia] =
    useState(null);

  const [removerFoto, setRemoverFoto] =
    useState(false);

  // Operações e mensagens do perfil.
  const [salvando, setSalvando] =
    useState(false);

  const [erroPerfil, setErroPerfil] =
    useState("");

  const [sucessoPerfil, setSucessoPerfil] =
    useState("");

  const [avisoPerfil, setAvisoPerfil] =
    useState("");

  // Alteração de senha.
  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarNovaSenha,
    setConfirmarNovaSenha,
  ] = useState("");

  const [mostrarNovaSenha, setMostrarNovaSenha] =
    useState(false);

  const [
    mostrarConfirmacao,
    setMostrarConfirmacao,
  ] = useState(false);

  const [salvandoSenha, setSalvandoSenha] =
    useState(false);

  const [erroSenha, setErroSenha] =
    useState("");

  const [sucessoSenha, setSucessoSenha] =
    useState("");

  // DADOS CALCULADOS

  const temGoogle = possuiProvedor(
    usuario,
    "google"
  );

  const temEmail = possuiProvedor(
    usuario,
    "email"
  );

  const caminhoFotoAtual =
    dadosUsuario.profile_photo_path || null;

  const fotoAtual =
    dadosUsuario.avatar_url ||
    dadosUsuario.picture ||
    null;

  const fotoGoogle =
    dadosUsuario.picture || null;

  const imagemExibida =
    urlPrevia ||
    (removerFoto
      ? fotoGoogle
      : fotoAtual);

  const inicial =
    obterNome(usuario)
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  // SINCRONIZAR NOME DA CONTA

  useEffect(() => {
    setNome(obterNome(usuario));
  }, [
    usuario?.id,
    usuario?.user_metadata?.full_name,
    usuario?.user_metadata?.name,
  ]);

  // PRÉVIA DA FOTOGRAFIA

  useEffect(() => {
    if (!fotoSelecionada) {
      setUrlPrevia(null);
      return;
    }

    const url = URL.createObjectURL(
      fotoSelecionada
    );

    setUrlPrevia(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [fotoSelecionada]);

  // SELECIONAR UMA FOTOGRAFIA

  function selecionarFoto(evento) {
    const arquivo =
      evento.target.files?.[0];

    if (!arquivo) return;

    setErroPerfil("");
    setSucessoPerfil("");
    setAvisoPerfil("");

    if (!TIPOS_FOTO.includes(arquivo.type)) {
      setErroPerfil(
        "Escolha uma imagem JPG, PNG ou WebP."
      );

      evento.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErroPerfil(
        "A fotografia deve ter no máximo 3 MB."
      );

      evento.target.value = "";
      return;
    }

    setFotoSelecionada(arquivo);
    setRemoverFoto(false);
  }

  // REMOVER OU CANCELAR A FOTO

  function cancelarFotoSelecionada() {
    setFotoSelecionada(null);
    setRemoverFoto(false);

    setErroPerfil("");
    setSucessoPerfil("");

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }
  }

  function solicitarRemocaoFoto() {
    setFotoSelecionada(null);
    setRemoverFoto(true);

    setErroPerfil("");
    setSucessoPerfil("");

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }
  }

  // SALVAR NOME E FOTO

  async function salvarPerfil(evento) {
    evento.preventDefault();

    if (salvando || !usuario) return;

    const novoNome = nome.trim();

    setErroPerfil("");
    setSucessoPerfil("");
    setAvisoPerfil("");

    // Valida o nome.
    if (
      novoNome.length < 2 ||
      novoNome.length > 60
    ) {
      setErroPerfil(
        "O nome deve ter entre 2 e 60 caracteres."
      );

      return;
    }

    const nomeAlterado =
      novoNome !== obterNome(usuario);

    const fotoAlterada =
      Boolean(fotoSelecionada);

    const fotoSeraRemovida =
      removerFoto &&
      Boolean(caminhoFotoAtual);

    if (
      !nomeAlterado &&
      !fotoAlterada &&
      !fotoSeraRemovida
    ) {
      setAvisoPerfil(
        "Nenhuma alteração foi realizada."
      );

      return;
    }

    setSalvando(true);

    let novoCaminho = null;
    let novoAvatarUrl = fotoAtual;

    try {
      // Envia uma nova fotografia.
      if (fotoSelecionada) {
        const extensoes = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };

        const extensao =
          extensoes[fotoSelecionada.type];

        novoCaminho = [
          usuario.id,
          `${crypto.randomUUID()}.${extensao}`,
        ].join("/");

        const {
          error: erroUpload,
        } = await supabase.storage
          .from(BUCKET_PERFIL)
          .upload(
            novoCaminho,
            fotoSelecionada,
            {
              contentType:
                fotoSelecionada.type,
              cacheControl: "3600",
              upsert: false,
            }
          );

        if (erroUpload) {
          throw erroUpload;
        }

        // Obtém a URL pública da nova foto.
        const { data } = supabase.storage
          .from(BUCKET_PERFIL)
          .getPublicUrl(novoCaminho);

        novoAvatarUrl = data.publicUrl;
      }

      // Ao remover a foto personalizada,
      // mantém a foto do Google, se houver.
      if (fotoSeraRemovida) {
        novoAvatarUrl = fotoGoogle;
      }

      const caminhoFinal = fotoSelecionada
        ? novoCaminho
        : fotoSeraRemovida
          ? null
          : caminhoFotoAtual;

      // Atualiza os dados no Supabase Auth.
      const {
        data,
        error: erroAtualizacao,
      } = await supabase.auth.updateUser({
        data: {
          full_name: novoNome,
          avatar_url: novoAvatarUrl,
          profile_photo_path: caminhoFinal,
        },
      });

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      // Atualiza imediatamente o cabeçalho
      // e as informações da aplicação.
      onUsuarioAtualizado?.(data.user);

      setFotoSelecionada(null);
      setRemoverFoto(false);

      if (inputFotoRef.current) {
        inputFotoRef.current.value = "";
      }

      setSucessoPerfil(
        "As alterações do seu perfil foram salvas com sucesso!"
      );

      // Remove a foto personalizada antiga
      // depois da atualização da conta.
      if (
        caminhoFotoAtual &&
        caminhoFotoAtual !== caminhoFinal
      ) {
        const {
          error: erroRemocao,
        } = await supabase.storage
          .from(BUCKET_PERFIL)
          .remove([caminhoFotoAtual]);

        if (erroRemocao) {
          console.error(
            "Erro ao remover foto anterior:",
            erroRemocao
          );

          setAvisoPerfil(
            "O perfil foi salvo, mas não foi possível remover a fotografia anterior do armazenamento."
          );
        }
      }
    } catch (erroRecebido) {
      console.error(
        "Erro ao salvar perfil:",
        erroRecebido
      );

      // Limpa um upload novo se a atualização
      // da conta falhou.
      if (novoCaminho) {
        const {
          error: erroLimpeza,
        } = await supabase.storage
          .from(BUCKET_PERFIL)
          .remove([novoCaminho]);

        if (erroLimpeza) {
          console.error(
            "Erro ao limpar upload:",
            erroLimpeza
          );
        }
      }

      setErroPerfil(
        mensagemErroConta(erroRecebido)
      );
    } finally {
      setSalvando(false);
    }
  }

  // ALTERAR SENHA

  async function alterarSenha(evento) {
    evento.preventDefault();

    if (salvandoSenha) return;

    setErroSenha("");
    setSucessoSenha("");

    if (novaSenha.length < 8) {
      setErroSenha(
        "A nova senha deve ter pelo menos 8 caracteres."
      );

      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha(
        "As senhas digitadas não são iguais."
      );

      return;
    }

    setSalvandoSenha(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: novaSenha,
        });

      if (error) throw error;

      setNovaSenha("");
      setConfirmarNovaSenha("");

      setMostrarNovaSenha(false);
      setMostrarConfirmacao(false);

      setSucessoSenha(
        "Sua senha foi atualizada com sucesso!"
      );
    } catch (erroRecebido) {
      console.error(
        "Erro ao alterar senha:",
        erroRecebido
      );

      setErroSenha(
        mensagemErroConta(erroRecebido)
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  // INTERFACE

  return (
    <div className="perfil-pagina">
      {/* VOLTAR */}
      <button
        type="button"
        className="conta-voltar"
        onClick={onVoltar}
        disabled={salvando || salvandoSenha}
      >
        <ArrowLeft size={18} />
        Voltar para o início
      </button>

      {/* TÍTULO */}
      <div className="conta-cabecalho">
        <span className="conta-etiqueta">
          MINHA CONTA
        </span>

        <h1>Meu perfil</h1>

        <p>
          Gerencie suas informações, formas de
          acesso e preferências.
        </p>
      </div>

      {/* ==================================
          DADOS DO PERFIL
      ================================== */}

      <section className="conta-card">
        <div className="conta-perfil-topo">
          <div className="conta-avatar">
            {imagemExibida ? (
              <img
                src={imagemExibida}
                alt="Foto do seu perfil"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{inicial}</span>
            )}

            <span className="conta-avatar-camera">
              <Camera size={15} />
            </span>
          </div>

          <div className="conta-perfil-identificacao">
            <h2>{obterNome(usuario)}</h2>
            <p>{usuario?.email}</p>
          </div>
        </div>

        <form
          className="conta-formulario"
          onSubmit={salvarPerfil}
        >
          {/* FOTO DO PERFIL */}
          <div className="conta-foto-secao">
            <div>
              <h3>Foto de perfil</h3>

              <p>
                Escolha uma imagem para personalizar
                sua conta. JPG, PNG ou WebP,
                com até 3 MB.
              </p>
            </div>

            <div className="conta-foto-acoes">
              <input
                ref={inputFotoRef}
                id="conta-escolher-foto"
                className="conta-input-arquivo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarFoto}
                disabled={salvando}
              />

              <label
                className="conta-botao-foto"
                htmlFor="conta-escolher-foto"
              >
                <ImagePlus size={17} />
                Escolher foto
              </label>

              {fotoSelecionada ? (
                <button
                  type="button"
                  className="conta-botao-remover-foto"
                  onClick={cancelarFotoSelecionada}
                  disabled={salvando}
                >
                  Cancelar seleção
                </button>
              ) : (
                caminhoFotoAtual &&
                !removerFoto && (
                  <button
                    type="button"
                    className="conta-botao-remover-foto"
                    onClick={solicitarRemocaoFoto}
                    disabled={salvando}
                  >
                    <Trash2 size={16} />
                    Remover foto
                  </button>
                )
              )}

              {removerFoto && (
                <button
                  type="button"
                  className="conta-botao-remover-foto"
                  onClick={cancelarFotoSelecionada}
                  disabled={salvando}
                >
                  Desfazer remoção
                </button>
              )}
            </div>

            {fotoSelecionada && (
              <small className="conta-foto-ajuda">
                Nova foto selecionada. Clique em
                Salvar alterações para confirmar.
              </small>
            )}

            {removerFoto && (
              <small className="conta-foto-ajuda">
                A fotografia personalizada será
                removida ao salvar.
              </small>
            )}
          </div>

          {/* NOME DE EXIBIÇÃO */}
          <div className="conta-campo">
            <label htmlFor="conta-nome">
              Nome de exibição
            </label>

            <div className="conta-input-simples">
              <UserRound size={18} />

              <input
                id="conta-nome"
                type="text"
                autoComplete="name"
                maxLength={60}
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value);
                  setErroPerfil("");
                  setSucessoPerfil("");
                }}
                disabled={salvando}
                required
              />
            </div>

            <small>
              Esse nome aparecerá no cabeçalho
              do My Kitchen.
            </small>
          </div>

          {/* E-MAIL */}
          <div className="conta-campo">
            <label htmlFor="conta-email">
              E-mail da conta
            </label>

            <input
              id="conta-email"
              type="email"
              value={usuario?.email || ""}
              disabled
            />

            <small>
              A alteração de e-mail não está
              disponível nesta versão.
            </small>
          </div>

          {/* MENSAGENS DO PERFIL */}
          {erroPerfil && (
            <p
              className="conta-mensagem erro"
              role="alert"
            >
              <AlertCircle size={19} />
              {erroPerfil}
            </p>
          )}

          {sucessoPerfil && (
            <p
              className="conta-mensagem sucesso"
              role="status"
            >
              <CheckCircle2 size={19} />
              {sucessoPerfil}
            </p>
          )}

          {avisoPerfil && (
            <p
              className="conta-mensagem aviso"
              role="status"
            >
              <AlertCircle size={19} />
              {avisoPerfil}
            </p>
          )}

          {/* SALVAR */}
          <div className="conta-salvar-area">
            <button
              type="submit"
              className="conta-botao-salvar"
              disabled={salvando}
            >
              <Save size={18} />

              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>

      {/* ==================================
          FORMAS DE ACESSO
      ================================== */}

      <section className="conta-card conta-acesso-card">
        <div className="conta-secao-titulo">
          <span className="conta-secao-icone">
            <LockKeyhole size={22} />
          </span>

          <div>
            <h2>Formas de acesso</h2>

            <p>
              Confira como você pode entrar
              na sua conta.
            </p>
          </div>
        </div>

        {/* GOOGLE CONECTADO */}
        {temGoogle && (
          <div className="conta-provedor">
            <span className="conta-provedor-icone">
              <IconeGoogle size={24} />
            </span>

            <div className="conta-provedor-texto">
              <strong>Google</strong>
              <small>
                Conta Google conectada ao
                My Kitchen.
              </small>
            </div>

            <span className="conta-provedor-status">
              Conectado
            </span>
          </div>
        )}

        {/* ACESSO POR E-MAIL */}
        {temEmail && (
          <div className="conta-provedor">
            <span className="conta-provedor-icone email">
              <KeyRound size={23} />
            </span>

            <div className="conta-provedor-texto">
              <strong>E-mail e senha</strong>
              <small>
                Acesso utilizando suas
                credenciais cadastradas.
              </small>
            </div>

            <span className="conta-provedor-status">
              Ativo
            </span>
          </div>
        )}

        {/* ALTERAÇÃO DE SENHA */}
        {temEmail && (
          <form
            className="conta-senha-formulario"
            onSubmit={alterarSenha}
          >
            <h3>Alterar senha</h3>

            <p>
              Atualize sua senha de acesso
              sempre que precisar.
            </p>

            <div className="conta-campo">
              <label htmlFor="conta-nova-senha">
                Nova senha
              </label>

              <div className="conta-input-simples">
                <LockKeyhole size={18} />

                <input
                  id="conta-nova-senha"
                  type={
                    mostrarNovaSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={novaSenha}
                  onChange={(evento) => {
                    setNovaSenha(
                      evento.target.value
                    );

                    setErroSenha("");
                    setSucessoSenha("");
                  }}
                  disabled={salvandoSenha}
                />

                <button
                  type="button"
                  className="conta-mostrar-senha"
                  onClick={() =>
                    setMostrarNovaSenha(
                      !mostrarNovaSenha
                    )
                  }
                  aria-label={
                    mostrarNovaSenha
                      ? "Ocultar nova senha"
                      : "Mostrar nova senha"
                  }
                  disabled={salvandoSenha}
                >
                  {mostrarNovaSenha ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="conta-campo">
              <label htmlFor="conta-confirmar-senha">
                Confirmar nova senha
              </label>

              <div className="conta-input-simples">
                <LockKeyhole size={18} />

                <input
                  id="conta-confirmar-senha"
                  type={
                    mostrarConfirmacao
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  value={confirmarNovaSenha}
                  onChange={(evento) => {
                    setConfirmarNovaSenha(
                      evento.target.value
                    );

                    setErroSenha("");
                    setSucessoSenha("");
                  }}
                  disabled={salvandoSenha}
                />

                <button
                  type="button"
                  className="conta-mostrar-senha"
                  onClick={() =>
                    setMostrarConfirmacao(
                      !mostrarConfirmacao
                    )
                  }
                  aria-label={
                    mostrarConfirmacao
                      ? "Ocultar confirmação"
                      : "Mostrar confirmação"
                  }
                  disabled={salvandoSenha}
                >
                  {mostrarConfirmacao ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {erroSenha && (
              <p
                className="conta-mensagem erro"
                role="alert"
              >
                <AlertCircle size={19} />
                {erroSenha}
              </p>
            )}

            {sucessoSenha && (
              <p
                className="conta-mensagem sucesso"
                role="status"
              >
                <CheckCircle2 size={19} />
                {sucessoSenha}
              </p>
            )}

            <div className="conta-salvar-area">
              <button
                type="submit"
                className="conta-botao-salvar"
                disabled={salvandoSenha}
              >
                <KeyRound size={18} />

                {salvandoSenha
                  ? "Atualizando..."
                  : "Atualizar senha"}
              </button>
            </div>
          </form>
        )}

        {temGoogle && !temEmail && (
          <p className="conta-acesso-ajuda">
            Seu acesso é realizado pela conta
            Google. A senha do Google é gerenciada
            diretamente pelo Google.
          </p>
        )}
      </section>

      {/* EXCLUSÃO DE CONTA */}
      <ExcluirConta />
    </div>
  );
}

// REDEFINIÇÃO DE SENHA

export function RedefinirSenha({ onConcluir }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");

  async function redefinirSenha(evento) {
    evento.preventDefault();

    if (carregando) return;

    setErro("");

    if (senha.length < 8) {
      setErro(
        "Sua nova senha deve ter pelo menos 8 caracteres."
      );

      return;
    }

    if (senha !== confirmacao) {
      setErro(
        "As senhas digitadas não são iguais."
      );

      return;
    }

    setCarregando(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: senha,
        });

      if (error) throw error;

      onConcluir?.();
    } catch (erroRecebido) {
      console.error(
        "Erro ao redefinir senha:",
        erroRecebido
      );

      setErro(
        mensagemErroConta(erroRecebido)
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="conta-recuperacao-pagina">
      <form
        className="conta-recuperacao-card"
        onSubmit={redefinirSenha}
      >
        <span className="conta-recuperacao-icone">
          <KeyRound size={27} />
        </span>

        <h1>Criar nova senha</h1>

        <p>
          Escolha uma nova senha para acessar
          sua conta do My Kitchen.
        </p>

        <div className="conta-campo">
          <label htmlFor="redefinir-senha">
            Nova senha
          </label>

          <div className="conta-input-simples">
            <LockKeyhole size={18} />

            <input
              id="redefinir-senha"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={senha}
              onChange={(evento) =>
                setSenha(evento.target.value)
              }
              disabled={carregando}
              required
            />

            <button
              type="button"
              className="conta-mostrar-senha"
              aria-label={
                mostrarSenha
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              onClick={() =>
                setMostrarSenha(!mostrarSenha)
              }
            >
              {mostrarSenha ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="conta-campo">
          <label htmlFor="redefinir-confirmacao">
            Confirmar nova senha
          </label>

          <div className="conta-input-simples">
            <LockKeyhole size={18} />

            <input
              id="redefinir-confirmacao"
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              value={confirmacao}
              onChange={(evento) =>
                setConfirmacao(
                  evento.target.value
                )
              }
              disabled={carregando}
              required
            />
          </div>
        </div>

        {erro && (
          <p
            className="conta-mensagem erro"
            role="alert"
          >
            <AlertCircle size={19} />
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="conta-botao-salvar conta-recuperacao-botao"
          disabled={carregando}
        >
          <Save size={18} />

          {carregando
            ? "Atualizando..."
            : "Salvar nova senha"}
        </button>
      </form>
    </main>
  );
}
