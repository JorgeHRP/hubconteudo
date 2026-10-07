import type { AppModulo, AppRole, Profile } from "@/lib/types";
import { exigirSupabase } from "./client";

/**
 * Pessoas no banco: diretório, papéis, painéis liberados e a função
 * `manage-users`. Quem chama é o `src/data/store.ts`; as telas não conhecem
 * este arquivo.
 */

const ORDEM_PAPEL: AppRole[] = ["funcionario", "gerente", "master"];

export interface PessoasRemotas {
  profiles: Profile[];
  papeis: Record<string, AppRole>;
  modulos: Record<string, AppModulo[]>;
}

/**
 * O diretório vem da view, que só entrega CPF e contato de emergência ao dono
 * e a quem tem o módulo `colaboradores`. Painéis liberados: cada pessoa lê os
 * próprios; gestores leem os de todos — é o que as policies devolvem.
 */
export async function listarPessoas(): Promise<PessoasRemotas> {
  const sb = exigirSupabase();
  const [perfis, linhasPapel, linhasModulo] = await Promise.all([
    sb.from("colaboradores_publico").select("*").order("nome"),
    sb.from("user_roles").select("user_id, role"),
    sb.from("user_permissoes").select("user_id, modulo"),
  ]);

  if (perfis.error) throw new Error(perfis.error.message);
  if (linhasPapel.error) throw new Error(linhasPapel.error.message);
  if (linhasModulo.error) throw new Error(linhasModulo.error.message);

  const papeis: Record<string, AppRole> = {};
  for (const linha of linhasPapel.data ?? []) {
    const atual = papeis[linha.user_id] ?? "funcionario";
    const novo = linha.role as AppRole;
    papeis[linha.user_id] =
      ORDEM_PAPEL.indexOf(novo) > ORDEM_PAPEL.indexOf(atual) ? novo : atual;
  }

  const modulos: Record<string, AppModulo[]> = {};
  for (const linha of linhasModulo.data ?? []) {
    (modulos[linha.user_id] ??= []).push(linha.modulo as AppModulo);
  }

  return { profiles: (perfis.data ?? []) as Profile[], papeis, modulos };
}

type CorpoManageUsers =
  | ({ acao: "criar" } & Record<string, unknown>)
  | { acao: "reenviar_convite" | "desativar" | "reativar"; user_id: string };

/** Chama a função `manage-users` e devolve a mensagem dela quando recusa. */
export async function gerirUsuario<T = { ok: true }>(corpo: CorpoManageUsers): Promise<T> {
  const { data, error } = await exigirSupabase().functions.invoke("manage-users", { body: corpo });
  if (!error) return data as T;

  // Em resposta de erro a mensagem vem no corpo, não em `error.message`.
  const resposta = (error as { context?: unknown }).context;
  if (resposta instanceof Response) {
    const detalhe = await resposta.json().catch(() => null);
    if (detalhe?.erro) throw new Error(detalhe.erro);
  }
  throw new Error("Não foi possível falar com o servidor. Tente de novo em instantes.");
}

export async function gravarPerfil(user_id: string, dados: Partial<Profile>) {
  const { data, error } = await exigirSupabase()
    .from("profiles").update(dados).eq("user_id", user_id).select("id");
  if (error) throw new Error(error.message);
  // Policy que barra não dá erro: só não altera nenhuma linha.
  if (!data?.length) throw new Error("Você não tem permissão para alterar este cadastro.");
}

export async function gravarPapel(user_id: string, role: AppRole) {
  const sb = exigirSupabase();
  const { data, error } = await sb
    .from("user_roles").update({ role }).eq("user_id", user_id).select("user_id");
  if (error) throw new Error(error.message);
  if (data?.length) return;

  const criacao = await sb.from("user_roles").insert({ user_id, role }).select("user_id");
  if (criacao.error || !criacao.data?.length) {
    throw new Error("Apenas o master altera papéis.");
  }
}

/** Grava só a diferença, para um erro no meio não deixar a pessoa sem painel nenhum. */
export async function gravarModulos(user_id: string, modulos: AppModulo[]) {
  const sb = exigirSupabase();
  const atuais = await sb.from("user_permissoes").select("modulo").eq("user_id", user_id);
  if (atuais.error) throw new Error(atuais.error.message);

  const tinha = (atuais.data ?? []).map((l) => l.modulo as AppModulo);
  const entram = modulos.filter((m) => !tinha.includes(m));
  const saem = tinha.filter((m) => !modulos.includes(m));

  if (entram.length) {
    const { data, error } = await sb
      .from("user_permissoes")
      .insert(entram.map((modulo) => ({ user_id, modulo })))
      .select("modulo");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("Apenas o master libera painéis.");
  }
  if (saem.length) {
    const { data, error } = await sb
      .from("user_permissoes").delete().eq("user_id", user_id).in("modulo", saem).select("modulo");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("Apenas o master libera painéis.");
  }
}
