import type { DespesaViagem, RelatorioViagem, ViagemStatus } from "@/lib/types";
import { exigirSupabase } from "./client";
import { conferir } from "./hub";

/**
 * Relatório de Viagens no banco (`relatorios_viagem` e `despesas_viagem`).
 * Quem chama é o `src/data/store.ts`.
 *
 * O banco devolve só o que a pessoa pode ver: as próprias viagens, ou todas para
 * quem aprova. Quem pode mudar cada status, e quem avaliou, é decidido lá
 * (migração 000008); aqui só se pede.
 */

const CAMPOS =
  "id, colaborador_id, titulo, destino, motivo, data_inicio, data_fim, status, " +
  "observacao_financeiro, avaliado_por, avaliado_em, created_at, " +
  "despesas_viagem(id, relatorio_id, categoria, descricao, data, valor, comprovante_nome, comprovante_url, created_at)";

interface LinhaDespesa extends DespesaViagem { created_at: string }
interface LinhaViagem extends Omit<RelatorioViagem, "despesas"> {
  despesas_viagem: LinhaDespesa[] | null;
}

function montar(linha: LinhaViagem): RelatorioViagem {
  const { despesas_viagem, ...viagem } = linha;
  return {
    ...viagem,
    motivo: viagem.motivo ?? "",
    despesas: [...(despesas_viagem ?? [])]
      .sort((a, b) => a.data.localeCompare(b.data) || a.created_at.localeCompare(b.created_at))
      .map(({ created_at: _c, ...d }) => ({ ...d, valor: Number(d.valor) })),
  };
}

export async function listarViagensRemoto(): Promise<RelatorioViagem[]> {
  const { data, error } = await exigirSupabase()
    .from("relatorios_viagem").select(CAMPOS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LinhaViagem[]).map(montar);
}

async function buscar(id: string): Promise<RelatorioViagem> {
  const linha = conferir(
    await exigirSupabase().from("relatorios_viagem").select(CAMPOS).eq("id", id)
  );
  return montar(linha as unknown as LinhaViagem);
}

export async function criarViagemRemoto(dados: {
  colaborador_id: string; titulo: string; destino: string; motivo: string;
  data_inicio: string; data_fim: string;
}) {
  const linha = conferir(
    await exigirSupabase().from("relatorios_viagem").insert(dados).select(CAMPOS)
  );
  return montar(linha as unknown as LinhaViagem);
}

export async function adicionarDespesaRemoto(
  relatorio_id: string, despesa: Omit<DespesaViagem, "id" | "relatorio_id">
) {
  conferir(
    await exigirSupabase().from("despesas_viagem").insert({ ...despesa, relatorio_id }).select("id")
  );
  return buscar(relatorio_id);
}

export async function removerDespesaRemoto(relatorio_id: string, despesa_id: string) {
  const removida = conferir(
    await exigirSupabase().from("despesas_viagem").delete()
      .eq("id", despesa_id).eq("relatorio_id", relatorio_id).select("id, comprovante_url")
  ) as unknown as { comprovante_url: string | null };
  await apagarComprovantes([removida.comprovante_url]);
  return buscar(relatorio_id);
}

/** O servidor carimba quem avaliou e quando; o navegador só manda o status e o motivo. */
export async function mudarStatusViagemRemoto(id: string, status: ViagemStatus, observacao?: string) {
  const mudanca: Record<string, unknown> = { status };
  if (status === "reprovado") mudanca.observacao_financeiro = observacao ?? null;
  const linha = conferir(
    await exigirSupabase().from("relatorios_viagem").update(mudanca).eq("id", id).select(CAMPOS)
  );
  return montar(linha as unknown as LinhaViagem);
}

export async function removerViagemRemoto(id: string) {
  // As despesas saem junto (cascade); os arquivos delas, não. Anota antes de apagar.
  const { data: despesas } = await exigirSupabase()
    .from("despesas_viagem").select("comprovante_url").eq("relatorio_id", id);
  conferir(await exigirSupabase().from("relatorios_viagem").delete().eq("id", id).select("id"));
  await apagarComprovantes((despesas ?? []).map((d) => d.comprovante_url as string | null));
  return true;
}

/* ---------------- comprovantes (bucket privado `comprovantes`) ---------------- */

const BUCKET = "comprovantes";

/** Até 10 MB, foto ou PDF. O bucket não limita sozinho, então a conferência é aqui. */
export const COMPROVANTE_MAX_BYTES = 10 * 1024 * 1024;
export const COMPROVANTE_TIPOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/** Nome sem acento, espaço nem barra: o Storage recusa alguns caracteres no caminho. */
const nomeSeguro = (nome: string) =>
  nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-80) || "comprovante";

/**
 * Sobe o arquivo para `<dono>/<relatório>/<id>-<nome>`. A primeira pasta é o dono:
 * é ela que as policies do bucket conferem (migração 000003) — só o dono envia
 * e apaga; o dono e quem aprova viagens leem.
 */
export async function enviarComprovanteRemoto(dono_id: string, relatorio_id: string, arquivo: File) {
  if (arquivo.size > COMPROVANTE_MAX_BYTES) throw new Error("O comprovante passa de 10 MB.");
  if (arquivo.type && !COMPROVANTE_TIPOS.includes(arquivo.type)) {
    throw new Error("Envie o comprovante em PDF ou imagem (JPG, PNG, WEBP ou HEIC).");
  }
  const caminho = `${dono_id}/${relatorio_id}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
  const { error } = await exigirSupabase().storage.from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined, upsert: false });
  if (error) throw new Error(`Não foi possível enviar o comprovante: ${error.message}`);
  return caminho;
}

/** Link temporário (5 min): o bucket é privado, não existe endereço fixo. */
export async function linkComprovanteRemoto(caminho: string) {
  const { data, error } = await exigirSupabase().storage.from(BUCKET).createSignedUrl(caminho, 300);
  if (error || !data) throw new Error("Não foi possível abrir o comprovante.");
  return data.signedUrl;
}

/** Limpeza de arquivo que ficou sem despesa. Falhar aqui não desfaz o que já foi feito. */
export async function apagarComprovantes(caminhos: (string | null | undefined)[]) {
  const validos = caminhos.filter((c): c is string => Boolean(c));
  if (!validos.length) return;
  const { error } = await exigirSupabase().storage.from(BUCKET).remove(validos);
  if (error) console.warn("[comprovantes] arquivo não removido:", error.message);
}
