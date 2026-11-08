import { clienteAdmin, exigirUsuario } from "../_compartilhado/auth.ts";
import { erro, json, preflight } from "../_compartilhado/cors.ts";
import { chamarModelo, ErroIA, extrairJson } from "../_compartilhado/ia.ts";

/**
 * Análise de CS por IA para um cliente da carteira.
 *
 * POST { cliente_id: string, pergunta?: string }
 *   → { analise: { resumo, percepcoes, riscos, recomendacoes, flag_sugerida, modelo } }
 *
 * Os dados são lidos aqui, com a chave de serviço, de `central_registros`
 * (cliente, frentes, notas, avaliações de churn, recursos, reuniões e tarefas do
 * ClickUp). O navegador não manda dado nenhum além do id, então ninguém consegue
 * "plantar" contexto na análise. Quem grava a análise é a tela, na coleção
 * `analises`, como as demais da ficha.
 *
 * Acesso: quem tem o painel de CS (a mesma regra que libera a ficha no banco).
 * Segredos: IA_API_KEY, IA_API_URL, IA_MODELO (ver _compartilhado/ia.ts).
 */

type Registro = Record<string, unknown>;

/** Teto do contexto mandado ao modelo, para o custo de cada análise não disparar. */
const MAX_CONTEXTO = 60_000;

const SISTEMA = `Você é um analista sênior de Customer Success de uma agência de marketing digital.
Analise os dados do cliente e responda SOMENTE com um objeto JSON, sem texto fora dele, neste formato:
{"resumo":"","percepcoes":"","riscos":"","recomendacoes":"","flag_sugerida":"green|yellow|red"}

Regras:
- Escreva em português do Brasil, direto, para o time de CS ler em um minuto.
- resumo: 2 a 3 frases sobre a situação da conta.
- percepcoes: o que os dados mostram (tendência das avaliações, alertas, entregas, reuniões).
- riscos: riscos concretos de churn ou de insatisfação; se não houver, diga isso.
- recomendacoes: 3 ações numeradas ("1) ... 2) ... 3) ..."), práticas e para os próximos 30 dias.
- flag_sugerida: green (saudável), yellow (atenção) ou red (risco alto).
- Use só o que está nos dados. Não invente números, nomes ou fatos. Se faltar informação, diga o que falta.
- Se houver uma pergunta do time, responda a ela dentro de "percepcoes" ou "recomendacoes".`;

/**
 * Registros de uma coleção ligados ao cliente. `filtro` é a condição do
 * PostgREST sobre o JSON (`dados->>campo`), montada só com o id já conferido.
 */
async function colecao(colecao: string, filtro: string, limite: number, ordem?: string) {
  const { data, error } = await clienteAdmin()
    .from("central_registros").select("dados")
    .eq("colecao", colecao).eq("removido", false).or(filtro)
    .order("seq", { ascending: false }).limit(ordem ? 500 : limite);
  if (error) throw new Error(error.message);
  const itens = (data ?? []).map((l) => l.dados as Registro);
  if (ordem) itens.sort((a, b) => String(b[ordem] ?? "").localeCompare(String(a[ordem] ?? "")));
  return itens.slice(0, limite);
}

/** Tira campos que só ocupam espaço (ids internos, anexos em base64). */
function enxugar(r: Registro): Registro {
  const limpo: Registro = {};
  for (const [k, v] of Object.entries(r)) {
    if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (typeof v === "string" && v.startsWith("data:")) continue;
    if (k === "id" || k.endsWith("_id")) continue;
    limpo[k] = typeof v === "string" && v.length > 1500 ? `${v.slice(0, 1500)}…` : v;
  }
  return limpo;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return erro("Use POST.", 405);

  const acesso = await exigirUsuario(req, "cs");
  if (!acesso.ok) return erro(acesso.mensagem, acesso.status);

  const corpo = await req.json().catch(() => null);
  const clienteId = typeof corpo?.cliente_id === "string" ? corpo.cliente_id.trim() : "";
  const pergunta = typeof corpo?.pergunta === "string" ? corpo.pergunta.trim().slice(0, 1000) : "";
  // O id entra no filtro do banco: só letras, números, hífen e sublinhado.
  if (!/^[\w-]{1,80}$/.test(clienteId)) return erro("Informe o cliente.");

  try {
    const [cliente] = await colecao("clientes", `id.eq.${clienteId}`, 1);
    if (!cliente) return erro("Cliente não encontrado.", 404);

    const doCliente = `dados->>cliente_id.eq.${clienteId}`;
    const [frentesTodas, notas, avaliacoes, recursos, reunioes, tarefas] = await Promise.all([
      colecao("projetos", `dados->>empresa_id.eq.${clienteId},dados->>cliente_id.eq.${clienteId}`, 20),
      colecao("notas", doCliente, 30, "created_at"),
      colecao("avaliacoes", doCliente, 12, "referencia_mes"),
      colecao("recursos", doCliente, 30, "created_at"),
      colecao("reunioes", doCliente, 10, "data"),
      colecao("tarefas", doCliente, 50),
    ]);
    const frentes = frentesTodas.filter((p) => p.ativo !== false);

    const hoje = new Date().toISOString().slice(0, 10);
    const contexto = JSON.stringify({
      data_de_hoje: hoje,
      cliente: enxugar(cliente),
      frentes_ativas: frentes.map(enxugar),
      avaliacoes_de_churn: avaliacoes.map(enxugar),
      notas_do_time: notas.map(enxugar),
      reunioes: reunioes.map(enxugar),
      recursos: recursos.map(enxugar),
      tarefas_clickup: tarefas.map(enxugar),
    }).slice(0, MAX_CONTEXTO);

    const r = await chamarModelo([
      { role: "system", content: SISTEMA },
      {
        role: "user",
        content: `Dados do cliente (JSON):\n${contexto}` +
          (pergunta ? `\n\nPergunta do time: ${pergunta}` : ""),
      },
    ], { maxTokens: 1500 });

    const lido = extrairJson(r.texto);
    if (!lido) throw new ErroIA("A IA não devolveu a análise no formato esperado. Tente de novo.", 502);

    const texto = (v: unknown) =>
      Array.isArray(v) ? v.map(String).join("\n") : typeof v === "string" ? v.trim() : "";
    const flag = ["green", "yellow", "red"].includes(String(lido.flag_sugerida))
      ? String(lido.flag_sugerida) : "yellow";

    const analise = {
      resumo: texto(lido.resumo),
      percepcoes: texto(lido.percepcoes),
      riscos: texto(lido.riscos),
      recomendacoes: texto(lido.recomendacoes),
      flag_sugerida: flag,
      modelo: r.modelo,
    };
    if (!analise.resumo) throw new ErroIA("A IA devolveu uma análise vazia. Tente de novo.", 502);

    // Registro de uso, para acompanhar o custo. Falhar aqui não derruba a análise.
    await clienteAdmin().from("consultas_ia").insert({
      user_id: acesso.userId, rota: `/cs/${clienteId}`,
      pergunta: pergunta || "Gerar análise", resposta: analise.resumo, motor: r.modelo,
      tokens_entrada: r.tokens_entrada, tokens_saida: r.tokens_saida,
    }).then(({ error }) => error && console.warn("[analise] uso não registrado:", error.message));

    return json({ analise });
  } catch (e) {
    if (e instanceof ErroIA) return erro(e.message, e.status);
    console.error("[analise]", e);
    return erro("Não foi possível gerar a análise.", 500);
  }
});
