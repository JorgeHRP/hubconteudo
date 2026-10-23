import { clienteAdmin, exigirMaster } from "../_compartilhado/auth.ts";
import { erro, json, preflight } from "../_compartilhado/cors.ts";

/**
 * Traz as tarefas do ClickUp para a Central.
 *
 * Cada empresa da carteira guarda em `clickup_vinculos` as pastas e listas do
 * ClickUp que são dela. A função lê esses vínculos, busca as tarefas e grava na
 * coleção `tarefas` de `central_registros`, que é o que a aba ClickUp, o
 * histórico e a produção do mês já leem. As telas recebem em até 20 segundos.
 *
 * Quem chama: o master (botão no Painel Admin) ou um agendamento, que manda o
 * cabeçalho `x-sync-secret` igual ao segredo SYNC_SECRET.
 *
 * POST { acao: "estrutura" }    → pastas e listas do workspace, para vincular
 * POST { acao: "sincronizar" }  → busca e grava as tarefas (padrão)
 *
 * Segredos: CLICKUP_API_TOKEN (obrigatório), SYNC_SECRET (só para agendamento).
 */

const API = "https://api.clickup.com/api/v2";

/** Concluída há mais tempo que isto não entra: o gráfico de produção mostra 6 meses. */
const MESES_DE_HISTORICO = 6;

interface Vinculo {
  tipo: "pasta" | "lista";
  id: string;
  nome?: string;
}

interface TarefaClickUp {
  id: string;
  name: string;
  parent: string | null;
  url: string;
  status: { status: string; type: string };
  assignees: { username: string | null; email: string }[];
  priority: { priority: string } | null;
  due_date: string | null;
  date_done: string | null;
  date_closed: string | null;
  list: { id: string; name: string };
}

const PRIORIDADES: Record<string, string> = {
  urgent: "urgente", high: "alta", normal: "normal", low: "baixa",
};

function token(): string {
  const t = Deno.env.get("CLICKUP_API_TOKEN");
  if (!t) throw new Error("Falta o segredo CLICKUP_API_TOKEN nas Edge Functions do Supabase.");
  return t;
}

/** GET na API do ClickUp. Respeita o limite de 100 chamadas por minuto. */
async function clickup<T>(caminho: string): Promise<T> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const resposta = await fetch(`${API}${caminho}`, { headers: { Authorization: token() } });
    if (resposta.status === 429) {
      const reinicia = Number(resposta.headers.get("x-ratelimit-reset")) * 1000;
      const espera = Math.min(Math.max(reinicia - Date.now(), 1000), 30_000);
      await new Promise((r) => setTimeout(r, espera));
      continue;
    }
    if (resposta.status === 401) throw new Error("O ClickUp recusou o token. Confira o CLICKUP_API_TOKEN.");
    if (!resposta.ok) throw new Error(`ClickUp respondeu ${resposta.status} em ${caminho}`);
    return await resposta.json() as T;
  }
  throw new Error("O ClickUp continuou limitando as chamadas. Tente de novo em um minuto.");
}

/* ---------------- estrutura do workspace ---------------- */

interface Lista { id: string; nome: string }
interface Pasta { id: string; nome: string; listas: Lista[] }
interface Espaco { id: string; nome: string; pastas: Pasta[]; listas: Lista[] }

async function estrutura() {
  const { teams } = await clickup<{ teams: { id: string; name: string }[] }>("/team");
  const workspaces = [];
  for (const time of teams) {
    const { spaces } = await clickup<{ spaces: { id: string; name: string }[] }>(
      `/team/${time.id}/space?archived=false`
    );
    const espacos: Espaco[] = [];
    for (const espaco of spaces) {
      const [{ folders }, { lists }] = await Promise.all([
        clickup<{ folders: { id: string; name: string; lists: { id: string; name: string }[] }[] }>(
          `/space/${espaco.id}/folder?archived=false`
        ),
        clickup<{ lists: { id: string; name: string }[] }>(`/space/${espaco.id}/list?archived=false`),
      ]);
      espacos.push({
        id: espaco.id,
        nome: espaco.name,
        pastas: folders.map((f) => ({
          id: f.id, nome: f.name, listas: f.lists.map((l) => ({ id: l.id, nome: l.name })),
        })),
        listas: lists.map((l) => ({ id: l.id, nome: l.name })),
      });
    }
    workspaces.push({ id: time.id, nome: time.name, espacos });
  }
  return { workspaces };
}

/* ---------------- sincronização ---------------- */

async function tarefasDaLista(lista_id: string, desde: number): Promise<TarefaClickUp[]> {
  const tarefas: TarefaClickUp[] = [];
  for (let pagina = 0; pagina < 50; pagina++) {
    const r = await clickup<{ tasks: TarefaClickUp[]; last_page?: boolean }>(
      `/list/${lista_id}/task?include_closed=true&subtasks=true&page=${pagina}`
    );
    for (const t of r.tasks) {
      const fim = Number(t.date_done ?? t.date_closed ?? 0);
      const fechada = t.status.type === "closed" || t.status.type === "done";
      if (fechada && fim && fim < desde) continue;
      tarefas.push(t);
    }
    if (r.last_page !== false || r.tasks.length === 0) break;
  }
  return tarefas;
}

const dataIso = (ms: string | null) => (ms ? new Date(Number(ms)).toISOString() : null);

