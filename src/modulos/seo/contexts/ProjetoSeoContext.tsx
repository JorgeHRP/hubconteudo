import { createContext, useContext, type ReactNode } from "react";
import type { ProjetoSeo } from "@/lib/types";

/**
 * Diz a todas as telas do painel de qual cliente é o projeto aberto.
 *
 * O isolamento dos dados acontece aqui: `useSharedData` prefixa cada chave de
 * armazenamento com o id do cliente, então duas contas nunca se misturam —
 * sem precisar mexer em cada tela.
 */
interface ProjetoSeoValor {
  clienteId: string;
  clienteNome: string;
  projetoId: string;
  origem: ProjetoSeo["origem"];
}

const ProjetoSeoContext = createContext<ProjetoSeoValor | null>(null);

export function ProjetoSeoProvider({
  valor,
  children,
}: {
  valor: ProjetoSeoValor;
  children: ReactNode;
}) {
  return <ProjetoSeoContext.Provider value={valor}>{children}</ProjetoSeoContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjetoSeo() {
  return useContext(ProjetoSeoContext);
}

/**
 * true quando o projeto foi aberto em branco.
 *
 * As telas trazem um conteúdo de exemplo embutido (o da Faculdade ESEG). Num
 * projeto em branco esse exemplo não deve aparecer: a tela começa vazia e a
 * pessoa preenche com os dados do cliente.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useComecaVazio() {
  return useContext(ProjetoSeoContext)?.origem === "vazio";
}

/** Chave de armazenamento isolada por cliente. */
// eslint-disable-next-line react-refresh/only-export-components
export function chaveDoCliente(clienteId: string | undefined, chave: string) {
  return clienteId ? `cliente:${clienteId}:${chave}` : chave;
}
