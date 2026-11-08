import { clienteAdmin, exigirUsuario } from "../_compartilhado/auth.ts";
import { erro, json, preflight } from "../_compartilhado/cors.ts";
import { chamarModelo, ErroIA, extrairJson } from "../_compartilhado/ia.ts";

/**
 * Assistente de IA da Central (o botão flutuante no canto da tela).
 *
 * POST {
 *   pergunta: string,
 *   contexto: { rota, tela, papel },
 *   historico?: { autor: "pessoa" | "ia", texto }[],   // últimas mensagens da conversa
 *   referencias?: string[]                              // manual do sistema (src/lib/ia.ts)
 * } → { resposta, sugestoes, motor }
 *
 * O manual vem do navegador para existir num lugar só (src/lib/ia.ts), o mesmo
 * que responde quando a IA está desligada. Ele só orienta a resposta de quem
 * perguntou; nenhum dado do banco é lido aqui.
 *
 * Acesso: qualquer pessoa ativa. Limite de 60 consultas por hora por pessoa.
 * Cada consulta fica em `consultas_ia`, para acompanhar uso e custo.
 * Segredos: IA_API_KEY, IA_API_URL, IA_MODELO (ver _compartilhado/ia.ts).
 */

const LIMITE_POR_HORA = 60;

const papeis: Record<string, string> = {
  master: "master (acesso total)", gerente: "gerente", funcionario: "funcionário",
};

function sistema(tela: string, papel: string, referencias: string[]) {
  return `Você é o assistente da Central Interna, o sistema interno de uma agência de marketing digital.
Ajuda colaboradores a usar o sistema: onde fica cada coisa, como fazer cada tarefa, quem pode o quê.

A pessoa está na tela "${tela}" e tem o papel ${papel}.

Manual do sistema (use como fonte; não invente telas, botões ou regras que não estejam aqui):
${referencias.map((r) => `- ${r}`).join("\n")}

Regras:
- Responda em português do Brasil, curto e direto (até 6 frases), com o caminho de telas quando ajudar.
- Se a resposta não estiver no manual, diga que não sabe e sugira quem procurar (o master ou o gestor).
- Não tem acesso aos dados das pessoas ou dos clientes; se pedirem, explique onde a pessoa encontra.
- Responda SOMENTE com JSON: {"resposta":"","sugestoes":["","",""]}
  "sugestoes" são até 3 perguntas curtas que a pessoa pode fazer em seguida.`;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return erro("Use POST.", 405);

  const acesso = await exigirUsuario(req);
  if (!acesso.ok) return erro(acesso.mensagem, acesso.status);

  const corpo = await req.json().catch(() => null);
  const pergunta = texto(corpo?.pergunta, 2000);
  if (!pergunta) return erro("Escreva a pergunta.");

  const rota = texto(corpo?.contexto?.rota, 200) || "/";
  const tela = texto(corpo?.contexto?.tela, 100) || "Início";
  const papel = papeis[texto(corpo?.contexto?.papel, 20)] ?? "funcionário";
  const referencias = (Array.isArray(corpo?.referencias) ? corpo.referencias : [])
    .map((r: unknown) => texto(r, 1500)).filter(Boolean).slice(0, 40);
  const historico = (Array.isArray(corpo?.historico) ? corpo.historico : [])
    .slice(-6)
    .map((m: { autor?: unknown; texto?: unknown }) => ({
      role: m?.autor === "ia" ? "assistant" as const : "user" as const,
      content: texto(m?.texto, 2000),
    }))
    .filter((m: { content: string }) => m.content);

  const admin = clienteAdmin();
  const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin.from("consultas_ia")
    .select("id", { count: "exact", head: true })
    .eq("user_id", acesso.userId).gte("created_at", umaHoraAtras);
  if ((count ?? 0) >= LIMITE_POR_HORA) {
    return erro("Você chegou ao limite de consultas desta hora. Tente de novo mais tarde.", 429);
  }

  try {
    const r = await chamarModelo([
      { role: "system", content: sistema(tela, papel, referencias) },
      ...historico,
      { role: "user", content: pergunta },
    ], { maxTokens: 700 });

    const lido = extrairJson(r.texto);
    // Sem JSON, o texto inteiro vira a resposta: melhor que perder o que a IA disse.
    const resposta = texto(lido?.resposta, 6000) || (lido ? "" : r.texto);
    if (!resposta) throw new ErroIA("A IA devolveu uma resposta vazia. Tente de novo.", 502);
    const sugestoes = (Array.isArray(lido?.sugestoes) ? lido.sugestoes : [])
      .map((s: unknown) => texto(s, 120)).filter(Boolean).slice(0, 3);

    const { error } = await admin.from("consultas_ia").insert({
      user_id: acesso.userId, rota, pergunta, resposta, motor: r.modelo,
      tokens_entrada: r.tokens_entrada, tokens_saida: r.tokens_saida,
    });
    if (error) console.warn("[assistente] uso não registrado:", error.message);

    return json({ resposta, sugestoes, motor: r.modelo });
  } catch (e) {
    if (e instanceof ErroIA) return erro(e.message, e.status);
    console.error("[assistente]", e);
    return erro("Não foi possível consultar a IA.", 500);
  }
});
