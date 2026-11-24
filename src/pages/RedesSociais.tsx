import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Share2, Plus, Trash2, ExternalLink, Users2, CalendarDays, Pencil,
  ArrowLeft, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  listarEmpresas, listarIntegracoes, listarPerfisSociais, listarProfiles, listarPublicacoes,
  removerPerfilSocial, removerPublicacao, salvarPerfilSocial, salvarPublicacao,
} from "@/data/store";
import {
  formatoLabels, redeLabels, redeTom, redes, seguidoresLegivel,
  statusPublicacaoLabels, statusPublicacaoVariant,
} from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type {
  FormatoPublicacao, Publicacao, RedeSocial, StatusPublicacao,
} from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { CarteiraDaFrente } from "@/components/CarteiraDaFrente";
import { EsqueletoIndicadores, EsqueletoPagina, EsqueletoTabela } from "@/components/Esqueletos";
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Raiz da frente: a carteira de clientes, como no painel de SEO. Lançar o
 * projeto registra a frente no Painel de CS.
 */
export default function RedesSociais() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Share2}
        titulo="Gestão de Redes Sociais"
        subtitulo="Social media: perfis, calendário de publicação e desempenho por rede"
      />
      <CarteiraDaFrente tipo="social" destino={(id) => `/redes-sociais/${id}`} />
    </div>
  );
}

