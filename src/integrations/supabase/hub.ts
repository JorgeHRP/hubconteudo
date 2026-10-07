import type {
  Comentario, Evento, Post, PostTipo, Solicitacao, SolicitacaoStatus,
} from "@/lib/types";
import { exigirSupabase } from "./client";

/**
 * Hub no banco: mural, calendário e solicitações.
 * Quem chama é o `src/data/store.ts`; as telas não conhecem este arquivo.
 *
 * Policy que barra uma alteração não devolve erro, só não altera nenhuma linha.
 * Por isso toda gravação pede a linha de volta e reclama quando ela não vem.
 */

const SEM_PERMISSAO = "Você não tem permissão para fazer isto.";

function conferir<T>(resposta: { data: T[] | null; error: { message: string } | null }): T {
  if (resposta.error) throw new Error(resposta.error.message);
  if (!resposta.data?.length) throw new Error(SEM_PERMISSAO);
  return resposta.data[0];
}

/* ---------------- mural ---------------- */

const CAMPOS_POST =
  "id, autor_id, conteudo, tipo, fixado, imagem_url, created_at, " +
  "post_curtidas(user_id), comentarios(id, post_id, autor_id, conteudo, created_at)";

interface LinhaPost extends Omit<Post, "curtidas" | "comentarios"> {
  post_curtidas: { user_id: string }[] | null;
  comentarios: Comentario[] | null;
}

function montarPost(linha: LinhaPost): Post {
  const { post_curtidas, comentarios, ...post } = linha;
  return {
    ...post,
    curtidas: (post_curtidas ?? []).map((c) => c.user_id),
    comentarios: [...(comentarios ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

export async function listarPostsRemoto(): Promise<Post[]> {
  const { data, error } = await exigirSupabase()
    .from("posts")
    .select(CAMPOS_POST)
    .order("fixado", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LinhaPost[]).map(montarPost);
}

export async function criarPostRemoto(autor_id: string, conteudo: string, tipo: PostTipo) {
  const linha = conferir(
    await exigirSupabase().from("posts").insert({ autor_id, conteudo, tipo }).select(CAMPOS_POST)
  );
  return montarPost(linha as unknown as LinhaPost);
}

export async function alternarCurtidaRemoto(post_id: string, user_id: string) {
  const sb = exigirSupabase();
  const atual = await sb
    .from("post_curtidas").select("id").eq("post_id", post_id).eq("user_id", user_id);
  if (atual.error) throw new Error(atual.error.message);

  const { error } = atual.data?.length
    ? await sb.from("post_curtidas").delete().eq("post_id", post_id).eq("user_id", user_id)
    : await sb.from("post_curtidas").insert({ post_id, user_id });
  if (error) throw new Error(error.message);
}

export async function comentarRemoto(post_id: string, autor_id: string, conteudo: string) {
  conferir(
    await exigirSupabase().from("comentarios").insert({ post_id, autor_id, conteudo }).select("id")
  );
}

export async function alternarFixadoRemoto(post_id: string) {
  const sb = exigirSupabase();
  const atual = await sb.from("posts").select("fixado").eq("id", post_id).maybeSingle();
  if (atual.error) throw new Error(atual.error.message);
  if (!atual.data) throw new Error("Publicação não encontrada.");

  conferir(
    await sb.from("posts").update({ fixado: !atual.data.fixado }).eq("id", post_id).select("id")
  );
}

export async function removerPostRemoto(post_id: string) {
  conferir(await exigirSupabase().from("posts").delete().eq("id", post_id).select("id"));
}

/* ---------------- calendário ---------------- */

const CAMPOS_EVENTO = "id, titulo, data, tipo, descricao, criado_por";

export async function listarEventosRemoto(): Promise<Evento[]> {
  const { data, error } = await exigirSupabase()
    .from("eventos").select(CAMPOS_EVENTO).order("data");
  if (error) throw new Error(error.message);
  return (data ?? []) as Evento[];
}

export async function criarEventoRemoto(dados: Omit<Evento, "id">) {
  return conferir(
    await exigirSupabase().from("eventos").insert(dados).select(CAMPOS_EVENTO)
  ) as Evento;
}

export async function removerEventoRemoto(id: string) {
  conferir(await exigirSupabase().from("eventos").delete().eq("id", id).select("id"));
}

/* ---------------- solicitações ---------------- */

const CAMPOS_SOLICITACAO =
  "id, solicitante_id, categoria, titulo, descricao, status, created_at, updated_at";

/** Cada pessoa recebe as próprias; gestores recebem todas — é o que as policies devolvem. */
export async function listarSolicitacoesRemoto(): Promise<Solicitacao[]> {
  const { data, error } = await exigirSupabase()
    .from("solicitacoes").select(CAMPOS_SOLICITACAO).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Solicitacao[];
}

export async function criarSolicitacaoRemoto(
  solicitante_id: string, categoria: string, titulo: string, descricao: string
) {
  return conferir(
    await exigirSupabase()
      .from("solicitacoes")
      .insert({ solicitante_id, categoria, titulo, descricao })
      .select(CAMPOS_SOLICITACAO)
  ) as Solicitacao;
}

export async function mudarStatusSolicitacaoRemoto(id: string, status: SolicitacaoStatus) {
  return conferir(
    await exigirSupabase()
      .from("solicitacoes").update({ status }).eq("id", id).select(CAMPOS_SOLICITACAO)
  ) as Solicitacao;
}
