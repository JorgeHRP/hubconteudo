import { useAuth as useAuthCentral } from "@/contexts/AuthContext";

/**
 * Adaptador de autenticação.
 *
 * O módulo de SEO nasceu com login próprio, esperando `{ user }`. Aqui ele passa
 * a usar a sessão da Central Interna — quem entrou no sistema já está autenticado
 * no painel de SEO, sem segundo login.
 */
export function useAuth() {
  const { userId, profile } = useAuthCentral();

  return {
    user: userId ? { id: userId, email: profile?.email ?? "", nome: profile?.nome ?? "" } : null,
    profile,
  };
}
