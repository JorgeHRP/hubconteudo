import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase.
 *
 * Enquanto as variáveis não existem, `supabase` é null e a aplicação continua
 * usando a camada local (`src/data/store.ts`). Isso permite desenvolver as telas
 * sem banco e ligar o backend depois, sem reescrever nada.
 *
 * Local:      as variáveis saem de `supabase start` e vão para `.env.local`
 * Produção:   vêm de `/config.js`, escrito na subida do container a partir das
 *             variáveis do serviço (docker/20-config.sh); na hospedagem sem
 *             container, entram no build (Vite embute variáveis VITE_*)
 *
 * A chave `anon` é pública por natureza — quem protege os dados é o RLS do banco.
 * A chave `service_role` NUNCA entra aqui: ela vive apenas nas edge functions.
 */

const emExecucao =
  (window as { __CENTRAL_CONFIG__?: { supabaseUrl?: string; supabaseAnonKey?: string } })
    .__CENTRAL_CONFIG__ ?? {};

const url = emExecucao.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
const anonKey =
  emExecucao.supabaseAnonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/** true quando o backend está configurado. */
export function temSupabase(): boolean {
  return supabase !== null;
}

/** Uso interno: garante o cliente ou explica o que falta. */
export function exigirSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local"
    );
  }
  return supabase;
}
