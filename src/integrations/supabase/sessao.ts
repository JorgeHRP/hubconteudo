import type { AppModulo, AppRole, Profile } from "@/lib/types";
import { exigirSupabase } from "./client";

/**
 * Login real: tudo o que fala com o Supabase Auth fica aqui.
 * O AuthContext decide quando chamar; as telas não conhecem este arquivo.
 */

export interface UsuarioRemoto {
  profile: Profile;
  papel: AppRole;
  modulos: AppModulo[];
}

const ORDEM_PAPEL: AppRole[] = ["funcionario", "gerente", "master"];

/**
 * O link do e-mail de convite ou de troca de senha chega com `type=invite` ou
 * `type=recovery` no endereço. Precisa ser lido antes de o cliente do Supabase
 * limpar a URL, por isso é capturado na carga do módulo.
 */
const tipoDoLink = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type");
export const chegouPorLinkDeSenha = tipoDoLink === "invite" || tipoDoLink === "recovery";

export const urlDefinirSenha = () => `${window.location.origin}/definir-senha`;

/** Mensagens do Supabase vêm em inglês; estas são as que a pessoa de fato encontra. */
export function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Este e-mail ainda não foi confirmado. Abra o convite que chegou na sua caixa.";
  if (m.includes("user is banned")) return "Esta conta está desativada. Fale com quem administra a Central.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Espere um minuto e tente de novo.";
  if (m.includes("should be different")) return "A senha nova precisa ser diferente da anterior.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sem conexão com o servidor. Confira a internet e tente de novo.";
  return "Não foi possível concluir. Tente de novo em instantes.";
}

/**
 * Busca perfil, papel e painéis liberados de quem entrou.
 * Devolve null quando a conta existe no Auth mas não tem cadastro ativo na Central.
 */
export async function carregarUsuario(userId: string): Promise<UsuarioRemoto | null> {
  const sb = exigirSupabase();

  // O perfil vem da view, não da tabela: é ela que entrega CPF e contato de
  // emergência para o dono (a tabela não libera essas colunas para ninguém).
  const [perfil, papeis, permissoes] = await Promise.all([
    sb.from("colaboradores_publico").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("user_roles").select("role").eq("user_id", userId),
    sb.from("user_permissoes").select("modulo").eq("user_id", userId),
  ]);

  if (perfil.error) throw perfil.error;
  if (papeis.error) throw papeis.error;
  if (permissoes.error) throw permissoes.error;
  if (!perfil.data || !perfil.data.ativo) return null;

  // Sem linha em user_roles a pessoa é tratada como funcionária, nunca como mais.
  const papel = (papeis.data ?? [])
    .map((r) => r.role as AppRole)
    .reduce<AppRole>(
      (maior, r) => (ORDEM_PAPEL.indexOf(r) > ORDEM_PAPEL.indexOf(maior) ? r : maior),
      "funcionario"
    );

  return {
    profile: perfil.data as Profile,
    papel,
    modulos: (permissoes.data ?? []).map((p) => p.modulo as AppModulo),
  };
}

export async function entrar(email: string, senha: string): Promise<string | null> {
  const { error } = await exigirSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  return error ? traduzirErro(error.message) : null;
}

export async function sair(): Promise<void> {
  await exigirSupabase().auth.signOut();
}

export async function pedirTrocaDeSenha(email: string): Promise<string | null> {
  const { error } = await exigirSupabase().auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: urlDefinirSenha() }
  );
  return error ? traduzirErro(error.message) : null;
}

export async function definirSenha(senha: string): Promise<string | null> {
  const { error } = await exigirSupabase().auth.updateUser({ password: senha });
  return error ? traduzirErro(error.message) : null;
}
