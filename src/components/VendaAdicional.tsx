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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-success" />
          Possibilidade de venda adicional
          {pendentes > 0 && (
            <Badge variant="outline" className="ml-1 text-[10px]">
              {pendentes} {pendentes === 1 ? "não ofertado" : "não ofertados"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {lista.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <PartyPopper className="h-4 w-4 shrink-0 text-success" />
            Este cliente já contrata todas as frentes que a agência vende.
          </div>
        ) : (
          lista.map((o) => (
            <div key={o.tipo}
              className={cn("rounded-lg border p-3 transition-colors",
                o.ofertado ? "bg-muted/30" : "bg-card")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                    tipoProjetoTom[o.tipo])}>
                    {tipoProjetoLabels[o.tipo]}
                  </span>
                  <p className="mt-1.5 text-xs text-muted-foreground">{argumento[o.tipo]}</p>
                </div>

                <Button
                  size="sm"
                  variant={o.ofertado ? "outline" : "default"}
                  className="h-7 shrink-0 text-xs"
                  onClick={() => ofertar.mutate({ tipo: o.tipo, ofertado: !o.ofertado })}
                >
                  {o.ofertado
                    ? <><Check className="h-3.5 w-3.5" /> Ofertado</>
                    : <><CircleDashed className="h-3.5 w-3.5" /> Marcar como ofertado</>}
                </Button>
              </div>

              {o.ofertado && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t pt-2.5">
                  <Select value={o.resposta}
                    onValueChange={(v) => responder.mutate({ tipo: o.tipo, resposta: v as RespostaOferta })}>
                    <SelectTrigger className="h-7 w-52 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(respostaLabels) as RespostaOferta[]).map((r) => (
                        <SelectItem key={r} value={r}>{respostaLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-[11px] text-muted-foreground">
                    {o.ofertado_em && `ofertado em ${formatDate(o.ofertado_em.slice(0, 10))}`}
                    {nomeDe(o.ofertado_por) && ` por ${nomeDe(o.ofertado_por)}`}
                  </span>
                </div>
              )}
            </div>
          ))
        )}

        <p className="pt-1 text-[11px] text-muted-foreground">
          A lista se ajusta sozinha: assim que a frente é lançada, o serviço sai daqui
          e passa a aparecer em Projetos por frente.
        </p>
      </CardContent>
    </Card>
  );
}
