import {
  baixarRegistros, enviarRegistros, type EnvioRegistro, type LinhaRegistro,
} from "@/integrations/supabase/registros";

/**
 * Mantém as coleções do `store.ts` iguais para todo mundo, pela tabela
 * `central_registros`.
 *
 * O store continua trabalhando em memória, como sempre. Aqui só se compara o que
 * está em memória com o que o servidor tinha por último (o `espelho`): o que
 * mudou sobe, e o que mudou lá desce. Em edição simultânea do mesmo registro
 * vale a última gravação.
 *
 * A lista de coleções é repetida em `pode_colecao` (migração 000007), que é quem
 * decide de verdade quem lê e grava. Incluir uma coleção aqui sem incluir lá não
 * tem efeito: o servidor recusa.
 */

type Item = Record<string, unknown>;
type Banco = Record<string, unknown>;

const porId = (item: Item) => String(item.id);
const porChave = (item: Item) => String(item.chave);

/** Coleções compartilhadas e como achar a identidade de cada registro. */
export const COLECOES: Record<string, (item: Item) => string> = {
  // carteira
  empresas: porId, contatos: porId, personas: porId, produtos: porId, concorrentes: porId,
  reunioesEmpresa: porId, cases: porId, timeline: porId, documentosEmpresa: porId,
  escopos: porId, projetos: porId, conquistas: porId, equipe: porId, equipes: porId,
  oportunidades: porId, projetosSeo: porId,
  // ficha de CS
  clientes: porId, notas: porId, recursos: porId, avaliacoes: porId, analises: porId,
  tarefas: porId, reunioes: porId,
  // quadro de tarefas
  tarefas_internas: porId, statusTarefa: porId, tiposTarefa: porId,
  comentariosTarefa: porId, temposTarefa: porId,
  acessosCliente: porId, notificacoesCliente: porId,
  notificacoes: porId,
  preferenciasNotificacao: (p) => `${p.user_id}:${p.tipo}`,
  // inbound
  catalogoInbound: porId, pontosMesInbound: porId, planoInbound: porId,
  pautasInbound: porId, fluxosInbound: porId, nosFluxo: porId,
  // sites, redes e projetos RD
  projetosSite: porId, perfisSociais: porId, publicacoes: porId,
  implantacoes: porId, notasImplantacao: porId,
  // administração
  integracoes: porChave, paineis: porChave,
};

/** O store põe o registro novo no começo destas listas; ao receber, vale o mesmo. */
const NOVOS_PRIMEIRO = new Set([
  "analises", "avaliacoes", "conquistas", "notas", "notasImplantacao",
  "notificacoesCliente", "recursos", "reunioes", "tarefas_internas",
]);

/** Só o master altera estas; os demais nunca tentam enviar. */
const SO_MASTER = new Set(["integracoes", "paineis"]);

/** Folga na busca do que mudou: uma gravação pode ser confirmada um instante depois da hora dela. */
const FOLGA_MS = 15_000;

let banco: Banco | null = null;
let ehMaster = false;
let ligada = false;
let cursor: string | null = null;
const espelho = new Map<string, Map<string, string>>();
const recusadas = new Set<string>();

let aoMudar: () => void = () => {};
let aoFalhar: (mensagem: string) => void = () => {};
let fila: Promise<void> = Promise.resolve();
let agendado: ReturnType<typeof setTimeout> | null = null;

export function ouvirSincronia(ouvintes: { mudou: () => void; falhou: (m: string) => void }) {
  aoMudar = ouvintes.mudou;
  aoFalhar = ouvintes.falhou;
}

export const sincroniaLigada = () => ligada;

/**
 * Texto de comparação com as chaves em ordem fixa. O banco devolve o JSON com as
 * chaves reordenadas; sem isto, todo registro pareceria alterado ao voltar.
 */
