import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Globe2, Plus, ExternalLink, Trash2, Pencil, CheckCircle2, Rocket, Clock,
  AlertTriangle, ArrowLeft, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listarEmpresas, listarProfiles, listarProjetosSite, progressoSite,
  removerProjetoSite, salvarProjetoSite, alternarEtapaSite,
} from "@/data/store";
import {
  faseSiteLabels, faseSiteVariant, ordemFasesSite, tipoSiteLabels,
} from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type { FaseSite, ProjetoSite, TipoSite } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoIndicadores, EsqueletoLista } from "@/components/Esqueletos";
import { CarteiraDaFrente } from "@/components/CarteiraDaFrente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const hoje = () => new Date().toISOString().slice(0, 10);

/**
 * Raiz da frente: a carteira de clientes, como no painel de SEO. Quem já tem
 * projeto e quem ainda não tem, com o botão de lançar — e lançar já registra a
 * frente no Painel de CS.
 */
export default function Sites() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Globe2}
        titulo="Sites e Hotsites"
        subtitulo="Desenvolvimento, homologação e publicação, por cliente"
      />
      <CarteiraDaFrente tipo="sites" destino={(id) => `/sites/${id}`} />
    </div>
  );
}

/** Projetos de um cliente. */
export function SitesDoCliente() {
  const { id = "" } = useParams();
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const empresa = empresas?.find((e) => e.id === id);

  if (empresas && !empresa) return <Navigate to="/sites" replace />;

  return <PainelSites empresaId={id} nomeEmpresa={empresa?.nome_fantasia ?? ""} />;
}

