import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppModulo, AppRole, Profile } from "@/lib/types";
import { buscarProfile, modulosDe, papelDe } from "@/data/store";

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
  /** Master tem tudo; os demais só o que foi liberado em user_permissoes. */
  temModulo: (modulo: AppModulo) => boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  recarregarProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregar(id: string) {
    const p = await buscarProfile(id);
    setProfile(p);
    setUserId(p ? id : null);
  }

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_SESSAO);
    if (salvo) carregar(salvo).finally(() => setLoading(false));
    else setLoading(false);
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
      temModulo: (modulo) => isMaster || modulos.includes(modulo),
      login: async (id: string) => {
        localStorage.setItem(CHAVE_SESSAO, id);
        await carregar(id);
      },
      logout: () => {
        localStorage.removeItem(CHAVE_SESSAO);
        setUserId(null);
        setProfile(null);
      },
      recarregarProfile: async () => {
        if (userId) await carregar(userId);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, profile, loading, role, isMaster, isGestor, modulos.join(",")]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
