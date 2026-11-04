
import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import { supabase } from "./lib/supabaseClient";
import {
  listarReceitas,
  salvarReceitaNoBanco,
  atualizarStatusPreparo,
  excluirReceitaNoBanco,
} from "./services/receitas";

import Autenticacao from "./components/Autenticacao";
import FormularioReceita from "./components/FormularioReceita";
import DetalhesReceita from "./components/DetalhesReceita";
import PaginaInicial from "./components/PaginaInicial";
import PaginaReceitas from "./components/PaginaReceitas";
import Modal from "./components/Modal";
import Cabecalho from "./components/layout/Cabecalho";
import Rodape from "./components/layout/Rodape";

import {
  Perfil,
  RedefinirSenha,
} from "./components/Conta";

import "./App.css";
import "./components/AcoesReceita.css";

// NOTIFICAÇÕES

function Notificacao({ dados, onFechar }) {
  if (!dados) return null;

  const Icone =
    dados.tipo === "sucesso"
      ? CheckCircle2
      : dados.tipo === "erro"
        ? AlertCircle
        : AlertTriangle;

  return (
    <div
      className={`receita-notificacao ${dados.tipo}`}
      role={
        dados.tipo === "erro"
          ? "alert"
          : "status"
      }
    >
      <Icone size={21} />

      <span>{dados.mensagem}</span>

      <button
        type="button"
        className="receita-notificacao-fechar"
        aria-label="Fechar notificação"
        onClick={onFechar}
      >
        <X size={17} />
      </button>
    </div>
  );
}

// RECEITA NÃO ENCONTRADA

function PaginaNaoEncontrada({ onVoltar }) {
  return (
    <section className="receitas">
      <div className="estado-vazio">
        <ChefHat
          size={48}
          color="#c47747"
          strokeWidth={1.5}
        />

        <h3>Receita não encontrada</h3>

        <p>
          Essa receita não existe ou não está
          disponível na sua conta.
        </p>

        <button
          type="button"
          className="limpar-filtros"
          onClick={onVoltar}
        >
          Voltar para minhas receitas
        </button>
      </div>
    </section>
  );
}

// ROTA DOS DETALHES

function RotaDetalhes({
  receitas,
  carregando,
  excluindo,
  atualizandoCozinheiId,
  onVoltar,
  onEditar,
  onExcluir,
  onAlternarCozinhei,
}) {
  const { id } = useParams();

  const receita = receitas.find(
    (item) => item.id === id
  );

  if (carregando) {
    return (
      <div
        className="app-carregando"
        role="status"
      >
        Carregando receita...
      </div>
    );
  }

  if (!receita) {
    return (
      <PaginaNaoEncontrada
        onVoltar={onVoltar}
      />
    );
  }

  return (
    <DetalhesReceita
      key={receita.id}
      receita={receita}
      onVoltar={onVoltar}
      onEditar={() => onEditar(receita)}
      onExcluir={() => onExcluir(receita)}
      onAlternarCozinhei={() =>
        onAlternarCozinhei(receita)
      }
      atualizandoCozinhei={
        atualizandoCozinheiId === receita.id
      }
      excluindo={excluindo}
    />
  );
}

// ROTA DO FORMULÁRIO

function RotaFormulario({
  receitas,
  carregando,
  salvando,
  onSalvar,
  onVoltar,
}) {
  const { id } = useParams();

  const editando = Boolean(id);

  const receitaInicial = editando
    ? receitas.find(
        (item) => item.id === id
      )
    : null;

  if (editando && carregando) {
    return (
      <div
        className="app-carregando"
        role="status"
      >
        Carregando receita para edição...
      </div>
    );
  }

  if (editando && !receitaInicial) {
    return (
      <PaginaNaoEncontrada
        onVoltar={() => onVoltar(null)}
      />
    );
  }

  return (
    <section className="receitas">
      <FormularioReceita
        key={receitaInicial?.id ?? "nova"}
        receitaInicial={receitaInicial}
        onSalvar={(dados) =>
          onSalvar(dados, receitaInicial)
        }
        onCancelar={() =>
          onVoltar(receitaInicial)
        }
        salvando={salvando}
      />
    </section>
  );
}

