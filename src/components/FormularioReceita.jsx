
import { useEffect, useRef, useState } from "react";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChefHat,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  calcularTempo,
  formatarTempo,
  separarTempo,
} from "../utils/tempo";

import {
  CATEGORIAS,
  DIFICULDADES,
  TAGS_DISPONIVEIS,
  UNIDADES,
  normalizarDificuldade,
} from "../config/receitas";

import "./FormularioReceita.css";

// OPÇÕES DO FORMULÁRIO

const NOMES_ETAPAS = [
  "Informações",
  "Ingredientes",
  "Preparo",
  "Finalizar",
];

const TOTAL_ETAPAS = 4;

const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

// Mantém a proteção do salvamento
// depois da transição para a etapa 4.
const INTERVALO_SEGURANCA = 800;

// FUNÇÕES AUXILIARES

function criarIngrediente(dados = {}) {
  return {
    id: crypto.randomUUID(),
    quantidade: String(dados.quantidade ?? ""),
    unidade: dados.unidade || "unidade(s)",
    nome: dados.nome || "",
  };
}

function criarPasso(texto = "") {
  return {
    id: crypto.randomUUID(),
    texto,
  };
}

function trocarPosicao(lista, indice, direcao) {
  const destino = indice + direcao;

  if (destino < 0 || destino >= lista.length) {
    return lista;
  }

  const copia = [...lista];

  [copia[indice], copia[destino]] = [
    copia[destino],
    copia[indice],
  ];

  return copia;
}

// COMPONENTE PRINCIPAL

