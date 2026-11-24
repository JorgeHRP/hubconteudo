import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bell, MessageSquare, AtSign, UserPlus, Circle, Clock, AlertTriangle,
  CheckCircle2, ListTree, Paperclip, Mail, Plus, Eye, Settings2, CheckCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  listarNotificacoes, listarPreferencias, marcarNotificacaoLida,
  marcarTodasLidas, limparNotificacoes, salvarPreferencia,
} from "@/data/store";
import { notificacaoAjuda, notificacaoLabels } from "@/lib/labels-clientes";
import type { TipoNotificacao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Ícone e tom de cada aviso. Os tons saem dos tokens do tema — nada de cor fixa,
 * senão o modo escuro quebra.
 */
const visual: Record<TipoNotificacao, { icone: typeof Bell; tom: string }> = {
  nova_tarefa: { icone: Plus, tom: "bg-primary/10 text-primary" },
  comentario: { icone: MessageSquare, tom: "bg-info/10 text-info" },
  mencao: { icone: AtSign, tom: "bg-warning/15 text-warning-strong" },
  mudanca_status: { icone: Circle, tom: "bg-info/10 text-info" },
  mudanca_responsavel: { icone: UserPlus, tom: "bg-primary/10 text-primary" },
  prazo_proximo: { icone: Clock, tom: "bg-warning/15 text-warning-strong" },
  atrasada: { icone: AlertTriangle, tom: "bg-destructive/10 text-destructive" },
  concluida: { icone: CheckCircle2, tom: "bg-success/10 text-success" },
  subtarefa: { icone: ListTree, tom: "bg-accent/10 text-accent" },
  anexo: { icone: Paperclip, tom: "bg-muted text-muted-foreground" },
  resumo_diario: { icone: Mail, tom: "bg-primary/10 text-primary" },
  observando: { icone: Eye, tom: "bg-info/10 text-info" },
};

const ordemPreferencias: TipoNotificacao[] = [
  "nova_tarefa", "mudanca_responsavel", "mencao", "comentario",
  "mudanca_status", "concluida", "prazo_proximo", "atrasada",
  "subtarefa", "anexo", "observando", "resumo_diario",
];

function quando(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)} h`;
  return `${Math.floor(min / 1440)} d`;
}

/** Sino com a caixa de avisos do time e o ajuste do que cada um quer receber. */
export function SinoNotificacoes() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [ajustes, setAjustes] = useState(false);

  const { data: avisos } = useQuery({
    queryKey: ["notificacoes", userId],
    queryFn: () => listarNotificacoes(userId!),
    enabled: Boolean(userId),
    // Sem servidor empurrando evento, a caixa se atualiza sozinha de meio em meio minuto.
    refetchInterval: 30000,
  });
  const { data: prefs } = useQuery({
    queryKey: ["preferencias-notificacao", userId],
    queryFn: () => listarPreferencias(userId!),
    enabled: Boolean(userId) && ajustes,
  });

  const atualizar = () => qc.invalidateQueries({ queryKey: ["notificacoes", userId] });

  const ler = useMutation({ mutationFn: marcarNotificacaoLida, onSuccess: atualizar });
  const lerTudo = useMutation({ mutationFn: () => marcarTodasLidas(userId!), onSuccess: atualizar });
  const limpar = useMutation({ mutationFn: () => limparNotificacoes(userId!), onSuccess: atualizar });
  const trocarPref = useMutation({
    mutationFn: ({ tipo, ativo }: { tipo: TipoNotificacao; ativo: boolean }) =>
      salvarPreferencia(userId!, tipo, ativo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preferencias-notificacao", userId] });
      atualizar();
    },
  });

  const lista = avisos ?? [];
  const naoLidas = lista.filter((n) => !n.lida).length;
  const ligado = (tipo: TipoNotificacao) =>
    prefs?.find((p) => p.tipo === tipo)?.ativo ?? true;

  return (
    <>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={naoLidas > 0 ? `Avisos: ${naoLidas} não lidos` : "Avisos"}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Bell className="h-5 w-5" />
            {naoLidas > 0 && (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold leading-none tabular-nums text-destructive-foreground ring-2 ring-background"
              >
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border bg-popover p-0 shadow-pop"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="font-display text-sm font-semibold">Avisos</span>
              {naoLidas > 0 && (
                <span className="truncate text-xs tabular-nums text-muted-foreground">
                  {naoLidas} não {naoLidas === 1 ? "lido" : "lidos"}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {naoLidas > 0 && (
                <Button variant="ghost" size="icon" className="h-9 w-9" title="Marcar tudo como lido"
                  aria-label="Marcar tudo como lido"
                  onClick={() => lerTudo.mutate()}>
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Preferências"
                aria-label="Preferências de aviso"
                onClick={() => { setAberto(false); setAjustes(true); }}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[min(24rem,60vh)] divide-y overflow-y-auto">
            {avisos === undefined && Boolean(userId) ? (
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3" aria-hidden>
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span
                  aria-hidden
                  className="flex h-11 w-11 items-center justify-center rounded-lg border bg-card text-accent shadow-card"
                >
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold">Nada por aqui</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Quando alguém te citar, mudar uma tarefa sua ou um prazo
                    chegar, o aviso aparece neste sino.
                  </p>
                </div>
              </div>
            ) : (
              lista.map((n) => {
                const v = visual[n.tipo];
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.lida) ler.mutate(n.id);
                      if (n.tarefa_id) { setAberto(false); navegar("/tarefas"); }
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
                      !n.lida && "bg-accent/5"
                    )}
                  >
                    <span aria-hidden className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md", v.tom)}>
                      <v.icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", n.lida ? "font-medium text-foreground/80" : "font-semibold text-foreground")}>
                          {notificacaoLabels[n.tipo]}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {quando(n.created_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 block break-words text-xs leading-relaxed text-muted-foreground">{n.texto}</span>
                    </span>
                    {!n.lida && (
                      <>
                        <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                        <span className="sr-only">Não lido</span>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {lista.length > 0 && (
            <div className="border-t bg-muted/50 p-1.5">
              <Button variant="ghost" size="sm" className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => limpar.mutate()}>
                Limpar tudo
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={ajustes} onOpenChange={setAjustes}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preferências de aviso</DialogTitle>
            <DialogDescription>
              Vale só para você. Desligar aqui não some com a tarefa — some com o aviso.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y overflow-hidden rounded-md border">
            {ordemPreferencias.map((tipo) => {
              const v = visual[tipo];
              return (
                <label key={tipo} className="flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50">
                  <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", v.tom)}>
                    <v.icone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Label className="cursor-pointer text-sm">{notificacaoLabels[tipo]}</Label>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{notificacaoAjuda[tipo]}</p>
                  </span>
                  <input
                    type="checkbox"
                    className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
                    checked={ligado(tipo)}
                    onChange={(e) => trocarPref.mutate({ tipo, ativo: e.target.checked })}
                  />
                </label>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
