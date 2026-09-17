import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Eye, EyeOff, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  alternarCompartilhamento, listarStatus, listarTarefasDaEmpresa, moverTarefa,
} from "@/data/store";
import { prioridadeVariant } from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import { useAuth } from "@/contexts/AuthContext";
import { EstadoVazio } from "@/components/EstadoVazio";
import { TarefaDialog } from "@/components/TarefaDialog";
import { TarefaDetalhe } from "@/components/TarefaDetalhe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Tarefas daquele cliente, agrupadas por fase quando vieram do onboarding. */
export function TarefasDaEmpresa({ empresaId }: { empresaId: string }) {
  const { userId } = useAuth();
  const [aberta, setAberta] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: tarefas } = useQuery({
    queryKey: ["tarefas-empresa", empresaId],
    queryFn: () => listarTarefasDaEmpresa(empresaId),
  });
  const { data: colunas } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });

  const ordem = (colunas ?? []).map((c) => c.id);
  const concluidos = new Set((colunas ?? []).filter((c) => c.concluido).map((c) => c.id));
  const rotuloStatus = (id: string) => colunas?.find((c) => c.id === id)?.label ?? "—";

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["tarefas-empresa", empresaId] });
    qc.invalidateQueries({ queryKey: ["tarefas"] });
  };

  const mover = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => moverTarefa(id, status, userId),
    onSuccess: recarregar,
  });

  const compartilhar = useMutation({
    mutationFn: (id: string) => alternarCompartilhamento(id),
    onSuccess: (t) => {
      recarregar();
      toast.success(t?.compartilhada ? "Compartilhada com o cliente" : "Tirada do painel do cliente");
    },
  });

  const lista = tarefas ?? [];
  if (lista.length === 0) {
    return (
      <EstadoVazio
        icone={ListChecks}
        titulo="Nenhuma tarefa para este cliente"
        descricao="Crie uma tarefa avulsa ou marque a empresa como onboarding na visão geral para gerar o roteiro de 26 etapas."
        acao={<TarefaDialog empresaFixa={empresaId} />}
      />
    );
  }

  const fases = Array.from(new Set(lista.map((t) => t.fase ?? "Sem fase")));
  const concluidas = lista.filter((t) => concluidos.has(t.status_id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {concluidas} de {lista.length} concluídas
          </p>
          <div className="mt-1.5 h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div className="gradient-primary h-full rounded-full transition-all"
              style={{ width: `${(concluidas / lista.length) * 100}%` }} />
          </div>
        </div>
        <TarefaDialog empresaFixa={empresaId} />
      </div>

      {fases.map((fase) => {
        const daFase = lista.filter((t) => (t.fase ?? "Sem fase") === fase);
        return (
          <div key={fase}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {fase}
            </p>
            <div className="space-y-2">
              {daFase.map((t) => {
                const i = ordem.indexOf(t.status_id);
                return (
                  <Card key={t.id}>
                    <CardContent className="flex flex-wrap items-center gap-3 p-3 pt-3">
                      <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => setAberta(t.id)}
                          className={cn("text-left text-sm hover:underline",
                            concluidos.has(t.status_id) && "text-muted-foreground line-through")}>
                          {t.titulo}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant={prioridadeVariant[t.prioridade]} className="text-[9px]">
                            {rotuloStatus(t.status_id)}
                          </Badge>
                          {t.lado !== "nos" && (
                            <span className="rounded bg-muted px-1.5 py-0.5">
                              {t.lado === "cliente" ? "cliente" : "comercial"}
                            </span>
                          )}
                          {t.prazo && (
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" /> {formatDate(t.prazo)}
                            </span>
                          )}
                          {t.compartilhada && (
                            <span className="text-info">
                              {t.aprovacao === "aprovada"
                                ? "aprovada pelo cliente"
                                : t.aprovacao === "ajuste_pedido"
                                  ? "ajuste pedido"
                                  : "no painel do cliente"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          title={t.compartilhada ? "Tirar do painel do cliente" : "Compartilhar com o cliente"}
                          onClick={() => compartilhar.mutate(t.id)}
                        >
                          {t.compartilhada
                            ? <EyeOff className="h-3.5 w-3.5 text-info" />
                            : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          disabled={i === ordem.length - 1}
                          onClick={() => mover.mutate({ id: t.id, status: ordem[i + 1] })}
                        >
                          Avançar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <TarefaDetalhe
        tarefa={lista.find((t) => t.id === aberta) ?? null}
        aberto={aberta !== null}
        onFechar={() => setAberta(null)}
      />
    </div>
  );
}
