import type { ChurnFlag } from "@/lib/types";
import { exigirSupabase } from "./client";

/**
 * Funções `assistente-ia` e `analise-cliente-ia`. Quem chama é `src/lib/ia.ts`
 * e `src/data/store.ts`; as telas não conhecem este arquivo.
 */

/** Erro vindo da função, com o status HTTP (503 = IA ainda não configurada). */
export class ErroFuncaoIA extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

async function chamar<T>(funcao: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await exigirSupabase().functions.invoke(funcao, { body });
  if (!error) return data as T;

  // Em resposta de erro a mensagem vem no corpo, não em `error.message`.
  const resposta = (error as { context?: unknown }).context;
  if (resposta instanceof Response) {
    const detalhe = await resposta.json().catch(() => null);
    if (detalhe?.erro) throw new ErroFuncaoIA(detalhe.erro, resposta.status);
    if (resposta.status === 404) {
      throw new ErroFuncaoIA(`A função ${funcao} ainda não foi publicada no Supabase.`, 404);
    }
  }
  throw new ErroFuncaoIA("Não foi possível falar com o servidor. Tente de novo em instantes.", 0);
}

export type PedidoAssistente = {
  pergunta: string;
  contexto: { rota: string; tela: string; papel: string | null };
  historico: { autor: "pessoa" | "ia"; texto: string }[];
  referencias: string[];
};

export const consultarAssistenteRemoto = (pedido: PedidoAssistente) =>
  chamar<{ resposta: string; sugestoes: string[]; motor: string }>("assistente-ia", pedido);

export interface AnaliseGerada {
  resumo: string;
  percepcoes: string;
  riscos: string;
  recomendacoes: string;
  flag_sugerida: ChurnFlag;
  modelo: string;
}

export const gerarAnaliseRemota = async (cliente_id: string, pergunta?: string) =>
  (await chamar<{ analise: AnaliseGerada }>("analise-cliente-ia", { cliente_id, pergunta })).analise;
