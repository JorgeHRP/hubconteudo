import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, FolderOpen, MessageSquare, ListChecks, Link2, ThermometerSun,
  ExternalLink, Plus, Loader2, History, Video, Building2, BookMarked, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  buscarEmpresa, criarNota, criarRecurso, listarAnalises, listarAvaliacoes, listarNotas,
  listarProfiles, listarProjetosDaEmpresa, listarRecursos, listarTarefas, salvarAnalise,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    if (!cliente) return;
    setGerando(true);
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

    setGerando(false);
    setPergunta("");
    qc.invalidateQueries({ queryKey: ["analises", id] });
    qc.invalidateQueries({ queryKey: ["historico", id] });
    toast.success("Análise gerada");
  }

  if (!cliente) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Carregando cliente…</p>;
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
    { rotulo: "ClickUp", url: cliente.clickup_list_id ? `https://app.clickup.com/${cliente.clickup_list_id}` : null },
    { rotulo: "RD Station", url: cliente.rd_deal_id ? `https://crm.rdstation.com/deals/${cliente.rd_deal_id}` : null },
  ];

  return (
    <div className="animate-fade-in">
      <Link to="/cs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para o painel
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{cliente.nome_fantasia}</h1>
            <Badge variant={flagBadgeVariant[flagConta]}>{flagLabels[flagConta]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              cliente.razao_social,
              cliente.cnpj ? `CNPJ ${cliente.cnpj}` : null,
              cliente.segmento,
              `${formatCurrency(mrrTotal)}/mês`,
              `responsável ${nomeDe(cliente.responsavel_id)}`,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex gap-2">
        <TarefaDialog
          empresaFixa={id}
          gatilho={<Button variant="outline"><Plus /> Tarefa</Button>}
        />
        <Dialog open={churnAberto} onOpenChange={setChurnAberto}>
          <DialogTrigger asChild>
            <Button variant="destructive"><ThermometerSun /> Avaliar risco</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Termômetro de churn — {cliente.nome_fantasia}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {perguntasChurn.map((p) => (
                <div key={p.id}>
                  <p className="mb-2 text-sm font-medium">{p.pergunta}</p>
                  <div className="grid gap-1.5">
                    {p.opcoes.map((opcao, valor) => (
                      <button
                        key={opcao}
                        onClick={() => setRespostas((r) => ({ ...r, [p.id]: valor }))}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-left text-xs transition-colors",
                          respostas[p.id] === valor
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <span className="mr-2 text-muted-foreground">{valor}</span>
                        {opcao}
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

              <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pontuação</p>
                  <p className="text-xl font-bold">{pontuacao} / {PONTUACAO_MAXIMA_CHURN}</p>
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

      <Tabs defaultValue="conta">
        <TabsList className="flex-wrap">
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

        <TabsContent value="conta">
          <ContaDoCliente empresa={cliente} />
        </TabsContent>

        <TabsContent value="dossie">
          <DossieEmpresa empresaId={id} />
        </TabsContent>

        <TabsContent value="tarefas">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
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
            <CardContent className="p-4 pt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Pergunta livre sobre este cliente (opcional)…"
                  value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
                <Button onClick={gerarAnalise} disabled={gerando}>
                  {gerando ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {gerando ? "Analisando…" : "Gerar análise"}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Rodando com simulação local. Quando a edge function <code>analise-cliente-ia</code> entrar,
                esta chamada passa a usar o modelo de verdade.
              </p>
            </CardContent>
          </Card>

          {analises?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma análise gerada ainda.
            </p>
          )}

          {analises?.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 p-5 pt-5">
                <div className="flex items-center justify-between">
                  <Badge variant={flagBadgeVariant[a.flag_sugerida]} className="text-[9px]">
                    Flag sugerida: {flagLabels[a.flag_sugerida]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {([
                  ["Resumo", a.resumo],
                  ["Percepções", a.percepcoes],
                  ["Riscos", a.riscos],
                  ["Recomendações", a.recomendacoes],
                ] as const).map(([titulo, texto]) => (
                  <div key={titulo}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
                    <p className="mt-0.5 text-sm">{texto}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {(avaliacoes?.length ?? 0) > 0 && (
            <Card>
              <CardContent className="p-5 pt-5">
                <p className="mb-3 text-sm font-semibold">Histórico do termômetro</p>
                <div className="space-y-2">
                  {avaliacoes?.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                      <span className="text-muted-foreground">{formatDate(a.referencia_mes)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {a.pontuacao}/{PONTUACAO_MAXIMA_CHURN}
                        </span>
                        <Badge variant={flagBadgeVariant[a.flag]} className="text-[9px]">
                          {flagLabels[a.flag]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="repo">
          <div className="mb-4 flex justify-end">
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
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recursos?.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 pt-4">
                  <Badge variant="secondary" className="mb-2 text-[9px]">{recursoTipoLabels[r.tipo]}</Badge>
                  <p className="text-sm font-medium">{r.titulo}</p>
                  {r.descricao && <p className="mt-0.5 text-xs text-muted-foreground">{r.descricao}</p>}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {nomeDe(r.criado_por)} · {formatDate(r.created_at.slice(0, 10))}
                  </p>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
            {recursos?.length === 0 && (
              <p className="py-8 text-sm text-muted-foreground">Nenhum recurso ainda.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="mb-4">
            <CardContent className="p-4 pt-4">
              <Textarea placeholder="Registrar nota, reunião, alerta ou entrega…"
                value={nota.conteudo} onChange={(e) => setNota({ ...nota, conteudo: e.target.value })}
                className="resize-none border-0 bg-muted/40 focus-visible:ring-1" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <Select value={nota.tipo} onValueChange={(v) => setNota({ ...nota, tipo: v as NotaTipo })}>
                  <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
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

          <div className="space-y-3">
            {notas?.map((n) => (
              <div key={n.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    n.tipo === "alerta" ? "bg-destructive" : n.tipo === "entrega" ? "bg-success" :
                    n.tipo === "reuniao" ? "bg-primary" : "bg-muted-foreground"
                  )} />
                  <span className="w-px flex-1 bg-border" />
                </div>
                <Card className="mb-1 flex-1">
                  <CardContent className="p-3 pt-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[9px]">{notaTipoLabels[n.tipo]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {nomeDe(n.autor_id)} · {new Date(n.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm">{n.conteudo}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {notas?.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma nota registrada.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clickup">
          {tarefas && tarefas.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { rotulo: "Pendentes", valor: pendentes.length },
                { rotulo: "Atrasadas", valor: atrasadas.length },
                { rotulo: "Entregues no mês", valor: entreguesNoMes.length },
                { rotulo: "Total sincronizado", valor: tarefas.length },
              ].map((k) => (
                <Card key={k.rotulo}>
                  <CardContent className="p-4 pt-4">
                    <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                    <p className="text-2xl font-bold">{k.valor}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {tarefas && tarefas.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Tarefa</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="hidden p-3 font-medium md:table-cell">Responsável</th>
                      <th className="hidden p-3 font-medium lg:table-cell">Prioridade</th>
                      <th className="hidden p-3 font-medium sm:table-cell">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarefas.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                              {t.nome}
                            </a>
                          ) : t.nome}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[9px]">{t.status}</Badge>
                        </td>
                        <td className="hidden p-3 text-muted-foreground md:table-cell">{t.responsavel}</td>
                        <td className="hidden p-3 lg:table-cell">
                          <Badge
                            variant={t.prioridade === "urgente" ? "destructive" : t.prioridade === "alta" ? "warning" : "secondary"}
                            className="text-[9px]"
                          >
                            {t.prioridade}
                          </Badge>
                        </td>
                        <td className="hidden p-3 text-muted-foreground sm:table-cell">{formatDate(t.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-14 text-center">
                  <ListChecks className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Nenhuma tarefa sincronizada</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    {cliente.clickup_list_id
                      ? "Este cliente já tem a lista do ClickUp cadastrada. Falta ligar a integração no Painel Admin para trazer as tarefas pendentes e a produção do mês."
                      : "Cadastre o ClickUp list id do cliente e ligue a integração para ver aqui as tarefas pendentes e a produção mensal."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integr">
          <div className="grid gap-3 sm:grid-cols-2">
            {integracoes.map((i) => (
              <Card key={i.rotulo}>
                <CardContent className="flex items-center justify-between p-4 pt-4">
                  <div>
                    <p className="text-sm font-medium">{i.rotulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.url ? "Configurado" : "Não configurado para este cliente"}
                    </p>
                  </div>
                  {i.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={i.url} target="_blank" rel="noreferrer">Abrir <ExternalLink /></a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
