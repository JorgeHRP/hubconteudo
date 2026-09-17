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
import { Separator } from "@/components/ui/separator";
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
  mencao: { icone: AtSign, tom: "bg-warning/10 text-warning" },
  mudanca_status: { icone: Circle, tom: "bg-info/10 text-info" },
  mudanca_responsavel: { icone: UserPlus, tom: "bg-primary/10 text-primary" },
  prazo_proximo: { icone: Clock, tom: "bg-warning/10 text-warning" },
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
            aria-label={naoLidas > 0 ? `Avisos: ${naoLidas} não lidos` : "Avisos"}
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {naoLidas > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-[22rem] p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Avisos</span>
            <div className="flex items-center gap-0.5">
              {naoLidas > 0 && (
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Marcar tudo como lido"
                  onClick={() => lerTudo.mutate()}>
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Preferências"
                onClick={() => { setAberto(false); setAjustes(true); }}>
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {lista.length === 0 ? (
              <p className="px-3 py-10 text-center text-xs text-muted-foreground">
                Nada por aqui. Quando alguém te citar, mudar uma tarefa sua ou um prazo
                chegar, o aviso aparece neste sino.
              </p>
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
                      "flex w-full gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50",
                      !n.lida && "bg-primary/5"
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", v.tom)}>
                      <v.icone className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium">{notificacaoLabels[n.tipo]}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {quando(n.created_at)}
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{n.texto}</span>
                    </span>
                    {!n.lida && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {lista.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="h-7 w-full text-xs"
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

          <div className="space-y-1">
            {ordemPreferencias.map((tipo, i) => {
              const v = visual[tipo];
              return (
                <div key={tipo}>
                  {i > 0 && <Separator />}
                  <label className="flex cursor-pointer items-center gap-3 py-2.5">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", v.tom)}>
                      <v.icone className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Label className="cursor-pointer text-sm">{notificacaoLabels[tipo]}</Label>
                      <p className="text-[11px] text-muted-foreground">{notificacaoAjuda[tipo]}</p>
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                      checked={ligado(tipo)}
                      onChange={(e) => trocarPref.mutate({ tipo, ativo: e.target.checked })}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