/** Perfis e calendário de um cliente. */
export function RedesDoCliente() {
  const { id = "" } = useParams();
  const qc = useQueryClient();

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });
  const empresa = empresas?.find((e) => e.id === id);

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["perfis-sociais"] });
    qc.invalidateQueries({ queryKey: ["publicacoes"] });
    qc.invalidateQueries({ queryKey: ["projetos"] });
  };

  if (empresas && !empresa) return <Navigate to="/redes-sociais" replace />;
  if (!empresas) return <EsqueletoPagina />;

  const reportei = integracoes?.find((i) => i.chave === "reportei");

  return (
    <div className="animate-fade-in">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/redes-sociais"><ArrowLeft /> Todos os clientes</Link>
      </Button>

      <PageHeader
        icone={Share2}
        titulo={empresa?.nome_fantasia ?? ""}
        subtitulo="Perfis, calendário de publicação e desempenho por rede"
        acao={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/cs/${id}`}>Ficha do cliente</Link>
          </Button>
        }
      />

      {/* Enquanto o Reportei não está ligado, os números são digitados à mão. */}
      {reportei && !reportei.conectada && (
        <div role="note" className="mb-6 flex items-start gap-3 rounded-lg border border-info/20 bg-info/10 p-4 text-sm leading-relaxed text-muted-foreground">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
          <span>
            <strong className="font-semibold text-foreground">Reportei não conectado.</strong> Ao ligar a
            integração, os seguidores e as métricas de cada rede passam a ser atualizados
            sozinhos, e os relatórios do cliente vêm junto. Configure em{" "}
            <Link to="/admin"
              className="rounded-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              Painel Admin → Integrações
            </Link>
            . Enquanto isso, os números são preenchidos à mão.
          </span>
        </div>
      )}

      <Tabs defaultValue="perfis">
        <TabsList>
          <TabsTrigger value="perfis"><Users2 /> Perfis</TabsTrigger>
          <TabsTrigger value="calendario"><CalendarDays /> Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="perfis">
          <Perfis empresaId={id} aoMudar={recarregar} />
        </TabsContent>

        <TabsContent value="calendario">
          <Calendario empresaId={id} aoMudar={recarregar} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- perfis ---------------- */

function Perfis({ empresaId, aoMudar }: { empresaId: string; aoMudar: () => void }) {
  const [rede, setRede] = useState<RedeSocial>("instagram");
  const [usuario, setUsuario] = useState("");
  const [url, setUrl] = useState("");

  const { data: perfis } = useQuery({
    queryKey: ["perfis-sociais", empresaId],
    queryFn: () => listarPerfisSociais(empresaId),
    enabled: Boolean(empresaId),
  });

  const gravar = useMutation({
    mutationFn: (dados: Parameters<typeof salvarPerfilSocial>[0]) => salvarPerfilSocial(dados),
    onSuccess: () => { aoMudar(); toast.success("Perfil salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const apagar = useMutation({
    mutationFn: removerPerfilSocial,
    onSuccess: () => { aoMudar(); toast.success("Perfil removido"); },
  });

  const lista = perfis ?? [];
  const total = lista.reduce((s, p) => s + (p.seguidores ?? 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b px-5 py-3.5">
          <CardTitle className="text-base">Adicionar perfil</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <Select value={rede} onValueChange={(v) => setRede(v as RedeSocial)}>
              <SelectTrigger className="sm:w-40" aria-label="Rede social"><SelectValue /></SelectTrigger>
              <SelectContent>
                {redes.map((r) => <SelectItem key={r} value={r}>{redeLabels[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="sm:w-44" placeholder="@usuario" aria-label="Usuário do perfil" value={usuario}
              onChange={(e) => setUsuario(e.target.value)} />
            <Input className="sm:min-w-[14rem] sm:flex-1" placeholder="https://" aria-label="Endereço do perfil" value={url}
              onChange={(e) => setUrl(e.target.value)} />
            <Button disabled={!usuario.trim()}
              onClick={() => {
                gravar.mutate({
                  empresa_id: empresaId, rede,
                  usuario: usuario.trim(), url: url.trim() || null,
                });
                setUsuario(""); setUrl("");
              }}>
              <Plus /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {!perfis ? (
        <div role="status" aria-label="Carregando perfis">
          <EsqueletoIndicadores quantidade={3} />
        </div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          icone={Share2}
          titulo="Nenhum perfil cadastrado"
          descricao="Cadastre os perfis que a agência administra para este cliente. Ao salvar o primeiro, a frente de Redes Sociais entra na ficha dele no Painel de CS."
        />
      ) : (
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Perfis administrados
            </h2>
            {total > 0 && (
              <p className="text-xs tabular-nums text-muted-foreground">
                {seguidoresLegivel(total)} seguidores somados em {lista.length}{" "}
                {lista.length === 1 ? "perfil" : "perfis"}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((p) => (
              <Card key={p.id} className="group overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b py-2 pl-4 pr-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium", redeTom[p.rede])}>
                      {redeLabels[p.rede]}
                    </span>
                    <p className="truncate text-sm font-medium">{p.usuario}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {p.url && (
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent">
                        <a href={p.url} target="_blank" rel="noreferrer"
                          title="Abrir perfil" aria-label={`Abrir perfil ${p.usuario}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon"
                      className="h-9 w-9 text-muted-foreground transition-opacity hover:text-destructive [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                      title="Remover perfil" aria-label={`Remover perfil ${p.usuario}`}
                      onClick={() => apagar.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                  <Input
                    type="number"
                    className="mt-1.5 h-9 w-36 font-display text-base font-semibold tabular-nums"
                    aria-label={`Seguidores de ${p.usuario}`}
                    defaultValue={p.seguidores ?? ""}
                    placeholder="—"
                    onBlur={(e) => {
                      const n = e.target.value === "" ? null : Number(e.target.value);
                      if (n !== p.seguidores) {
                        gravar.mutate({ ...p, seguidores: n });
                      }
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p.medido_em
                      ? `medido em ${formatDate(p.medido_em)}`
                      : "sem medição registrada"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------- calendário ---------------- */

function Calendario({ empresaId, aoMudar }: { empresaId: string; aoMudar: () => void }) {
  const [filtro, setFiltro] = useState("todas");
  const [editando, setEditando] = useState<Publicacao | null>(null);
  const [aberto, setAberto] = useState(false);

  const { data: publicacoes } = useQuery({
    queryKey: ["publicacoes", empresaId],
    queryFn: () => listarPublicacoes(empresaId),
    enabled: Boolean(empresaId),
  });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: perfis } = useQuery({
    queryKey: ["perfis-sociais", empresaId],
    queryFn: () => listarPerfisSociais(empresaId),
    enabled: Boolean(empresaId),
  });

  const apagar = useMutation({
    mutationFn: removerPublicacao,
    onSuccess: () => { aoMudar(); toast.success("Publicação removida"); },
  });

  const lista = (publicacoes ?? []).filter((p) => filtro === "todas" || p.status === filtro);
  const nomeDe = (id: string | null) => profiles?.find((p) => p.user_id === id)?.nome ?? null;

  const dialogo = (
    <PublicacaoDialog
      empresaId={empresaId}
      publicacao={editando ?? undefined}
      redesDisponiveis={(perfis ?? []).map((p) => p.rede)}
      aberto={aberto}
      setAberto={(v) => { setAberto(v); if (!v) setEditando(null); }}
      aoSalvar={aoMudar}
    />
  );

  if (!publicacoes) {
    return (
      <div role="status" aria-label="Carregando calendário">
        <EsqueletoTabela linhas={5} colunas={5} />
      </div>
    );
  }

  if ((publicacoes ?? []).length === 0) {
    return (
      <>
        <EstadoVazio
          icone={CalendarDays}
          titulo="Calendário vazio"
          descricao="Programe as publicações deste cliente: formato, redes, data e status, da ideia até o ar."
          acao={<Button onClick={() => setAberto(true)}><Plus /> Nova publicação</Button>}
        />
        {dialogo}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-full bg-card sm:w-52" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            {(Object.keys(statusPublicacaoLabels) as StatusPublicacao[]).map((st) => (
              <SelectItem key={st} value={st}>{statusPublicacaoLabels[st]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="ml-auto" size="sm" onClick={() => setAberto(true)}>
          <Plus /> Nova publicação
        </Button>
      </div>

      <Card className="overflow-hidden">
        {lista.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma publicação neste status.
          </p>
        ) : (
          <Table className="min-w-[50rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Publicação</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Redes</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 pr-4"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[20rem] pl-4">
                    <button type="button"
                      onClick={() => { setEditando(p); setAberto(true); }}
                      className="rounded-sm text-left font-medium leading-snug text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      {p.titulo}
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatoLabels[p.formato]}
                  </TableCell>
                  <TableCell>
                    {p.redes.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.redes.map((r) => (
                          <span key={r} className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", redeTom[r])}>
                            {redeLabels[r]}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {nomeDe(p.responsavel_id) ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {p.data_prevista ? formatDate(p.data_prevista) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusPublicacaoVariant[p.status]} className="whitespace-nowrap">
                      {statusPublicacaoLabels[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-0.5">
                      {p.link && (
                        <Button asChild variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent">
                          <a href={p.link} target="_blank" rel="noreferrer"
                            title="Abrir publicação" aria-label={`Abrir link de ${p.titulo}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        title="Editar publicação" aria-label={`Editar publicação ${p.titulo}`}
                        onClick={() => { setEditando(p); setAberto(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        title="Remover publicação" aria-label={`Remover publicação ${p.titulo}`}
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

      {dialogo}
    </div>
  );
}

function PublicacaoDialog({
  empresaId,
  publicacao,
  redesDisponiveis,
  aberto,
  setAberto,
  aoSalvar,
}: {
  empresaId: string;
  publicacao?: Publicacao;
  redesDisponiveis: RedeSocial[];
  aberto: boolean;
  setAberto: (v: boolean) => void;
  aoSalvar: () => void;
}) {
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const [form, setForm] = useState({
    titulo: "", redes: [] as RedeSocial[], formato: "feed" as FormatoPublicacao,
    status: "ideia" as StatusPublicacao, data_prevista: "", legenda: "",
    link: "", responsavel_id: "",
  });

  const abrir = (v: boolean) => {
    setAberto(v);
    if (v) {
      setForm({
        titulo: publicacao?.titulo ?? "",
        redes: publicacao?.redes ?? [],
        formato: publicacao?.formato ?? "feed",
        status: publicacao?.status ?? "ideia",
        data_prevista: publicacao?.data_prevista ?? "",
        legenda: publicacao?.legenda ?? "",
        link: publicacao?.link ?? "",
        responsavel_id: publicacao?.responsavel_id ?? "",
      });
    }
  };

  const gravar = useMutation({
    mutationFn: () =>
      salvarPublicacao({
        id: publicacao?.id,
        empresa_id: empresaId,
        titulo: form.titulo.trim(),
        redes: form.redes,
        formato: form.formato,
        status: form.status,
        data_prevista: form.data_prevista || null,
        legenda: form.legenda.trim() || null,
        link: form.link.trim() || null,
        responsavel_id: form.responsavel_id || null,
      }),
    onSuccess: () => {
      aoSalvar();
      setAberto(false);
      toast.success(publicacao ? "Publicação atualizada" : "Publicação criada");
    },
  });

  // Sem perfil cadastrado, oferece todas as redes: o cadastro pode vir depois.
  const opcoes = redesDisponiveis.length > 0 ? [...new Set(redesDisponiveis)] : redes;

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{publicacao ? "Editar publicação" : "Nova publicação"}</DialogTitle>
          <DialogDescription>
            O que vai ao ar, em qual rede e quando.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Título *</Label>
            <Input className="mt-1.5" value={form.titulo}
              placeholder="Depoimento de aluno — turma de Direito"
              onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Label>Redes</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {opcoes.map((r) => {
                const marcada = form.redes.includes(r);
                return (
                  <button key={r} type="button" aria-pressed={marcada}
                    onClick={() =>
                      setForm({
                        ...form,
                        redes: marcada
                          ? form.redes.filter((x) => x !== r)
                          : [...form.redes, r],
                      })
                    }
                    className={cn("inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      marcada
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted")}>
                    {redeLabels[r]}
                  </button>
                );
              })}
            </div>
            {redesDisponiveis.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Nenhum perfil cadastrado ainda — a lista mostra todas as redes.
              </p>
            )}
          </div>

          <div>
            <Label>Formato</Label>
            <Select value={form.formato}
              onValueChange={(v) => setForm({ ...form, formato: v as FormatoPublicacao })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(formatoLabels) as FormatoPublicacao[]).map((f) => (
                  <SelectItem key={f} value={f}>{formatoLabels[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as StatusPublicacao })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(statusPublicacaoLabels) as StatusPublicacao[]).map((st) => (
                  <SelectItem key={st} value={st}>{statusPublicacaoLabels[st]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data prevista</Label>
            <Input type="date" className="mt-1.5" value={form.data_prevista}
              onChange={(e) => setForm({ ...form, data_prevista: e.target.value })} />
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

          <div className="sm:col-span-2">
            <Label>Legenda</Label>
            <Textarea className="mt-1.5" rows={3} value={form.legenda}
              onChange={(e) => setForm({ ...form, legenda: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Label>Link da publicação</Label>
            <Input className="mt-1.5" placeholder="https://" value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })} />
          </div>

          <Button className="sm:col-span-2" disabled={!form.titulo.trim() || gravar.isPending}
            onClick={() => gravar.mutate()}>
            {publicacao ? "Salvar alterações" : "Criar publicação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
