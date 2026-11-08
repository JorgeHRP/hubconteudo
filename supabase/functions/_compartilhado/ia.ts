/**
 * Conversa com o modelo de IA. Serve para qualquer provedor que aceite o formato
 * "chat completions" (OpenAI, Gemini pelo endereço compatível, gateway da Lovable…).
 *
 * Segredos das Edge Functions:
 *   IA_API_KEY  chave do provedor (obrigatória)
 *   IA_API_URL  endereço de chat completions do provedor (obrigatório)
 *   IA_MODELO   nome do modelo, exatamente como o provedor escreve (obrigatório)
 *
 * Trocar de provedor é trocar os três segredos; o código não muda.
 */

export interface MensagemIA {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RespostaModelo {
  texto: string;
  modelo: string;
  tokens_entrada: number | null;
  tokens_saida: number | null;
}

/** Erro com o status que a função deve devolver ao navegador. */
export class ErroIA extends Error {
  constructor(mensagem: string, public status: number) {
    super(mensagem);
  }
}

export function iaConfigurada(): boolean {
  return Boolean(Deno.env.get("IA_API_KEY") && Deno.env.get("IA_API_URL") && Deno.env.get("IA_MODELO"));
}

export async function chamarModelo(
  mensagens: MensagemIA[], opcoes: { maxTokens?: number; temperatura?: number } = {}
): Promise<RespostaModelo> {
  const chave = Deno.env.get("IA_API_KEY");
  const url = Deno.env.get("IA_API_URL");
  const modelo = Deno.env.get("IA_MODELO");
  if (!chave || !url || !modelo) {
    throw new ErroIA("A IA ainda não foi configurada (faltam IA_API_KEY, IA_API_URL e IA_MODELO).", 503);
  }

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelo,
        messages: mensagens,
        max_tokens: opcoes.maxTokens ?? 1200,
        temperature: opcoes.temperatura ?? 0.3,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new ErroIA("O serviço de IA não respondeu. Tente de novo em instantes.", 504);
  }

  if (!resposta.ok) {
    const detalhe = (await resposta.text().catch(() => "")).slice(0, 300);
    console.error(`[ia] provedor respondeu ${resposta.status}: ${detalhe}`);
    if (resposta.status === 401 || resposta.status === 403) {
      throw new ErroIA("A chave da IA foi recusada pelo provedor. Confira o segredo IA_API_KEY.", 502);
    }
    if (resposta.status === 402) throw new ErroIA("Os créditos da IA acabaram.", 402);
    if (resposta.status === 429) throw new ErroIA("Muitas consultas à IA agora. Espere um minuto e tente de novo.", 429);
    throw new ErroIA("O serviço de IA falhou. Tente de novo em instantes.", 502);
  }

  const corpo = await resposta.json();
  const texto = corpo?.choices?.[0]?.message?.content;
  if (typeof texto !== "string" || !texto.trim()) {
    throw new ErroIA("A IA devolveu uma resposta vazia. Tente de novo.", 502);
  }
  return {
    texto: texto.trim(),
    modelo: typeof corpo.model === "string" ? corpo.model : modelo,
    tokens_entrada: corpo?.usage?.prompt_tokens ?? null,
    tokens_saida: corpo?.usage?.completion_tokens ?? null,
  };
}

/**
 * Lê o JSON que o modelo devolveu. Aceita o objeto puro, dentro de bloco de
 * código ou com texto em volta. Devolve null se não houver JSON legível.
 */
export function extrairJson(texto: string): Record<string, unknown> | null {
  const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  for (const candidato of [limpo, limpo.slice(limpo.indexOf("{"), limpo.lastIndexOf("}") + 1)]) {
    try {
      const valor = JSON.parse(candidato);
      if (valor && typeof valor === "object" && !Array.isArray(valor)) return valor;
    } catch { /* tenta o próximo */ }
  }
  return null;
}
