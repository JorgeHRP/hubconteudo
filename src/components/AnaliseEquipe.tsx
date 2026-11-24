import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, TrendingUp, CalendarClock, AlertTriangle, Target, UserX, Gauge, Layers,
} from "lucide-react";
import { listarEmpresas, listarProfiles, listarStatus, listarTarefas2 } from "@/data/store";
import type { Tarefa } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoTabela } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const hoje = () => new Date().toISOString().slice(0, 10);
const atrasada = (t: Tarefa, feitos: Set<string>) =>
  !feitos.has(t.status_id) && !!t.prazo && t.prazo < hoje();
/** Dias entre duas datas. Devolve null quando a conclusão é anterior à criação —
 *  acontece com dado importado ou corrigido à mão, e uma média negativa não diz nada. */
function dias(de: string, ate: string): number | null {
  const d = (new Date(ate).getTime() - new Date(de).getTime()) / 86400000;
  return Number.isFinite(d) && d >= 0 ? d : null;
}

/** Meses recentes no formato AAAA-MM, do mais antigo ao atual. */
function ultimosMeses(quantidade: number) {
  const agora = new Date();
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (quantidade - 1 - i), 1);
    return {
      chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      rotulo: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    };
  });
}

interface Linha {
  id: string;
  nome: string;
  abertas: number;
  atrasadas: number;
  concluidasMes: number;
  concluidasTotal: number;
  noPrazo: number | null;
  tempoMedio: number | null;
  cargaHoras: number;
}

