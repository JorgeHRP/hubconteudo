import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase, Search, Building2, TrendingUp, AlertTriangle, ShieldAlert, Trophy,
  ArrowRight, MapPin,
} from "lucide-react";
import {
  listarConquistas, listarContatosTodos, listarEmpresas, listarProfiles, listarProjetos,
  listarTarefas2,
} from "@/data/store";
import {
  statusEmpresaLabels, statusEmpresaVariant, tipoProjetoCurto, tipoProjetoLabels,
  tipoProjetoTom,
} from "@/lib/labels-clientes";
import { flagBadgeVariant, flagLabels, formatCurrency, formatDate } from "@/lib/cs-data";
import type { ChurnFlag, TipoProjeto } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoIndicadores, EsqueletoTabela } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function Kpi({
  icone: Icone, rotulo, valor, tom,
}: {
  icone: typeof Building2; rotulo: string; valor: string | number; tom?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p className="mt-1.5 break-words font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl">
            {valor}
          </p>
        </div>
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            tom ?? "bg-primary/10 text-primary"
          )}
        >
          <Icone className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function GestaoClientes() {
  const [busca, setBusca] = useState("");
  const [frente, setFrente] = useState("todas");

  const { data: empresas, isLoading: carregando } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetos"], queryFn: listarProjetos });
  const { data: contatos } = useQuery({ queryKey: ["contatos"], queryFn: listarContatosTodos });
  const { data: conquistas } = useQuery({ queryKey: ["conquistas"], queryFn: listarConquistas });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: tarefas } = useQuery({ queryKey: ["tarefas"], queryFn: listarTarefas2 });


  const listaEmpresas = empresas ?? [];
  const listaProjetos = projetos ?? [];

  const projetosDe = (empresaId: string) =>
    listaProjetos.filter((p) => p.empresa_id === empresaId);

  /** A flag da conta é a pior entre os projetos; sem projeto, é a definida na visão geral. */
  const flagDaConta = (empresaId: string): ChurnFlag => {
    const seus = projetosDe(empresaId);
    if (seus.some((p) => p.flag === "red")) return "red";
    if (seus.some((p) => p.flag === "yellow")) return "yellow";
    if (seus.length > 0) return "green";
    return listaEmpresas.find((e) => e.id === empresaId)?.flag_conta ?? "green";
  };

  const ativas = listaEmpresas.filter((e) => e.status === "ativo");
  const mrrTotal = listaProjetos.reduce((s, p) => s + p.mrr, 0);
  const amarelas = listaEmpresas.filter((e) => flagDaConta(e.id) === "yellow");
  const vermelhas = listaEmpresas.filter((e) => flagDaConta(e.id) === "red");

  const porFrente = useMemo(() => {
    const tipos: TipoProjeto[] = ["cs", "trafego", "seo", "rd"];
    return tipos.map((t) => ({
      tipo: t,
      quantidade: listaProjetos.filter((p) => p.tipo === t).length,
    }));
  }, [listaProjetos]);

  const maxFrente = Math.max(...porFrente.map((f) => f.quantidade), 1);

  const filtradas = listaEmpresas.filter((e) => {
    const t = busca.toLowerCase();
    const bate =
      e.nome_fantasia.toLowerCase().includes(t) ||
      e.razao_social.toLowerCase().includes(t) ||
      (e.cnpj ?? "").includes(t) ||
      (e.segmento ?? "").toLowerCase().includes(t);
    const temFrente =
      frente === "todas" || projetosDe(e.id).some((p) => p.tipo === frente);
    return bate && temFrente;
  });

  const destaques = (conquistas ?? []).filter((c) => c.destaque).slice(0, 4);
  const nomeDe = (id: string | null) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";
  const contatoPrincipal = (empresaId: string) =>
    contatos?.find((c) => c.empresa_id === empresaId && c.principal);

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Briefcase}
        titulo="Gestão de Clientes"
        subtitulo="Retrato da carteira. O time de CS alimenta estes números no Painel de CS."
      />

      {carregando ? (
        <div role="status" aria-label="Carregando carteira" className="space-y-6">
          <EsqueletoIndicadores />
          <EsqueletoTabela colunas={5} />
        </div>
      ) : listaEmpresas.length === 0 ? (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhuma empresa cadastrada"
          descricao="Os clientes são cadastrados no Painel de CS, onde o time opera a carteira. Assim que a primeira empresa entrar, o retrato aparece aqui."
          acao={
            <Button asChild>
              <Link to="/cs">Ir para o Painel de CS <ArrowRight /></Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icone={Building2} rotulo="Clientes ativos" valor={ativas.length} />
            <Kpi icone={TrendingUp} rotulo="MRR somado" valor={formatCurrency(mrrTotal)} />
            <Kpi icone={AlertTriangle} rotulo="Sinais de atenção" valor={amarelas.length}
              tom="bg-warning/15 text-warning-strong" />
            <Kpi icone={ShieldAlert} rotulo="Em risco" valor={vermelhas.length}
              tom="bg-destructive/10 text-destructive" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:items-start">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Projetos por frente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {porFrente.map(({ tipo, quantidade }) => (
                  <div key={tipo}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
                      <span className="font-medium text-foreground">{tipoProjetoLabels[tipo]}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {quantidade} {quantidade === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max((quantidade / maxFrente) * 100, quantidade > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-accent" aria-hidden /> Conquistas em destaque
                </CardTitle>
              </CardHeader>
              {destaques.length === 0 ? (
                <p className="border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  Nenhuma conquista marcada como destaque. Registre na ficha da empresa —
                  é o que se leva para a reunião de renovação.
                </p>
              ) : (
                <ul className="divide-y border-t">
                  {destaques.map((c) => {
                    const empresa = listaEmpresas.find((e) => e.id === c.empresa_id);
                    return (
                      <li key={c.id} className="px-5 py-3">
                        {c.indicador && (
                          <p className="font-display text-lg font-semibold leading-tight text-accent">
                            {c.indicador}
                          </p>
                        )}
                        <p className="text-sm font-medium">{c.titulo}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {empresa?.nome_fantasia} · {formatDate(c.data)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="my-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CNPJ ou segmento…" value={busca}
                aria-label="Buscar empresa"
                onChange={(e) => setBusca(e.target.value)} className="bg-card pl-9" />
            </div>
            <Select value={frente} onValueChange={setFrente}>
              <SelectTrigger className="bg-card sm:w-52" aria-label="Filtrar por frente"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as frentes</SelectItem>
                {(Object.keys(tipoProjetoLabels) as TipoProjeto[]).map((t) => (
                  <SelectItem key={t} value={t}>{tipoProjetoLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtradas.length === 0 ? (
            <EstadoVazio
              icone={Search}
              titulo="Nenhuma empresa com esse filtro"
              descricao="Ajuste a busca ou a frente de trabalho."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
                <p className="font-display text-sm font-semibold">Carteira</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {filtradas.length === listaEmpresas.length
                    ? `${listaEmpresas.length} ${listaEmpresas.length === 1 ? "empresa" : "empresas"}`
                    : `${filtradas.length} de ${listaEmpresas.length}`}
                </p>
              </div>
              <Table className="min-w-[60rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead>Frentes</TableHead>
                    <TableHead>Contato principal</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">MRR somado</TableHead>
                    <TableHead className="text-right">Tarefas</TableHead>
                    <TableHead className="w-10 pr-4"><span className="sr-only">Abrir</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((e) => {
                    const seus = projetosDe(e.id);
                    const contato = contatoPrincipal(e.id);
                    const pior = flagDaConta(e.id);
                    const tarefasAbertas = (tarefas ?? []).filter(
                      (t) => t.empresa_id === e.id && !t.concluida_em
                    ).length;
                    return (
                      <TableRow key={e.id} className="group">
                        <TableCell className="max-w-[16rem] pl-4">
                          <Link
                            to={`/cs/${e.id}`}
                            className="block truncate rounded-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            {e.nome_fantasia}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {e.segmento ?? e.razao_social}
                          </p>
                          {(e.cidade || e.estado) && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                              {[e.cidade, e.estado].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusEmpresaVariant[e.status]} className="whitespace-nowrap">
                            {statusEmpresaLabels[e.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={flagBadgeVariant[pior]} className="whitespace-nowrap">
                            {flagLabels[pior]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {seus.map((p) => (
                              <span
                                key={p.id}
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-xs font-medium",
                                  tipoProjetoTom[p.tipo]
                                )}
                              >
                                {tipoProjetoCurto[p.tipo]}
                              </span>
                            ))}
                            {seus.length === 0 && (
                              <span className="whitespace-nowrap text-xs text-muted-foreground">sem projeto</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[14rem]">
                          {contato ? (
                            <>
                              <p className="truncate">{contato.nome}</p>
                              {contato.cargo && (
                                <p className="truncate text-xs text-muted-foreground">{contato.cargo}</p>
                              )}
                            </>
                          ) : (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              Contato não cadastrado
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                          {nomeDe(e.responsavel_id)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                          {seus.length > 0
                            ? formatCurrency(seus.reduce((s, p) => s + p.mrr, 0))
                            : <span className="font-normal text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tarefasAbertas > 0
                            ? tarefasAbertas
                            : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                        <TableCell className="pr-4">
                          <Link
                            to={`/cs/${e.id}`}
                            aria-label={`Abrir a ficha de ${e.nome_fantasia}`}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