function PainelSites({ empresaId, nomeEmpresa }: { empresaId: string; nomeEmpresa: string }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("todas");

  const { data: todos } = useQuery({ queryKey: ["sites"], queryFn: listarProjetosSite });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  // Só os projetos deste cliente: a carteira já fez a separação por conta.
  const sites = (todos ?? []).filter((s) => s.empresa_id === empresaId);

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["sites"] });
    qc.invalidateQueries({ queryKey: ["projetos"] });
  };

  const apagar = useMutation({
    mutationFn: removerProjetoSite,
    onSuccess: () => { recarregar(); toast.success("Projeto encerrado"); },
  });
  const etapa = useMutation({
    mutationFn: ({ id, i }: { id: string; i: number }) => alternarEtapaSite(id, i),
    onSuccess: recarregar,
  });

  const lista = sites.filter((s) => filtro === "todas" || s.fase === filtro);
  const nomeDe = (id: string | null) =>
    profiles?.find((p) => p.user_id === id)?.nome ?? null;

  const atrasado = (s: ProjetoSite) =>
    s.previsao_entrega !== null && s.previsao_entrega < hoje() && s.fase !== "publicado" && s.fase !== "manutencao";

  const indicadores = {
    emAndamento: sites.filter((s) => s.fase !== "publicado" && s.fase !== "manutencao").length,
    publicados: sites.filter((s) => s.fase === "publicado" || s.fase === "manutencao").length,
    atrasados: sites.filter(atrasado).length,
  };

  return (
    <div className="animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/sites"><ArrowLeft /> Todos os clientes</Link>
      </Button>

      <PageHeader
        icone={Globe2}
        titulo={nomeEmpresa}
        subtitulo="Sites e hotsites deste cliente"
        acao={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/cs/${empresaId}`}>Ficha do cliente</Link>
            </Button>
            <SiteDialog empresaFixa={empresaId} aoSalvar={recarregar} />
          </div>
        }
      />

      {!todos ? (
        <div role="status" aria-label="Carregando projetos" className="space-y-6">
          <EsqueletoIndicadores quantidade={3} />
          <EsqueletoLista linhas={3} />
        </div>
      ) : sites.length === 0 ? (
        <EstadoVazio
          icone={Globe2}
          titulo="Nenhum site em desenvolvimento"
          descricao="Cadastre o primeiro site ou hotsite deste cliente: tipo, plataforma, prazo e as etapas de entrega."
          acao={<SiteDialog empresaFixa={empresaId} aoSalvar={recarregar} />}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { rotulo: "Em desenvolvimento", valor: indicadores.emAndamento, icone: Clock, tom: "bg-info/10 text-info" },
              { rotulo: "No ar", valor: indicadores.publicados, icone: Rocket, tom: "bg-success/10 text-success" },
              { rotulo: "Fora do prazo", valor: indicadores.atrasados, icone: AlertTriangle, tom: "bg-destructive/10 text-destructive" },
            ].map((k) => (
              <Card key={k.rotulo}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                    <p className="mt-1.5 font-display text-2xl font-semibold leading-none tabular-nums">{k.valor}</p>
                  </div>
                  <span aria-hidden
                    className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", k.tom)}>
                    <k.icone className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-4">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="bg-card sm:w-56" aria-label="Filtrar por fase"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as fases</SelectItem>
                {ordemFasesSite.map((f) => (
                  <SelectItem key={f} value={f}>{faseSiteLabels[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lista.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-card/60 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum site nesta fase.
            </p>
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {lista.map((s) => {
                  const pct = progressoSite(s);
                  const expandido = aberto === s.id;
                  return (
                    <li key={s.id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <button type="button" onClick={() => setAberto(expandido ? null : s.id)}
                              aria-expanded={expandido}
                              className="min-w-0 break-words rounded-sm text-left text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                              {s.nome}
                            </button>
                            <Badge variant={faseSiteVariant[s.fase]}>
                              {faseSiteLabels[s.fase]}
                            </Badge>
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              {tipoSiteLabels[s.tipo]}
                            </Badge>
                            {atrasado(s) && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" aria-hidden /> Fora do prazo
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {s.plataforma && <span>{s.plataforma}</span>}
                            {nomeDe(s.responsavel_id) && <span>{nomeDe(s.responsavel_id)}</span>}
                            {s.previsao_entrega && (
                              <span className={cn("tabular-nums", atrasado(s) && "font-medium text-destructive")}>
                                entrega {formatDate(s.previsao_entrega)}
                              </span>
                            )}
                            {s.url_producao && (
                              <a href={s.url_producao} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 rounded-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                                <ExternalLink className="h-3 w-3" aria-hidden /> no ar
                              </a>
                            )}
                            {s.url_homologacao && (
                              <a href={s.url_homologacao} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 rounded-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                                <ExternalLink className="h-3 w-3" aria-hidden /> homologação
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-0.5">
                          <SiteDialog site={s} aoSalvar={recarregar} gatilho={
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"
                              title="Editar projeto" aria-label="Editar projeto">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          } />
                          <Button variant="ghost" size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            title="Encerrar projeto" aria-label="Encerrar projeto"
                            onClick={() => apagar.mutate(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"
                          role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
                          aria-label={`Progresso de ${s.nome}`}>
                          <div className={cn("h-full rounded-full transition-all",
                            pct === 100 ? "bg-success" : "bg-primary")}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <button type="button" onClick={() => setAberto(expandido ? null : s.id)}
                          aria-expanded={expandido}
                          className="mt-1 inline-flex min-h-9 items-center gap-1 rounded-sm text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-0 sm:py-1">
                          {s.checklist.filter((e) => e.feito).length} de {s.checklist.length} etapas ·{" "}
                          {expandido ? "esconder" : "ver etapas"}
                          <ChevronDown aria-hidden
                            className={cn("h-3.5 w-3.5 transition-transform", expandido && "rotate-180")} />
                        </button>
                      </div>

                      {expandido && (
                        <div className="mt-2 rounded-md border bg-muted/50 p-3">
                          <div className="grid gap-x-4 sm:grid-cols-2">
                            {s.checklist.map((e, i) => (
                              <label key={i} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
                                <Checkbox checked={e.feito}
                                  onCheckedChange={() => etapa.mutate({ id: s.id, i })} />
                                <span className={cn(e.feito && "text-muted-foreground line-through")}>
                                  {e.titulo}
                                </span>
                              </label>
                            ))}
                          </div>
                          {s.observacoes && (
                            <p className="mt-2 whitespace-pre-wrap border-t pt-2 text-xs leading-relaxed text-muted-foreground">
                              {s.observacoes}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SiteDialog({
  site,
  empresaFixa,
  aoSalvar,
  gatilho,
}: {
  site?: ProjetoSite;
  /** Aberto de dentro de um cliente: o projeto já nasce vinculado a ele. */
  empresaFixa?: string;
  aoSalvar: () => void;
  gatilho?: React.ReactNode;
}) {
  const { userId } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    empresa_id: "", nome: "", tipo: "site" as TipoSite, plataforma: "",
    url_producao: "", url_homologacao: "", fase: "briefing" as FaseSite,
    responsavel_id: "", previsao_entrega: "", observacoes: "",
  });

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const abrir = (v: boolean) => {
    setAberto(v);
    if (v) {
      setForm({
        empresa_id: site?.empresa_id ?? empresaFixa ?? "",
        nome: site?.nome ?? "",
        tipo: site?.tipo ?? "site",
        plataforma: site?.plataforma ?? "",
        url_producao: site?.url_producao ?? "",
        url_homologacao: site?.url_homologacao ?? "",
        fase: site?.fase ?? "briefing",
        responsavel_id: site?.responsavel_id ?? userId ?? "",
        previsao_entrega: site?.previsao_entrega ?? "",
        observacoes: site?.observacoes ?? "",
      });
    }
  };

  const gravar = useMutation({
    mutationFn: () =>
      salvarProjetoSite({
        id: site?.id,
        empresa_id: form.empresa_id,
        nome: form.nome.trim(),
        tipo: form.tipo,
        plataforma: form.plataforma.trim() || null,
        url_producao: form.url_producao.trim() || null,
        url_homologacao: form.url_homologacao.trim() || null,
        fase: form.fase,
        responsavel_id: form.responsavel_id || null,
        previsao_entrega: form.previsao_entrega || null,
        observacoes: form.observacoes.trim() || null,
      }),
    onSuccess: () => {
      aoSalvar();
      setAberto(false);
      toast.success(site ? "Projeto atualizado" : "Projeto criado. A frente entrou na ficha do cliente.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        {gatilho ?? <Button size="sm"><Plus /> Novo site</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{site ? "Editar projeto" : "Novo site ou hotsite"}</DialogTitle>
          <DialogDescription>
            O projeto nasce com as dez etapas padrão de entrega da agência, que você
            marca conforme avança.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nome do projeto *</Label>
            <Input className="mt-1.5" value={form.nome} placeholder="Hotsite Vestibular 2027"
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div>
            <Label>Cliente *</Label>
            <Select value={form.empresa_id} disabled={Boolean(site) || Boolean(empresaFixa)}
              onValueChange={(v) => setForm({ ...form, empresa_id: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {empresas?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoSite })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(tipoSiteLabels) as TipoSite[]).map((t) => (
                  <SelectItem key={t} value={t}>{tipoSiteLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plataforma</Label>
            <Input className="mt-1.5" value={form.plataforma} placeholder="WordPress, Shopify, Next…"
              onChange={(e) => setForm({ ...form, plataforma: e.target.value })} />
          </div>

          <div>
            <Label>Fase</Label>
            <Select value={form.fase} onValueChange={(v) => setForm({ ...form, fase: v as FaseSite })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ordemFasesSite.map((f) => (
                  <SelectItem key={f} value={f}>{faseSiteLabels[f]}</SelectItem>
                ))}
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
            <Label>Previsão de entrega</Label>
            <Input type="date" className="mt-1.5" value={form.previsao_entrega}
              onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} />
          </div>

          <div>
            <Label>URL de homologação</Label>
            <Input className="mt-1.5" placeholder="https://" value={form.url_homologacao}
              onChange={(e) => setForm({ ...form, url_homologacao: e.target.value })} />
          </div>

          <div>
            <Label>URL no ar</Label>
            <Input className="mt-1.5" placeholder="https://" value={form.url_producao}
              onChange={(e) => setForm({ ...form, url_producao: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea className="mt-1.5" value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>

          <Button className="sm:col-span-2"
            disabled={!form.nome.trim() || !form.empresa_id || gravar.isPending}
            onClick={() => gravar.mutate()}>
            {site ? "Salvar alterações" : <><CheckCircle2 /> Criar projeto</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