// APLICAÇÃO PRINCIPAL

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // AUTENTICAÇÃO

  const [usuario, setUsuario] = useState(null);

  const [
    verificandoSessao,
    setVerificandoSessao,
  ] = useState(true);

  const [
    modoRecuperacao,
    setModoRecuperacao,
  ] = useState(() => {
    const parametros = new URLSearchParams(
      window.location.search
    );

    return parametros.get("recuperar") === "1";
  });

  // RECEITAS

  const [receitas, setReceitas] = useState([]);

  const [
    carregandoReceitas,
    setCarregandoReceitas,
  ] = useState(false);

  const [
    usuarioComReceitasCarregadas,
    setUsuarioComReceitasCarregadas,
  ] = useState(null);

  // MENSAGENS

  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [notificacao, setNotificacao] =
    useState(null);

  // OPERAÇÕES

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const salvandoRef = useRef(false);
  const excluindoRef = useRef(false);

  // Atualização do status de preparo.
  const [
    atualizandoCozinheiId,
    setAtualizandoCozinheiId,
  ] = useState(null);

  const atualizandoCozinheiRef = useRef(false);

  // Confirmação de exclusão.
  const [
    receitaParaExcluir,
    setReceitaParaExcluir,
  ] = useState(null);

  const [
    erroExclusao,
    setErroExclusao,
  ] = useState("");

  // AUTENTICAÇÃO

  useEffect(() => {
    const { data } =
      supabase.auth.onAuthStateChange(
        (evento, sessao) => {
          setUsuario(sessao?.user ?? null);

          setVerificandoSessao(false);

          if (evento === "PASSWORD_RECOVERY") {
            setModoRecuperacao(true);
          }

          if (evento === "SIGNED_OUT") {
            setModoRecuperacao(false);
            setReceitaParaExcluir(null);
            setNotificacao(null);
          }
        }
      );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // CARREGAR RECEITAS

  useEffect(() => {
    const usuarioId = usuario?.id;

    if (!usuarioId) {
      setReceitas([]);
      setCarregandoReceitas(false);

      setUsuarioComReceitasCarregadas(null);

      return;
    }

    let ativo = true;

    async function carregarReceitas() {
      setCarregandoReceitas(true);
      setUsuarioComReceitasCarregadas(null);
      setReceitas([]);

      try {
        const lista = await listarReceitas(usuarioId);
        if (ativo) setReceitas(lista);
      } catch (error) {
        if (ativo) {
          setErro(
            "Erro ao carregar receitas: " +
            error.message
          );
        }
      } finally {
        if (ativo) {
          setUsuarioComReceitasCarregadas(
            usuarioId
          );

          setCarregandoReceitas(false);
        }
      }
    }

    carregarReceitas();

    return () => {
      ativo = false;
    };
  }, [usuario?.id]);

  // Volta ao topo ao navegar.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Notificações desaparecem após 5 segundos.
  useEffect(() => {
    if (!notificacao) return;

    const temporizador = setTimeout(() => {
      setNotificacao(null);
    }, 5000);

    return () => {
      clearTimeout(temporizador);
    };
  }, [notificacao]);

  const aguardandoReceitas =
    Boolean(usuario) &&
    (
      carregandoReceitas ||
      usuarioComReceitasCarregadas !== usuario.id
    );

  // NAVEGAÇÃO

  function irParaInicio() {
    setErro("");
    navigate("/");
  }

  function irParaReceitas() {
    setErro("");
    navigate("/receitas");
  }

  function criarReceita() {
    if (
      salvandoRef.current ||
      excluindoRef.current
    ) {
      return;
    }

    setErro("");
    setAviso("");

    navigate("/receitas/nova");
  }

  function abrirReceita(receita) {
    setErro("");

    navigate(`/receitas/${receita.id}`);
  }

  function editarReceita(receita) {
    if (
      salvandoRef.current ||
      excluindoRef.current
    ) {
      return;
    }

    setErro("");
    setAviso("");

    navigate(
      `/receitas/${receita.id}/editar`
    );
  }

  function cancelarFormulario(receitaInicial) {
    if (salvandoRef.current) return;

    if (receitaInicial) {
      navigate(
        `/receitas/${receitaInicial.id}`
      );
    } else {
      navigate("/receitas");
    }
  }

  function abrirPerfil() {
    if (
      salvandoRef.current ||
      excluindoRef.current
    ) {
      return;
    }

    setErro("");
    navigate("/perfil");
  }

  function atualizarUsuario(usuarioAtualizado) {
    if (usuarioAtualizado) {
      setUsuario(usuarioAtualizado);
    }
  }

  function concluirRecuperacao() {
    setModoRecuperacao(false);

    setAviso(
      "Sua senha foi atualizada com sucesso!"
    );

    navigate("/", {
      replace: true,
    });
  }

  // CADASTRAR E EDITAR RECEITAS

  async function salvarReceita(
    dados,
    receitaEditando = null
  ) {
    if (
      !usuario ||
      salvandoRef.current
    ) {
      return;
    }

    salvandoRef.current = true;

    setSalvando(true);
    setErro("");
    setAviso("");

    try {
      const { receita, aviso: avisoSalvamento } = await salvarReceitaNoBanco({
        dados,
        usuarioId: usuario.id,
        receitaOriginal: receitaEditando,
      });

      setReceitas((anteriores) => receitaEditando
        ? anteriores.map((item) => item.id === receita.id ? receita : item)
        : [receita, ...anteriores]
      );

      if (avisoSalvamento) setAviso(avisoSalvamento);
      navigate(`/receitas/${receita.id}`, { replace: true });
    } catch (error) {
      setErro("Não foi possível salvar a receita: " + error.message);
      window.scrollTo(0, 0);
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

    // MARCAR OU DESMARCAR COMO PREPARADA

  async function alternarCozinhei(receita) {
    if (
      !usuario ||
      !receita ||
      atualizandoCozinheiRef.current
    ) {
      return;
    }

    atualizandoCozinheiRef.current = true;

    setAtualizandoCozinheiId(receita.id);
    setNotificacao(null);

    const novoStatus = !Boolean(
      receita.ja_cozinhei
    );

    try {
      const statusConfirmado = await atualizarStatusPreparo({
        receitaId: receita.id,
        usuarioId: usuario.id,
        preparada: novoStatus,
      });

      // Atualiza cards, detalhes e indicadores.
      setReceitas((anteriores) =>
        anteriores.map((item) =>
          item.id === receita.id
            ? {
                ...item,
                ja_cozinhei: statusConfirmado,
              }
            : item
        )
      );

      setNotificacao({
        tipo: "sucesso",
        mensagem: novoStatus
          ? `A receita "${receita.nome}" foi marcada como preparada!`
          : `A marcação da receita "${receita.nome}" foi removida.`,
      });
    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error
      );

      setNotificacao({
        tipo: "erro",
        mensagem:
          "Não foi possível atualizar a receita. " +
          "Tente novamente.",
      });
    } finally {
      atualizandoCozinheiRef.current = false;
      setAtualizandoCozinheiId(null);
    }
  }

  // ABRIR MODAL DE EXCLUSÃO

  function solicitarExclusaoReceita(receita) {
    if (
      !usuario ||
      excluindoRef.current ||
      salvandoRef.current
    ) {
      return;
    }

    setReceitaParaExcluir(receita);
    setErroExclusao("");
    setNotificacao(null);
    setErro("");
  }

  function cancelarExclusaoReceita() {
    if (excluindoRef.current) {
      return;
    }

    setReceitaParaExcluir(null);
    setErroExclusao("");
  }

  // CONFIRMAR EXCLUSÃO

  async function confirmarExclusaoReceita() {
    const receita = receitaParaExcluir;

    if (
      !usuario ||
      !receita ||
      excluindoRef.current
    ) {
      return;
    }

    excluindoRef.current = true;

    setExcluindo(true);
    setErroExclusao("");
    setErro("");
    setAviso("");

    try {
      const { fotoRemovida } = await excluirReceitaNoBanco({
        receita,
        usuarioId: usuario.id,
      });

      // Atualiza a coleção.
      setReceitas((anteriores) =>
        anteriores.filter(
          (item) => item.id !== receita.id
        )
      );

      setReceitaParaExcluir(null);
      setErroExclusao("");

      navigate("/receitas", {
        replace: true,
      });

      if (fotoRemovida) {
        setNotificacao({
          tipo: "sucesso",
          mensagem:
            `A receita "${receita.nome}" ` +
            "foi excluída com sucesso!",
        });
      } else {
        setNotificacao({
          tipo: "aviso",
          mensagem:
            `A receita "${receita.nome}" foi excluída, ` +
            "mas a fotografia não pôde ser removida.",
        });
      }
    } catch (error) {
      setErroExclusao(
        "Não foi possível excluir a receita: " +
        error.message
      );
    } finally {
      excluindoRef.current = false;
      setExcluindo(false);
    }
  }

  // SAIR DA CONTA

  async function sairDaConta() {
    if (salvando || excluindo) {
      return;
    }

    setErro("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      setErro(
        "Não foi possível sair: " +
        error.message
      );

      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  // DADOS DO USUÁRIO

  const dadosUsuario =
    usuario?.user_metadata || {};

  const nomeUsuario =
    dadosUsuario.full_name ||
    dadosUsuario.name ||
    dadosUsuario.user_name ||
    usuario?.email?.split("@")[0] ||
    "Minha conta";

  const emailUsuario = usuario?.email || "";

  const fotoUsuario =
    dadosUsuario.avatar_url ||
    dadosUsuario.picture ||
    null;

  const inicialUsuario =
    nomeUsuario
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  // VERIFICAÇÃO DE SESSÃO

  if (verificandoSessao) {
    return (
      <div
        className="app-carregando"
        role="status"
      >
        Verificando sua sessão...
      </div>
    );
  }

  if (!usuario) {
    return <Autenticacao />;
  }

  if (modoRecuperacao) {
    return (
      <RedefinirSenha
        onConcluir={concluirRecuperacao}
      />
    );
  }

  // INTERFACE PRINCIPAL

  return (
    <div className="app">
      {/* ==================================
          CABEÇALHO
      ================================== */}

      <Cabecalho
        location={location}
        nomeUsuario={nomeUsuario}
        emailUsuario={emailUsuario}
        fotoUsuario={fotoUsuario}
        inicialUsuario={inicialUsuario}
        irParaInicio={irParaInicio}
        irParaReceitas={irParaReceitas}
        abrirPerfil={abrirPerfil}
        sairDaConta={sairDaConta}
        desabilitarSair={salvando || excluindo}
      />

      {/* ==================================
          CONTEÚDO
      ================================== */}

      <main>
        {erro && (
          <div
            className="app-alerta"
            role="alert"
          >
            {erro}
          </div>
        )}

        {aviso && (
          <div
            className="app-aviso"
            role="status"
          >
            {aviso}
          </div>
        )}

        {salvando && (
          <div
            className="app-carregando"
            role="status"
          >
            Salvando receita...
          </div>
        )}

        {/* ROTAS */}
        <Routes>
          {/* PÁGINA INICIAL */}
          <Route
            path="/"
            element={
              <PaginaInicial
                receitas={receitas}
                carregando={aguardandoReceitas}
                onExplorar={irParaReceitas}
                onNovaReceita={criarReceita}
                onAbrirReceita={abrirReceita}
              />
            }
          />

          {/* NOVA PÁGINA MINHAS RECEITAS */}
          <Route
            path="/receitas"
            element={
              <PaginaReceitas
                receitas={receitas}
                carregando={aguardandoReceitas}
                onNovaReceita={criarReceita}
                onAbrirReceita={abrirReceita}
              />
            }
          />

          {/* NOVA RECEITA */}
          <Route
            path="/receitas/nova"
            element={
              <RotaFormulario
                receitas={receitas}
                carregando={aguardandoReceitas}
                salvando={salvando}
                onSalvar={salvarReceita}
                onVoltar={cancelarFormulario}
              />
            }
          />

          {/* EDITAR RECEITA */}
          <Route
            path="/receitas/:id/editar"
            element={
              <RotaFormulario
                receitas={receitas}
                carregando={aguardandoReceitas}
                salvando={salvando}
                onSalvar={salvarReceita}
                onVoltar={cancelarFormulario}
              />
            }
          />

          {/* DETALHES */}
          <Route
            path="/receitas/:id"
            element={
              <RotaDetalhes
                receitas={receitas}
                carregando={aguardandoReceitas}
                excluindo={excluindo}
                atualizandoCozinheiId={
                  atualizandoCozinheiId
                }
                onVoltar={irParaReceitas}
                onEditar={editarReceita}
                onExcluir={
                  solicitarExclusaoReceita
                }
                onAlternarCozinhei={
                  alternarCozinhei
                }
              />
            }
          />

          {/* PERFIL */}
          <Route
            path="/perfil"
            element={
              <Perfil
                usuario={usuario}
                onVoltar={irParaInicio}
                onUsuarioAtualizado={
                  atualizarUsuario
                }
              />
            }
          />

          {/* PÁGINA INEXISTENTE */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </main>

      {/* ==================================
          RODAPÉ
      ================================== */}

      <Rodape
        location={location}
        irParaInicio={irParaInicio}
        irParaReceitas={irParaReceitas}
        criarReceita={criarReceita}
        abrirPerfil={abrirPerfil}
        sairDaConta={sairDaConta}
        desabilitarSair={salvando || excluindo}
      />

      {/* ==================================
          MODAL DE EXCLUSÃO
      ================================== */}

      <Modal
        aberto={Boolean(receitaParaExcluir)}
        onFechar={cancelarExclusaoReceita}
        variante="perigo"
        processando={excluindo}
        titulo="Excluir receita?"
        descricao={
          "Você está prestes a excluir " +
          "permanentemente esta receita:"
        }
        icone={
          <AlertTriangle size={27} />
        }
        acoes={
          <>
            <button
              type="button"
              className="mk-modal-botao-secundario"
              onClick={cancelarExclusaoReceita}
              disabled={excluindo}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="mk-modal-botao-perigo"
              onClick={confirmarExclusaoReceita}
              disabled={excluindo}
            >
              {excluindo ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="mk-modal-spinner"
                  />

                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={17} />
                  Excluir receita
                </>
              )}
            </button>
          </>
        }
      >
        {receitaParaExcluir && (
          <>
            {/* IDENTIFICAÇÃO */}
            <div className="mk-modal-identificacao">
              {receitaParaExcluir.imagem ? (
                <img
                  src={receitaParaExcluir.imagem}
                  alt=""
                />
              ) : (
                <span className="mk-modal-sem-foto">
                  <ChefHat size={23} />
                </span>
              )}

              <div>
                <strong>
                  {receitaParaExcluir.nome}
                </strong>

                <small>
                  {receitaParaExcluir.categoria}
                </small>
              </div>
            </div>

            {/* AVISO DE EXCLUSÃO */}
            <div className="mk-modal-aviso">
              <AlertTriangle size={19} />

              <div>
                <strong>
                  Esta ação não poderá ser desfeita.
                </strong>

                <p>
                  A receita será removida da sua
                  coleção. Sua fotografia armazenada
                  também será excluída.
                </p>

                <p>
                  Se ela estiver compartilhada,
                  o link deixará de exibir a receita
                  depois da exclusão.
                </p>
              </div>
            </div>

            {/* ERRO */}
            {erroExclusao && (
              <p
                className="mk-modal-erro"
                role="alert"
              >
                {erroExclusao}
              </p>
            )}

            {/* PROCESSANDO */}
            {excluindo && (
              <p
                className="mk-modal-processando"
                role="status"
              >
                <LoaderCircle
                  size={18}
                  className="mk-modal-spinner"
                />

                Excluindo receita...
              </p>
            )}
          </>
        )}
      </Modal>

      {/* NOTIFICAÇÕES */}
      <Notificacao
        dados={notificacao}
        onFechar={() =>
          setNotificacao(null)
        }
      />
    </div>
  );
}

export default App;
