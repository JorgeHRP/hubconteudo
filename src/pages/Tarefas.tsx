import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListChecks, ChevronLeft, ChevronRight, Trash2, CalendarClock, AlertTriangle,
  CheckCircle2, Clock, Users, LayoutGrid, BarChart3, Eye, EyeOff,
  MessageSquare, Paperclip, Timer, ListTree, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  alternarCompartilhamento, listarEmpresas, listarProfiles, listarStatus,
  listarTarefas2, listarTiposTarefa, moverTarefa, removerTarefa, tempoTotal,
  criarTarefaExemplo, removerExemplos,
} from "@/data/store";
import { prioridadeLabels, prioridadeVariant } from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type { Tarefa } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { TarefaDialog } from "@/components/TarefaDialog";
import { TarefaDetalhe } from "@/components/TarefaDetalhe";
import { ConfigQuadro } from "@/components/ConfigQuadro";
import { AnaliseEquipe } from "@/components/AnaliseEquipe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const hoje = () => new Date().toISOString().slice(0, 10);

/** Tempo cronometrado no formato curto que cabe no rodapé do card. */
function tempoCurto(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `${m}min`;
}

/** Atrasada: tem prazo vencido e ainda não está numa coluna de conclusão. */
function atrasada(t: Tarefa, concluidos: Set<string>) {
  return !concluidos.has(t.status_id) && t.prazo !== null && t.prazo < hoje();
}

