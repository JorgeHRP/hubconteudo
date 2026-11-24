import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, FolderOpen, MessageSquare, ListChecks, Link2, ThermometerSun,
  ExternalLink, Plus, Loader2, History, Video, Building2, BookMarked, ClipboardList,
  Clock, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  buscarEmpresa, criarNota, criarRecurso, listarAnalises, listarAvaliacoes, listarNotas,
  listarProfiles, listarProjetosDaEmpresa, listarRecursos, listarTarefas, salvarAnalise,
  gerarAnaliseIA, podeGerarAnaliseIA,
  salvarAvaliacao,
} from "@/data/store";
import {
  PONTUACAO_MAXIMA_CHURN, calcularFlag, flagBadgeVariant, flagLabels, formatCurrency,
  formatDate, notaTipoLabels, perguntasChurn, recursoTipoLabels,
} from "@/lib/cs-data";
import type { ChurnFlag, NotaTipo, RecursoTipo } from "@/lib/types";
import { HistoricoCliente } from "@/components/HistoricoCliente";
import { DossieEmpresa } from "@/components/DossieEmpresa";
import { TarefasDaEmpresa } from "@/components/TarefasDaEmpresa";
import { AcessoClienteCard } from "@/components/AcessoClienteCard";
import { ContaDoCliente } from "@/components/ContaDoCliente";
import { TarefaDialog } from "@/components/TarefaDialog";
import { ReunioesCliente } from "@/components/ReunioesCliente";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista, EsqueletoPagina } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ClienteDetalhe() {
  const { id = "" } = useParams();
  const { userId } = useAuth();
  const qc = useQueryClient();

  const [nota, setNota] = useState({ tipo: "geral" as NotaTipo, conteudo: "" });
  const [recurso, setRecurso] = useState({ tipo: "relatorio" as RecursoTipo, titulo: "", url: "" });
  const [recursoAberto, setRecursoAberto] = useState(false);
  const [churnAberto, setChurnAberto] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [comentarioChurn, setComentarioChurn] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [gerando, setGerando] = useState(false);
  const comIA = podeGerarAnaliseIA();

  const { data: cliente } = useQuery({ queryKey: ["empresa", id], queryFn: () => buscarEmpresa(id) });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: notas } = useQuery({ queryKey: ["notas", id], queryFn: () => listarNotas(id) });
  const { data: recursos } = useQuery({ queryKey: ["recursos", id], queryFn: () => listarRecursos(id) });
  const { data: avaliacoes } = useQuery({ queryKey: ["avaliacoes", id], queryFn: () => listarAvaliacoes(id) });
  const { data: analises } = useQuery({ queryKey: ["analises", id], queryFn: () => listarAnalises(id) });
  const { data: tarefas } = useQuery({ queryKey: ["tarefas-clickup", id], queryFn: () => listarTarefas(id) });
  const { data: projetos } = useQuery({
    queryKey: ["projetos", id],
    queryFn: () => listarProjetosDaEmpresa(id),
  });

  const nomeDe = (uid: string | null) => profiles?.find((p) => p.user_id === uid)?.nome ?? "—";

  const addNota = useMutation({
    mutationFn: () => criarNota(id, userId!, nota.tipo, nota.conteudo.trim()),
    onSuccess: () => {
      setNota({ tipo: "geral", conteudo: "" });
      qc.invalidateQueries({ queryKey: ["notas", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      toast.success("Nota registrada");
    },
  });

  const addRecurso = useMutation({
    mutationFn: () =>
      criarRecurso({
        cliente_id: id, tipo: recurso.tipo, titulo: recurso.titulo.trim(),
        descricao: null, url: recurso.url.trim() || null, criado_por: userId!,
      }),
    onSuccess: () => {
      setRecursoAberto(false);
      setRecurso({ tipo: "relatorio", titulo: "", url: "" });
      qc.invalidateQueries({ queryKey: ["recursos", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      toast.success("Recurso adicionado");
    },
  });

  const pontuacao = Object.values(respostas).reduce((s, v) => s + v, 0);
  const flagPrevia = calcularFlag(pontuacao);
  const todasRespondidas = Object.keys(respostas).length === perguntasChurn.length;

  const avaliar = useMutation({
    mutationFn: () => {
      const hoje = new Date();
      const referencia_mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
      return salvarAvaliacao({
        cliente_id: id, analista_id: userId!, referencia_mes, respostas,
        pontuacao, flag: flagPrevia, comentario: comentarioChurn.trim() || null,
      });
    },
    onSuccess: () => {
      setChurnAberto(false);
      setRespostas({});
      setComentarioChurn("");
      qc.invalidateQueries({ queryKey: ["avaliacoes", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      qc.invalidateQueries({ queryKey: ["cliente", id] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Avaliação registrada e flag atualizada");
    },
  });

  async function gerarAnalise() {
    if (!cliente || gerando) return;
    setGerando(true);
    try {
      if (comIA) await gerarAnaliseIA(id, userId, pergunta);
      else await simularAnalise();
      setPergunta("");
      qc.invalidateQueries({ queryKey: ["analises", id] });
      qc.invalidateQueries({ queryKey: ["historico", id] });
      toast.success("Análise gerada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  /** Modo de demonstração (sem banco): monta a análise com regras fixas, sem IA. */
  async function simularAnalise() {
    if (!cliente) return;
    await new Promise((r) => setTimeout(r, 900));

    const ultima = avaliacoes?.[0];
    const alertas = (notas ?? []).filter((n) => n.tipo === "alerta");
    const flag = ultima?.flag ?? cliente.flag_conta ?? "green";

    await salvarAnalise({
      cliente_id: id,
      resumo:
        `${cliente.nome_fantasia}${cliente.segmento ? ` (${cliente.segmento})` : ""} tem ` +
        `${projetos?.length ?? 0} frente(s) ativa(s) e MRR de ${formatCurrency(mrrTotal)}. ` +
        `A última avaliação de churn somou ${ultima?.pontuacao ?? 0} de ${PONTUACAO_MAXIMA_CHURN} pontos.`,
      percepcoes:
        alertas.length > 0
          ? `Foram registrados ${alertas.length} alerta(s) na timeline. O mais recente: "${alertas[0].conteudo}"`
          : "Nenhum alerta registrado na timeline recente. Relacionamento sem atritos aparentes.",
      riscos:
        flag === "red"
          ? "Risco alto de não renovação. Priorizar contato com o decisor ainda nesta semana."
          : flag === "yellow"
            ? "Sinais de atenção: acompanhar de perto os próximos 30 dias e reforçar entrega de resultado."
            : "Sem risco relevante identificado no momento.",
      recomendacoes:
        flag === "red"
          ? "1) Escalar para a diretoria. 2) Montar plano de recuperação em 7 dias. 3) Levar case de resultado à próxima reunião."
          : "1) Manter cadência de reuniões. 2) Registrar resultados no relatório mensal. 3) Explorar expansão de escopo.",
      flag_sugerida: flag,
      modelo: "simulacao-local",
      gerado_por: userId,
    });
  }

  if (!cliente) {
    return <EsqueletoPagina />;
  }

  const mrrTotal = (projetos ?? []).reduce((s, p) => s + p.mrr, 0);
  const flagConta: ChurnFlag = (projetos ?? []).some((p) => p.flag === "red")
    ? "red"
    : (projetos ?? []).some((p) => p.flag === "yellow")
      ? "yellow"
      : (projetos ?? []).length > 0
        ? "green"
        : cliente.flag_conta ?? "green";

  const hojeIso = new Date().toISOString().slice(0, 10);
  const mesAtual = hojeIso.slice(0, 7);
  const listaTarefas = tarefas ?? [];
  const pendentes = listaTarefas.filter((t) => !t.concluida_em);
  const atrasadas = pendentes.filter((t) => t.due_date && t.due_date < hojeIso);
  const entreguesNoMes = listaTarefas.filter((t) => t.concluida_em?.startsWith(mesAtual));

  const integracoes = [
    { rotulo: "Google Drive", url: cliente.drive_folder_url ?? null },
    { rotulo: "Read.ai", url: cliente.read_workspace_url ?? null },
    { rotulo: "ClickUp", url: cliente.clickup_vinculos?.[0]?.url ?? null },
    { rotulo: "RD Station", url: cliente.rd_deal_id ? `https://crm.rdstation.com/deals/${cliente.rd_deal_id}` : null },
  ];

  return (
    <div className="animate-fade-in">
      <Link
        to="/cs"
        className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para o painel
      </Link>

      {/* Cabeçalho-resumo da ficha: nome, situação e os dados principais da conta. */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 items-start gap-3.5">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              >
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h1 className="break-words text-xl font-semibold leading-tight sm:text-2xl">
                    {cliente.nome_fantasia}
                  </h1>
                  <Badge variant={flagBadgeVariant[flagConta]}>{flagLabels[flagConta]}</Badge>
                </div>
                <p className="mt-1 break-words text-sm text-muted-foreground">{cliente.razao_social}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <TarefaDialog
                empresaFixa={id}
                gatilho={<Button variant="outline"><Plus /> Tarefa</Button>}
              />
              <Dialog open={churnAberto} onOpenChange={setChurnAberto}>
                <DialogTrigger asChild>
                  <Button variant="destructive"><ThermometerSun /> Avaliar risco</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader><DialogTitle>Termômetro de churn — {cliente.nome_fantasia}</DialogTitle></DialogHeader>
                  <div className="space-y-5">
                    {perguntasChurn.map((p) => (
                      <div key={p.id}>
                        <p className="mb-2 text-sm font-medium">{p.pergunta}</p>
                        <div className="grid gap-1.5">
                          {p.opcoes.map((opcao, valor) => (
                            <button
                              key={opcao}
                              type="button"
                              aria-pressed={respostas[p.id] === valor}
                              onClick={() => setRespostas((r) => ({ ...r, [p.id]: valor }))}
                              className={cn(
                                "flex min-h-9 items-start gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                respostas[p.id] === valor
                                  ? "border-primary bg-primary/10 font-medium text-primary"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <span className="w-3 shrink-0 tabular-nums text-muted-foreground">{valor}</span>
                              <span className="min-w-0">{opcao}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div>
                      <Label htmlFor="churn-com">Comentário</Label>
                      <Textarea id="churn-com" className="mt-1.5" value={comentarioChurn}
                        onChange={(e) => setComentarioChurn(e.target.value)} />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Pontuação</p>
                        <p className="font-display text-xl font-semibold tabular-nums">
                          {pontuacao} / {PONTUACAO_MAXIMA_CHURN}
                        </p>
                      </div>
                      <Badge variant={flagBadgeVariant[flagPrevia]}>{flagLabels[flagPrevia]}</Badge>
                    </div>

                    <Button className="w-full" disabled={!todasRespondidas || avaliar.isPending}
                      onClick={() => avaliar.mutate()}>
                      Salvar avaliação do mês
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 lg:grid-cols-4">
            {[
              ["CNPJ", cliente.cnpj || "—"],
              ["Segmento", cliente.segmento || "—"],
              ["Receita mensal", `${formatCurrency(mrrTotal)}/mês`],
              ["Responsável", nomeDe(cliente.responsavel_id)],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
                <dd className="mt-1 break-words text-sm font-medium tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="conta">
        {/* No celular as abas rolam na horizontal; em tela maior, quebram linha. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="h-auto w-max justify-start sm:w-auto sm:flex-wrap">
            <TabsTrigger value="conta"><Building2 /> Conta</TabsTrigger>
            <TabsTrigger value="historico"><History /> Histórico</TabsTrigger>
            <TabsTrigger value="ia"><Sparkles /> Análise de IA</TabsTrigger>
            <TabsTrigger value="reunioes"><Video /> Reuniões</TabsTrigger>
            <TabsTrigger value="repo"><FolderOpen /> Repositório</TabsTrigger>
            <TabsTrigger value="timeline"><MessageSquare /> Notas</TabsTrigger>
            <TabsTrigger value="clickup"><ListChecks /> ClickUp</TabsTrigger>
            <TabsTrigger value="dossie"><BookMarked /> Dossiê</TabsTrigger>
            <TabsTrigger value="tarefas"><ClipboardList /> Tarefas</TabsTrigger>
            <TabsTrigger value="integr"><Link2 /> Integrações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conta">
          <ContaDoCliente empresa={cliente} />
        </TabsContent>

        <TabsContent value="dossie">
          <DossieEmpresa empresaId={id} />
        </TabsContent>

        <TabsContent value="tarefas">
          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 lg:col-span-2">
              <TarefasDaEmpresa empresaId={id} />
            </div>
            <AcessoClienteCard empresaId={id} />
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoCliente clienteId={id} />
        </TabsContent>

        <TabsContent value="reunioes">
          <ReunioesCliente clienteId={id} readWorkspaceUrl={cliente.read_workspace_url ?? null} />
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden /> Nova análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Pergunta livre sobre este cliente (opcional)…"
                  aria-label="Pergunta livre sobre este cliente (opcional)"
                  value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
                <Button className="shrink-0" onClick={gerarAnalise} disabled={gerando}>
                  {gerando ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {gerando ? "Analisando…" : "Gerar análise"}
                </Button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {comIA
                  ? "A IA lê a ficha inteira (frentes, notas, avaliações de churn, reuniões, recursos e tarefas do ClickUp) e sugere a flag. Leva alguns segundos."
                  : "Modo de demonstração: a análise é montada com regras fixas, sem IA."}
              </p>
            </CardContent>
          </Card>

          {!analises && <EsqueletoLista linhas={2} />}

          {analises?.length === 0 && (
            <EstadoVazio
              icone={Sparkles}
              titulo="Nenhuma análise gerada ainda"
              descricao="Gere a primeira análise para ver resumo, percepções, riscos e recomendações deste cliente."
            />
          )}

          {analises?.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-5 py-3">
                <Badge variant={flagBadgeVariant[a.flag_sugerida]}>
                  Flag sugerida: {flagLabels[a.flag_sugerida]}
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <CardContent className="grid gap-x-8 gap-y-4 p-5 md:grid-cols-2">
                {([
                  ["Resumo", a.resumo],
                  ["Percepções", a.percepcoes],
                  ["Riscos", a.riscos],
                  ["Recomendações", a.recomendacoes],
                ] as const).map(([titulo, texto]) => (
                  <div key={titulo} className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
                    <p className="mt-1 break-words text-sm leading-relaxed">{texto}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {(avaliacoes?.length ?? 0) > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ThermometerSun className="h-4 w-4 text-accent" aria-hidden /> Histórico do termômetro
                </CardTitle>
              </CardHeader>
              <ul className="divide-y border-t">
                {avaliacoes?.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="tabular-nums">{formatDate(a.referencia_mes)}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {a.pontuacao}/{PONTUACAO_MAXIMA_CHURN}
                      </span>
                      <Badge variant={flagBadgeVariant[a.flag]}>
                        {flagLabels[a.flag]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="repo">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-4 w-4 text-accent" aria-hidden /> Repositório
              </CardTitle>
            <Dialog open={recursoAberto} onOpenChange={setRecursoAberto}>
              <DialogTrigger asChild><Button size="sm"><Plus /> Adicionar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo recurso</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={recurso.tipo} onValueChange={(v) => setRecurso({ ...recurso, tipo: v as RecursoTipo })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(recursoTipoLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="r-tit">Título</Label>
                    <Input id="r-tit" className="mt-1.5" value={recurso.titulo}
                      onChange={(e) => setRecurso({ ...recurso, titulo: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="r-url">URL</Label>
                    <Input id="r-url" className="mt-1.5" value={recurso.url}
                      onChange={(e) => setRecurso({ ...recurso, url: e.target.value })} />
                  </div>
                  <Button className="w-full" disabled={!recurso.titulo.trim()} onClick={() => addRecurso.mutate()}>
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </CardHeader>
            {!recursos ? (
              <div className="divide-y border-t" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 px-5 py-3">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                ))}
              </div>
            ) : recursos.length === 0 ? (
              <div className="flex items-center gap-3 border-t px-5 py-4">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                >
                  <FolderOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm">Nenhum recurso ainda.</p>
                  <p className="text-xs text-muted-foreground">
                    Guarde aqui relatórios, apresentações e links úteis deste cliente.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y border-t">
                {recursos.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                    <div className="min-w-0 flex-1 basis-56">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-medium">{r.titulo}</p>
                        <Badge variant="secondary">{recursoTipoLabels[r.tipo]}</Badge>
                      </div>
                      {r.descricao && (
                        <p className="mt-0.5 break-words text-sm text-muted-foreground">{r.descricao}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {nomeDe(r.criado_por)} · {formatDate(r.created_at.slice(0, 10))}
                      </p>
                    </div>
                    {r.url && (
                      <Button variant="outline" size="sm" className="shrink-0" asChild>
                        <a href={r.url} target="_blank" rel="noreferrer"
                          aria-label={`Abrir ${r.titulo} em nova aba`}>
                          Abrir <ExternalLink />
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-accent" aria-hidden /> Nova nota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Registrar nota, reunião, alerta ou entrega…"
                aria-label="Texto da nota"
                value={nota.conteudo} onChange={(e) => setNota({ ...nota, conteudo: e.target.value })}
                className="resize-none" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Select value={nota.tipo} onValueChange={(v) => setNota({ ...nota, tipo: v as NotaTipo })}>
                  <SelectTrigger className="h-9 w-40" aria-label="Tipo da nota"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(notaTipoLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!nota.conteudo.trim()} onClick={() => addNota.mutate()}>
                  Registrar
                </Button>
              </div>
            </CardContent>
          </Card>

          {!notas ? (
            <EsqueletoLista linhas={3} />
          ) : notas.length === 0 ? (
            <EstadoVazio
              icone={MessageSquare}
              titulo="Nenhuma nota registrada"
              descricao="Registre acima o que aconteceu com este cliente: reunião, alerta, entrega ou observação do time."
            />
          ) : (
            <Card>
              <CardContent className="p-5">
                {/* Linha do tempo: trilho fino à esquerda e um ponto por nota, na cor do tipo. */}
                <ol className="ml-1.5 space-y-5 border-l pl-5">
                  {notas.map((n) => (
                    <li key={n.id} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -left-[25.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
                          n.tipo === "alerta" ? "bg-destructive" : n.tipo === "entrega" ? "bg-success" :
                          n.tipo === "reuniao" ? "bg-primary" : "bg-muted-foreground"
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variant="secondary">{notaTipoLabels[n.tipo]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {nomeDe(n.autor_id)} · {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">{n.conteudo}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clickup" className="space-y-4">
          {tarefas && tarefas.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { icone: Clock, rotulo: "Pendentes", valor: pendentes.length, tom: "bg-primary/10 text-primary" },
                { icone: AlertTriangle, rotulo: "Atrasadas", valor: atrasadas.length, tom: "bg-destructive/10 text-destructive" },
                { icone: CheckCircle2, rotulo: "Entregues no mês", valor: entreguesNoMes.length, tom: "bg-success/10 text-success" },
                { icone: RefreshCw, rotulo: "Total sincronizado", valor: tarefas.length, tom: "bg-info/10 text-info" },
              ].map((k) => (
                <Card key={k.rotulo}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums leading-none">{k.valor}</p>
                    </div>
                    <span aria-hidden
                      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", k.tom)}>
                      <k.icone className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {tarefas && tarefas.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Responsável</TableHead>
                    <TableHead className="hidden lg:table-cell">Prioridade</TableHead>
                    <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="min-w-[10rem] break-words font-medium">
                        {t.url ? (
                          <a href={t.url} target="_blank" rel="noreferrer"
                            className="rounded-sm transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                            {t.nome}
                          </a>
                        ) : t.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{t.responsavel}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={t.prioridade === "urgente" ? "destructive" : t.prioridade === "alta" ? "warning" : "secondary"}
                          className="capitalize"
                        >
                          {t.prioridade}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground sm:table-cell">
                        {formatDate(t.due_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : !tarefas ? (
            <EsqueletoLista linhas={4} />
          ) : (
            <EstadoVazio
              icone={ListChecks}
              titulo="Nenhuma tarefa sincronizada"
              descricao={
                cliente.clickup_vinculos?.length
                  ? "Este cliente já está vinculado ao ClickUp. As tarefas aparecem aqui depois da próxima sincronização (Painel Admin → Integrações → Sincronizar agora)."
                  : "Vincule a pasta deste cliente no ClickUp em Painel Admin → Integrações → Vincular clientes para ver aqui as tarefas pendentes e a produção mensal."
              }
            />
          )}
        </TabsContent>

        <TabsContent value="integr">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-accent" aria-hidden /> Integrações deste cliente
              </CardTitle>
            </CardHeader>
            <ul className="divide-y border-t">
              {integracoes.map((i) => (
                <li key={i.rotulo} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">{i.rotulo}</p>
                    <Badge variant={i.url ? "success" : "secondary"}>
                      {i.url ? "Configurado" : "Não configurado"}
                    </Badge>
                  </div>
                  {i.url && (
                    <Button variant="outline" size="sm" className="shrink-0" asChild>
                      <a href={i.url} target="_blank" rel="noreferrer"
                        aria-label={`Abrir ${i.rotulo} em nova aba`}>
                        Abrir <ExternalLink />
                      </a>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
