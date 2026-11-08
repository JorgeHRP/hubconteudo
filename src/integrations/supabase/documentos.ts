import type { Documento } from "@/lib/types";
import { exigirSupabase } from "./client";
import { conferir } from "./hub";

/**
 * Contracheques e documentos (`documentos`), com o arquivo no Storage.
 * Quem chama é o `src/data/store.ts`.
 *
 * Dois buckets, conforme o documento:
 *   - pessoal (user_id preenchido) → `documentos`, privado, em `<pessoa>/<arquivo>`.
 *     A pessoa abre só a própria pasta; quem tem o módulo colaboradores, todas.
 *   - institucional (user_id nulo) → `institucional`, público, em `<categoria>/<arquivo>`.
 * O banco recusa registro que aponte para outra pasta (migração 000011).
 */

const CAMPOS =
  "id, user_id, nome, descricao, categoria, competencia, arquivo_url, arquivo_nome, uploaded_by, created_at";

const bucketDe = (d: Pick<Documento, "user_id">) => (d.user_id ? "documentos" : "institucional");
const pastaDe = (d: Pick<Documento, "user_id" | "categoria">) => d.user_id ?? d.categoria;

/** Até 20 MB: PDF, imagem ou os formatos de escritório mais comuns. */
export const DOCUMENTO_MAX_BYTES = 20 * 1024 * 1024;
export const DOCUMENTO_ACEITA =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv";

/** Nome sem acento, espaço nem barra: o Storage recusa alguns caracteres no caminho. */
const nomeSeguro = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/\.{2,}/g, ".").slice(-80) || "arquivo";

export async function listarDocumentosRemoto(): Promise<Documento[]> {
  const { data, error } = await exigirSupabase()
    .from("documentos").select(CAMPOS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Documento[];
}

async function enviarArquivo(doc: Pick<Documento, "user_id" | "categoria">, arquivo: File) {
  if (arquivo.size > DOCUMENTO_MAX_BYTES) throw new Error(`"${arquivo.name}" passa de 20 MB.`);
  const caminho = `${pastaDe(doc)}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
  const { error } = await exigirSupabase().storage.from(bucketDe(doc))
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined, upsert: false });
  if (error) throw new Error(`Não foi possível enviar "${arquivo.name}": ${error.message}`);
  return caminho;
}

async function apagarArquivo(doc: Pick<Documento, "user_id" | "arquivo_url">) {
  if (!doc.arquivo_url) return;
  const { error } = await exigirSupabase().storage.from(bucketDe(doc)).remove([doc.arquivo_url]);
  if (error) console.warn("[documentos] arquivo não removido:", error.message);
}

/**
 * Grava o documento. Com arquivo, ele sobe antes; se o registro não puder ser
 * gravado, o arquivo é apagado para não ficar órfão no bucket.
 */
export async function criarDocumentoRemoto(
  dados: Omit<Documento, "id" | "created_at">, arquivo?: File | null
): Promise<Documento> {
  const caminho = arquivo ? await enviarArquivo(dados, arquivo) : null;
  const linha = {
    ...dados,
    arquivo_url: caminho ?? dados.arquivo_url,
    arquivo_nome: arquivo?.name ?? dados.arquivo_nome,
  };
  try {
    return conferir(
      await exigirSupabase().from("documentos").insert(linha).select(CAMPOS)
    ) as Documento;
  } catch (e) {
    if (caminho) await apagarArquivo({ user_id: dados.user_id, arquivo_url: caminho });
    throw e;
  }
}

export async function removerDocumentoRemoto(id: string) {
  const removido = conferir(
    await exigirSupabase().from("documentos").delete().eq("id", id).select("user_id, arquivo_url")
  ) as Pick<Documento, "user_id" | "arquivo_url">;
  await apagarArquivo(removido);
  return true;
}

/**
 * Endereço para abrir o arquivo. O pessoal é privado: link temporário de 5 min.
 * O institucional é público, mas o link também é pedido na hora, para nunca
 * ficar gravado em lugar nenhum.
 */
export async function linkDocumentoRemoto(doc: Pick<Documento, "user_id" | "arquivo_url" | "arquivo_nome">) {
  if (!doc.arquivo_url) throw new Error("Este documento não tem arquivo.");
  const { data, error } = await exigirSupabase().storage.from(bucketDe(doc))
    .createSignedUrl(doc.arquivo_url, 300, { download: doc.arquivo_nome ?? true });
  if (error || !data) throw new Error("Não foi possível abrir o arquivo.");
  return data.signedUrl;
}
