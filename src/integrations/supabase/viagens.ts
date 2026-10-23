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
  conferir(
    await exigirSupabase().from("despesas_viagem").delete()
      .eq("id", despesa_id).eq("relatorio_id", relatorio_id).select("id")
  );
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
  conferir(await exigirSupabase().from("relatorios_viagem").delete().eq("id", id).select("id"));
  return true;
}
