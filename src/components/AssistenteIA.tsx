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

    const r: RespostaIA = await consultarIA(limpo, {
      rota: pathname,
      tela: nomeDaTela(pathname),
      papel: role,
    });

    setMensagens((m) => [...m, { autor: "ia", texto: r.resposta, motor: r.motor }]);
    setSugestoes(r.sugestoes);
    setPensando(false);
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        title="Consultar a IA"
        className="gradient-primary fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[540px] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border bg-card shadow-xl">
      <div className="gradient-primary flex items-center gap-2 px-4 py-3 text-primary-foreground">
        <Sparkles className="h-4 w-4" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Consultar IA</p>
          <p className="truncate text-[10px] opacity-80">{nomeDaTela(pathname)}</p>
        </div>
        <button onClick={() => setAberto(false)} aria-label="Fechar assistente">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.length === 0 && (
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Pergunte como usar a Central Interna — churn, cadastro de pessoas, viagens,
            contracheques, integrações. Estou vendo que você está em{" "}
            <strong className="text-foreground">{nomeDaTela(pathname)}</strong>.
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.autor === "pessoa" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                m.autor === "ia" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {m.autor === "ia" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                m.autor === "ia" ? "bg-muted/60" : "bg-primary text-primary-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{m.texto}</p>
              {m.motor && (
                <p className="mt-1.5 text-[9px] text-muted-foreground">via {m.motor}</p>
              )}
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {sugestoes.length > 0 && !pensando && (
          <div className="space-y-1.5 pt-1">
            {sugestoes.map((s) => (
              <button
                key={s}
                onClick={() => perguntar(s)}
                className="block w-full rounded-md border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={fim} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => { e.preventDefault(); perguntar(pergunta); }}
      >
        <Input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte alguma coisa…"
          className="h-9 text-xs"
        />
        <Button type="submit" size="sm" className="h-9 px-3" disabled={!pergunta.trim() || pensando}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
