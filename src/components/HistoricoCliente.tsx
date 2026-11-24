import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Video, FileText, ThermometerSun, Sparkles, CheckSquare, Flag,
  Filter, ExternalLink, History, BarChart3,
} from "lucide-react";
import { listarHistorico, producaoMensal } from "@/data/store";
import type { EventoHistoricoTipo } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista } from "@/components/Esqueletos";
import { Skeleton } from "@/components/ui/skeleton";
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

/** Cor do ícone de cada tipo de registro. */
const cores: Record<EventoHistoricoTipo, string> = {
  nota: "text-muted-foreground",
  reuniao: "text-info",
  documento: "text-primary",
  avaliacao: "text-warning-strong",
  analise_ia: "text-accent",
  tarefa: "text-success",
  flag: "text-destructive",
};

/** Cor do ponto no trilho da linha do tempo. */
const pontos: Record<EventoHistoricoTipo, string> = {
  nota: "bg-muted-foreground",
  reuniao: "bg-info",
  documento: "bg-primary",
  avaliacao: "bg-warning",
  analise_ia: "bg-accent",
  tarefa: "bg-success",
  flag: "bg-destructive",
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-accent" aria-hidden /> Produção dos últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!producao ? (
            <Skeleton className="h-32 w-full" />
          ) : totalEntregue === 0 && totalReunioes === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nenhuma entrega ou reunião registrada no período. Com o ClickUp e o Read.ai
              ligados, a produção mensal aparece aqui automaticamente.
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-2 sm:gap-4">
                {producao.map((p) => (
                  <div key={p.competencia} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span className="h-4 text-xs font-medium tabular-nums text-muted-foreground">
                      {p.entregues > 0 ? p.entregues : ""}
                    </span>
                    <div className="flex h-24 w-full max-w-16 items-end">
                      <div
                        className="w-full rounded-t-sm bg-primary transition-all"
                        style={{ height: `${Math.max((p.entregues / maxProducao) * 100, p.entregues > 0 ? 8 : 2)}%` }}
                        title={`${plural(p.entregues, "entrega", "entregas")}, ${plural(p.reunioes, "reunião", "reuniões")}`}
                      />
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">
                      {mesLegivel(p.competencia)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                <span>{plural(totalEntregue, "entrega", "entregas")}</span>
                <span>{plural(totalReunioes, "reunião", "reuniões")}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger className="h-9 gap-2 bg-card sm:w-64" aria-label="Filtrar por tipo de registro">
            <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
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
          <SelectTrigger className="h-9 bg-card sm:w-48" aria-label="Filtrar por período"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-between gap-3 sm:contents">
          <Button
            variant={soRelevantes ? "default" : "outline"}
            size="sm"
            className="h-9"
            aria-pressed={soRelevantes}
            onClick={() => setSoRelevantes((v) => !v)}
          >
            <Flag /> Só os marcos
          </Button>

          <span className="text-xs tabular-nums text-muted-foreground sm:ml-auto">
            {plural(filtrados.length, "registro", "registros")}
          </span>
        </div>
      </div>

      {!eventos ? (
        <EsqueletoLista linhas={4} />
      ) : filtrados.length === 0 ? (
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
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-accent" aria-hidden /> Linha do tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* Trilho fino à esquerda; um ponto por registro. Marco = ponto cheio na cor do tipo. */}
            <ol className="ml-1.5 space-y-6 border-l pl-5">
              {filtrados.map((e) => {
                const Icone = icones[e.tipo];
                return (
                  <li key={e.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -left-[25.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                        e.relevante ? pontos[e.tipo] : "border-2 border-muted-foreground/40 bg-card"
                      )}
                    />

                    <p className="text-xs tabular-nums text-muted-foreground">{dataLegivel(e.data)}</p>
                    <p className={cn("mt-0.5 break-words text-sm", e.relevante ? "font-semibold" : "font-medium")}>
                      {e.titulo}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Icone className={cn("h-3 w-3", cores[e.tipo])} aria-hidden /> {e.origem}
                      </Badge>
                      {e.autor && <span>{e.autor}</span>}
                    </div>

                    {e.descricao && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                        {e.descricao}
                      </p>
                    )}

                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-sm text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-0"
                      >
                        Abrir <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
