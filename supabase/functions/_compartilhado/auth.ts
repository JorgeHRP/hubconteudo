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

/**
 * Quem chamou precisa estar logado e ativo e, se `modulo` vier, ter aquele
 * painel liberado. A conferência é a mesma do banco (`has_modulo`).
 */
export async function exigirUsuario(req: Request, modulo?: string): Promise<
  { ok: true; userId: string } | { ok: false; status: number; mensagem: string }
> {
  const userId = await usuarioDaRequisicao(req);
  if (!userId) return { ok: false, status: 401, mensagem: "Sessão inválida." };

  const admin = clienteAdmin();
  const { data: perfil } = await admin
    .from("profiles").select("ativo").eq("user_id", userId).maybeSingle();
  if (!perfil?.ativo) return { ok: false, status: 403, mensagem: "Usuário inativo." };

  if (modulo) {
    const { data: tem } = await admin.rpc("has_modulo", { _user_id: userId, _modulo: modulo });
    if (tem !== true) return { ok: false, status: 403, mensagem: "Você não tem acesso a este painel." };
  }
  return { ok: true, userId };
}
