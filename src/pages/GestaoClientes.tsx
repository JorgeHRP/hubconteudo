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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function Kpi({
  icone: Icone, rotulo, valor, tom,
}: {
  icone: typeof Building2; rotulo: string; valor: string | number; tom?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <Icone className={cn("h-4 w-4", tom ?? "text-primary")} />
        </div>
        <p className="text-2xl font-bold">{valor}</p>
      </CardContent>
    </Card>
  );
}

export default function GestaoClientes() {
  const [busca, setBusca] = useState("");
  const [frente, setFrente] = useState("todas");

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
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

      {listaEmpresas.length === 0 ? (
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
              tom="text-warning" />
            <Kpi icone={ShieldAlert} rotulo="Em risco" valor={vermelhas.length}
              tom="text-destructive" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Projetos por frente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {porFrente.map(({ tipo, quantidade }) => (
                  <div key={tipo}>
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-medium">{tipoProjetoLabels[tipo]}</span>
                      <span className="text-muted-foreground">
                        {quantidade} {quantidade === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="gradient-primary h-full rounded-full transition-all"
                        style={{ width: `${Math.max((quantidade / maxFrente) * 100, quantidade > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-warning" /> Conquistas em destaque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {destaques.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conquista marcada como destaque. Registre na ficha da empresa —
                    é o que se leva para a reunião de renovação.
                  </p>
                ) : (
                  destaques.map((c) => {
                    const empresa = listaEmpresas.find((e) => e.id === c.empresa_id);
                    return (
                      <div key={c.id} className="border-b pb-2 last:border-0 last:pb-0">
                        {c.indicador && (
                          <p className="text-lg font-bold leading-tight text-accent">
                            {c.indicador}
                          </p>
                        )}
                        <p className="text-sm font-medium">{c.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {empresa?.nome_fantasia} · {formatDate(c.data)}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="my-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CNPJ ou segmento…" value={busca}
                onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Select value={frente} onValueChange={setFrente}>
              <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((e) => {
                const seus = projetosDe(e.id);
                const contato = contatoPrincipal(e.id);
                const pior = flagDaConta(e.id);
                const tarefasAbertas = (tarefas ?? []).filter(
                  (t) => t.empresa_id === e.id && !t.concluida_em
                ).length;
                return (
                  <Link key={e.id} to={`/cs/${e.id}`} className="group">
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="p-5 pt-5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold group-hover:text-primary">
                              {e.nome_fantasia}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.segmento ?? e.razao_social}
                            </p>
                          </div>
                          <span
                            title={pior === "red" ? "Em risco" : pior === "yellow" ? "Atenção" : "Saudável"}
                            className={cn(
                              "mt-1 h-3 w-3 shrink-0 rounded-full ring-4",
                              pior === "green" && "bg-success ring-success/15",
                              pior === "yellow" && "bg-warning ring-warning/15",
                              pior === "red" && "bg-destructive ring-destructive/15"
                            )}
                          />
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant={statusEmpresaVariant[e.status]} className="text-[9px]">
                            {statusEmpresaLabels[e.status]}
                          </Badge>
                          <Badge variant={flagBadgeVariant[pior]} className="text-[9px]">
                            {flagLabels[pior]}
                          </Badge>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-1">
                          {seus.map((p) => (
                            <span
                              key={p.id}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-medium",
                                tipoProjetoTom[p.tipo]
                              )}
                            >
                              {tipoProjetoCurto[p.tipo]}
                            </span>
                          ))}
                          {seus.length === 0 && (
                            <span className="text-[10px] text-muted-foreground">sem projeto</span>
                          )}
                        </div>

                        <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                          <p className="truncate">
                            {contato ? `${contato.nome}${contato.cargo ? ` · ${contato.cargo}` : ""}` : "Contato não cadastrado"}
                          </p>
                          {(e.cidade || e.estado) && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {[e.cidade, e.estado].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <p>Responsável: {nomeDe(e.responsavel_id)}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground">
                              {seus.length > 0 ? "MRR somado" : "Tarefas em aberto"}
                            </p>
                            <p className="text-sm font-bold">
                              {seus.length > 0
                                ? formatCurrency(seus.reduce((s, p) => s + p.mrr, 0))
                                : tarefasAbertas}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {seus.length > 0 && tarefasAbertas > 0 && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {tarefasAbertas} tarefa{tarefasAbertas === 1 ? "" : "s"}
                              </span>
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
