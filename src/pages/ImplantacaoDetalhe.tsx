import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ListChecks, FileText, CalendarRange, MessageSquare, Plus, Trash2,
  ChevronDown, ChevronRight, Rocket, Check, CheckCircle2, Circle, CircleDot, Clock,
  ExternalLink, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  atualizarFerramenta, buscarImplantacao, criarNotaImplantacao, listarEmpresas,
  listarNotasImplantacao, listarProfiles, removerNotaImplantacao,
} from "@/data/store";
import {
  ferramentaLabels, statusItemLabels, statusItemVariant,
  type FaseImplantacao, type Ferramenta, type ItemChecklist, type StatusItem,
} from "@/modulos/rd/roteiros";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista, EsqueletoPagina } from "@/components/Esqueletos";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const statusPossiveis = Object.keys(statusItemLabels) as StatusItem[];

export default function ImplantacaoDetalhe() {
  const { id = "" } = useParams();
  const { userId, profile } = useAuth();
  const qc = useQueryClient();

  const [ferramenta, setFerramenta] = useState<string | null>(null);
  const [fasesAbertas, setFasesAbertas] = useState<Record<string, boolean>>({});
  const [nota, setNota] = useState({ conteudo: "", link: "", anexo: "" });

  const { data: imp } = useQuery({ queryKey: ["implantacao", id], queryFn: () => buscarImplantacao(id) });
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: notas } = useQuery({
    queryKey: ["notas-implantacao", id],
    queryFn: () => listarNotasImplantacao(id),
  });

  const salvar = useMutation({
    mutationFn: ({ f, mudanca }: { f: string; mudanca: Record<string, unknown> }) =>
      atualizarFerramenta(id, f, mudanca),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["implantacao", id] });
      qc.invalidateQueries({ queryKey: ["implantacoes"] });
    },
  });

  const addNota = useMutation({
    mutationFn: () =>
      criarNotaImplantacao({
        implantacao_id: id,
        autor_id: userId,
        autor_nome: profile?.nome ?? "—",
        conteudo: nota.conteudo.trim(),
        link_reuniao: nota.link.trim() || null,
        anexo_nome: nota.anexo.trim() || null,
      }),
    onSuccess: () => {
      setNota({ conteudo: "", link: "", anexo: "" });
      qc.invalidateQueries({ queryKey: ["notas-implantacao", id] });
      toast.success("Anotação registrada");
    },
  });

  if (!imp) {
    return <EsqueletoPagina />;
  }

  const ferramentaAtual = ferramenta ?? imp.ferramentas[0];
  const dados = imp.dados[ferramentaAtual];
  const fases = (dados?.fases ?? []) as FaseImplantacao[];
  const empresa = empresas?.find((e) => e.id === imp.empresa_id);
  const nomeDe = (uid: string | null) => profiles?.find((p) => p.user_id === uid)?.nome ?? "—";

  const itens = fases.flatMap((f) => f.items ?? []);
  const feitos = itens.filter((i) => i.status === "concluido" || i.status === "nao_se_aplica").length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;

  /** Só para a apresentação do roteiro: a etapa atual é a primeira que ainda tem item em aberto. */
  const faseCompleta = (f: FaseImplantacao) => {
    const daFase = f.items ?? [];
    return daFase.length > 0
      && daFase.every((i) => i.status === "concluido" || i.status === "nao_se_aplica");
  };
  const faseAtualId = fases.find((f) => !faseCompleta(f))?.id ?? null;

  /** Grava a alteração de um item dentro do roteiro daquela ferramenta. */
  function mudarItem(faseId: string, itemId: string, mudanca: Partial<ItemChecklist>) {
    const novas = fases.map((f) =>
      f.id !== faseId
        ? f
        : { ...f, items: f.items.map((i) => (i.id === itemId ? { ...i, ...mudanca } : i)) }
    );
    salvar.mutate({ f: ferramentaAtual, mudanca: { fases: novas } });
  }

  return (
    <div className="animate-fade-in">
      <Link to="/projetos-rd"
        className="mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Implantações
      </Link>

      <PageHeader
        icone={Rocket}
        titulo={empresa?.nome_fantasia ?? "Cliente"}
        subtitulo={`${imp.ferramentas.map((f) => ferramentaLabels[f as Ferramenta]).join(" · ")} · iniciada em ${formatDate(imp.created_at.slice(0, 10))}`}
      />

      {/* progresso da ferramenta em foco + seletor de ferramenta */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-xs text-muted-foreground">
                Progresso · {ferramentaLabels[ferramentaAtual as Ferramenta]}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">{feitos} de {itens.length} itens</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <p className="font-display text-2xl font-semibold leading-none tabular-nums">{pct}%</p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
                aria-label="Progresso do roteiro">
                <div className={cn("h-full rounded-full transition-all",
                  pct === 100 ? "bg-success" : "bg-primary")}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {imp.ferramentas.length > 1 && (
            <div role="group" aria-label="Ferramenta em foco"
              className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-1 sm:shrink-0">
              {imp.ferramentas.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={f === ferramentaAtual}
                  onClick={() => setFerramenta(f)}
                  className={cn(
                    "min-h-9 flex-1 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-8 sm:flex-none",
                    f === ferramentaAtual
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-card hover:text-foreground"
                  )}
                >
                  {ferramentaLabels[f as Ferramenta]}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        {/* No celular as quatro abas não cabem lado a lado: a faixa rola na horizontal. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            <TabsTrigger value="checklist"><ListChecks /> Checklist</TabsTrigger>
            <TabsTrigger value="cronograma"><CalendarRange /> Cronograma</TabsTrigger>
            <TabsTrigger value="escopo"><FileText /> Escopo</TabsTrigger>
            <TabsTrigger value="notas"><MessageSquare /> Anotações ({notas?.length ?? 0})</TabsTrigger>
          </TabsList>
        </div>

        {/* ---------- checklist: roteiro em etapas ---------- */}
        <TabsContent value="checklist">
          <Card className="overflow-hidden">
            <ol className="divide-y">
              {fases.map((fase, indice) => {
                const aberta = fasesAbertas[fase.id] ?? true;
                const daFase = fase.items ?? [];
                const okFase = daFase.filter(
                  (i) => i.status === "concluido" || i.status === "nao_se_aplica"
                ).length;
                const concluida = faseCompleta(fase);
                const atual = !concluida && fase.id === faseAtualId;

                return (
                  <li key={fase.id}>
                    <button
                      type="button"
                      aria-expanded={aberta}
                      onClick={() => setFasesAbertas((s) => ({ ...s, [fase.id]: !aberta }))}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-5"
                    >
                      <span aria-hidden
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          concluida
                            ? "bg-success/10 text-success"
                            : atual
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        )}>
                        {concluida ? <Check className="h-4 w-4" /> : indice + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-medium leading-snug",
                          !concluida && !atual && "text-muted-foreground")}>
                          {fase.name}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-1 w-24 max-w-full overflow-hidden rounded-full bg-muted">
                            <span className={cn("block h-full rounded-full",
                              concluida ? "bg-success" : "bg-primary")}
                              style={{ width: `${daFase.length ? (okFase / daFase.length) * 100 : 0}%` }} />
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {okFase}/{daFase.length}
                          </span>
                        </span>
                      </span>
                      {concluida ? (
                        <Badge variant="success" className="hidden shrink-0 sm:inline-flex">Concluída</Badge>
                      ) : atual ? (
                        <Badge variant="default" className="hidden shrink-0 sm:inline-flex">Etapa atual</Badge>
                      ) : (
                        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">Pendente</Badge>
                      )}
                      {aberta
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                    </button>

                    {aberta && daFase.length > 0 && (
                      <ul className="divide-y border-t bg-muted/50">
                        {daFase.map((item) => (
                          <li key={item.id}
                            className="flex flex-col gap-2 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:gap-3">
                            <span className="flex min-w-0 flex-1 items-start gap-2.5">
                              {item.status === "concluido" ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                              ) : item.status === "em_andamento" ? (
                                <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                              ) : item.status === "aguardando_cliente" ? (
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong" aria-hidden />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                              )}
                              <span className={cn("min-w-0 text-sm leading-snug",
                                item.status === "concluido" && "text-muted-foreground line-through",
                                item.status === "nao_se_aplica" && "text-muted-foreground")}>
                                {item.task}
                              </span>
                            </span>

                            <div className="grid grid-cols-2 gap-2 pl-[1.625rem] sm:grid-cols-3 lg:flex lg:shrink-0 lg:pl-0">
                              <Select
                                value={item.status}
                                onValueChange={(v) => mudarItem(fase.id, item.id, { status: v as StatusItem })}
                              >
                                <SelectTrigger className="h-9 bg-card text-xs lg:w-40" aria-label="Situação do item">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusPossiveis.map((s) => (
                                    <SelectItem key={s} value={s}>{statusItemLabels[s]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={item.responsible || "nenhum"}
                                onValueChange={(v) =>
                                  mudarItem(fase.id, item.id, { responsible: v === "nenhum" ? "" : v })
                                }
                              >
                                <SelectTrigger className="h-9 bg-card text-xs lg:w-40" aria-label="Responsável pelo item">
                                  <SelectValue placeholder="Responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nenhum">Sem responsável</SelectItem>
                                  {profiles?.filter((p) => p.ativo).map((p) => (
                                    <SelectItem key={p.user_id} value={p.nome}>{p.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                type="date"
                                aria-label="Data do item"
                                className="col-span-2 h-9 bg-card text-xs sm:col-span-1 lg:w-36"
                                value={item.date}
                                onChange={(e) => mudarItem(fase.id, item.id, { date: e.target.value })}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        </TabsContent>

        {/* ---------- cronograma: derivado do checklist ---------- */}
        <TabsContent value="cronograma">
          {itens.filter((i) => i.date).length === 0 ? (
            <EstadoVazio
              icone={CalendarRange}
              titulo="Nenhuma data definida"
              descricao="O cronograma é montado a partir das datas do checklist — não se edita separadamente. Preencha as datas dos itens e eles aparecem aqui em ordem."
            />
          ) : (
            <Card className="overflow-hidden">
              <Table className="min-w-[46rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-5">Data</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="pr-4 sm:pr-5">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fases
                    .flatMap((f) => (f.items ?? []).map((i) => ({ ...i, fase: f.name })))
                    .filter((i) => i.date)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="whitespace-nowrap pl-4 font-medium tabular-nums sm:pl-5">
                          {formatDate(i.date)}
                        </TableCell>
                        <TableCell className="min-w-[14rem]">{i.task}</TableCell>
                        <TableCell className="text-muted-foreground">{i.fase}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {i.responsible || "—"}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-5">
                          <Badge variant={statusItemVariant[i.status]} className="whitespace-nowrap">
                            {statusItemLabels[i.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ---------- escopo ---------- */}
        <TabsContent value="escopo">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <Label htmlFor="escopo">Escopo contratado — {ferramentaLabels[ferramentaAtual as Ferramenta]}</Label>
              <Textarea
                id="escopo"
                className="mt-2 min-h-[240px]"
                defaultValue={dados?.escopo ?? ""}
                placeholder="Descreva o que foi contratado para esta ferramenta."
                onBlur={(e) => {
                  if (e.target.value !== (dados?.escopo ?? "")) {
                    salvar.mutate({ f: ferramentaAtual, mudanca: { escopo: e.target.value } });
                    toast.success("Escopo salvo");
                  }
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                O escopo é por ferramenta, porque muda a cada implantação. Salva ao sair do campo.
              </p>

              <div className="mt-5 border-t pt-5">
                <Label>Responsável pela ferramenta</Label>
                <Select
                  value={dados?.responsavel_id ?? "nenhum"}
                  onValueChange={(v) =>
                    salvar.mutate({
                      f: ferramentaAtual,
                      mudanca: { responsavel_id: v === "nenhum" ? null : v },
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 sm:w-64" aria-label="Responsável pela ferramenta"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem responsável</SelectItem>
                    {profiles?.filter((p) => p.ativo).map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada ferramenta tem o seu — não existe responsável geral da implantação.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- anotações ---------- */}
        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <Textarea
                aria-label="Nova anotação"
                placeholder="Registrar uma decisão, um combinado, o que ficou de uma reunião…"
                value={nota.conteudo}
                onChange={(e) => setNota({ ...nota, conteudo: e.target.value })}
                className="resize-none"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input aria-label="Link da reunião" placeholder="Link da reunião (opcional)" value={nota.link}
                  onChange={(e) => setNota({ ...nota, link: e.target.value })} className="h-9 text-sm" />
                <Input aria-label="Nome da transcrição anexada" placeholder="Nome da transcrição anexada (opcional)" value={nota.anexo}
                  onChange={(e) => setNota({ ...nota, anexo: e.target.value })} className="h-9 text-sm" />
              </div>
              <Button size="sm" disabled={!nota.conteudo.trim()} onClick={() => addNota.mutate()}>
                <Plus /> Registrar
              </Button>
            </CardContent>
          </Card>

          {!notas ? (
            <div role="status" aria-label="Carregando anotações">
              <EsqueletoLista linhas={3} />
            </div>
          ) : notas.length === 0 ? (
            <EstadoVazio
              icone={MessageSquare}
              titulo="Nenhuma anotação"
              descricao="Registre aqui o que foi decidido em cada conversa — fica com autor, data e o link da reunião."
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {notas.map((n) => (
                  <li key={n.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.autor_nome}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {new Date(n.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon"
                        className="-mr-2 -mt-1 h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        title="Excluir anotação" aria-label="Excluir anotação"
                        onClick={async () => {
                          await removerNotaImplantacao(n.id);
                          qc.invalidateQueries({ queryKey: ["notas-implantacao", id] });
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">{n.conteudo}</p>
                    {(n.link_reuniao || n.anexo_nome) && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {n.link_reuniao && (
                          <a href={n.link_reuniao} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                            <ExternalLink className="h-3 w-3" aria-hidden /> Abrir reunião
                          </a>
                        )}
                        {n.anexo_nome && (
                          <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
                            <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="break-all">{n.anexo_nome}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-xs text-muted-foreground">
        Responsável da conta:{" "}
        <span className="font-medium text-foreground">{nomeDe(empresa?.responsavel_id ?? null)}</span>
      </p>
    </div>
  );
}