function FormularioReceita({
  receitaInicial = null,
  onSalvar,
  onCancelar,
  salvando = false,
}) {
  const editando = Boolean(receitaInicial);

  const inputFotoRef = useRef(null);

  // Impede chamadas simultâneas ao salvamento.
  const salvamentoEmAndamentoRef = useRef(false);

  const tempoInicial = separarTempo(
    receitaInicial?.tempo
  );

  // ETAPAS DO FORMULÁRIO

  const [etapaAtual, setEtapaAtual] = useState(1);

  const [podeSalvar, setPodeSalvar] = useState(false);

  useEffect(() => {
    setPodeSalvar(false);

    if (etapaAtual !== TOTAL_ETAPAS) {
      return;
    }

    // Evita salvar por um clique repetido
    // logo após avançar da etapa 3.
    const temporizador = setTimeout(() => {
      setPodeSalvar(true);
    }, INTERVALO_SEGURANCA);

    return () => {
      clearTimeout(temporizador);
    };
  }, [etapaAtual]);

  // INFORMAÇÕES GERAIS

  const [nome, setNome] = useState(
    receitaInicial?.nome || ""
  );

  const [descricao, setDescricao] = useState(
    receitaInicial?.descricao || ""
  );

  const [categoria, setCategoria] = useState(
    receitaInicial?.categoria || ""
  );

  const [horas, setHoras] = useState(
    tempoInicial.horas
  );

  const [minutos, setMinutos] = useState(
    tempoInicial.minutos
  );

  const [dificuldade, setDificuldade] = useState(
    normalizarDificuldade(
      receitaInicial?.dificuldade
    )
  );

  const [porcoes, setPorcoes] = useState(
    receitaInicial?.porcoes == null
      ? ""
      : String(receitaInicial.porcoes)
  );

  // INGREDIENTES

  const [ingredientes, setIngredientes] = useState(
    () => {
      const lista = receitaInicial?.ingredientes;

      if (
        Array.isArray(lista) &&
        lista.length > 0
      ) {
        return lista.map(criarIngrediente);
      }

      return [criarIngrediente()];
    }
  );

  // MODO DE PREPARO

  const [passos, setPassos] = useState(() => {
    const lista = receitaInicial?.preparo;

    if (
      Array.isArray(lista) &&
      lista.length > 0
    ) {
      return lista.map((item) =>
        criarPasso(
          typeof item === "string"
            ? item
            : item?.texto || ""
        )
      );
    }

    return [criarPasso()];
  });

  // INFORMAÇÕES COMPLEMENTARES

  const [tags, setTags] = useState(
    Array.isArray(receitaInicial?.tags)
      ? receitaInicial.tags
      : []
  );

  const [observacoes, setObservacoes] = useState(
    receitaInicial?.observacoes || ""
  );

  const [jaCozinhei, setJaCozinhei] = useState(
    Boolean(receitaInicial?.ja_cozinhei)
  );

  // FOTOGRAFIA

  const [imagemArquivo, setImagemArquivo] =
    useState(null);

  const [removerFoto, setRemoverFoto] =
    useState(false);

  const [previewFoto, setPreviewFoto] =
    useState("");

  const [erroFoto, setErroFoto] = useState("");

  // ERROS

  const [erros, setErros] = useState({});

  const [erroGeral, setErroGeral] = useState("");

  // PRÉVIA DA FOTOGRAFIA

  useEffect(() => {
    if (!imagemArquivo) {
      setPreviewFoto("");
      return;
    }

    const url = URL.createObjectURL(imagemArquivo);

    setPreviewFoto(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imagemArquivo]);

  const fotoExibida = removerFoto
    ? null
    : previewFoto || receitaInicial?.imagem || null;

  // INGREDIENTES

  function alterarIngrediente(id, campo, valor) {
    setIngredientes((anteriores) =>
      anteriores.map((item) =>
        item.id === id
          ? { ...item, [campo]: valor }
          : item
      )
    );

    setErros((anteriores) => ({
      ...anteriores,
      ingredientes: "",
    }));
  }

  function adicionarIngrediente() {
    setIngredientes((anteriores) => [
      ...anteriores,
      criarIngrediente(),
    ]);
  }

  function removerIngrediente(id) {
    setIngredientes((anteriores) =>
      anteriores.length === 1
        ? anteriores
        : anteriores.filter(
            (item) => item.id !== id
          )
    );
  }

  function moverIngrediente(indice, direcao) {
    setIngredientes((anteriores) =>
      trocarPosicao(
        anteriores,
        indice,
        direcao
      )
    );
  }

  // PASSOS DO PREPARO

  function alterarPasso(id, texto) {
    setPassos((anteriores) =>
      anteriores.map((passo) =>
        passo.id === id
          ? { ...passo, texto }
          : passo
      )
    );

    setErros((anteriores) => ({
      ...anteriores,
      preparo: "",
    }));
  }

  function adicionarPasso() {
    setPassos((anteriores) => [
      ...anteriores,
      criarPasso(),
    ]);
  }

  function removerPasso(id) {
    setPassos((anteriores) =>
      anteriores.length === 1
        ? anteriores
        : anteriores.filter(
            (passo) => passo.id !== id
          )
    );
  }

  function moverPasso(indice, direcao) {
    setPassos((anteriores) =>
      trocarPosicao(
        anteriores,
        indice,
        direcao
      )
    );
  }

  // TAGS

  function alternarTag(tag) {
    setTags((anteriores) =>
      anteriores.includes(tag)
        ? anteriores.filter(
            (item) => item !== tag
          )
        : [...anteriores, tag]
    );
  }

  // FOTOGRAFIA

  function selecionarFoto(evento) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setErroFoto("");

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
      setErroFoto(
        "Escolha uma imagem JPG, PNG ou WebP."
      );

      evento.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setErroFoto(
        "A fotografia deve ter no máximo 5 MB."
      );

      evento.target.value = "";
      return;
    }

    setImagemArquivo(arquivo);
    setRemoverFoto(false);
  }

  function limparFoto() {
    setImagemArquivo(null);

    setRemoverFoto(
      Boolean(receitaInicial?.image_path)
    );

    setErroFoto("");

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }
  }

  // VALIDAÇÃO DAS ETAPAS

  function obterErrosDaEtapa(numero) {
    const novosErros = {};

    // ETAPA 1 - INFORMAÇÕES
    if (numero === 1) {
      if (!nome.trim()) {
        novosErros.nome =
          "Informe o nome da receita.";
      } else if (nome.trim().length > 120) {
        novosErros.nome =
          "O nome deve ter no máximo 120 caracteres.";
      }

      if (descricao.length > 500) {
        novosErros.descricao =
          "A descrição deve ter no máximo 500 caracteres.";
      }

      if (!categoria) {
        novosErros.categoria =
          "Selecione uma categoria.";
      }

      if (calcularTempo(horas, minutos) === null) {
        novosErros.tempo =
          "Informe um tempo entre 1 minuto e 24 horas.";
      }

      if (
        porcoes !== "" &&
        (
          !Number.isInteger(Number(porcoes)) ||
          Number(porcoes) < 1 ||
          Number(porcoes) > 100
        )
      ) {
        novosErros.porcoes =
          "Informe de 1 a 100 porções.";
      }

      // Garante que a dificuldade seja válida.
      if (!DIFICULDADES.includes(dificuldade)) {
        novosErros.dificuldade =
          "Selecione um nível de dificuldade válido.";
      }
    }

    // ETAPA 2 - INGREDIENTES
    if (numero === 2) {
      const invalido = ingredientes.some(
        (item) =>
          !String(item.quantidade).trim() ||
          !item.nome.trim()
      );

      if (invalido) {
        novosErros.ingredientes =
          "Preencha a quantidade e o nome de todos os ingredientes.";
      }
    }

    // ETAPA 3 - PREPARO
    if (numero === 3) {
      const invalido = passos.some(
        (passo) => !passo.texto.trim()
      );

      if (invalido) {
        novosErros.preparo =
          "Preencha todos os passos do modo de preparo.";
      }
    }

    // ETAPA 4 - FINALIZAR
    if (numero === 4) {
      if (observacoes.length > 1000) {
        novosErros.observacoes =
          "As observações devem ter no máximo 1.000 caracteres.";
      }

      if (erroFoto) {
        novosErros.foto = erroFoto;
      }
    }

    return novosErros;
  }

  function validarEtapa(numero) {
    const novosErros =
      obterErrosDaEtapa(numero);

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  // PRÓXIMA ETAPA

  function avancarEtapa() {
    if (salvando) {
      return;
    }

    if (etapaAtual >= TOTAL_ETAPAS) {
      return;
    }

    setErroGeral("");

    if (!validarEtapa(etapaAtual)) {
      return;
    }

    // Apenas avança.
    // Não salva dados no Supabase.
    setEtapaAtual((anterior) =>
      Math.min(TOTAL_ETAPAS, anterior + 1)
    );
  }

  // VOLTAR ETAPA

  function voltarEtapa() {
    if (salvando) {
      return;
    }

    setErroGeral("");
    setErros({});

    setEtapaAtual((anterior) =>
      Math.max(1, anterior - 1)
    );
  }

  // SALVAR RECEITA

  async function confirmarSalvamento() {
    // PROTEÇÃO DO FORMULÁRIO:
    // Só permite salvar na quarta etapa.
    if (
      etapaAtual !== TOTAL_ETAPAS ||
      !podeSalvar ||
      salvando ||
      salvamentoEmAndamentoRef.current
    ) {
      return;
    }

    // Confere todas as etapas antes de salvar.
    for (
      let numero = 1;
      numero <= TOTAL_ETAPAS;
      numero++
    ) {
      const errosEncontrados =
        obterErrosDaEtapa(numero);

      if (
        Object.keys(errosEncontrados).length > 0
      ) {
        setErros(errosEncontrados);
        setEtapaAtual(numero);

        setErroGeral(
          "Revise os campos indicados antes de salvar."
        );

        return;
      }
    }

    setErros({});
    setErroGeral("");

    const ingredientesLimpos =
      ingredientes.map((item) => ({
        quantidade: String(
          item.quantidade
        ).trim(),

        unidade: item.unidade,
        nome: item.nome.trim(),
      }));

    const preparo = passos.map(
      (passo) => passo.texto.trim()
    );

    const dadosReceita = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      categoria,

      tempo: calcularTempo(horas, minutos),

      porcoes:
        porcoes === ""
          ? null
          : Number(porcoes),

      dificuldade,
      ingredientes: ingredientesLimpos,
      preparo,
      tags,

      observacoes: observacoes.trim(),
      ja_cozinhei: jaCozinhei,

      imagemArquivo,
      removerFoto,
    };

    // Único ponto em que onSalvar é chamado.
    salvamentoEmAndamentoRef.current = true;

    try {
      await onSalvar(dadosReceita);
    } catch (erroRecebido) {
      console.error(
        "Erro ao solicitar salvamento:",
        erroRecebido
      );

      setErroGeral(
        "Não foi possível salvar a receita."
      );
    } finally {
      salvamentoEmAndamentoRef.current = false;
    }
  }

  // IMPEDIR SUBMIT AUTOMÁTICO

  function impedirEnvioAutomatico(evento) {
    // Impede que Enter ou um submit inesperado
    // salve a receita antes da hora.
    evento.preventDefault();
  }

  // EXIBIR ERROS

  function mensagemErro(campo) {
    if (!erros[campo]) {
      return null;
    }

    return (
      <small
        className="form-erro"
        role="alert"
      >
        {erros[campo]}
      </small>
    );
  }

  // INTERFACE

  return (
    <form
      className="form-receita"
      onSubmit={impedirEnvioAutomatico}
      noValidate
    >
      {/* ==================================
          1. CABEÇALHO
      ================================== */}

      <div className="form-topo">
        <div>
          <span className="subtitulo">
            SUA COZINHA
          </span>

          <h2>
            {editando
              ? "Editar receita"
              : "Criar nova receita"}
          </h2>

          <p>
            {editando
              ? "Atualize as informações da sua receita."
              : "Registre seus ingredientes e o modo de preparo."}
          </p>
        </div>

        <button
          type="button"
          className="form-botao-secundario"
          onClick={onCancelar}
          disabled={salvando}
        >
          <X size={17} />
          Cancelar
        </button>
      </div>

      {/* ==================================
          2. INDICADORES DAS ETAPAS
      ================================== */}

      <div
        className="form-etapas"
        aria-label="Progresso do formulário"
      >
        {NOMES_ETAPAS.map((titulo, indice) => {
          const numero = indice + 1;

          return (
            <div
              key={titulo}
              className={
                "form-etapa-indicador " +
                (
                  numero === etapaAtual
                    ? "atual"
                    : numero < etapaAtual
                      ? "concluida"
                      : ""
                )
              }
              aria-current={
                numero === etapaAtual
                  ? "step"
                  : undefined
              }
            >
              <span className="form-etapa-numero">
                {numero < etapaAtual ? (
                  <Check size={16} />
                ) : (
                  numero
                )}
              </span>

              <span className="form-etapa-texto">
                {titulo}
              </span>
            </div>
          );
        })}
      </div>

      {/* BARRA DE PROGRESSO */}
      <div className="form-progresso">
        <div
          style={{
            width:
              `${(etapaAtual / TOTAL_ETAPAS) * 100}%`,
          }}
        />
      </div>

      {/* ETAPA ATUAL */}
      <div className="form-etapa-cabecalho">
        <div>
          <span className="form-etapa-contador">
            ETAPA {etapaAtual} DE {TOTAL_ETAPAS}
          </span>

          <h3>
            {NOMES_ETAPAS[etapaAtual - 1]}
          </h3>
        </div>
      </div>

      <fieldset
        className="form-conteudo-campos"
        disabled={salvando}
      >
        {/* ==================================
            ETAPA 1 - INFORMAÇÕES
        ================================== */}

        {etapaAtual === 1 && (
          <div className="form-secao">
            {/* NOME */}
            <div className="form-campo">
              <label htmlFor="nome-receita">
                Nome da receita
                <span className="form-obrigatorio">
                  {" "}*
                </span>
              </label>

              <input
                id="nome-receita"
                type="text"
                maxLength={120}
                placeholder="Ex.: Lasanha à bolonhesa"
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value);

                  setErros((anteriores) => ({
                    ...anteriores,
                    nome: "",
                  }));
                }}
                aria-invalid={Boolean(erros.nome)}
              />

              {mensagemErro("nome")}
            </div>

            {/* DESCRIÇÃO */}
            <div className="form-campo">
              <label htmlFor="descricao-receita">
                Descrição (opcional)
              </label>

              <textarea
                id="descricao-receita"
                rows={3}
                maxLength={500}
                placeholder="Conte um pouco sobre essa receita..."
                value={descricao}
                onChange={(evento) =>
                  setDescricao(evento.target.value)
                }
              />

              <small className="form-ajuda">
                {descricao.length}/500 caracteres
              </small>

              {mensagemErro("descricao")}
            </div>

            <div className="form-linha">
              {/* CATEGORIA */}
              <div className="form-campo">
                <label htmlFor="categoria-receita">
                  Categoria
                  <span className="form-obrigatorio">
                    {" "}*
                  </span>
                </label>

                <select
                  id="categoria-receita"
                  value={categoria}
                  onChange={(evento) => {
                    setCategoria(evento.target.value);

                    setErros((anteriores) => ({
                      ...anteriores,
                      categoria: "",
                    }));
                  }}
                  aria-invalid={
                    Boolean(erros.categoria)
                  }
                >
                  <option value="">
                    Selecione uma categoria
                  </option>

                  {CATEGORIAS.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                {mensagemErro("categoria")}
              </div>

              {/* TEMPO DE PREPARO */}
              <div className="form-campo form-campo-tempo">
                <label
                  id="rotulo-tempo"
                  className="form-rotulo-tempo"
                >
                  Tempo de preparo
                  <span className="form-obrigatorio">
                    {" "}*
                  </span>
                </label>

                <div
                  className="form-tempo-campos"
                  role="group"
                  aria-labelledby="rotulo-tempo"
                >
                  {/* HORAS */}
                  <div className="form-tempo-item">
                    <label htmlFor="horas-receita">
                      Horas
                    </label>

                    <input
                      id="horas-receita"
                      type="number"
                      min="0"
                      max="24"
                      step="1"
                      placeholder="0"
                      value={horas}
                      onChange={(evento) => {
                        setHoras(evento.target.value);

                        setErros((anteriores) => ({
                          ...anteriores,
                          tempo: "",
                        }));
                      }}
                      aria-invalid={
                        Boolean(erros.tempo)
                      }
                    />
                  </div>

                  {/* MINUTOS */}
                  <div className="form-tempo-item">
                    <label htmlFor="minutos-receita">
                      Minutos
                    </label>

                    <input
                      id="minutos-receita"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      placeholder="30"
                      value={minutos}
                      onChange={(evento) => {
                        setMinutos(evento.target.value);

                        setErros((anteriores) => ({
                          ...anteriores,
                          tempo: "",
                        }));
                      }}
                      aria-invalid={
                        Boolean(erros.tempo)
                      }
                    />
                  </div>
                </div>

                <small className="form-tempo-ajuda">
                  Preencha pelo menos um dos campos.
                </small>

                {mensagemErro("tempo")}
              </div>
            </div>

            <div className="form-linha">
              {/* DIFICULDADE */}
              <div className="form-campo">
                <label htmlFor="dificuldade-receita">
                  Dificuldade
                </label>

                <select
                  id="dificuldade-receita"
                  value={dificuldade}
                  onChange={(evento) => {
                    setDificuldade(
                      evento.target.value
                    );

                    setErros((anteriores) => ({
                      ...anteriores,
                      dificuldade: "",
                    }));
                  }}
                  aria-invalid={
                    Boolean(erros.dificuldade)
                  }
                >
                  {DIFICULDADES.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                {mensagemErro("dificuldade")}
              </div>

              {/* PORÇÕES */}
              <div className="form-campo">
                <label htmlFor="porcoes-receita">
                  Porções (opcional)
                </label>

                <input
                  id="porcoes-receita"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="Ex.: 4"
                  value={porcoes}
                  onChange={(evento) => {
                    setPorcoes(evento.target.value);

                    setErros((anteriores) => ({
                      ...anteriores,
                      porcoes: "",
                    }));
                  }}
                  aria-invalid={
                    Boolean(erros.porcoes)
                  }
                />

                {mensagemErro("porcoes")}
              </div>
            </div>
          </div>
        )}

        {/* ==================================
            ETAPA 2 - INGREDIENTES
        ================================== */}

        {etapaAtual === 2 && (
          <div className="form-secao">
            <p className="form-legenda">
              Informe os ingredientes e suas
              quantidades na ordem que preferir.
            </p>

            <div className="form-lista-itens">
              {ingredientes.map((item, indice) => (
                <div
                  className="form-item-grupo"
                  key={item.id}
                >
                  <div className="form-item-topo">
                    <strong>
                      Ingrediente {indice + 1}
                    </strong>

                    <div className="form-item-acoes">
                      <button
                        type="button"
                        title="Mover para cima"
                        aria-label={
                          `Mover ingrediente ${indice + 1} para cima`
                        }
                        disabled={indice === 0}
                        onClick={() =>
                          moverIngrediente(
                            indice,
                            -1
                          )
                        }
                      >
                        <ArrowUp size={17} />
                      </button>

                      <button
                        type="button"
                        title="Mover para baixo"
                        aria-label={
                          `Mover ingrediente ${indice + 1} para baixo`
                        }
                        disabled={
                          indice ===
                          ingredientes.length - 1
                        }
                        onClick={() =>
                          moverIngrediente(
                            indice,
                            1
                          )
                        }
                      >
                        <ArrowDown size={17} />
                      </button>

                      <button
                        type="button"
                        title="Remover ingrediente"
                        aria-label={
                          `Remover ingrediente ${indice + 1}`
                        }
                        disabled={
                          ingredientes.length === 1
                        }
                        onClick={() =>
                          removerIngrediente(
                            item.id
                          )
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="form-ingrediente">
                    {/* QUANTIDADE */}
                    <div className="form-campo">
                      <label
                        htmlFor={`quantidade-${item.id}`}
                      >
                        Quantidade *
                      </label>

                      <input
                        id={`quantidade-${item.id}`}
                        type="text"
                        placeholder="Ex.: 2 ou 1/2"
                        value={item.quantidade}
                        onChange={(evento) =>
                          alterarIngrediente(
                            item.id,
                            "quantidade",
                            evento.target.value
                          )
                        }
                      />
                    </div>

                    {/* UNIDADE */}
                    <div className="form-campo">
                      <label
                        htmlFor={`unidade-${item.id}`}
                      >
                        Unidade
                      </label>

                      <select
                        id={`unidade-${item.id}`}
                        value={item.unidade}
                        onChange={(evento) =>
                          alterarIngrediente(
                            item.id,
                            "unidade",
                            evento.target.value
                          )
                        }
                      >
                        {UNIDADES.map((unidade) => (
                          <option
                            key={unidade}
                            value={unidade}
                          >
                            {unidade}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* INGREDIENTE */}
                    <div className="form-campo">
                      <label
                        htmlFor={`ingrediente-${item.id}`}
                      >
                        Ingrediente *
                      </label>

                      <input
                        id={`ingrediente-${item.id}`}
                        type="text"
                        placeholder="Ex.: farinha de trigo"
                        value={item.nome}
                        onChange={(evento) =>
                          alterarIngrediente(
                            item.id,
                            "nome",
                            evento.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mensagemErro("ingredientes")}

            <button
              type="button"
              className="form-botao-adicionar"
              onClick={adicionarIngrediente}
            >
              <Plus size={18} />
              Adicionar ingrediente
            </button>
          </div>
        )}

        {/* ==================================
            ETAPA 3 - PREPARO
        ================================== */}

        {etapaAtual === 3 && (
          <div className="form-secao">
            <p className="form-legenda">
              Descreva o preparo em etapas simples.
              Você poderá reorganizá-las.
            </p>

            <div className="form-lista-itens">
              {passos.map((passo, indice) => (
                <div
                  className="form-item-grupo"
                  key={passo.id}
                >
                  <div className="form-item-topo">
                    <strong>
                      Passo {indice + 1}
                    </strong>

                    <div className="form-item-acoes">
                      <button
                        type="button"
                        title="Mover para cima"
                        aria-label={
                          `Mover passo ${indice + 1} para cima`
                        }
                        disabled={indice === 0}
                        onClick={() =>
                          moverPasso(indice, -1)
                        }
                      >
                        <ArrowUp size={17} />
                      </button>

                      <button
                        type="button"
                        title="Mover para baixo"
                        aria-label={
                          `Mover passo ${indice + 1} para baixo`
                        }
                        disabled={
                          indice === passos.length - 1
                        }
                        onClick={() =>
                          moverPasso(indice, 1)
                        }
                      >
                        <ArrowDown size={17} />
                      </button>

                      <button
                        type="button"
                        title="Remover passo"
                        aria-label={
                          `Remover passo ${indice + 1}`
                        }
                        disabled={
                          passos.length === 1
                        }
                        onClick={() =>
                          removerPasso(passo.id)
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="form-campo">
                    <label
                      htmlFor={`passo-${passo.id}`}
                    >
                      Instrução *
                    </label>

                    <textarea
                      id={`passo-${passo.id}`}
                      rows={3}
                      placeholder="Explique o que deve ser feito..."
                      value={passo.texto}
                      onChange={(evento) =>
                        alterarPasso(
                          passo.id,
                          evento.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {mensagemErro("preparo")}

            <button
              type="button"
              className="form-botao-adicionar"
              onClick={adicionarPasso}
            >
              <Plus size={18} />
              Adicionar passo
            </button>
          </div>
        )}

        {/* ==================================
            ETAPA 4 - FINALIZAR
        ================================== */}

        {etapaAtual === 4 && (
          <div className="form-secao">
            {/* TAGS */}
            <div className="form-finalizacao">
              <h4>Tags (opcional)</h4>

              <p className="form-legenda">
                Escolha características que ajudam
                a identificar sua receita.
              </p>

              <div className="form-tags">
                {TAGS_DISPONIVEIS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={
                      tags.includes(tag)
                        ? "form-tag selecionada"
                        : "form-tag"
                    }
                    aria-pressed={
                      tags.includes(tag)
                    }
                    onClick={() =>
                      alternarTag(tag)
                    }
                  >
                    {tags.includes(tag) && (
                      <Check size={15} />
                    )}

                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* FOTOGRAFIA */}
            <div className="form-finalizacao">
              <h4>Fotografia (opcional)</h4>

              <p className="form-legenda">
                Escolha uma foto JPG, PNG ou WebP
                com até 5 MB.
              </p>

              <div className="form-foto-area">
                {fotoExibida ? (
                  <div className="form-preview-container">
                    <img
                      className="form-preview"
                      src={fotoExibida}
                      alt="Prévia da receita"
                    />

                    <button
                      type="button"
                      className="form-remover-foto"
                      onClick={limparFoto}
                    >
                      <Trash2 size={16} />
                      Remover foto
                    </button>
                  </div>
                ) : (
                  <span className="form-foto-vazia">
                    <ChefHat size={43} />
                    Nenhuma fotografia selecionada
                  </span>
                )}

                <label
                  className="form-botao-adicionar"
                  htmlFor="foto-receita"
                >
                  <ImagePlus size={18} />
                  Escolher fotografia
                </label>

                <input
                  ref={inputFotoRef}
                  id="foto-receita"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarFoto}
                  className="form-input-foto"
                />
              </div>

              {erroFoto && (
                <small
                  className="form-erro"
                  role="alert"
                >
                  {erroFoto}
                </small>
              )}
            </div>

            {/* OBSERVAÇÕES */}
            <div className="form-finalizacao">
              <h4>Observações (opcional)</h4>

              <div className="form-campo">
                <label htmlFor="observacoes-receita">
                  Dicas e anotações
                </label>

                <textarea
                  id="observacoes-receita"
                  className="form-observacoes"
                  rows={5}
                  maxLength={1000}
                  placeholder="Ex.: Na próxima vez, usar menos açúcar..."
                  value={observacoes}
                  onChange={(evento) => {
                    setObservacoes(
                      evento.target.value
                    );

                    setErros((anteriores) => ({
                      ...anteriores,
                      observacoes: "",
                    }));
                  }}
                  aria-invalid={
                    Boolean(erros.observacoes)
                  }
                />

                <small className="form-ajuda">
                  {observacoes.length}/1000 caracteres
                </small>

                {mensagemErro("observacoes")}
              </div>
            </div>

            {/* RECEITA PREPARADA */}
            <div className="form-finalizacao">
              <h4>
                Você já preparou esta receita?
              </h4>

              <label className="form-cozinhei-opcao">
                <input
                  type="checkbox"
                  checked={jaCozinhei}
                  onChange={(evento) =>
                    setJaCozinhei(
                      evento.target.checked
                    )
                  }
                />

                <span className="form-cozinhei-icone">
                  <CheckCircle2 size={23} />
                </span>

                <span>
                  <strong>
                    Já preparei esta receita
                  </strong>

                  <small>
                    Marque se você já fez esse prato.
                    Ele receberá um selo na sua coleção.
                  </small>
                </span>
              </label>
            </div>

            {/* RESUMO */}
            <div className="form-revisao">
              <h4>Resumo da receita</h4>

              <p>
                <strong>Nome:</strong>{" "}
                {nome || "Não informado"}
              </p>

              <p>
                <strong>Categoria:</strong>{" "}
                {categoria || "Não informada"}
              </p>

              <p>
                <strong>Tempo:</strong>{" "}
                {formatarTempo(
                  calcularTempo(horas, minutos)
                )}
              </p>

              <p>
                <strong>Dificuldade:</strong>{" "}
                {dificuldade}
              </p>

              <p>
                <strong>Ingredientes:</strong>{" "}
                {ingredientes.length}
              </p>

              <p>
                <strong>Passos:</strong>{" "}
                {passos.length}
              </p>

              <p>
                <strong>Já preparei:</strong>{" "}
                {jaCozinhei ? "Sim" : "Não"}
              </p>
            </div>
          </div>
        )}
      </fieldset>

      {/* ==================================
          MENSAGENS DE ERRO
      ================================== */}

      {erroGeral && (
        <p
          className="form-resumo-erro"
          role="alert"
        >
          {erroGeral}
        </p>
      )}

      {/* ==================================
          NAVEGAÇÃO DO FORMULÁRIO
      ================================== */}

      <div className="form-navegacao">
        {/* VOLTAR */}
        {etapaAtual > 1 ? (
          <button
            type="button"
            className="form-voltar"
            onClick={voltarEtapa}
            disabled={salvando}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        ) : (
          <button
            type="button"
            className="form-voltar"
            onClick={onCancelar}
            disabled={salvando}
          >
            <X size={18} />
            Cancelar
          </button>
        )}

        {/* PRÓXIMA ETAPA */}
        {etapaAtual < TOTAL_ETAPAS ? (
          <button
            key={`avancar-${etapaAtual}`}
            type="button"
            className="form-salvar"
            onClick={avancarEtapa}
            disabled={salvando}
          >
            Próxima etapa
            <ArrowRight size={18} />
          </button>
        ) : (
          /* SALVAR SOMENTE NA ETAPA 4 */
          <button
            key="confirmar-salvamento"
            type="button"
            className="form-salvar"
            onClick={confirmarSalvamento}
            disabled={
              salvando || !podeSalvar
            }
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : !podeSalvar
                ? "Preparando..."
                : editando
                  ? "Salvar alterações"
                  : "Salvar receita"}
          </button>
        )}
      </div>
    </form>
  );
}

export default FormularioReceita;
