
import { useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  FolderOpen,
  Heart,
  LockKeyhole,
  Mail,
  Send,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import imagemLogin from "../assets/imagem-login.webp";
import IconeGoogle from "./ui/IconeGoogle";

import "./Autenticacao.css";

// MENSAGENS DE ERRO DO SUPABASE

function traduzirErroAutenticacao(erro) {
  const codigo = String(erro?.code || "").toLowerCase();
  const mensagem = String(erro?.message || "").toLowerCase();

  if (
    codigo === "invalid_credentials" ||
    mensagem.includes("invalid login credentials")
  ) {
    return "E-mail ou senha incorretos. Verifique os dados e tente novamente.";
  }

  if (
    codigo === "email_not_confirmed" ||
    mensagem.includes("email not confirmed")
  ) {
    return "Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada.";
  }

  if (
    codigo === "email_exists" ||
    codigo === "user_already_exists" ||
    mensagem.includes("already registered")
  ) {
    return "Não foi possível cadastrar esse e-mail. Tente entrar ou recuperar sua senha.";
  }

  if (
    codigo === "weak_password" ||
    mensagem.includes("password should")
  ) {
    return "Essa senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
  }

  if (
    codigo === "email_address_invalid" ||
    mensagem.includes("invalid email")
  ) {
    return "Informe um endereço de e-mail válido.";
  }

  if (
    codigo === "over_email_send_rate_limit" ||
    codigo === "over_request_rate_limit" ||
    erro?.status === 429
  ) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  }

  if (
    codigo === "provider_disabled" ||
    codigo === "oauth_provider_not_supported"
  ) {
    return "O acesso com Google está indisponível no momento.";
  }

  if (codigo === "email_provider_disabled") {
    return "O cadastro por e-mail está temporariamente indisponível.";
  }

  if (
    codigo === "otp_expired" ||
    codigo === "flow_state_expired"
  ) {
    return "Esse link expirou. Solicite um novo e-mail e tente novamente.";
  }

  if (
    typeof navigator !== "undefined" &&
    !navigator.onLine
  ) {
    return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
  }

  return "Não foi possível concluir sua solicitação agora. Tente novamente em instantes.";
}

// COMPONENTE DE AUTENTICAÇÃO

