import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/** Cliente com a chave de serviço — ignora RLS. Só dentro da função. */
export function clienteAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/**
 * Identifica quem chamou, a partir do token do próprio usuário.
 * Devolve null se não houver sessão válida.
 */
export async function usuarioDaRequisicao(req: Request): Promise<string | null> {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return null;

  const cliente = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } }
  );

  const { data, error } = await cliente.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/** Confere o papel de quem chamou, sem confiar em nada vindo do cliente. */
export async function papelDe(userId: string): Promise<string | null> {
  const { data } = await clienteAdmin()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

export async function exigirMaster(req: Request): Promise<
  { ok: true; userId: string } | { ok: false; status: number; mensagem: string }
> {
  const userId = await usuarioDaRequisicao(req);
  if (!userId) return { ok: false, status: 401, mensagem: "Sessão inválida." };

  const papel = await papelDe(userId);
  if (papel !== "master") {
    return { ok: false, status: 403, mensagem: "Apenas o master pode fazer isto." };
  }
  return { ok: true, userId };
}
