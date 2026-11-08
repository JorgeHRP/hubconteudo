import { exigirSupabase } from "./client";

/**
 * Envio e abertura de arquivos no Storage. Quem chama é o `src/data/store.ts`.
 *
 *   avatars        público   `<pessoa>/<arquivo>`          foto de perfil
 *   posts          público   `<autor>/<arquivo>`           imagem do mural
 *   institucional  público   `capas/<arquivo>`             capa de trilha e curso
 *   anexos         privado   `tarefas/<tarefa>/<arquivo>`  anexos do quadro de tarefas
 *
 * Quem pode enviar, abrir e apagar em cada um é conferido no banco (migrações
 * 000001, 000002 e 000012).
 */

export type Bucket = "avatars" | "posts" | "institucional" | "anexos";

export const MB = 1024 * 1024;
export const LIMITE_IMAGEM = 5 * MB;
export const LIMITE_ANEXO = 25 * MB;

/** Nome sem acento, espaço nem barra: o Storage recusa alguns caracteres no caminho. */
export const nomeSeguro = (nome: string) =>
  nome.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/\.{2,}/g, ".").slice(-80) || "arquivo";

export function conferirImagem(arquivo: File, limite = LIMITE_IMAGEM) {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha uma imagem (JPG, PNG ou WEBP).");
  if (arquivo.size > limite) {
    throw new Error(`A imagem tem ${(arquivo.size / MB).toFixed(1)} MB. O limite é ${limite / MB} MB.`);
  }
}

/** Sobe o arquivo em `<pasta>/<id>-<nome>` e devolve o caminho dentro do bucket. */
export async function enviarArquivo(bucket: Bucket, pasta: string, arquivo: File) {
  const caminho = `${pasta}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
  const { error } = await exigirSupabase().storage.from(bucket)
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined, upsert: false });
  if (error) throw new Error(`Não foi possível enviar "${arquivo.name}": ${error.message}`);
  return caminho;
}

/** Endereço fixo de um arquivo em bucket público. */
export const urlPublica = (bucket: Bucket, caminho: string) =>
  exigirSupabase().storage.from(bucket).getPublicUrl(caminho).data.publicUrl;

/** Sobe e devolve o endereço público (avatars, posts, institucional). */
export async function enviarPublico(bucket: Bucket, pasta: string, arquivo: File) {
  return urlPublica(bucket, await enviarArquivo(bucket, pasta, arquivo));
}

/** O caminho dentro do bucket, a partir do endereço público. Null se não for dele. */
export function caminhoDaUrl(bucket: Bucket, url: string | null | undefined): string | null {
  const marca = `/storage/v1/object/public/${bucket}/`;
  const i = url?.indexOf(marca) ?? -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marca.length).split("?")[0]) : null;
}

/** Link temporário (5 min) para arquivo de bucket privado. */
export async function linkTemporario(bucket: Bucket, caminho: string, nome?: string) {
  const { data, error } = await exigirSupabase().storage.from(bucket)
    .createSignedUrl(caminho, 300, nome ? { download: nome } : undefined);
  if (error || !data) throw new Error("Não foi possível abrir o arquivo.");
  return data.signedUrl;
}

/** Limpeza de arquivo que ficou sem uso. Falhar aqui não desfaz o que já foi feito. */
export async function apagarArquivos(bucket: Bucket, caminhos: (string | null | undefined)[]) {
  const validos = caminhos.filter((c): c is string => Boolean(c));
  if (!validos.length) return;
  const { error } = await exigirSupabase().storage.from(bucket).remove(validos);
  if (error) console.warn(`[${bucket}] arquivo não removido:`, error.message);
}