function Autenticacao() {
  // Telas: entrar, cadastrar ou recuperar.
  const [modo, setModo] = useState("entrar");

  // Dados do formulário.
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Exibição das senhas.
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  // Mensagens e carregamento.
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const cadastrando = modo === "cadastrar";
  const recuperando = modo === "recuperar";

  // NAVEGAÇÃO ENTRE AS TELAS

  function alterarModo(novoModo) {
    if (carregando) return;

    setModo(novoModo);
    setErro("");
    setMensagem("");

    setSenha("");
    setConfirmarSenha("");

    setMostrarSenha(false);
    setMostrarConfirmacao(false);
  }

  function limparMensagens() {
    if (erro) setErro("");
    if (mensagem) setMensagem("");
  }

  // LOGIN, CADASTRO E RECUPERAÇÃO

  async function enviarFormulario(evento) {
    evento.preventDefault();

    if (carregando) return;

    setErro("");
    setMensagem("");

    const emailNormalizado = email.trim().toLowerCase();

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);

    if (!emailValido) {
      setErro("Informe um e-mail válido para continuar.");
      return;
    }

    if (!recuperando && !senha) {
      setErro("Informe sua senha para continuar.");
      return;
    }

    if (cadastrando) {
      if (senha.length < 8) {
        setErro("A senha deve ter pelo menos 8 caracteres.");
        return;
      }

      if (senha !== confirmarSenha) {
        setErro("As senhas não são iguais.");
        return;
      }
    }

    setCarregando(true);

    try {
      // Recuperar senha
      if (recuperando) {
        const { error } =
          await supabase.auth.resetPasswordForEmail(
            emailNormalizado,
            {
              redirectTo:
                `${window.location.origin}/?recuperar=1`,
            }
          );

        if (error) throw error;

        setMensagem(
          "Se existir uma conta com esse e-mail, você receberá um link para redefinir sua senha. Confira também a pasta de spam."
        );

        return;
      }

      // Cadastrar nova conta
      if (cadastrando) {
        const { data, error } =
          await supabase.auth.signUp({
            email: emailNormalizado,
            password: senha,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

        if (error) throw error;

        // Se a confirmação de e-mail estiver habilitada,
        // o usuário deve confirmar antes de entrar.
        if (!data.session) {
          setModo("entrar");
          setSenha("");
          setConfirmarSenha("");

          setMensagem(
            "Cadastro solicitado! Verifique seu e-mail para confirmar a conta e depois faça login."
          );
        }

        return;
      }

      // Entrar com e-mail e senha
      const { error } =
        await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password: senha,
        });

      if (error) throw error;

      // O App.jsx identifica a sessão automaticamente.
    } catch (erroRecebido) {
      setErro(
        traduzirErroAutenticacao(erroRecebido)
      );
    } finally {
      setCarregando(false);
    }
  }

  // LOGIN COM GOOGLE

  async function entrarComGoogle() {
    if (carregando) return;

    setErro("");
    setMensagem("");
    setCarregando(true);

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });

      if (error) throw error;
    } catch (erroRecebido) {
      setErro(
        traduzirErroAutenticacao(erroRecebido)
      );
    } finally {
      setCarregando(false);
    }
  }

  // TEXTOS DE CADA TELA

  const titulo = recuperando
    ? "Recuperar senha"
    : cadastrando
      ? "Crie sua conta!"
      : "Bem-vindo de volta!";

  const subtitulo = recuperando
    ? "Informe seu e-mail para receber o link de recuperação."
    : cadastrando
      ? "Comece a organizar suas receitas em um só lugar."
      : "Entre na sua conta para acessar suas receitas.";

  // INTERFACE

  return (
    <main className="auth-pagina">
      {/* APRESENTAÇÃO À ESQUERDA */}
      <section
        className="auth-apresentacao"
        aria-label="Conheça o My Kitchen"
      >
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icone">
            <ChefHat size={31} strokeWidth={2.2} />
          </span>

          <span>My Kitchen</span>
        </div>

        {/* Texto principal */}
        <div className="auth-introducao">
          <span className="auth-etiqueta">
            SEU LIVRO DE RECEITAS DIGITAL
          </span>

          <h1>
            Suas receitas merecem um lugar{" "}
            <em>especial.</em>
          </h1>

          <p>
            Organize seus pratos favoritos,
            registre ingredientes e tenha suas
            receitas sempre à mão.
          </p>
        </div>

        {/* Vantagens e ilustração */}
        <div className="auth-cena">
          <ul className="auth-beneficios">
            <li>
              <span>
                <BookOpen size={23} />
              </span>

              <strong>
                Cadastre suas receitas
              </strong>
            </li>

            <li>
              <span>
                <FolderOpen size={23} />
              </span>

              <strong>
                Organize por categorias
              </strong>
            </li>

            <li>
              <span>
                <Heart size={23} />
              </span>

              <strong>
                Acesse de qualquer lugar
              </strong>
            </li>
          </ul>

          <img
            className="auth-ilustracao"
            src={imagemLogin}
            alt="Panela alaranjada com utensílios de cozinha, tomates, alho e manjericão"
          />
        </div>
      </section>

      {/* FORMULÁRIO À DIREITA */}
      <section
        className="auth-area-formulario"
        aria-label="Acessar My Kitchen"
      >
        <div className="auth-caixa">
          {/* Título */}
          <div className="auth-cabecalho">
            <span
              className="auth-detalhe"
              aria-hidden="true"
            />

            <h2>{titulo}</h2>

            <p>{subtitulo}</p>
          </div>

          {/* Google */}
          {!recuperando && (
            <>
              <button
                type="button"
                className="auth-google"
                onClick={entrarComGoogle}
                disabled={carregando}
              >
                <IconeGoogle />

                Continuar com Google
              </button>

              <div className="auth-divisor">
                <span>
                  ou continue com e-mail
                </span>
              </div>
            </>
          )}

          {/* Formulário */}
          <form
            className="auth-formulario"
            onSubmit={enviarFormulario}
            noValidate
          >
            {/* E-mail */}
            <div className="auth-campo">
              <label htmlFor="auth-email">
                E-mail
              </label>

              <div className="auth-input-grupo">
                <Mail
                  size={19}
                  aria-hidden="true"
                />

                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(evento) => {
                    setEmail(evento.target.value);
                    limparMensagens();
                  }}
                  disabled={carregando}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            {!recuperando && (
              <div className="auth-campo">
                <label htmlFor="auth-senha">
                  Senha
                </label>

                <div className="auth-input-grupo">
                  <LockKeyhole
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="auth-senha"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    autoComplete={
                      cadastrando
                        ? "new-password"
                        : "current-password"
                    }
                    placeholder={
                      cadastrando
                        ? "Mínimo de 8 caracteres"
                        : "Digite sua senha"
                    }
                    value={senha}
                    onChange={(evento) => {
                      setSenha(evento.target.value);
                      limparMensagens();
                    }}
                    disabled={carregando}
                    required
                  />

                  <button
                    type="button"
                    className="auth-mostrar-senha"
                    aria-label={
                      mostrarSenha
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-pressed={mostrarSenha}
                    onClick={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                    disabled={carregando}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmar senha no cadastro */}
            {cadastrando && (
              <div className="auth-campo">
                <label htmlFor="auth-confirmar-senha">
                  Confirme sua senha
                </label>

                <div className="auth-input-grupo">
                  <LockKeyhole
                    size={19}
                    aria-hidden="true"
                  />

                  <input
                    id="auth-confirmar-senha"
                    type={
                      mostrarConfirmacao
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="Digite a senha novamente"
                    value={confirmarSenha}
                    onChange={(evento) => {
                      setConfirmarSenha(
                        evento.target.value
                      );
                      limparMensagens();
                    }}
                    disabled={carregando}
                    required
                  />

                  <button
                    type="button"
                    className="auth-mostrar-senha"
                    aria-label={
                      mostrarConfirmacao
                        ? "Ocultar confirmação"
                        : "Mostrar confirmação"
                    }
                    aria-pressed={mostrarConfirmacao}
                    onClick={() =>
                      setMostrarConfirmacao(
                        !mostrarConfirmacao
                      )
                    }
                    disabled={carregando}
                  >
                    {mostrarConfirmacao ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Recuperar senha */}
            {modo === "entrar" && (
              <div className="auth-opcoes">
                <button
                  type="button"
                  className="auth-link"
                  onClick={() =>
                    alterarModo("recuperar")
                  }
                  disabled={carregando}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Mensagem de erro */}
            {erro && (
              <div
                className="auth-erro"
                role="alert"
              >
                <AlertCircle
                  size={20}
                  aria-hidden="true"
                />

                <span>{erro}</span>
              </div>
            )}

            {/* Mensagem de sucesso */}
            {mensagem && (
              <div
                className="auth-sucesso"
                role="status"
              >
                <CheckCircle2
                  size={20}
                  aria-hidden="true"
                />

                <span>{mensagem}</span>
              </div>
            )}

            {/* Botão principal */}
            <button
              className="auth-enviar"
              type="submit"
              disabled={carregando}
            >
              {carregando
                ? "Aguarde..."
                : recuperando
                  ? "Enviar link de recuperação"
                  : cadastrando
                    ? "Criar conta"
                    : "Entrar"}

              {recuperando &&
                !carregando && (
                  <Send size={18} />
                )}
            </button>
          </form>

          {/* Trocar entre login, cadastro e recuperação */}
          <div className="auth-rodape-alternar">
            {recuperando ? (
              <button
                type="button"
                className="auth-link auth-voltar"
                onClick={() =>
                  alterarModo("entrar")
                }
                disabled={carregando}
              >
                <ArrowLeft size={17} />
                Voltar ao login
              </button>
            ) : cadastrando ? (
              <p>
                Já tem uma conta?{" "}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() =>
                    alterarModo("entrar")
                  }
                  disabled={carregando}
                >
                  Entrar
                </button>
              </p>
            ) : (
              <p>
                Ainda não tem uma conta?{" "}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() =>
                    alterarModo("cadastrar")
                  }
                  disabled={carregando}
                >
                  Cadastre-se
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Autenticacao;