function assinatura(valor: unknown): string {
  return JSON.stringify(valor, (_chave, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v
  );
}

const lista = (colecao: string): Item[] => {
  const atual = banco?.[colecao];
  return Array.isArray(atual) ? (atual as Item[]) : [];
};

function fotografia(colecao: string): Map<string, string> {
  const chaveDe = COLECOES[colecao];
  return new Map(lista(colecao).map((item) => [chaveDe(item), assinatura(item)]));
}

/**
 * Primeira carga depois do login. Toda coleção compartilhada volta aos padrões
 * do código e recebe por cima o que o servidor tem — nada do que a pessoa
 * anterior via neste navegador sobra em memória. Coleção que o servidor ainda
 * não tem fica com os padrões (colunas do quadro, catálogo de inbound…), e o
 * master os envia na sequência.
 */
export async function iniciarSincronia(db: Banco, padroes: Banco, master: boolean) {
  banco = db;
  ehMaster = master;
  ligada = false;
  cursor = null;
  espelho.clear();
  recusadas.clear();

  const linhas = await baixarRegistros(null);
  const porColecao = new Map<string, LinhaRegistro[]>();
  for (const linha of linhas) {
    if (!porColecao.has(linha.colecao)) porColecao.set(linha.colecao, []);
    porColecao.get(linha.colecao)!.push(linha);
    if (!cursor || linha.atualizado_em > cursor) cursor = linha.atualizado_em;
  }

  for (const colecao of Object.keys(COLECOES)) {
    db[colecao] = padroes[colecao] ?? [];
    const doServidor = porColecao.get(colecao);
    if (doServidor) {
      const vivos = doServidor.filter((l) => !l.removido).map((l) => l.dados as Item);
      db[colecao] = NOVOS_PRIMEIRO.has(colecao) ? vivos.reverse() : vivos;
      espelho.set(colecao, fotografia(colecao));
    } else if (master) {
      espelho.set(colecao, new Map());
    } else {
      // Quem não é master não semeia padrões: usa os do código sem enviá-los.
      espelho.set(colecao, fotografia(colecao));
    }
  }

  ligada = true;
  agendarEnvio();
}

export function pararSincronia() {
  ligada = false;
  if (agendado) clearTimeout(agendado);
  agendado = null;
}

/** Chamado pelo store depois de cada alteração. Junta as mudanças próximas num envio só. */
export function agendarEnvio() {
  if (!ligada || agendado) return;
  agendado = setTimeout(() => {
    agendado = null;
    fila = fila.then(enviar).catch((e: Error) => aoFalhar(e.message));
  }, 250);
}

async function enviar() {
  if (!ligada) return;
  const envio: EnvioRegistro[] = [];
  const novoEspelho = new Map<string, Map<string, string>>();

  for (const colecao of Object.keys(COLECOES)) {
    if (recusadas.has(colecao) || (SO_MASTER.has(colecao) && !ehMaster)) continue;
    const antes = espelho.get(colecao) ?? new Map<string, string>();
    const agora = fotografia(colecao);
    let mudou = false;

    for (const [id, json] of agora) {
      if (antes.get(id) === json) continue;
      envio.push({ colecao, id, dados: JSON.parse(json), removido: false });
      mudou = true;
    }
    for (const id of antes.keys()) {
      if (agora.has(id)) continue;
      envio.push({ colecao, id, dados: {}, removido: true });
      mudou = true;
    }
    if (mudou) novoEspelho.set(colecao, agora);
  }

  if (!envio.length) return;

  try {
    await enviarRegistros(envio);
    for (const [colecao, foto] of novoEspelho) espelho.set(colecao, foto);
  } catch (e) {
    // Uma coleção recusada não pode travar as outras: descobre qual foi e segue.
    let falhou: string | null = null;
    for (const colecao of novoEspelho.keys()) {
      try {
        await enviarRegistros(envio.filter((r) => r.colecao === colecao));
        espelho.set(colecao, novoEspelho.get(colecao)!);
      } catch {
        recusadas.add(colecao);
        falhou = colecao;
      }
    }
    if (falhou) {
      throw new Error(
        "Uma alteração não foi salva no servidor: você não tem permissão para gravar nesta área. " +
        "Recarregue a página para ver o que está valendo."
      );
    }
    throw e;
  }
}

/** Busca o que os outros mudaram. Registro com alteração local ainda não enviada não é sobrescrito. */
export function buscarMudancas(): Promise<void> {
  if (!ligada) return Promise.resolve();
  fila = fila.then(receber).catch((e: Error) => console.warn("[sincronia]", e.message));
  return fila;
}

async function receber() {
  if (!ligada || !banco) return;
  const desde = cursor ? new Date(new Date(cursor).getTime() - FOLGA_MS).toISOString() : null;
  const linhas = await baixarRegistros(desde);
  let mudou = false;

  for (const linha of linhas) {
    const chaveDe = COLECOES[linha.colecao];
    if (!chaveDe) continue;
    if (!cursor || linha.atualizado_em > cursor) cursor = linha.atualizado_em;

    const foto = espelho.get(linha.colecao) ?? new Map<string, string>();
    espelho.set(linha.colecao, foto);
    const itens = lista(linha.colecao);
    const i = itens.findIndex((item) => chaveDe(item) === linha.id);
    const local = i >= 0 ? assinatura(itens[i]) : undefined;
    const conhecido = foto.get(linha.id);

    // Mudou aqui e ainda não subiu: fica a versão local, que sobe no próximo envio.
    if (local !== conhecido) continue;

    if (linha.removido) {
      if (i >= 0) { itens.splice(i, 1); mudou = true; }
      foto.delete(linha.id);
      continue;
    }

    const json = assinatura(linha.dados);
    if (json === conhecido) continue;
    if (i >= 0) itens[i] = linha.dados as Item;
    else if (NOVOS_PRIMEIRO.has(linha.colecao)) itens.unshift(linha.dados as Item);
    else itens.push(linha.dados as Item);
    if (!Array.isArray(banco[linha.colecao])) banco[linha.colecao] = itens;
    foto.set(linha.id, json);
    mudou = true;
  }

  if (mudou) aoMudar();
}