/** Análise da equipe: quem está entregando, quem está travado e onde o trabalho está parado. */
export function AnaliseEquipe({ empresaFiltro }: { empresaFiltro?: string }) {
  const { data: tarefas, isLoading: carregando } = useQuery({ queryKey: ["tarefas"], queryFn: listarTarefas2 });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: colunas } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });

  const concluidos = useMemo(
    () => new Set((colunas ?? []).filter((c) => c.concluido).map((c) => c.id)),
    [colunas]
  );

  const lista = useMemo(
    () => (tarefas ?? []).filter((t) => !empresaFiltro || t.empresa_id === empresaFiltro),
    [tarefas, empresaFiltro]
  );

  const mesAtual = hoje().slice(0, 7);
  const meses = ultimosMeses(6);

  const equipe: Linha[] = useMemo(() => {
    return (profiles ?? [])
      .filter((p) => p.ativo)
      .map((p) => {
        const minhas = lista.filter((t) => t.responsaveis.includes(p.user_id));
        const concluidas = minhas.filter((t) => t.concluida_em);
        const comPrazo = concluidas.filter((t) => t.prazo);
        const noPrazo = comPrazo.filter((t) => t.concluida_em!.slice(0, 10) <= t.prazo!);
        const tempos = concluidas
          .map((t) => dias(t.created_at, t.concluida_em!))
          .filter((d): d is number => d !== null);

        return {
          id: p.user_id,
          nome: p.nome,
          abertas: minhas.filter((t) => !concluidos.has(t.status_id)).length,
          atrasadas: minhas.filter((t) => atrasada(t, concluidos)).length,
          concluidasMes: concluidas.filter((t) => t.concluida_em!.startsWith(mesAtual)).length,
          concluidasTotal: concluidas.length,
          noPrazo: comPrazo.length ? Math.round((noPrazo.length / comPrazo.length) * 100) : null,
          tempoMedio: tempos.length
            ? Math.round((tempos.reduce((s, v) => s + v, 0) / tempos.length) * 10) / 10
            : null,
          cargaHoras: minhas
            .filter((t) => !concluidos.has(t.status_id))
            .reduce((s, t) => s + (t.estimativa_horas ?? 0), 0),
        };
      })
      .filter((l) => l.abertas + l.concluidasTotal > 0)
      .sort((a, b) => b.abertas - a.abertas);
  }, [profiles, lista, mesAtual, concluidos]);

  const semDono = lista.filter(
    (t) => t.responsaveis.length === 0 && !concluidos.has(t.status_id) && t.lado === "nos"
  );

  const entregasPorMes = meses.map((m) => ({
    ...m,
    total: lista.filter((t) => t.concluida_em?.startsWith(m.chave)).length,
  }));
  const maxEntregas = Math.max(...entregasPorMes.map((m) => m.total), 1);

  const porEtapa = (colunas ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    cor: c.cor,
    concluido: c.concluido === true,
    total: lista.filter((t) => t.status_id === c.id).length,
  }));
  const totalEtapas = Math.max(porEtapa.reduce((s, e) => s + e.total, 0), 1);

  const porCliente = useMemo(() => {
    const mapa = new Map<string, number>();
    lista
      .filter((t) => !concluidos.has(t.status_id))
      .forEach((t) => {
        const chave = t.empresa_id ?? "internas";
        mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
      });
    return [...mapa.entries()]
      .map(([id, total]) => ({
        nome: id === "internas"
          ? "Tarefas internas"
          : empresas?.find((e) => e.id === id)?.nome_fantasia ?? "—",
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [lista, empresas, concluidos]);
  const maxCliente = Math.max(...porCliente.map((c) => c.total), 1);

  const maxCarga = Math.max(...equipe.map((l) => l.abertas), 1);

  if (carregando) {
    return (
      <div role="status" aria-label="Carregando análise da equipe">
        <EsqueletoTabela colunas={5} />
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <EstadoVazio
        icone={Users}
        titulo="Sem dados para analisar"
        descricao="Assim que houver tarefas com responsável e prazo, esta tela mostra quem está entregando, quem está sobrecarregado e onde o trabalho trava."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* alertas primeiro: o que precisa de ação */}
      {(semDono.length > 0 || equipe.some((l) => l.atrasadas > 0)) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {semDono.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/15 p-4">
              <UserX className="mt-0.5 h-5 w-5 shrink-0 text-warning-strong" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {semDono.length} tarefa{semDono.length === 1 ? "" : "s"} sem responsável
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Trabalho da agência que ninguém assumiu. Não entra na conta de ninguém e
                  não aparece em nenhuma carga.
                </p>
              </div>
            </div>
          )}

          {equipe.filter((l) => l.atrasadas > 0).length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {equipe.filter((l) => l.atrasadas > 0).length} pessoa(s) com tarefa atrasada
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {equipe.filter((l) => l.atrasadas > 0)
                    .map((l) => `${l.nome.split(" ")[0]} (${l.atrasadas})`)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* tabela da equipe */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-accent" aria-hidden /> Desempenho por pessoa
          </CardTitle>
        </CardHeader>
        {equipe.length === 0 ? (
          <p className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma tarefa tem responsável definido ainda.
          </p>
        ) : (
          <div className="border-t">
            <Table className="min-w-[44rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Pessoa</TableHead>
                  <TableHead className="text-right">Em aberto</TableHead>
                  <TableHead className="text-right">Atrasadas</TableHead>
                  <TableHead className="text-right">No mês</TableHead>
                  <TableHead className="text-right">No prazo</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Tempo médio</TableHead>
                  <TableHead className="pr-5 text-right">Carga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {equipe.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-5">
                      <p className="whitespace-nowrap font-medium">{l.nome}</p>
                      <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full bg-primary"
                          style={{ width: `${(l.abertas / maxCarga) * 100}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{l.abertas}</TableCell>
                    <TableCell className={cn("text-right font-medium",
                      l.atrasadas > 0 ? "text-destructive" : "text-muted-foreground")}>
                      {l.atrasadas}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {l.concluidasMes}
                    </TableCell>
                    <TableCell className="text-right">
                      {l.noPrazo === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge
                          variant={l.noPrazo >= 80 ? "success" : l.noPrazo >= 50 ? "warning" : "destructive"}
                        >
                          {l.noPrazo}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {l.tempoMedio === null ? "—" : `${l.tempoMedio} d`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5 text-right text-muted-foreground">
                      {l.cargaHoras > 0 ? `${l.cargaHoras} h` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {/* entregas por mês */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" aria-hidden /> Entregas por mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entregasPorMes.every((m) => m.total === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma tarefa concluída ainda. O ritmo do time aparece aqui a partir da
                primeira entrega.
              </p>
            ) : (
              <>
                <div className="flex items-end justify-between gap-2">
                  {entregasPorMes.map((m) => (
                    <div key={m.chave} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="h-4 text-xs font-medium tabular-nums text-foreground">
                        {m.total > 0 ? m.total : ""}
                      </span>
                      <div className="flex h-28 w-full items-end border-b">
                        <div
                          className="mx-auto w-full max-w-14 rounded-t-sm bg-primary transition-all"
                          style={{
                            height: `${Math.max((m.total / maxEntregas) * 100, m.total > 0 ? 6 : 2)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">{m.rotulo}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs tabular-nums text-muted-foreground">
                  {entregasPorMes.reduce((s, m) => s + m.total, 0)} entregas nos últimos 6 meses
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* onde o trabalho está parado */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-accent" aria-hidden /> Onde está o trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {porEtapa.map((e) => (
              <div key={e.id}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.cor }} aria-hidden />
                    <span className="truncate">{e.label}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{e.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", e.concluido ? "bg-success" : "bg-primary")}
                    style={{ width: `${(e.total / totalEtapas) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* carga por cliente */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-accent" aria-hidden /> Trabalho em aberto por cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {porCliente.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada em aberto.</p>
            ) : (
              porCliente.map((c) => (
                <div key={c.nome}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs">
                    <span className="truncate">{c.nome}</span>
                    <span className="shrink-0 font-medium tabular-nums">{c.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent"
                      style={{ width: `${(c.total / maxCliente) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* resumo do time */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" aria-hidden /> Resumo do time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              {
                rotulo: "Pessoas com tarefa",
                valor: equipe.length,
                icone: Users,
              },
              {
                rotulo: "Média por pessoa",
                valor: equipe.length
                  ? Math.round((equipe.reduce((s, l) => s + l.abertas, 0) / equipe.length) * 10) / 10
                  : 0,
                icone: Gauge,
              },
              {
                rotulo: "Entrega no prazo",
                valor: (() => {
                  const comDado = equipe.filter((l) => l.noPrazo !== null);
                  if (!comDado.length) return "—";
                  return `${Math.round(comDado.reduce((s, l) => s + l.noPrazo!, 0) / comDado.length)}%`;
                })(),
                icone: Target,
              },
              {
                rotulo: "Tempo médio",
                valor: (() => {
                  const comDado = equipe.filter((l) => l.tempoMedio !== null);
                  if (!comDado.length) return "—";
                  return `${Math.round((comDado.reduce((s, l) => s + l.tempoMedio!, 0) / comDado.length) * 10) / 10} d`;
                })(),
                icone: CalendarClock,
              },
            ].map((k) => (
              <div key={k.rotulo} className="rounded-md border bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <k.icone className="h-3.5 w-3.5 shrink-0" aria-hidden /> {k.rotulo}
                </div>
                <p className="mt-1.5 font-display text-2xl font-semibold leading-none tabular-nums">{k.valor}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