function converter(t: TarefaClickUp, empresa_id: string) {
  const fechada = t.status.type === "closed" || t.status.type === "done";
  return {
    id: `cu-${t.id}`,
    cliente_id: empresa_id,
    task_id: t.id,
    parent_id: t.parent,
    nome: t.name,
    status: t.status.status,
    responsavel: t.assignees.map((a) => a.username || a.email).join(", ") || null,
    prioridade: t.priority ? PRIORIDADES[t.priority.priority] ?? t.priority.priority : null,
    lista: t.list.name,
    due_date: dataIso(t.due_date)?.slice(0, 10) ?? null,
    url: t.url,
    concluida_em: fechada ? dataIso(t.date_done ?? t.date_closed) : null,
  };
}

async function sincronizar() {
  const sb = clienteAdmin();
  const { data: empresas, error } = await sb
    .from("central_registros")
    .select("id, dados")
    .eq("colecao", "empresas")
    .eq("removido", false);
  if (error) throw new Error(error.message);

  // Lista vinculada direto vale mais que a pasta: uma lista pode estar na pasta
  // de outra empresa (ex.: Casinha Pequenina dentro de Colégio Friburgo).
  const donoDaLista = new Map<string, { empresa: string; direto: boolean }>();
  const pastas: { id: string; empresa: string }[] = [];
  const vinculadas = new Set<string>();

  for (const linha of empresas ?? []) {
    const dados = linha.dados as { ativo?: boolean; clickup_vinculos?: Vinculo[] };
    if (dados.ativo === false) continue;
    for (const v of dados.clickup_vinculos ?? []) {
      vinculadas.add(linha.id);
      if (v.tipo === "lista") donoDaLista.set(v.id, { empresa: linha.id, direto: true });
      else pastas.push({ id: v.id, empresa: linha.id });
    }
  }

  for (const p of pastas) {
    const { lists } = await clickup<{ lists: { id: string }[] }>(`/folder/${p.id}/list?archived=false`);
    for (const l of lists) {
      if (!donoDaLista.get(l.id)?.direto) donoDaLista.set(l.id, { empresa: p.empresa, direto: false });
    }
  }

  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES_DE_HISTORICO);
  desde.setDate(1);

  const novas = new Map<string, ReturnType<typeof converter>>();
  const porEmpresa: Record<string, number> = {};
  const falhas: string[] = [];

  for (const [lista_id, dono] of donoDaLista) {
    try {
      for (const t of await tarefasDaLista(lista_id, desde.getTime())) {
        novas.set(`cu-${t.id}`, converter(t, dono.empresa));
      }
    } catch (e) {
      falhas.push(`lista ${lista_id}: ${(e as Error).message}`);
    }
  }
  for (const t of novas.values()) porEmpresa[t.cliente_id] = (porEmpresa[t.cliente_id] ?? 0) + 1;

  // O que já estava no banco: só regrava o que mudou, e tira o que saiu do ClickUp.
  const existentes = new Map<string, string>();
  for (let de = 0; ; de += 1000) {
    const { data, error: e } = await sb
      .from("central_registros")
      .select("id, dados")
      .eq("colecao", "tarefas")
      .eq("removido", false)
      .like("id", "cu-%")
      .range(de, de + 999);
    if (e) throw new Error(e.message);
    for (const l of data ?? []) existentes.set(l.id, JSON.stringify(ordenar(l.dados)));
    if (!data || data.length < 1000) break;
  }

  const envio: { colecao: string; id: string; dados: unknown; removido: boolean }[] = [];
  for (const [id, t] of novas) {
    if (existentes.get(id) !== JSON.stringify(ordenar(t))) {
      envio.push({ colecao: "tarefas", id, dados: t, removido: false });
    }
  }
  // Com alguma lista falhando, não apaga nada: a tarefa pode só não ter vindo.
  let removidas = 0;
  if (falhas.length === 0) {
    for (const id of existentes.keys()) {
      if (novas.has(id)) continue;
      envio.push({ colecao: "tarefas", id, dados: {}, removido: true });
      removidas++;
    }
  }

  for (let de = 0; de < envio.length; de += 500) {
    const { error: e } = await sb
      .from("central_registros")
      .upsert(envio.slice(de, de + 500), { onConflict: "colecao,id" });
    if (e) throw new Error(e.message);
  }

  const agora = new Date().toISOString();
  const { data: integ } = await sb
    .from("central_registros")
    .select("dados")
    .eq("colecao", "integracoes")
    .eq("id", "clickup")
    .maybeSingle();
  await sb.from("central_registros").upsert({
    colecao: "integracoes",
    id: "clickup",
    dados: { ...(integ?.dados ?? { chave: "clickup", nome: "ClickUp" }), conectada: true, ultima_sincronizacao: agora },
    removido: false,
  }, { onConflict: "colecao,id" });

  return {
    ok: true,
    empresas: vinculadas.size,
    listas: donoDaLista.size,
    tarefas: novas.size,
    gravadas: envio.length - removidas,
    removidas,
    por_empresa: porEmpresa,
    falhas,
    sincronizado_em: agora,
  };
}

/** Chaves em ordem fixa: o banco devolve o JSON reordenado. */
function ordenar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenar);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.keys(v as Record<string, unknown>).sort().map((k) => [k, ordenar((v as Record<string, unknown>)[k])])
    );
  }
  return v;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const segredo = Deno.env.get("SYNC_SECRET");
    const agendado = !!segredo && req.headers.get("x-sync-secret") === segredo;
    if (!agendado) {
      const autorizado = await exigirMaster(req);
      if (!autorizado.ok) return erro(autorizado.mensagem, autorizado.status);
    }

    const corpo = await req.json().catch(() => ({})) as { acao?: string };
    if (corpo.acao === "estrutura") return json(await estrutura());
    return json(await sincronizar());
  } catch (e) {
    return erro((e as Error).message, 500);
  }
});
