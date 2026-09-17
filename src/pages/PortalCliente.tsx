import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, MessageSquareWarning, Clock, ShieldCheck, CalendarClock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  buscarEmpresaPorToken, listarTarefasDaEmpresa, marcarNotificacoesLidas, responderTarefa,
} from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import type { AprovacaoCliente, Tarefa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Marca } from "@/components/Marca";

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

  const { data: tarefas } = useQuery({
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Link inválido ou expirado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peça um novo link para a sua equipe de atendimento na Conteúdo Martech.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function Item({ t }: { t: Tarefa }) {
    const respondida = t.aprovacao && t.aprovacao !== "aguardando";
    return (
      <Card className={cn(respondida && "bg-card/60")}>
        <CardContent className="p-5 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">{t.titulo}</p>
              {t.fase && (
                <Badge variant="secondary" className="mt-1 text-[9px]">{t.fase}</Badge>
              )}
            </div>
            {t.prazo && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> {formatDate(t.prazo)}
              </span>
            )}
          </div>

          {t.descricao && (
            <p className="mt-2 text-sm text-muted-foreground">{t.descricao}</p>
          )}

          {t.subtarefas.length > 0 && (
            <ul className="mt-3 space-y-1 border-t pt-3">
              {t.subtarefas.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-full border",
                    s.feita ? "border-success bg-success" : "border-input"
                  )} />
                  {s.titulo}
                </li>
              ))}
            </ul>
          )}

          {respondida ? (
            <div className="mt-3 border-t pt-3">
              <Badge variant={t.aprovacao === "aprovada" ? "success" : "warning"} className="text-[10px]">
                {t.aprovacao === "aprovada" ? "Aprovado por você" : "Ajuste solicitado"}
              </Badge>
              {t.comentario_cliente && (
                <p className="mt-2 text-sm text-muted-foreground">“{t.comentario_cliente}”</p>
              )}
            </div>
          ) : comentando === t.id ? (
            <div className="mt-3 space-y-2 border-t pt-3">
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="O que precisa ser ajustado?"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setComentando(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
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
            <div className="mt-3 flex gap-2 border-t pt-3">
              <Button
                size="sm"
                onClick={() => responder.mutate({ id: t.id, resposta: "aprovada", texto: null })}
              >
                <CheckCircle2 /> Aprovar
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setComentando(t.id); setComentario(""); }}>
                <MessageSquareWarning /> Pedir ajuste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <Marca tipo="emblema" altura={30} className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{empresa.nome_fantasia}</p>
            <p className="text-xs text-muted-foreground">
              Acompanhamento · Conteúdo Martech
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-6">
        {compartilhadas.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="font-medium">Nada para revisar por enquanto</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Quando a equipe compartilhar uma entrega, ela aparece aqui para você aprovar
                ou pedir ajuste.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {aguardando.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  Aguardando você
                  <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                    {aguardando.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {aguardando.map((t) => <Item key={t.id} t={t} />)}
                </div>
              </section>
            )}

            {respondidas.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Já respondidas
                </h2>
                <div className="space-y-3">
                  {respondidas.map((t) => <Item key={t.id} t={t} />)}
                </div>
              </section>
            )}
          </>
        )}

        <p className="pb-6 text-center text-xs text-muted-foreground">
          Link exclusivo. Não compartilhe fora da sua equipe.
        </p>
      </main>
    </div>
  );
}
