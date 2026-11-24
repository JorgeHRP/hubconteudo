import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, MessageSquareWarning, Clock, Link2Off, CalendarClock, Circle,
} from "lucide-react";
import { toast } from "sonner";
import {
  buscarEmpresaPorToken, listarTarefasDaEmpresa, marcarNotificacoesLidas, responderTarefa,
} from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import type { AprovacaoCliente, Tarefa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Marca } from "@/components/Marca";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista } from "@/components/Esqueletos";

/**
 * Painel do cliente — aberto por link exclusivo, sem login.
 * Mostra apenas o que a agência compartilhou e permite aprovar ou pedir ajuste.
 */
export default function PortalCliente() {
  const { token = "" } = useParams();
  const qc = useQueryClient();
  const [comentando, setComentando] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["portal-empresa", token],
    queryFn: () => buscarEmpresaPorToken(token),
  });

  const { data: tarefas, isLoading: carregandoTarefas } = useQuery({
    queryKey: ["portal-tarefas", empresa?.id],
    queryFn: () => listarTarefasDaEmpresa(empresa!.id),
    enabled: Boolean(empresa),
  });

  useEffect(() => {
    if (empresa) marcarNotificacoesLidas(empresa.id);
  }, [empresa]);

  const responder = useMutation({
    mutationFn: ({ id, resposta, texto }: { id: string; resposta: AprovacaoCliente; texto: string | null }) =>
      responderTarefa(id, resposta, texto),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["portal-tarefas", empresa?.id] });
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      setComentando(null);
      setComentario("");
      toast.success(v.resposta === "aprovada" ? "Aprovado. Obrigado!" : "Pedido de ajuste enviado.");
    },
  });

  const compartilhadas = useMemo(
    () => (tarefas ?? []).filter((t) => t.compartilhada),
    [tarefas]
  );

  const aguardando = compartilhadas.filter(
    (t) => t.aprovacao === null || t.aprovacao === "aguardando"
  );
  const respondidas = compartilhadas.filter((t) => t.aprovacao && t.aprovacao !== "aguardando");

  if (isLoading) {
    return (
      <div role="status" aria-label="Carregando" className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <EsqueletoLista linhas={3} />
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
        <Marca altura={28} />
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Link2Off className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">
                Link inválido ou expirado
              </h1>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Peça um novo link para a sua equipe de atendimento na Conteúdo Martech.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função de marcação (não componente): mantém o campo de texto montado enquanto se digita.
  function renderItem(t: Tarefa) {
    const respondida = t.aprovacao && t.aprovacao !== "aguardando";
    const feitas = t.subtarefas.filter((s) => s.feita).length;
    return (
      <li key={t.id} className="px-4 py-5 sm:px-5">
        <h3 className="break-words font-display text-base font-semibold leading-snug text-foreground">
          {t.titulo}
        </h3>

        {(t.fase || t.prazo) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {t.fase && <Badge variant="secondary">{t.fase}</Badge>}
            {t.prazo && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                <span className="sr-only">Prazo:</span>
                {formatDate(t.prazo)}
              </span>
            )}
          </div>
        )}

        {t.descricao && (
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
            {t.descricao}
          </p>
        )}

        {t.subtarefas.length > 0 && (
          <div className="mt-4 rounded-md border bg-muted/40 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Etapas
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {feitas} de {t.subtarefas.length} concluídas
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${Math.round((feitas / t.subtarefas.length) * 100)}%` }}
              />
            </div>
            <ul className="mt-3 space-y-2">
              {t.subtarefas.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                  {s.feita ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                  )}
                  <span className="sr-only">{s.feita ? "Concluída:" : "Pendente:"}</span>
                  <span className={cn("min-w-0 break-words", s.feita ? "text-muted-foreground" : "text-foreground")}>
                    {s.titulo}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {respondida ? (
          <div className="mt-4">
            <Badge variant={t.aprovacao === "aprovada" ? "success" : "warning"}>
              {t.aprovacao === "aprovada" ? "Aprovado por você" : "Ajuste solicitado"}
            </Badge>
            {t.comentario_cliente && (
              <blockquote className="mt-3 whitespace-pre-line break-words border-l-2 pl-3 text-sm leading-relaxed text-muted-foreground">
                “{t.comentario_cliente}”
              </blockquote>
            )}
          </div>
        ) : comentando === t.id ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que precisa ser ajustado?"
              aria-label="O que precisa ser ajustado?"
              className="min-h-24 text-base sm:text-sm"
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="h-10 sm:h-9"
                onClick={() => setComentando(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-10 sm:h-9"
                disabled={!comentario.trim()}
                onClick={() => responder.mutate({
                  id: t.id, resposta: "ajuste_pedido", texto: comentario.trim(),
                })}
              >
                Enviar pedido
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              size="sm"
              className="h-10 sm:h-9"
              onClick={() => responder.mutate({ id: t.id, resposta: "aprovada", texto: null })}
            >
              <CheckCircle2 /> Aprovar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 sm:h-9"
              onClick={() => { setComentando(t.id); setComentario(""); }}
            >
              <MessageSquareWarning /> Pedir ajuste
            </Button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Marca tipo="emblema" altura={34} className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold leading-tight text-foreground">
              {empresa.nome_fantasia}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Acompanhamento · Conteúdo Martech
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
            Entregas para sua revisão
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Veja o que a equipe compartilhou e aprove ou peça ajuste em cada entrega.
          </p>
        </div>

        {carregandoTarefas ? (
          <div role="status" aria-label="Carregando">
            <EsqueletoLista linhas={3} />
          </div>
        ) : compartilhadas.length === 0 ? (
          <EstadoVazio
            icone={Clock}
            titulo="Nada para revisar por enquanto"
            descricao="Quando a equipe compartilhar uma entrega, ela aparece aqui para você aprovar ou pedir ajuste."
          />
        ) : (
          <>
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Entregas respondidas</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    <span className="font-display text-base font-semibold text-foreground">
                      {respondidas.length}
                    </span>{" "}
                    de {compartilhadas.length}
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label="Entregas respondidas"
                  aria-valuemin={0}
                  aria-valuemax={compartilhadas.length}
                  aria-valuenow={respondidas.length}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((respondidas.length / compartilhadas.length) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {aguardando.length > 0 && (
              <section aria-labelledby="portal-aguardando">
                <Card className="overflow-hidden">
                  <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-4 py-4 sm:px-5">
                    <CardTitle className="text-base">
                      <h2 id="portal-aguardando">Aguardando você</h2>
                    </CardTitle>
                    <Badge variant="warning" className="shrink-0 tabular-nums">
                      {aguardando.length}
                    </Badge>
                  </CardHeader>
                  <ul className="divide-y">
                    {aguardando.map((t) => renderItem(t))}
                  </ul>
                </Card>
              </section>
            )}

            {respondidas.length > 0 && (
              <section aria-labelledby="portal-respondidas">
                <Card className="overflow-hidden">
                  <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-4 py-4 sm:px-5">
                    <CardTitle className="text-base">
                      <h2 id="portal-respondidas">Já respondidas</h2>
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {respondidas.length}
                    </Badge>
                  </CardHeader>
                  <ul className="divide-y">
                    {respondidas.map((t) => renderItem(t))}
                  </ul>
                </Card>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-3xl space-y-1 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground sm:px-6">
          <p>Link exclusivo. Não compartilhe fora da sua equipe.</p>
          <p>Produzido por Conteúdo Martech</p>
        </div>
      </footer>
    </div>
  );
}
