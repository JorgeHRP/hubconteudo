import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Headphones, Search, Users, TrendingUp, AlertTriangle, ShieldAlert, User, Mail,
  UserCog, ArrowRight, ListChecks,
} from "lucide-react";
import {
  definirFlagEmpresa, listarContatosTodos, listarEmpresas, listarProfiles, listarProjetos,
  listarTarefas2,
} from "@/data/store";
import {
  statusEmpresaLabels, tipoProjetoLabels, tipoProjetoTom,
} from "@/lib/labels-clientes";
import { flagBadgeVariant, flagLabels, formatCurrency, formatDate } from "@/lib/cs-data";
import type { ChurnFlag, TipoProjeto } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoIndicadores, EsqueletoLista } from "@/components/Esqueletos";
import { EmpresaDialog } from "@/components/EmpresaDialog";
import { ControleCliente } from "@/components/ControleCliente";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function Kpi({ icone: Icone, rotulo, valor, tom }: {
  icone: typeof Users; rotulo: string; valor: string | number; tom?: string;
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

/** Painel de CS — onde o time opera a carteira. */
export default function CS() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [frente, setFrente] = useState("todas");
  const [flag, setFlag] = useState("todas");

  const { data: empresas, isLoading: carregando } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetos"], queryFn: listarProjetos });
  const { data: contatos } = useQuery({ queryKey: ["contatos"], queryFn: listarContatosTodos });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: tarefas } = useQuery({ queryKey: ["tarefas"], queryFn: listarTarefas2 });

  const listaEmpresas = empresas ?? [];
  const listaProjetos = projetos ?? [];

  const projetosDe = (id: string) => listaProjetos.filter((p) => p.empresa_id === id);

  const flagDaConta = (id: string): ChurnFlag => {
    const seus = projetosDe(id);
    if (seus.some((p) => p.flag === "red")) return "red";
    if (seus.some((p) => p.flag === "yellow")) return "yellow";
    if (seus.length > 0) return "green";
    return listaEmpresas.find((e) => e.id === id)?.flag_conta ?? "green";
  };

  const mudarFlag = useMutation({
    mutationFn: ({ id, flag: f }: { id: string; flag: ChurnFlag }) => definirFlagEmpresa(id, f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      qc.invalidateQueries({ queryKey: ["projetos"] });
    },
  });

  const mrrTotal = listaProjetos.reduce((s, p) => s + p.mrr, 0);
  const amarelas = listaEmpresas.filter((e) => flagDaConta(e.id) === "yellow");
  const vermelhas = listaEmpresas.filter((e) => flagDaConta(e.id) === "red");

  const filtradas = listaEmpresas.filter((e) => {
    const t = busca.toLowerCase();
    const bate =
      e.nome_fantasia.toLowerCase().includes(t) ||
      e.razao_social.toLowerCase().includes(t) ||
      (e.segmento ?? "").toLowerCase().includes(t);
    const temFrente = frente === "todas" || projetosDe(e.id).some((p) => p.tipo === frente);
    const bateFlag = flag === "todas" || flagDaConta(e.id) === flag;
    return bate && temFrente && bateFlag;
  });

  const nomeDe = (id: string | null) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";
  const contatoPrincipal = (id: string) => contatos?.find((c) => c.empresa_id === id && c.principal);
  const abertas = (id: string) =>
    (tarefas ?? []).filter((t) => t.empresa_id === id && !t.concluida_em).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Headphones}
        titulo="Painel de CS"
        subtitulo="A carteira inteira: cadastro, saúde, entregas e relacionamento"
        acao={<EmpresaDialog />}
      />

      {carregando ? (
        <div role="status" aria-label="Carregando carteira" className="space-y-6">
          <EsqueletoIndicadores />
          <EsqueletoLista />
        </div>
      ) : listaEmpresas.length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhum cliente na carteira"
          descricao="Cadastre a primeira empresa. Dentro dela ficam contatos, projetos por frente, dossiê, tarefas e o termômetro de churn."
          acao={<EmpresaDialog />}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icone={Users} rotulo="Clientes na carteira" valor={listaEmpresas.length} />
            <Kpi icone={TrendingUp} rotulo="MRR somado" valor={formatCurrency(mrrTotal)} />
            <Kpi icone={AlertTriangle} rotulo="Sinais de atenção" valor={amarelas.length} tom="bg-warning/15 text-warning-strong" />
            <Kpi icone={ShieldAlert} rotulo="Em risco" valor={vermelhas.length} tom="bg-destructive/10 text-destructive" />
          </div>

          <div className="my-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar cliente…" value={busca} aria-label="Buscar cliente"
                onChange={(e) => setBusca(e.target.value)} className="bg-card pl-9" />
            </div>
            <Select value={frente} onValueChange={setFrente}>
              <SelectTrigger className="bg-card sm:w-48" aria-label="Filtrar por frente"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as frentes</SelectItem>
                {(Object.keys(tipoProjetoLabels) as TipoProjeto[]).map((t) => (
                  <SelectItem key={t} value={t}>{tipoProjetoLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={flag} onValueChange={setFlag}>
              <SelectTrigger className="bg-card sm:w-40" aria-label="Filtrar por flag"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as flags</SelectItem>
                <SelectItem value="green">Saudável</SelectItem>
                <SelectItem value="yellow">Atenção</SelectItem>
                <SelectItem value="red">Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtradas.length === 0 ? (
            <EstadoVazio icone={Search} titulo="Nenhum cliente com esse filtro"
              descricao="Ajuste a busca, a frente ou a flag." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((e) => {
                const seus = projetosDe(e.id);
                const contato = contatoPrincipal(e.id);
                const f = flagDaConta(e.id);
                return (
                  <Card key={e.id} className="flex flex-col transition-colors hover:border-primary/30">
                    <CardContent className="flex flex-1 flex-col p-5">
                      <Link to={`/cs/${e.id}`}
                        className="group min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display font-semibold transition-colors group-hover:text-primary">
                              {e.nome_fantasia}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.segmento ?? statusEmpresaLabels[e.status]}
                            </p>
                          </div>
                          <Badge variant={flagBadgeVariant[f]} className="shrink-0">
                            {flagLabels[f]}
                          </Badge>
                        </div>
                      </Link>

                      <div className="mb-4">
                        <ControleCliente
                          empresa={e}
                          flagAtual={f}
                          aoMudarFlag={(nova) => mudarFlag.mutate({ id: e.id, flag: nova })}
                          compacto
                        />
                      </div>

                      {/* Frentes ativas da conta: é o que o time precisa ver de relance. */}
                      <div className="mb-4">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Projetos ativos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {seus.map((p) => (
                            <span key={p.id}
                              className={cn("rounded-md px-2 py-0.5 text-xs font-medium",
                                tipoProjetoTom[p.tipo])}>
                              {tipoProjetoLabels[p.tipo]}
                            </span>
                          ))}
                          {seus.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              Nenhuma frente contratada
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t pb-3 pt-3 text-xs text-muted-foreground">
                        <p className="flex min-w-0 items-center gap-2">
                          <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{contato?.nome ?? "Contato não cadastrado"}</span>
                        </p>
                        {contato?.email && (
                          <p className="flex min-w-0 items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{contato.email}</span>
                          </p>
                        )}
                        <p className="flex min-w-0 items-center gap-2">
                          <UserCog className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{nomeDe(e.responsavel_id)}</span>
                        </p>
                      </div>

                      <Link to={`/cs/${e.id}`}
                        className="group mt-auto flex items-center justify-between gap-3 rounded-sm border-t pt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {seus.length > 0 ? "MRR" : "Tarefas em aberto"}
                          </p>
                          <p className="font-display text-base font-semibold tabular-nums">
                            {seus.length > 0
                              ? formatCurrency(seus.reduce((s, p) => s + p.mrr, 0))
                              : abertas(e.id)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {abertas(e.id) > 0 && seus.length > 0 && (
                            <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                              <ListChecks className="h-3 w-3" aria-hidden /> {abertas(e.id)}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                        </div>
                      </Link>

                      {seus.some((p) => p.renovacao) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Renova em {formatDate(seus.find((p) => p.renovacao)?.renovacao ?? null)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
