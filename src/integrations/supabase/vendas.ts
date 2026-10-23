import type { VendaNegocio } from "@/lib/types";
import { exigirSupabase } from "./client";
import { conferir } from "./hub";

/**
 * Negócios de Vendas no banco (`vendas_negocios`). Quem chama é o `store.ts`.
 *
 * Negócio que veio do RD Station (rd_deal_id preenchido) é só leitura: quem
 * grava é a sincronização. Os cadastrados à mão, quem tem o painel altera.
 * Status e data de fechamento seguem a etapa, pelo próprio banco.
 */

const CAMPOS =
  "id, rd_deal_id, nome, empresa, etapa, valor, responsavel, origem, produto, " +
  "status, data_criacao, data_fechamento";

export type DadosNegocio = Pick<
  VendaNegocio, "nome" | "empresa" | "etapa" | "valor" | "responsavel" | "origem" | "produto"
>;

const montar = (linha: VendaNegocio): VendaNegocio => ({ ...linha, valor: Number(linha.valor) });

export async function listarNegociosRemoto(): Promise<VendaNegocio[]> {
  const { data, error } = await exigirSupabase()
    .from("vendas_negocios").select(CAMPOS)
    .order("data_criacao", { ascending: false })
    .order("nome");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VendaNegocio[]).map(montar);
}

export async function criarNegocioRemoto(dados: DadosNegocio) {
  return montar(conferir(
    await exigirSupabase().from("vendas_negocios").insert(dados).select(CAMPOS)
  ) as unknown as VendaNegocio);
}

export async function alterarNegocioRemoto(id: string, dados: Partial<DadosNegocio>) {
  return montar(conferir(
    await exigirSupabase().from("vendas_negocios").update(dados).eq("id", id).select(CAMPOS)
  ) as unknown as VendaNegocio);
}

export async function removerNegocioRemoto(id: string) {
  conferir(await exigirSupabase().from("vendas_negocios").delete().eq("id", id).select("id"));
  return true;
}
