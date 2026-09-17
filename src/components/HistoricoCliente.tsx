import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Video, FileText, ThermometerSun, Sparkles, CheckSquare, Flag,
  Filter, ExternalLink, History, BarChart3,
} from "lucide-react";
import { listarHistorico, producaoMensal } from "@/data/store";
import type { EventoHistoricoTipo } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const icones: Record<EventoHistoricoTipo, typeof MessageSquare> = {
  nota: MessageSquare,
  reuniao: Video,
  documento: FileText,
  avaliacao: ThermometerSun,
  analise_ia: Sparkles,
  tarefa: CheckSquare,
  flag: Flag,
};

const rotulos: Record<EventoHistoricoTipo, string> = {
  nota: "Notas do time",
  reuniao: "Reuniões",
  documento: "Documentos e relatórios",
  avaliacao: "Avaliações de churn",
  analise_ia: "Análises por IA",
  tarefa: "Entregas do ClickUp",
  flag: "Mudanças de flag",
};

const cores: Record<EventoHistoricoTipo, string> = {
  nota: "bg-muted text-muted-foreground",
  reuniao: "bg-info/10 text-info",
  documento: "bg-primary/10 text-primary",
  avaliacao: "bg-warning/10 text-warning",
  analise_ia: "bg-accent/10 text-accent",
  tarefa: "bg-success/10 text-success",
  flag: "bg-destructive/10 text-destructive",
};

const periodos = [
  { valor: "30", label: "Últimos 30 dias" },
  { valor: "90", label: "Últimos 3 meses" },
  { valor: "180", label: "Últimos 6 meses" },
  { valor: "365", label: "Último ano" },
  { valor: "tudo", label: "Todo o período" },
];

/** "2026-08-28" vira meio-dia local, senão o fuso joga a data para o dia anterior. */
function dataLegivel(iso: string) {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const plural = (n: number, um: string, muitos: string) =>
  `${n} ${n === 1 ? um : muitos}`;

function mesLegivel(competencia: string) {
  const [ano, mes] = competencia.split("-");
  return new Date(Number(ano), Number(mes) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

export function HistoricoCliente({ clienteId }: { clienteId: string }) {
  const [tipo, setTipo] = useState<"todos" | EventoHistoricoTipo>("todos");
  const [periodo, setPeriodo] = useState("90");
  const [soRelevantes, setSoRelevantes] = useState(false);

  const { data: eventos } = useQuery({
    queryKey: ["historico", clienteId],
    queryFn: () => listarHistorico(clienteId),
  });
  const { data: producao } = useQuery({
    queryKey: ["producao", clienteId],
    queryFn: () => producaoMensal(clienteId),
  });

  const filtrados = useMemo(() => {
    const lista = eventos ?? [];
    const limite =
      periodo === "tudo"
        ? null
        : new Date(Date.now() - Number(periodo) * 86400000).toISOString();

    return lista.filter((e) => {
      if (tipo !== "todos" && e.tipo !== tipo) return false;
      if (soRelevantes && !e.relevante) return false;
      if (limite && e.data < limite) return false;
      return true;
    });
  }, [eventos, tipo, periodo, soRelevantes]);

  const porTipo = useMemo(() => {
    const contagem = {} as Record<EventoHistoricoTipo, number>;
    (eventos ?? []).forEach((e) => {
      contagem[e.tipo] = (contagem[e.tipo] ?? 0) + 1;
    });
    return contagem;
  }, [eventos]);

  const maxProducao = Math.max(...(producao ?? []).map((p) => p.entregues), 1);
  const totalEntregue = (producao ?? []).reduce((s, p) => s + p.entregues, 0);
  const totalReunioes = (producao ?? []).reduce((s, p) => s + p.reunioes, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" /> Produção dos últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalEntregue === 0 && totalReunioes === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nenhuma entrega ou reunião registrada no período. Com o ClickUp e o Read.ai
              ligados, a produção mensal aparece aqui automaticamente.
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-2">
                {producao?.map((p) => (
                  <div key={p.competencia} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {p.entregues > 0 ? p.entregues : ""}
                    </span>
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="gradient-primary w-full rounded-t-md transition-all"
                        style={{ height: `${Math.max((p.entregues / maxProducao) * 100, p.entregues > 0 ? 8 : 2)}%` }}
                        title={`${plural(p.entregues, "entrega", "entregas")}, ${plural(p.reunioes, "reunião", "reuniões")}`}
                      />
                    </div>
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {mesLegivel(p.competencia)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 border-t pt-3 text-xs text-muted-foreground">
                <span>{plural(totalEntregue, "entrega", "entregas")}</span>
                <span>{plural(totalReunioes, "reunião", "reuniões")}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger className="h-9 w-56 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Tudo ({eventos?.length ?? 0})</SelectItem>
            {(Object.keys(rotulos) as EventoHistoricoTipo[]).map((t) => (
              <SelectItem key={t} value={t} disabled={!porTipo[t]}>
                {rotulos[t]} ({porTipo[t] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={soRelevantes ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => setSoRelevantes((v) => !v)}
        >
          Só os marcos
        </Button>

        <span className="ml-auto text-xs text-muted-foreground">
          {plural(filtrados.length, "registro", "registros")}
        </span>
      </div>

      {filtrados.length === 0 ? (
        <EstadoVazio
          icone={History}
          titulo={eventos?.length === 0 ? "Histórico ainda vazio" : "Nada neste filtro"}
          descricao={
            eventos?.length === 0
              ? "A jornada do cliente se monta sozinha: notas do time, reuniões do Read.ai, relatórios, avaliações de churn, análises por IA e entregas do ClickUp entram aqui conforme acontecem."
              : "Amplie o período ou troque o tipo de registro."
          }
        />
      ) : (
        <div className="relative">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />
          <div className="space-y-3">
            {filtrados.map((e) => {
              const Icone = icones[e.tipo];
              return (
                <div key={e.id} className="relative flex gap-3">
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                      cores[e.tipo]
                    )}
                  >
                    <Icone className="h-4 w-4" />
                  </div>

                  <Card className={cn("flex-1", !e.relevante && "bg-card/60")}>
                    <CardContent className="p-3 pt-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium">{e.titulo}</p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="secondary" className="text-[9px]">{e.origem}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {dataLegivel(e.data)}
                          </span>
                        </div>
                      </div>

                      {e.descricao && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                          {e.descricao}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3">
                        {e.autor && (
                          <span className="text-[10px] text-muted-foreground">{e.autor}</span>
                        )}
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                          >
                            Abrir <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
