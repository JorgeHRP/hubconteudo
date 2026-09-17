import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase.
 *
 * Enquanto as variáveis não existem, `supabase` é null e a aplicação continua
 * usando a camada local (`src/data/store.ts`). Isso permite desenvolver as telas
 * sem banco e ligar o backend depois, sem reescrever nada.
 *
 * Local:      as variáveis saem de `supabase start` e vão para `.env.local`
 * Produção:   entram no build (Vite embute variáveis VITE_* no bundle)
 *
 * A chave `anon` é pública por natureza — quem protege os dados é o RLS do banco.
 * A chave `service_role` NUNCA entra aqui: ela vive apenas nas edge functions.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
