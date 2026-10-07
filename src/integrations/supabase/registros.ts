import { exigirSupabase } from "./client";

/**
 * Tabela `central_registros`: um registro de tela por linha, com o conteúdo em
 * JSON. Quem decide o que entra e quando é `src/data/sincronia.ts`.
 */

export interface LinhaRegistro {
  colecao: string;
  id: string;
  dados: unknown;
  removido: boolean;
  atualizado_em: string;
}

const PAGINA = 1000;

/** Tudo o que a pessoa pode ler, ou só o que mudou depois de `desde`. Em ordem de criação. */
export async function baixarRegistros(desde: string | null): Promise<LinhaRegistro[]> {
  const sb = exigirSupabase();
  const linhas: LinhaRegistro[] = [];

  for (let de = 0; ; de += PAGINA) {
    let consulta = sb
      .from("central_registros")
      .select("colecao, id, dados, removido, atualizado_em")
      .order("seq")
      .range(de, de + PAGINA - 1);
    if (desde) consulta = consulta.gt("atualizado_em", desde);

    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    linhas.push(...((data ?? []) as LinhaRegistro[]));
    if (!data || data.length < PAGINA) return linhas;
  }
}

export interface EnvioRegistro {
  colecao: string;
  id: string;
  dados: unknown;
  removido: boolean;
}

export async function enviarRegistros(registros: EnvioRegistro[]) {
  const sb = exigirSupabase();
  for (let de = 0; de < registros.length; de += 200) {
    const { error } = await sb
      .from("central_registros")
      .upsert(registros.slice(de, de + 200), { onConflict: "colecao,id" });
    if (error) throw new Error(error.message);
  }
}
