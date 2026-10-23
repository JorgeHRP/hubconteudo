import type { ClickUpEstrutura, ClickUpSincronizacao } from "@/lib/types";
import { exigirSupabase } from "./client";

/**
 * Função `sync-clickup`. Quem chama é o `src/data/store.ts`; as telas não
 * conhecem este arquivo.
 */

async function chamar<T>(acao: "estrutura" | "sincronizar"): Promise<T> {
  const { data, error } = await exigirSupabase().functions.invoke("sync-clickup", { body: { acao } });
  if (!error) return data as T;

  // Em resposta de erro a mensagem vem no corpo, não em `error.message`.
  const resposta = (error as { context?: unknown }).context;
  if (resposta instanceof Response) {
    const detalhe = await resposta.json().catch(() => null);
    if (detalhe?.erro) throw new Error(detalhe.erro);
    if (resposta.status === 404) {
      throw new Error("A função sync-clickup ainda não foi publicada no Supabase.");
    }
  }
  throw new Error("Não foi possível falar com o servidor. Tente de novo em instantes.");
}

export const estruturaClickUpRemota = () => chamar<ClickUpEstrutura>("estrutura");
export const sincronizarClickUpRemoto = () => chamar<ClickUpSincronizacao>("sincronizar");
