import { supabase } from "../lib/supabaseClient";

const BUCKET = "recipe-images";
const URL_FOTO_SEGUNDOS = 60 * 60;

/** A foto é privada: só guardamos seu caminho no banco, nunca o link temporário. */
async function obterUrlFoto(caminho) {
  if (!caminho) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, URL_FOTO_SEGUNDOS);
  if (error) throw error;
  return data.signedUrl;
}

export async function listarReceitas(usuarioId) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", usuarioId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Uma imagem indisponível não deve impedir a exibição das demais receitas.
  return Promise.all((data ?? []).map(async (receita) => {
    let imagem = null;
    if (receita.image_path) {
      try {
        imagem = await obterUrlFoto(receita.image_path);
      } catch (erroFoto) {
        console.error("Falha ao carregar fotografia:", erroFoto);
      }
    }
    return { ...receita, imagem };
  }));
}

/**
 * Upload de imagem e atualização do banco não são uma transação única.
 * Se o banco falhar, apagamos a foto nova para evitar arquivos órfãos.
 */
export async function salvarReceitaNoBanco({ dados, usuarioId, receitaOriginal = null }) {
  const editando = Boolean(receitaOriginal);
  const id = receitaOriginal?.id ?? crypto.randomUUID();
  const fotoAnterior = receitaOriginal?.image_path ?? null;
  let caminhoFoto = dados.removerFoto ? null : fotoAnterior;
  let fotoNova = null;
  let salvouNoBanco = false;

  try {
    if (dados.imagemArquivo) {
      const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const extensao = extensoes[dados.imagemArquivo.type];
      if (!extensao) throw new Error("Formato de fotografia não permitido.");

      fotoNova = `${usuarioId}/${id}/${crypto.randomUUID()}.${extensao}`;
      const { error: erroUpload } = await supabase.storage
        .from(BUCKET)
        .upload(fotoNova, dados.imagemArquivo, {
          contentType: dados.imagemArquivo.type,
          upsert: false,
        });
      if (erroUpload) throw erroUpload;
      caminhoFoto = fotoNova;
    }

    const informacoes = {
      nome: dados.nome,
      descricao: dados.descricao,
      categoria: dados.categoria,
      tempo: dados.tempo,
      porcoes: dados.porcoes,
      dificuldade: dados.dificuldade,
      ingredientes: dados.ingredientes,
      preparo: dados.preparo,
      tags: dados.tags,
      observacoes: dados.observacoes || "",
      ja_cozinhei: Boolean(dados.ja_cozinhei),
      image_path: caminhoFoto,
    };

    const consulta = editando
      ? supabase.from("recipes").update(informacoes)
          .eq("id", id).eq("user_id", usuarioId)
      : supabase.from("recipes").insert({ id, user_id: usuarioId, ...informacoes });

    const { data, error } = await consulta.select("*").single();
    if (error) throw error;
    salvouNoBanco = true;

    // Após gravar, falhas na exibição/limpeza da foto são avisos, não erros de gravação.
    const avisos = [];
    let imagem = null;
    if (caminhoFoto === fotoAnterior && receitaOriginal?.imagem) {
      imagem = receitaOriginal.imagem;
    } else if (caminhoFoto) {
      try {
        imagem = await obterUrlFoto(caminhoFoto);
      } catch (erroFoto) {
        console.error("Falha ao obter link da foto:", erroFoto);
        avisos.push("Receita salva, mas a fotografia não pôde ser exibida agora.");
      }
    }

    if (fotoAnterior && fotoAnterior !== caminhoFoto) {
      try {
        const { error: erroRemocao } = await supabase.storage
          .from(BUCKET).remove([fotoAnterior]);
        if (erroRemocao) throw erroRemocao;
      } catch (erroRemocao) {
        console.error("Falha ao apagar a foto anterior:", erroRemocao);
        avisos.push("Receita salva, mas a fotografia anterior não pôde ser removida.");
      }
    }
    return { receita: { ...data, imagem }, aviso: avisos.join(" ") };
  } catch (erro) {
    if (!salvouNoBanco && fotoNova) {
      try {
        const { error: erroLimpeza } = await supabase.storage
          .from(BUCKET).remove([fotoNova]);
        if (erroLimpeza) throw erroLimpeza;
      } catch (erroLimpeza) {
        console.error("Falha ao limpar upload:", erroLimpeza);
      }
    }
    throw erro;
  }
}

export async function atualizarStatusPreparo({ receitaId, usuarioId, preparada }) {
  const { data, error } = await supabase.from("recipes")
    .update({ ja_cozinhei: preparada })
    .eq("id", receitaId)
    .eq("user_id", usuarioId)
    .select("id, ja_cozinhei")
    .single();
  if (error) throw error;
  return data.ja_cozinhei;
}

export async function excluirReceitaNoBanco({ receita, usuarioId }) {
  const { error } = await supabase.from("recipes")
    .delete()
    .eq("id", receita.id)
    .eq("user_id", usuarioId)
    .select("id")
    .single();
  if (error) throw error;
  if (!receita.image_path) return { fotoRemovida: true };

  // O banco já excluiu a receita: a falha ao remover a foto é reportada à parte.
  let fotoRemovida = true;
  try {
    const { error: erroFoto } = await supabase.storage
      .from(BUCKET).remove([receita.image_path]);
    if (erroFoto) throw erroFoto;
  } catch (erroFoto) {
    fotoRemovida = false;
    console.error("Falha ao remover foto excluída:", erroFoto);
  }
  return { fotoRemovida };
}
