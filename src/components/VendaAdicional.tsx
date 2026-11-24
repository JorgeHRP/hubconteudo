import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Check, CircleDashed, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listarOportunidades, listarProfiles, marcarOferta, responderOferta,
} from "@/data/store";
import { tipoProjetoLabels, tipoProjetoTom } from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type { RespostaOferta, TipoProjeto } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const respostaLabels: Record<RespostaOferta, string> = {
  sem_resposta: "Aguardando resposta",
  interessado: "Cliente interessado",
  recusado: "Cliente recusou",
};

/** O que cada frente resolve — ajuda o CS a abrir a conversa com o cliente. */
const argumento: Record<TipoProjeto, string> = {
  cs: "Atendimento e acompanhamento da conta.",
  trafego: "Mídia paga para gerar demanda com verba controlada.",
  seo: "Tráfego orgânico e presença nas buscas e nas respostas de IA.",
  inbound: "Conteúdo e nutrição para transformar visitante em matrícula.",
  rd: "Implantação do RD Station para organizar o funil e automatizar.",
  sites: "Site ou hotsite pensado para converter, não só para existir.",
  social: "Presença constante nas redes, com pauta e calendário.",
};

/**
 * Sugestão de venda adicional: as frentes que a agência vende e este cliente
 * ainda não contratou. A lista se atualiza sozinha — assim que o projeto é
 * lançado, o serviço sai daqui e entra em "Projetos por frente".
 */
export function VendaAdicional({ empresaId }: { empresaId: string }) {
  const { userId } = useAuth();
  const qc = useQueryClient();

  const { data: oportunidades } = useQuery({
    queryKey: ["oportunidades", empresaId],
    queryFn: () => listarOportunidades(empresaId),
  });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const recarregar = () => qc.invalidateQueries({ queryKey: ["oportunidades", empresaId] });

  const ofertar = useMutation({
    mutationFn: ({ tipo, ofertado }: { tipo: TipoProjeto; ofertado: boolean }) =>
      marcarOferta({ empresa_id: empresaId, tipo, ofertado, ofertado_por: userId }),
    onSuccess: (_, v) => {
      recarregar();
      toast.success(v.ofertado ? "Marcado como ofertado" : "Oferta desfeita");
    },
  });

  const responder = useMutation({
    mutationFn: ({ tipo, resposta }: { tipo: TipoProjeto; resposta: RespostaOferta }) =>
      responderOferta(empresaId, tipo, resposta),
    onSuccess: recarregar,
  });

  const lista = oportunidades ?? [];
  const nomeDe = (id: string | null) =>
    profiles?.find((p) => p.user_id === id)?.nome ?? null;

  const pendentes = lista.filter((o) => !o.ofertado).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          Possibilidade de venda adicional
        </CardTitle>
        {pendentes > 0 && (
          <Badge variant="warning">
            {pendentes} {pendentes === 1 ? "não ofertado" : "não ofertados"}
          </Badge>
        )}
      </CardHeader>

      {!oportunidades ? (
        <div className="divide-y border-t" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 px-5 py-3">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="flex items-center gap-3 border-t px-5 py-4 text-sm text-muted-foreground">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success"
          >
            <PartyPopper className="h-4 w-4" />
          </span>
          Este cliente já contrata todas as frentes que a agência vende.
        </div>
      ) : (
        <ul className="divide-y border-t">
          {lista.map((o) => (
            <li key={o.tipo}
              className={cn("px-5 py-3 transition-colors", o.ofertado && "bg-muted/50")}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1 basis-56">
                  <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                    tipoProjetoTom[o.tipo])}>
                    {tipoProjetoLabels[o.tipo]}
                  </span>
                  <p className="mt-1.5 text-sm text-muted-foreground">{argumento[o.tipo]}</p>
                </div>

                <Button
                  size="sm"
                  variant={o.ofertado ? "outline" : "default"}
                  className="shrink-0"
                  aria-pressed={o.ofertado}
                  onClick={() => ofertar.mutate({ tipo: o.tipo, ofertado: !o.ofertado })}
                >
                  {o.ofertado
                    ? <><Check className="text-success" /> Ofertado</>
                    : <><CircleDashed /> Marcar como ofertado</>}
                </Button>
              </div>

              {o.ofertado && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Select value={o.resposta}
                    onValueChange={(v) => responder.mutate({ tipo: o.tipo, resposta: v as RespostaOferta })}>
                    <SelectTrigger className="h-9 w-full bg-card text-sm sm:w-56"
                      aria-label={`Resposta do cliente para ${tipoProjetoLabels[o.tipo]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(respostaLabels) as RespostaOferta[]).map((r) => (
                        <SelectItem key={r} value={r}>{respostaLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-xs text-muted-foreground">
                    {o.ofertado_em && `ofertado em ${formatDate(o.ofertado_em.slice(0, 10))}`}
                    {nomeDe(o.ofertado_por) && ` por ${nomeDe(o.ofertado_por)}`}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="border-t px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        A lista se ajusta sozinha: assim que a frente é lançada, o serviço sai daqui
        e passa a aparecer em Projetos por frente.
      </p>
    </Card>
  );
}