export default function Tarefas() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [empresa, setEmpresa] = useState("todas");
  const [responsavel, setResponsavel] = useState("todos");
  const [aberta, setAberta] = useState<string | null>(null);

  const { data: tarefas } = useQuery({ queryKey: ["tarefas"], queryFn: listarTarefas2 });
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: colunas } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });
  const { data: tipos } = useQuery({ queryKey: ["tipos-tarefa"], queryFn: listarTiposTarefa });

  const mover = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => moverTarefa(id, status, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });

  const compartilhar = useMutation({
    mutationFn: (id: string) => alternarCompartilhamento(id),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      toast.success(
        t?.compartilhada
          ? "Compartilhada. O cliente foi avisado no painel dele."
          : "Removida do painel do cliente."
      );
    },
  });

  const apagar = useMutation({
    mutationFn: (id: string) => removerTarefa(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tarefas"] }); toast.success("Tarefa removida"); },
  });

  const recarregarTudo = () => {
    qc.invalidateQueries({ queryKey: ["tarefas"] });
    qc.invalidateQueries({ queryKey: ["notificacoes", userId] });
  };

  const exemplo = useMutation({
    mutationFn: () => criarTarefaExemplo(userId!),
    onSuccess: () => { recarregarTudo(); toast.success("Tarefa de exemplo criada. Clique no título para abrir."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const limparExemplos = useMutation({
    mutationFn: removerExemplos,
    onSuccess: (n) => { recarregarTudo(); toast.success(`${n} tarefa(s) de exemplo removida(s)`); },
  });

  const temExemplo = (tarefas ?? []).some((t) => t.titulo.startsWith("[Exemplo]"));

  const ordem = (colunas ?? []).map((c) => c.id);
  const concluidos = new Set((colunas ?? []).filter((c) => c.concluido).map((c) => c.id));
  const todas = tarefas ?? [];
  const filtradas = todas.filter((t) => {
    const bateEmpresa = empresa === "todas" || t.empresa_id === empresa
      || (empresa === "internas" && t.empresa_id === null);
    const bateResp = responsavel === "todos" || t.responsaveis.includes(responsavel);
    return bateEmpresa && bateResp;
  });

  const nomeEmpresa = (id: string | null) =>
    id ? empresas?.find((e) => e.id === id)?.nome_fantasia ?? "—" : "Interna";
  const nomePessoa = (id: string) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";
  const nomesResponsaveis = (t: Tarefa) =>
    t.responsaveis.length === 0
      ? "Sem responsável"
      : t.responsaveis.map(nomePessoa).join(", ");
  const tipoDe = (id: string | null) => tipos?.find((x) => x.id === id) ?? null;

  /** Resumo visual do que já existe dentro da tarefa, sem precisar abri-la. */
  const sinais = (t: Tarefa) => {
    const itens: { chave: string; icone: typeof ListTree; valor: string }[] = [];
    if (t.subtarefas.length > 0) {
      itens.push({
        chave: "check", icone: ListTree,
        valor: `${t.subtarefas.filter((s) => s.feita).length}/${t.subtarefas.length}`,
      });
    }
    if (t.anexos.length > 0) itens.push({ chave: "anx", icone: Paperclip, valor: String(t.anexos.length) });
    const seg = tempoTotal(t.id);
    if (seg > 0) itens.push({ chave: "tmp", icone: Timer, valor: tempoCurto(seg) });
    if (t.observadores.length > 0) itens.push({ chave: "obs", icone: MessageSquare, valor: String(t.observadores.length) });
    return itens;
  };

  /* ---- indicadores ---- */
  const indicadores = useMemo(() => {
    const abertas = filtradas.filter((t) => !concluidos.has(t.status_id));
    const emAtraso = filtradas.filter((t) => atrasada(t, concluidos));
    const mes = hoje().slice(0, 7);
    const concluidasMes = filtradas.filter((t) => t.concluida_em?.startsWith(mes));

    const tempos = filtradas
      .filter((t) => t.concluida_em)
      .map((t) => (new Date(t.concluida_em!).getTime() - new Date(t.created_at).getTime()) / 86400000);
    const medioDias = tempos.length
      ? Math.round((tempos.reduce((s, v) => s + v, 0) / tempos.length) * 10) / 10
      : null;

    const porPessoa = (profiles ?? [])
      .map((p) => ({
        nome: p.nome,
        abertas: filtradas.filter((t) => t.responsaveis.includes(p.user_id) && !concluidos.has(t.status_id)).length,
        concluidas: filtradas.filter((t) => t.responsaveis.includes(p.user_id) && concluidos.has(t.status_id)).length,
      }))
      .filter((x) => x.abertas + x.concluidas > 0)
      .sort((a, b) => b.abertas + b.concluidas - (a.abertas + a.concluidas));

    return { abertas, emAtraso, concluidasMes, medioDias, porPessoa };
  }, [filtradas, profiles, concluidos]);

  const porColuna = (id: string) => filtradas.filter((t) => t.status_id === id);
  const maxPessoa = Math.max(...indicadores.porPessoa.map((p) => p.abertas + p.concluidas), 1);

  function CartaoTarefa({ t }: { t: Tarefa }) {
    const i = ordem.indexOf(t.status_id);
    const tipo = tipoDe(t.tipo_id);
    return (
      <Card className={cn("group", atrasada(t, concluidos) && "ring-1 ring-destructive/40")}>
        <CardContent className="p-3 pt-3">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <button type="button" onClick={() => setAberta(t.id)}
              className="text-left text-sm font-medium leading-snug hover:underline">
              {t.titulo}
            </button>
            <Badge variant={prioridadeVariant[t.prioridade]} className="shrink-0 text-[9px]">
              {prioridadeLabels[t.prioridade]}
            </Badge>
          </div>

          <p className="truncate text-[11px] text-muted-foreground">{nomeEmpresa(t.empresa_id)}</p>

          {tipo && (
            <span
              className="mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{ backgroundColor: `${tipo.cor}22`, color: tipo.cor }}
            >
              {tipo.label}
            </span>
          )}

          {t.etiquetas.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {t.etiquetas.map((e) => (
                <span key={e} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          )}

          {t.compartilhada && (
            <div className="mt-2 flex items-center gap-1.5 rounded bg-info/10 px-2 py-1 text-[10px] text-info">
              <Eye className="h-3 w-3 shrink-0" />
              {t.aprovacao === "aprovada"
                ? "Aprovada pelo cliente"
                : t.aprovacao === "ajuste_pedido"
                  ? "Cliente pediu ajuste"
                  : "No painel do cliente"}
            </div>
          )}

          {sinais(t).length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              {sinais(t).map((s) => (
                <span key={s.chave} className="flex items-center gap-0.5">
                  <s.icone className="h-3 w-3" /> {s.valor}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between border-t pt-2 text-[10px] text-muted-foreground">
            <span className="truncate">{nomesResponsaveis(t)}</span>
            {t.prazo && (
              <span className={cn("flex shrink-0 items-center gap-1",
                atrasada(t, concluidos) && "font-medium text-destructive")}>
                <CalendarClock className="h-3 w-3" /> {formatDate(t.prazo)}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost" size="icon" className="h-6 w-6" title="Voltar etapa" disabled={i === 0}
              onClick={() => mover.mutate({ id: t.id, status: ordem[i - 1] })}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-6 w-6" title="Avançar etapa"
              disabled={i === ordem.length - 1}
              onClick={() => mover.mutate({ id: t.id, status: ordem[i + 1] })}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <TarefaDialog
              tarefa={t}
              gatilho={<Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">Editar</Button>}
            />
            <Button
              variant="ghost" size="icon" className="h-6 w-6"
              title={t.compartilhada ? "Tirar do painel do cliente" : "Compartilhar com o cliente"}
              disabled={!t.empresa_id}
              onClick={() => compartilhar.mutate(t.id)}
            >
              {t.compartilhada
                ? <EyeOff className="h-3.5 w-3.5 text-info" />
                : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6"
              onClick={() => apagar.mutate(t.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={ListChecks}
        titulo="Tarefas"
        subtitulo="Quadro de trabalho da agência, por cliente e por pessoa"
        acao={
          <div className="flex flex-wrap gap-2">
            {temExemplo && (
              <Button variant="ghost" size="sm" onClick={() => limparExemplos.mutate()}>
                Remover exemplo
              </Button>
            )}
            <ConfigQuadro />
            <TarefaDialog />
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Select value={empresa} onValueChange={setEmpresa}>
          <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os clientes</SelectItem>
            <SelectItem value="internas">Tarefas internas</SelectItem>
            {empresas?.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={responsavel} onValueChange={setResponsavel}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o time</SelectItem>
            {profiles?.filter((p) => p.ativo).map((p) => (
              <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {todas.length === 0 ? (
        <EstadoVazio
          icone={ListChecks}
          titulo="Nenhuma tarefa criada"
          descricao="Crie a primeira tarefa e acompanhe no quadro. Dá para vincular a um cliente e a uma frente, definir prazo, responsável e prioridade. Se quiser conhecer os recursos antes, gere uma tarefa de exemplo já preenchida."
          acao={
            <div className="flex flex-wrap justify-center gap-2">
              <TarefaDialog />
              <Button variant="outline" disabled={exemplo.isPending}
                onClick={() => exemplo.mutate()}>
                <Sparkles /> Criar tarefa de exemplo
              </Button>
            </div>
          }
        />
      ) : (
        <Tabs defaultValue="quadro">
          <TabsList>
            <TabsTrigger value="quadro"><LayoutGrid /> Quadro</TabsTrigger>
            <TabsTrigger value="indicadores"><BarChart3 /> Indicadores</TabsTrigger>
            <TabsTrigger value="equipe"><Users /> Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value="quadro">
            {/* Kanban rola na horizontal: o número de colunas é definido pela agência. */}
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {colunas?.map((col) => {
                const coluna = porColuna(col.id);
                return (
                  <div key={col.id} className="w-[17rem] shrink-0 rounded-lg bg-muted/30 p-2.5">
                    <div className="mb-2.5 flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.cor }} />
                        {col.label}
                      </span>
                      <span className="rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {coluna.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {coluna.map((t) => <CartaoTarefa key={t.id} t={t} />)}
                      {coluna.length === 0 && (
                        <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                          Nada aqui
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="equipe">
            <AnaliseEquipe empresaFiltro={empresa !== "todas" && empresa !== "internas" ? empresa : undefined} />
          </TabsContent>

          <TabsContent value="indicadores">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { icone: Clock, rotulo: "Em aberto", valor: indicadores.abertas.length, tom: "text-primary" },
                { icone: AlertTriangle, rotulo: "Atrasadas", valor: indicadores.emAtraso.length, tom: "text-destructive" },
                { icone: CheckCircle2, rotulo: "Concluídas no mês", valor: indicadores.concluidasMes.length, tom: "text-success" },
                {
                  icone: CalendarClock, rotulo: "Tempo médio de entrega",
                  valor: indicadores.medioDias === null ? "—" : `${indicadores.medioDias} d`,
                  tom: "text-info",
                },
              ].map((k) => (
                <Card key={k.rotulo}>
                  <CardContent className="p-4 pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                      <k.icone className={cn("h-4 w-4", k.tom)} />
                    </div>
                    <p className="text-2xl font-bold">{k.valor}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" /> Carga por pessoa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {indicadores.porPessoa.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa tem responsável definido.
                    </p>
                  ) : (
                    indicadores.porPessoa.map((p) => (
                      <div key={p.nome}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium">{p.nome}</span>
                          <span className="text-muted-foreground">
                            {p.abertas} em aberto · {p.concluidas} concluídas
                          </span>
                        </div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="gradient-primary h-full"
                            style={{ width: `${(p.abertas / maxPessoa) * 100}%` }} />
                          <div className="h-full bg-success"
                            style={{ width: `${(p.concluidas / maxPessoa) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-destructive" /> Atrasadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {indicadores.emAtraso.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa passou do prazo. 
                    </p>
                  ) : (
                    indicadores.emAtraso.slice(0, 8).map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0">
                        <div className="min-w-0">
                          <p className="truncate">{t.titulo}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {nomeEmpresa(t.empresa_id)} · {nomesResponsaveis(t)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-destructive">
                          {formatDate(t.prazo)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <TarefaDetalhe
        tarefa={todas.find((t) => t.id === aberta) ?? null}
        aberto={aberta !== null}
        onFechar={() => setAberta(null)}
      />
    </div>
  );
}
