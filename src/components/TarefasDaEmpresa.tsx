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
import { EsqueletoLista } from "@/components/Esqueletos";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (!tarefas) {
    return (
      <div role="status" aria-label="Carregando tarefas">
        <EsqueletoLista linhas={4} />
      </div>
    );
  }
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
    <div>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 space-y-0 pb-4">
          <div className="min-w-0 flex-1 basis-48">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-accent" aria-hidden /> Tarefas do cliente
            </CardTitle>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-2 w-full max-w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(concluidas / lista.length) * 100}%` }} />
              </div>
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {concluidas} de {lista.length} concluídas
              </p>
            </div>
          </div>
          <TarefaDialog empresaFixa={empresaId} />
        </CardHeader>

        {fases.map((fase) => {
          const daFase = lista.filter((t) => (t.fase ?? "Sem fase") === fase);
          return (
            <section key={fase} aria-label={fase}>
              <h3 className="border-y bg-muted/50 px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {fase}
              </h3>
              <ul className="divide-y">
                {daFase.map((t) => {
                  const i = ordem.indexOf(t.status_id);
                  return (
                    <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                      <div className="min-w-0 flex-1 basis-56">
                        <button type="button" onClick={() => setAberta(t.id)}
                          className={cn(
                            "rounded-sm text-left text-sm font-medium leading-snug transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            concluidos.has(t.status_id) && "font-normal text-muted-foreground line-through")}>
                          {t.titulo}
                        </button>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                          <Badge variant={prioridadeVariant[t.prioridade]}>
                            {rotuloStatus(t.status_id)}
                          </Badge>
                          {t.lado !== "nos" && (
                            <span className="rounded-md bg-muted px-1.5 py-0.5">
                              {t.lado === "cliente" ? "cliente" : "comercial"}
                            </span>
                          )}
                          {t.prazo && (
                            <span className="flex items-center gap-1 tabular-nums">
                              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {formatDate(t.prazo)}
                            </span>
                          )}
                          {t.compartilhada && (
                            <span className="flex items-center gap-1 text-info">
                              <Eye className="h-3.5 w-3.5" aria-hidden />
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
                          variant="ghost" size="icon" className="h-9 w-9"
                          title={t.compartilhada ? "Tirar do painel do cliente" : "Compartilhar com o cliente"}
                          aria-label={t.compartilhada ? "Tirar do painel do cliente" : "Compartilhar com o cliente"}
                          onClick={() => compartilhar.mutate(t.id)}
                        >
                          {t.compartilhada
                            ? <EyeOff className="h-4 w-4 text-info" />
                            : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          disabled={i === ordem.length - 1}
                          onClick={() => mover.mutate({ id: t.id, status: ordem[i + 1] })}
                        >
                          Avançar
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </Card>

      <TarefaDetalhe
        tarefa={lista.find((t) => t.id === aberta) ?? null}
        aberto={aberta !== null}
        onFechar={() => setAberta(null)}
      />
    </div>
  );
}
