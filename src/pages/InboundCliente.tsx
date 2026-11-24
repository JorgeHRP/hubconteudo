import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Magnet, ArrowLeft, Plus, Trash2, Coins, Copy, Calendar, Workflow,
  ClipboardList, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  atualizarItemPlano, buscarEmpresa, duplicarPlano, lancarItemPlano,
  listarCatalogoInbound, listarPautas, listarPlanoInbound, listarProfiles,
  removerItemPlano, removerPauta, salvarPauta, salvarPontosMes, pontosDoMes,
  saldoDoMes,
} from "@/data/store";
import {
  categoriaInboundTom, etapaFunilLabels, formatPontos, mesAtual, mesLegivel,
  prioridadeLabels, statusItemPlanoLabels, statusItemPlanoVariant,
  statusPautaLabels, statusPautaVariant, tiposMaterial,
} from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type {
  EtapaFunilConteudo, PautaInbound, PrioridadeTarefa, StatusItemPlano, StatusPauta,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { FluxosInbound } from "@/components/FluxosInbound";
import { EsqueletoPagina, EsqueletoTabela } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Últimos 12 meses e os 2 próximos — a janela em que o time realmente trabalha. */
function janelaDeMeses(): string[] {
  const hoje = new Date();
  const meses: string[] = [];
  for (let i = 2; i >= -12; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }
  return meses;
}

export default function InboundCliente() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [mes, setMes] = useState(mesAtual());

  const { data: empresa, isLoading: carregandoEmpresa } = useQuery({
    queryKey: ["empresa", id], queryFn: () => buscarEmpresa(id), enabled: Boolean(id),
  });
  const { data: catalogo } = useQuery({
    queryKey: ["catalogo-inbound"], queryFn: listarCatalogoInbound,
  });
  const { data: plano } = useQuery({
    queryKey: ["plano-inbound", id, mes], queryFn: () => listarPlanoInbound(id, mes),
  });
  const { data: pautas } = useQuery({
    queryKey: ["pautas", id], queryFn: () => listarPautas(id),
  });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["plano-inbound", id] });
    qc.invalidateQueries({ queryKey: ["clientes-inbound"] });
  };

  const saldo = useMemo(() => saldoDoMes(id, mes), [id, mes, plano]);
  const contrato = pontosDoMes(id, mes);

  if (carregandoEmpresa) return <EsqueletoPagina />;

  if (!empresa) {
    return (
      <EstadoVazio
        icone={Magnet}
        titulo="Cliente não encontrado"
        descricao="A empresa pode ter sido removida."
        acao={<Button asChild><Link to="/inbound">Voltar ao inbound</Link></Button>}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/inbound"><ArrowLeft /> Inbound</Link>
      </Button>

      <PageHeader
        icone={Magnet}
        titulo={empresa.nome_fantasia}
        subtitulo="Plano em pontos, calendário de pautas e réguas de nutrição"
        acao={
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-full bg-card sm:w-48" aria-label="Mês do plano"><SelectValue /></SelectTrigger>
            <SelectContent>
              {janelaDeMeses().map((m) => (
                <SelectItem key={m} value={m}>{mesLegivel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="plano">
        <TabsList>
          <TabsTrigger value="plano"><ClipboardList /> Plano do mês</TabsTrigger>
          <TabsTrigger value="pautas"><Calendar /> Pautas</TabsTrigger>
          <TabsTrigger value="fluxos"><Workflow /> Fluxos</TabsTrigger>
        </TabsList>

        <TabsContent value="plano">
          <PlanoDoMes />
        </TabsContent>

        <TabsContent value="pautas">
          <Pautas />
        </TabsContent>

        <TabsContent value="fluxos">
          <FluxosInbound empresaId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );

  /* ---------------- plano do mês ---------------- */

  function PlanoDoMes() {
    const [contratados, setContratados] = useState("");
    const [servico, setServico] = useState("");
    const [qtd, setQtd] = useState("1");
    const [copiarDe, setCopiarDe] = useState("");

    const gravarContrato = useMutation({
      mutationFn: () =>
        salvarPontosMes({ empresa_id: id, mes, pontos_contratados: Number(contratados) }),
      onSuccess: () => { recarregar(); setContratados(""); toast.success("Contrato do mês salvo"); },
    });
    const lancar = useMutation({
      mutationFn: () =>
        lancarItemPlano({ empresa_id: id, mes, catalogo_id: servico, quantidade: Number(qtd) }),
      onSuccess: () => { recarregar(); setServico(""); setQtd("1"); },
      onError: (e: Error) => toast.error(e.message),
    });
    const mudar = useMutation({
      mutationFn: ({ item, campos }: { item: string; campos: Parameters<typeof atualizarItemPlano>[1] }) =>
        atualizarItemPlano(item, campos),
      onSuccess: recarregar,
    });
    const apagar = useMutation({ mutationFn: removerItemPlano, onSuccess: recarregar });
    const copiar = useMutation({
      mutationFn: () => duplicarPlano(id, copiarDe, mes),
      onSuccess: (n) => { recarregar(); toast.success(`${n} itens copiados`); },
      onError: (e: Error) => toast.error(e.message),
    });

    const itens = plano ?? [];
    const ativos = (catalogo ?? []).filter((c) => c.ativo);
    const catDe = (cid: string | null) => ativos.find((c) => c.id === cid) ?? null;

    return (
      <div className="space-y-6">
        {/* contrato do mês */}
        <Card className="overflow-hidden">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 space-y-0 border-b px-5 py-3.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-accent" aria-hidden /> Pontos de {mesLegivel(mes)}
            </CardTitle>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Label htmlFor="pontos-contratados" className="text-xs text-muted-foreground">
                Pontos contratados
              </Label>
              <div className="flex flex-1 items-center gap-2 sm:flex-none">
                <Input
                  id="pontos-contratados"
                  type="number" min="0" className="h-9 flex-1 tabular-nums sm:w-32 sm:flex-none"
                  placeholder={contrato ? String(contrato.pontos_contratados) : "0"}
                  value={contratados}
                  onChange={(e) => setContratados(e.target.value)}
                />
                <Button size="sm" className="h-9" disabled={!contratados} onClick={() => gravarContrato.mutate()}>
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Contratado</dt>
                <dd className="mt-1 font-display text-2xl font-semibold leading-none tabular-nums">
                  {formatPontos(saldo.contratados)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Planejado</dt>
                <dd className={cn("mt-1 font-display text-2xl font-semibold leading-none tabular-nums",
                  saldo.estourou && "text-destructive")}>
                  {formatPontos(saldo.planejados)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Entregue</dt>
                <dd className="mt-1 font-display text-2xl font-semibold leading-none tabular-nums text-success">
                  {formatPontos(saldo.entregues)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Saldo</dt>
                <dd className={cn("mt-1 font-display text-2xl font-semibold leading-none tabular-nums",
                  saldo.saldo < 0 ? "text-destructive" : "text-foreground")}>
                  {formatPontos(saldo.saldo)}
                </dd>
              </div>
            </dl>

            {saldo.percentual !== null && (
              <div className="mt-5">
                <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-full transition-all", saldo.estourou ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${Math.min(saldo.percentual, 100)}%` }}
                  />
                </div>
                <p className={cn("mt-1.5 text-xs tabular-nums",
                  saldo.estourou ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {saldo.percentual}% do contratado
                  {saldo.estourou && ` — ${formatPontos(Math.abs(saldo.saldo))} pts acima`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* lançar serviço */}
        <Card>
          <CardHeader className="border-b px-5 py-3.5">
            <CardTitle className="text-base">Lançar serviço no plano</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-full sm:w-auto sm:min-w-[16rem] sm:flex-1">
                <Select value={servico} onValueChange={setServico}>
                  <SelectTrigger aria-label="Serviço do catálogo"><SelectValue placeholder="Escolha no catálogo" /></SelectTrigger>
                  <SelectContent>
                    {ativos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} · {formatPontos(c.pontos)} pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" min="1" className="w-20 tabular-nums" value={qtd} aria-label="Quantidade"
                onChange={(e) => setQtd(e.target.value)} />
              <Button disabled={!servico || lancar.isPending} onClick={() => lancar.mutate()}>
                <Plus /> Lançar
              </Button>
            </div>
            {servico && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatPontos((catDe(servico)?.pontos ?? 0) * Number(qtd || 1))} pts serão
                somados ao plano deste mês.
              </p>
            )}

            {itens.length === 0 && (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
                <div className="w-full sm:w-auto">
                  <Label className="text-xs text-muted-foreground">Ou copiar o plano de outro mês</Label>
                  <Select value={copiarDe} onValueChange={setCopiarDe}>
                    <SelectTrigger className="mt-1.5 sm:w-48" aria-label="Copiar de"><SelectValue placeholder="Outro mês" /></SelectTrigger>
                    <SelectContent>
                      {janelaDeMeses().filter((m) => m !== mes).map((m) => (
                        <SelectItem key={m} value={m}>{mesLegivel(m)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" disabled={!copiarDe} onClick={() => copiar.mutate()}>
                  <Copy /> Copiar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* itens do plano */}
        {!plano ? (
          <div role="status" aria-label="Carregando plano do mês">
            <EsqueletoTabela linhas={4} colunas={4} />
          </div>
        ) : itens.length === 0 ? (
          <EstadoVazio
            icone={Coins}
            titulo={`Nada planejado em ${mesLegivel(mes)}`}
            descricao="Lance os serviços contratados a partir do catálogo. O consumo em pontos é somado automaticamente e comparado com o contrato do mês."
          />
        ) : (
          <Card className="overflow-hidden">
            <Table className="min-w-[42rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Serviço</TableHead>
                  <TableHead className="w-24">Qtd.</TableHead>
                  <TableHead className="w-44">Situação</TableHead>
                  <TableHead className="w-28 text-right">Pontos</TableHead>
                  <TableHead className="w-12 pr-4"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((i) => {
                  const cat = catDe(i.catalogo_id);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="py-2.5 pl-4">
                        <p className="font-medium">{i.titulo}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {cat && (
                            <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium",
                              categoriaInboundTom[cat.categoria])}>
                              {cat.categoria}
                            </span>
                          )}
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {formatPontos(i.pontos_unitarios)} pts × {i.quantidade}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5">
                        <Input type="number" min="1" className="h-9 w-20 tabular-nums" value={i.quantidade}
                          aria-label={`Quantidade de ${i.titulo}`}
                          onChange={(e) =>
                            mudar.mutate({ item: i.id, campos: { quantidade: Math.max(1, Number(e.target.value)) } })
                          } />
                      </TableCell>

                      <TableCell className="py-2.5">
                        <Select value={i.status}
                          onValueChange={(v) => mudar.mutate({ item: i.id, campos: { status: v as StatusItemPlano } })}>
                          <SelectTrigger className="h-9 w-40" aria-label={`Situação de ${i.titulo}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(statusItemPlanoLabels) as StatusItemPlano[]).map((st) => (
                              <SelectItem key={st} value={st}>{statusItemPlanoLabels[st]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="py-2.5 text-right">
                        <Badge variant={statusItemPlanoVariant[i.status]} className="min-w-[4.5rem] justify-center tabular-nums">
                          {formatPontos(i.pontos_unitarios * i.quantidade)}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-2.5 pr-4 text-right">
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Remover do plano" aria-label={`Remover ${i.titulo} do plano`}
                          onClick={() => apagar.mutate(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  }

  /* ---------------- pautas ---------------- */

  function Pautas() {
    const vazia = {
      titulo: "", tipo_material: "Blogpost", produto: "", etapa_funil: "" as string,
      status: "ideia" as StatusPauta, prioridade: "normal" as PrioridadeTarefa,
      origem: "time" as PautaInbound["origem"], responsavel_id: "",
      data_prevista: "", link: "", descricao: "",
    };
    const [form, setForm] = useState(vazia);
    const [aberto, setAberto] = useState(false);
    const [editando, setEditando] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<string>("todas");

    const atualizar = () => qc.invalidateQueries({ queryKey: ["pautas", id] });
    const gravar = useMutation({
      mutationFn: () =>
        salvarPauta({
          id: editando ?? undefined,
          empresa_id: id,
          titulo: form.titulo.trim(),
          tipo_material: form.tipo_material,
          produto: form.produto.trim() || null,
          etapa_funil: (form.etapa_funil || null) as EtapaFunilConteudo | null,
          status: form.status,
          prioridade: form.prioridade,
          origem: form.origem,
          responsavel_id: form.responsavel_id || null,
          data_prevista: form.data_prevista || null,
          link: form.link.trim() || null,
          descricao: form.descricao.trim() || null,
        }),
      onSuccess: () => {
        atualizar(); setAberto(false); setForm(vazia); setEditando(null);
        toast.success(editando ? "Pauta atualizada" : "Pauta criada");
      },
    });
    const apagar = useMutation({
      mutationFn: removerPauta,
      onSuccess: () => { atualizar(); toast.success("Pauta removida"); },
    });

    const lista = (pautas ?? []).filter((p) => filtro === "todas" || p.status === filtro);
    const nome = (uid: string | null) =>
      profiles?.find((p) => p.user_id === uid)?.nome ?? null;

    const abrirEdicao = (p: PautaInbound) => {
      setEditando(p.id);
      setForm({
        titulo: p.titulo, tipo_material: p.tipo_material, produto: p.produto ?? "",
        etapa_funil: p.etapa_funil ?? "", status: p.status, prioridade: p.prioridade,
        origem: p.origem, responsavel_id: p.responsavel_id ?? "",
        data_prevista: p.data_prevista ?? "", link: p.link ?? "",
        descricao: p.descricao ?? "",
      });
      setAberto(true);
    };

    const dialogo = (
      <Dialog open={aberto} onOpenChange={(v) => {
        setAberto(v);
        if (!v) { setForm(vazia); setEditando(null); }
      }}>
        <DialogTrigger asChild>
          <Button size="sm"><Plus /> Nova pauta</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar pauta" : "Nova pauta"}</DialogTitle>
            <DialogDescription>
              O calendário editorial do cliente: o que será produzido, para qual produto
              e em que etapa do funil.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Título *</Label>
              <Input className="mt-1.5" value={form.titulo}
                placeholder="E-book: como escolher uma pós-graduação"
                onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>

            <div>
              <Label>Tipo de material</Label>
              <Select value={form.tipo_material}
                onValueChange={(v) => setForm({ ...form, tipo_material: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposMaterial.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Produto</Label>
              <Input className="mt-1.5" value={form.produto} placeholder="MBA, Graduação…"
                onChange={(e) => setForm({ ...form, produto: e.target.value })} />
            </div>

            <div>
              <Label>Etapa do funil</Label>
              <Select value={form.etapa_funil || "nenhuma"}
                onValueChange={(v) => setForm({ ...form, etapa_funil: v === "nenhuma" ? "" : v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Não definida" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não definida</SelectItem>
                  {(Object.keys(etapaFunilLabels) as EtapaFunilConteudo[]).map((e) => (
                    <SelectItem key={e} value={e}>{etapaFunilLabels[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Situação</Label>
              <Select value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as StatusPauta })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusPautaLabels) as StatusPauta[]).map((st) => (
                    <SelectItem key={st} value={st}>{statusPautaLabels[st]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade}
                onValueChange={(v) => setForm({ ...form, prioridade: v as PrioridadeTarefa })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(prioridadeLabels) as PrioridadeTarefa[]).map((p) => (
                    <SelectItem key={p} value={p}>{prioridadeLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Origem da ideia</Label>
              <Select value={form.origem}
                onValueChange={(v) => setForm({ ...form, origem: v as PautaInbound["origem"] })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="benchmark">Benchmark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || "nenhum"}
                onValueChange={(v) => setForm({ ...form, responsavel_id: v === "nenhum" ? "" : v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sem responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem responsável</SelectItem>
                  {profiles?.filter((p) => p.ativo).map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data prevista</Label>
              <Input type="date" className="mt-1.5" value={form.data_prevista}
                onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label>Link</Label>
              <Input className="mt-1.5" placeholder="https://" value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea className="mt-1.5" value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>

            <Button className="sm:col-span-2" disabled={!form.titulo.trim() || gravar.isPending}
              onClick={() => gravar.mutate()}>
              {editando ? "Salvar alterações" : "Criar pauta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );

    if (!pautas) {
      return (
        <div role="status" aria-label="Carregando pautas">
          <EsqueletoTabela linhas={5} colunas={5} />
        </div>
      );
    }

    if ((pautas ?? []).length === 0) {
      return (
        <EstadoVazio
          icone={Calendar}
          titulo="Nenhuma pauta"
          descricao="Registre o que será produzido para este cliente: e-books, blogposts, landing pages. Dá para acompanhar da ideia até a publicação."
          acao={dialogo}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-full bg-card sm:w-52" aria-label="Filtrar por situação"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as situações</SelectItem>
              {(Object.keys(statusPautaLabels) as StatusPauta[]).map((st) => (
                <SelectItem key={st} value={st}>{statusPautaLabels[st]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">{dialogo}</div>
        </div>

        <Card className="overflow-hidden">
          {lista.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhuma pauta nesta situação.
            </p>
          ) : (
            <Table className="min-w-[52rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Pauta</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Funil</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-24 pr-4"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[22rem] pl-4">
                      <button type="button" onClick={() => abrirEdicao(p)}
                        className="rounded-sm text-left font-medium leading-snug text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        {p.titulo}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{p.tipo_material}</TableCell>
                    <TableCell className="text-muted-foreground">{p.produto || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.etapa_funil ? etapaFunilLabels[p.etapa_funil] : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {nome(p.responsavel_id) ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {p.data_prevista ? formatDate(p.data_prevista) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusPautaVariant[p.status]} className="whitespace-nowrap">
                        {statusPautaLabels[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-0.5">
                        {p.link && (
                          <Button asChild variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent">
                            <a href={p.link} target="_blank" rel="noreferrer"
                              title="Abrir link" aria-label={`Abrir link de ${p.titulo}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Remover pauta" aria-label={`Remover pauta ${p.titulo}`}
                          onClick={() => apagar.mutate(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    );
  }
}
