import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";

/**
 * Conteúdo de uma seção do painel, resolvendo de onde ele começa.
 *
 * O projeto da ESEG virou o modelo da casa: a estrutura das seções é a mesma
 * para todo cliente, muda só o que está escrito dentro. Então:
 *
 * - projeto **do modelo ESEG** começa com o conteúdo da ESEG, para adaptar;
 * - projeto **em branco** começa com a mesma estrutura, porém vazia;
 * - depois que alguém salva, o que vale é sempre o que foi salvo.
 *
 * O `useSharedData` já isola por cliente, então dois projetos nunca se misturam.
 */
export function useConteudoSeo<T>(chave: string, modeloEseg: T, vazio: T) {
  const comecaVazio = useComecaVazio();
  const inicial = comecaVazio ? vazio : modeloEseg;

  // Guarda `null` enquanto ninguém salvou, para distinguir "nunca editado"
  // de "editado e esvaziado de propósito".
  const { value, save, loading, salvando } = useSharedData<T | null>(chave, null);

  return {
    conteudo: value ?? inicial,
    salvar: save,
    loading,
    salvando,
    comecaVazio,
    /** true enquanto a seção ainda mostra o conteúdo de origem, sem edição. */
    intocado: value === null,
  };
}
