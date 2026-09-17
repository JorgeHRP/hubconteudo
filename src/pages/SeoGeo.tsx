import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, Navigate, Route, Routes, useParams } from "react-router-dom";
import {
  Search, Workflow, PackageCheck, Globe, ClipboardList, KeyRound, Newspaper,
  FileText, CalendarDays, FileSearch, ScanSearch, Link2, ShieldCheck, Users2,
  CalendarClock, BarChart3, Rocket, Settings2, ArrowLeft, Plus, Building2, Info,
  FilePlus2, Copy, Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  encerrarProjetoSeo, lancarProjetoSeo, listarEmpresas, listarProjetosSeo,
} from "@/data/store";
import { flagBadgeVariant, flagLabels, formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { ProjetoSeoProvider } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import ProjectCycle from "@/modulos/seo/pages/ProjectCycle";
import Deliverables from "@/modulos/seo/pages/Deliverables";
import GeoHub from "@/modulos/seo/pages/GeoHub";
import Planejamento from "@/modulos/seo/pages/Planejamento";
import Keywords from "@/modulos/seo/pages/Keywords";
import Pautas from "@/modulos/seo/pages/Pautas";
import Articles from "@/modulos/seo/pages/Articles";
import EditorialCalendar from "@/modulos/seo/pages/EditorialCalendar";
import OnPage from "@/modulos/seo/pages/OnPage";
import OnPageAudit from "@/modulos/seo/pages/OnPageAudit";
import BacklinksHub from "@/modulos/seo/pages/BacklinksHub";
import Audit from "@/modulos/seo/pages/Audit";
import Competitors from "@/modulos/seo/pages/Competitors";
import WeeklyUpdates from "@/modulos/seo/pages/WeeklyUpdates";
import Report from "@/modulos/seo/pages/Report";
import Launch from "@/modulos/seo/pages/Launch";
import SeoAdmin from "@/modulos/seo/pages/Admin";

const BASE = "/seo-geo";

const secoes = [
  { titulo: "Ciclo do Projeto", rota: "", icone: Workflow, elemento: <ProjectCycle /> },
  { titulo: "Entregáveis", rota: "entregaveis", icone: PackageCheck, elemento: <Deliverables /> },
  { titulo: "GEO", rota: "geo", icone: Globe, elemento: <GeoHub /> },
  { titulo: "Planejamento", rota: "planejamento", icone: ClipboardList, elemento: <Planejamento /> },
  { titulo: "Palavras-chave", rota: "palavras-chave", icone: KeyRound, elemento: <Keywords /> },
  { titulo: "Pautas", rota: "pautas", icone: Newspaper, elemento: <Pautas /> },
  { titulo: "Artigos", rota: "artigos", icone: FileText, elemento: <Articles /> },
  { titulo: "Calendário Editorial", rota: "calendario", icone: CalendarDays, elemento: <EditorialCalendar /> },
  { titulo: "SEO On-Page", rota: "on-page", icone: FileSearch, elemento: <OnPage /> },
  { titulo: "Auditoria On-Page", rota: "on-page-audit", icone: ScanSearch, elemento: <OnPageAudit /> },
  { titulo: "Backlinks", rota: "backlinks", icone: Link2, elemento: <BacklinksHub /> },
  { titulo: "Auditoria", rota: "auditoria", icone: ShieldCheck, elemento: <Audit /> },
  { titulo: "Concorrentes", rota: "concorrentes", icone: Users2, elemento: <Competitors /> },
  { titulo: "Atualizações Semanais", rota: "semanal", icone: CalendarClock, elemento: <WeeklyUpdates /> },
  { titulo: "Relatório", rota: "relatorio", icone: BarChart3, elemento: <Report /> },
  { titulo: "Lançamento", rota: "lancamento", icone: Rocket, elemento: <Launch /> },
  { titulo: "Admin do painel", rota: "admin", icone: Settings2, elemento: <SeoAdmin /> },
];

/* ------------------------------------------------------------------ */
/* Seleção de cliente                                                  */
/* ------------------------------------------------------------------ */

function EscolhaDoCliente() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [lancando, setLancando] = useState<string | null>(null);
  const [encerrando, setEncerrando] = useState<{ id: string; nome: string } | null>(null);

  const { data: clientes } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetosSeo"], queryFn: listarProjetosSeo });

  const lancar = useMutation({
    mutationFn: ({ cliente_id, origem }: { cliente_id: string; origem: "vazio" | "modelo_eseg" }) =>
      lancarProjetoSeo(cliente_id, origem, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetosSeo"] });
      setLancando(null);
      toast.success("Projeto de SEO lançado");
    },
    onError: (e: Error) => {
      setLancando(null);
      toast.error(e.message);
    },
  });

  const encerrar = useMutation({
    mutationFn: (id: string) => encerrarProjetoSeo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetosSeo"] });
      setEncerrando(null);
      toast.success("Projeto encerrado. Os dados ficam guardados caso ele volte.");
    },
  });

  const comProjeto = (clientes ?? []).filter((c) =>
    projetos?.some((p) => p.cliente_id === c.id)
  );
  const semProjeto = (clientes ?? []).filter(
    (c) => !projetos?.some((p) => p.cliente_id === c.id)
  );

  if ((clientes ?? []).length === 0) {
    return (
      <EstadoVazio
        icone={Building2}
        titulo="Nenhum cliente cadastrado"
        descricao="O projeto de SEO é sempre vinculado a um cliente da carteira. Cadastre o cliente no Painel de CS primeiro."
        acao={
          <Button asChild variant="outline">
            <Link to="/cs">Ir para o Painel de CS</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {comProjeto.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projetos em andamento
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comProjeto.map((c) => {
              const projeto = projetos?.find((p) => p.cliente_id === c.id);
              return (
                <Link key={c.id} to={`${BASE}/${c.id}`} className="group">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="p-5 pt-5">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold group-hover:text-primary">{c.nome_fantasia}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.segmento ?? c.razao_social}
                          </p>
                        </div>
                        <Badge variant={flagBadgeVariant[c.flag_conta ?? "green"]} className="shrink-0 text-[9px]">
                          {flagLabels[c.flag_conta ?? "green"]}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <p className="text-[10px] text-muted-foreground">
                          Projeto desde {formatDate(projeto?.criado_em.slice(0, 10) ?? null)}
                          {projeto?.origem === "vazio" ? " · em branco" : " · do modelo ESEG"}
                        </p>
                        <button
                          title="Encerrar projeto"
                          onClick={(e) => {
                            e.preventDefault();
                            if (projeto) setEncerrando({ id: projeto.id, nome: c.nome_fantasia });
                          }}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {semProjeto.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clientes sem projeto de SEO
          </p>
          <div className="space-y-2">
            {semProjeto.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 pt-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nome_fantasia}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.segmento, c.cidade].filter(Boolean).join(" · ") || c.razao_social}
                    </p>
                  </div>
                  <Button size="sm" disabled={lancando !== null} onClick={() => setLancando(c.id)}>
                    <Plus /> Lançar projeto de SEO
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Cada projeto tem os próprios dados — palavras-chave, pautas, artigos, calendário
          e auditorias não se misturam entre clientes.
        </span>
      </div>

      {/* ponto de partida do projeto */}
      <Dialog open={lancando !== null} onOpenChange={(v) => !v && setLancando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como começar o projeto?</DialogTitle>
            <DialogDescription>
              {clientes?.find((c) => c.id === lancando)?.nome_fantasia}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <button
              onClick={() => lancar.mutate({ cliente_id: lancando!, origem: "vazio" })}
              className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <FilePlus2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Em branco</p>
                <p className="text-xs text-muted-foreground">
                  Mesma estrutura de seções do projeto da ESEG, porém vazia, para você
                  preencher com os dados deste cliente. É o normal para um cliente novo.
                </p>
              </div>
            </button>

            <button
              onClick={() => lancar.mutate({ cliente_id: lancando!, origem: "modelo_eseg" })}
              className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <Copy className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Copiar o modelo da ESEG</p>
                <p className="text-xs text-muted-foreground">
                  Traz o conteúdo da Faculdade ESEG já preenchido, para você adaptar.
                  Útil para clientes do mesmo segmento.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* encerrar projeto */}
      <Dialog open={encerrando !== null} onOpenChange={(v) => !v && setEncerrando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar o projeto de {encerrando?.nome}?</DialogTitle>
            <DialogDescription>
              O projeto sai da lista, mas os dados continuam guardados — se ele for
              relançado, o conteúdo volta como estava.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEncerrando(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => encerrar.mutate(encerrando!.id)}>
              <AlertTriangle /> Encerrar projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Painel do cliente                                                   */
/* ------------------------------------------------------------------ */

function PainelDoCliente({ clienteId }: { clienteId: string }) {
  const { data: clientes } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetosSeo"], queryFn: listarProjetosSeo });

  const cliente = clientes?.find((c) => c.id === clienteId);
  const projeto = projetos?.find((p) => p.cliente_id === clienteId);

  if (!clientes || !projetos) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Carregando projeto…</p>;
  }
  if (!cliente || !projeto) return <Navigate to={BASE} replace />;

  const raiz = `${BASE}/${clienteId}`;

  return (
    <ProjetoSeoProvider
      valor={{
        clienteId,
        clienteNome: cliente.nome_fantasia,
        projetoId: projeto.id,
        origem: projeto.origem,
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={BASE}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os projetos
        </Link>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{cliente.nome_fantasia}</span>
          <Badge variant={flagBadgeVariant[cliente.flag_conta ?? "green"]} className="text-[9px]">
            {flagLabels[cliente.flag_conta ?? "green"]}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/cs/${clienteId}`}>Ficha do cliente</Link>
          </Button>
        </div>
      </div>

      {projeto.origem === "vazio" && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span className="text-muted-foreground">
            Projeto em branco: a estrutura é a mesma do projeto da ESEG, porém vazia.
            Palavras-chave, artigos, pautas, calendário, on-page, concorrentes,{" "}
            <strong className="text-foreground">auditoria</strong> e{" "}
            <strong className="text-foreground">entregáveis</strong> começam em branco e
            são preenchidos por você. O{" "}
            <strong className="text-foreground">Ciclo do Projeto</strong> vem preenchido de
            propósito — é o método da agência, igual para todo cliente. As seções que ainda
            não são editáveis (GEO, Relatório, Planejamento, Lançamento, Auditoria On-Page,
            Backlinks e Atualizações Semanais) aparecem vazias, em vez de mostrar os números
            de outro cliente.
          </span>
        </div>
      )}

      <nav className="mb-5 flex gap-1.5 overflow-x-auto border-b pb-2">
        {secoes.map(({ titulo, rota, icone: Icone }) => (
          <NavLink
            key={rota}
            to={rota ? `${raiz}/${rota}` : raiz}
            end={rota === ""}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icone className="h-3.5 w-3.5" />
            {titulo}
          </NavLink>
        ))}
      </nav>

      <Routes>
        {secoes.map(({ rota, elemento }) => (
          <Route key={rota} path={rota || "/"} element={elemento} />
        ))}
        <Route path="*" element={<Navigate to={raiz} replace />} />
      </Routes>

    </ProjetoSeoProvider>
  );
}

function RotaDoCliente() {
  const { clienteId = "" } = useParams();
  return <PainelDoCliente clienteId={clienteId} />;
}

export default function SeoGeo() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Search}
        titulo="Gestão de SEO / GEO"
        subtitulo="SEO tradicional e otimização para buscadores generativos, por cliente"
      />

      <Routes>
        <Route path="/" element={<EscolhaDoCliente />} />
        <Route path=":clienteId/*" element={<RotaDoCliente />} />
      </Routes>
    </div>
  );
}
