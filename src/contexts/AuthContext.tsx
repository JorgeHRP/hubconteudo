import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppModulo, AppRole, Profile } from "@/lib/types";
import { buscarProfile, espelharUsuarioRemoto, modulosDe, papelDe } from "@/data/store";
import { USUARIO_MASTER_ID } from "@/data/seed";
import { supabase } from "@/integrations/supabase/client";
import {
  carregarUsuario, chegouPorLinkDeSenha, definirSenha as definirSenhaRemota,
  entrar, sair, traduzirErro,
} from "@/integrations/supabase/sessao";

const CHAVE_SESSAO = "central-interna:sessao";

interface AuthValue {
  userId: string | null;
  profile: Profile | null;
  role: AppRole | null;
  modulos: AppModulo[];
  loading: boolean;
  isAuthenticated: boolean;
  /** Master: acesso irrestrito, inclusive papéis e permissões. */
  isMaster: boolean;
  /** Master ou gerente: pode publicar conteúdo do hub. */
  isGestor: boolean;
  /** true quando o login é validado no Supabase; false no modo de demonstração. */
  loginReal: boolean;
  /** Entrou por convite ou por "esqueci a senha": precisa escolher a senha antes de seguir. */
  precisaDefinirSenha: boolean;
  /** Master tem tudo; os demais só o que foi liberado em user_permissoes. */
  temModulo: (modulo: AppModulo) => boolean;
  /** Devolve a mensagem de erro, ou null quando entrou. */
  login: (email: string, senha: string) => Promise<string | null>;
  logout: () => void;
  definirSenha: (senha: string) => Promise<string | null>;
  recarregarProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [precisaDefinirSenha, setPrecisaDefinirSenha] = useState(chegouPorLinkDeSenha);
  const loginReal = supabase !== null;

  // Modo de demonstração: a pessoa vem da base local.
  async function carregarLocal(id: string) {
    const p = await buscarProfile(id);
    setProfile(p);
    setUserId(p ? id : null);
  }

  // Login real: quem a pessoa é e o que ela pode vêm do servidor.
  // Devolve false quando a conta não tem cadastro ativo na Central.
  async function carregarRemoto(id: string): Promise<boolean> {
    const usuario = await carregarUsuario(id);
    if (!usuario) {
      await sair();
      setProfile(null);
      setUserId(null);
      return false;
    }
    espelharUsuarioRemoto(usuario.profile, usuario.papel, usuario.modulos);
    setProfile(usuario.profile);
    setUserId(id);
    return true;
  }

  useEffect(() => {
    if (!supabase) {
      const salvo = localStorage.getItem(CHAVE_SESSAO);
      if (salvo) carregarLocal(salvo).finally(() => setLoading(false));
      else setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => (data.session ? carregarRemoto(data.session.user.id) : false))
      .catch(() => false)
      .finally(() => setLoading(false));

    const { data: inscricao } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY") setPrecisaDefinirSenha(true);
      if (evento === "SIGNED_OUT" || !sessao) {
        setProfile(null);
        setUserId(null);
        return;
      }
      if (evento === "SIGNED_IN") {
        // Fora do callback: chamar o Supabase aqui dentro trava o cliente.
        const id = sessao.user.id;
        setTimeout(() => carregarRemoto(id).catch(() => undefined), 0);
      }
    });

    return () => inscricao.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role = userId ? papelDe(userId) : null;
  const modulos = userId ? modulosDe(userId) : [];
  const isMaster = role === "master";
  const isGestor = role === "master" || role === "gerente";

  const value = useMemo<AuthValue>(
    () => ({
      userId,
      profile,
      role,
      modulos,
      loading,
      isAuthenticated: Boolean(userId),
      isMaster,
      isGestor,
      loginReal,
      precisaDefinirSenha,
      temModulo: (modulo) => isMaster || modulos.includes(modulo),
      login: async (email, senha) => {
        if (!supabase) {
          localStorage.setItem(CHAVE_SESSAO, USUARIO_MASTER_ID);
          await carregarLocal(USUARIO_MASTER_ID);
          return null;
        }
        const erro = await entrar(email, senha);
        if (erro) return erro;
        try {
          const { data } = await supabase.auth.getUser();
          const ok = data.user ? await carregarRemoto(data.user.id) : false;
          return ok ? null : "Esta conta não tem cadastro ativo na Central. Fale com quem administra.";
        } catch (e) {
          await sair();
          return traduzirErro(e instanceof Error ? e.message : "");
        }
      },
      logout: () => {
        if (supabase) void sair();
        localStorage.removeItem(CHAVE_SESSAO);
        setUserId(null);
        setProfile(null);
      },
      definirSenha: async (senha) => {
        const erro = await definirSenhaRemota(senha);
        if (!erro) setPrecisaDefinirSenha(false);
        return erro;
      },
      recarregarProfile: async () => {
        if (!userId) return;
        if (supabase) await carregarRemoto(userId);
        else await carregarLocal(userId);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, profile, loading, role, isMaster, isGestor, precisaDefinirSenha, modulos.join(",")]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
