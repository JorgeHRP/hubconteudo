import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X, Send, Loader2, Bot, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { consultarIA, sugestoesDaTela, type RespostaIA } from "@/lib/ia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Mensagem {
  autor: "pessoa" | "ia";
  texto: string;
  motor?: string;
}

const nomesDeTela: Record<string, string> = {
  "/": "Início",
  "/feed": "Feed / Mural",
  "/calendario": "Calendário",
  "/colaboradores": "Colaboradores",
  "/solicitacoes": "Solicitações",
  "/viagens": "Relatório de Viagens",
  "/repositorios": "Repositórios",
  "/contracheques": "Contracheques",
  "/ativos": "Ativos da Marca",
  "/manual": "Manual Interno",
  "/treinamentos": "Treinamentos",
  "/politicas": "Políticas",
  "/cs": "Painel de CS",
  "/clientes": "Visão geral de clientes",
  "/empresas": "Cadastro de Empresas",
  "/seo-geo": "SEO / GEO",
  "/trafego": "Gestão de Tráfego",
  "/inbound": "Inbound",
  "/sites": "Sites e Hotsites",
  "/redes-sociais": "Gestão de Redes Sociais",
  "/projetos-rd": "Projetos RD",
  "/tarefas": "Tarefas",
  "/vendas": "Resultados de Vendas",
  "/financeiro": "Dashboard Financeiro",
  "/admin": "Painel Admin",
  "/perfil": "Meu perfil",
};

function nomeDaTela(rota: string) {
  if (nomesDeTela[rota]) return nomesDeTela[rota];
  if (rota.startsWith("/cs/")) return "Ficha do cliente";
  return "Central Interna";
}

/** Assistente disponível em toda a ferramenta, pelo botão flutuante. */
export function AssistenteIA() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto && mensagens.length === 0) setSugestoes(sugestoesDaTela(pathname));
  }, [aberto, pathname, mensagens.length]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, pensando]);

  async function perguntar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || pensando) return;

    setMensagens((m) => [...m, { autor: "pessoa", texto: limpo }]);
    setPergunta("");
    setSugestoes([]);
    setPensando(true);

    // A conversa até aqui (sem a pergunta nova), para a IA entender o contexto.
    const historico = mensagens.slice(-6).map((m) => ({ autor: m.autor, texto: m.texto }));
    const r: RespostaIA = await consultarIA(limpo, {
      rota: pathname,
      tela: nomeDaTela(pathname),
      papel: role,
    }, historico);

    setMensagens((m) => [...m, { autor: "ia", texto: r.resposta, motor: r.motor }]);
    setSugestoes(r.sugestoes);
    setPensando(false);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        title="Consultar a IA"
        aria-label="Consultar a IA"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Consultar IA"
      className="fixed bottom-3 right-3 z-40 flex h-[min(34rem,calc(100dvh-1.5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border bg-card shadow-pop sm:bottom-5 sm:right-5"
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold leading-tight">Consultar IA</p>
          <p className="truncate text-xs text-muted-foreground">{nomeDaTela(pathname)}</p>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar assistente"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background/60 p-4" aria-live="polite">
        {mensagens.length === 0 && (
          <div className="rounded-md border bg-card p-3 text-sm leading-relaxed text-muted-foreground">
            Pergunte como usar a Central Interna — churn, cadastro de pessoas, viagens,
            contracheques, integrações. Estou vendo que você está em{" "}
            <strong className="font-semibold text-foreground">{nomeDaTela(pathname)}</strong>.
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={cn("flex items-start gap-2", m.autor === "pessoa" && "flex-row-reverse")}>
            <div
              aria-hidden
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card",
                m.autor === "ia" ? "text-accent" : "text-muted-foreground"
              )}
            >
              {m.autor === "ia" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "min-w-0 max-w-[85%] rounded-lg border px-3 py-2 text-sm leading-relaxed",
                m.autor === "ia"
                  ? "bg-card text-foreground"
                  : "border-primary/15 bg-primary/10 text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.texto}</p>
              {m.motor && (
                <p className="mt-1.5 text-xs text-muted-foreground">via {m.motor}</p>
              )}
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex items-start gap-2" role="status" aria-label="A IA está respondendo">
            <div aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-card text-accent">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
            </div>
          </div>
        )}

        {sugestoes.length > 0 && !pensando && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sugestões</p>
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => perguntar(s)}
                className="block min-h-9 w-full rounded-md border bg-card px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={fim} />
      </div>

      <form
        className="flex items-center gap-2 border-t bg-card p-3"
        onSubmit={(e) => { e.preventDefault(); perguntar(pergunta); }}
      >
        <Input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte alguma coisa…"
          aria-label="Pergunta para a IA"
          className="h-10 text-sm"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" aria-label="Enviar pergunta"
          disabled={!pergunta.trim() || pensando}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
