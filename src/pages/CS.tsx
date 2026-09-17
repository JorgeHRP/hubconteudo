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

/** Painel de CS — onde o time opera a carteira. */
export default function CS() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [frente, setFrente] = useState("todas");
  const [flag, setFlag] = useState("todas");

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
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

      {listaEmpresas.length === 0 ? (
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
            <Kpi icone={AlertTriangle} rotulo="Sinais de atenção" valor={amarelas.length} tom="text-warning" />
            <Kpi icone={ShieldAlert} rotulo="Em risco" valor={vermelhas.length} tom="text-destructive" />
          </div>

          <div className="my-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar cliente…" value={busca}
                onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
            <Select value={frente} onValueChange={setFrente}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as frentes</SelectItem>
                {(Object.keys(tipoProjetoLabels) as TipoProjeto[]).map((t) => (
                  <SelectItem key={t} value={t}>{tipoProjetoLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={flag} onValueChange={setFlag}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
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
                  <Card key={e.id} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col p-5 pt-5">
                      <Link to={`/cs/${e.id}`} className="group min-w-0">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold group-hover:text-primary">
                              {e.nome_fantasia}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.segmento ?? statusEmpresaLabels[e.status]}
                            </p>
                          </div>
                          <Badge variant={flagBadgeVariant[f]} className="shrink-0 text-[9px]">
                            {flagLabels[f]}
                          </Badge>
                        </div>
                      </Link>

                      <div className="mb-3">
                        <ControleCliente
                          empresa={e}
                          flagAtual={f}
                          aoMudarFlag={(nova) => mudarFlag.mutate({ id: e.id, flag: nova })}
                          compacto
                        />
                      </div>

                      {/* Frentes ativas da conta: é o que o time precisa ver de relance. */}
                      <div className="mb-3">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Projetos ativos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {seus.map((p) => (
                            <span key={p.id}
                              className={cn("rounded px-2 py-0.5 text-[10px] font-medium",
                                tipoProjetoTom[p.tipo])}>
                              {tipoProjetoLabels[p.tipo]}
                            </span>
                          ))}
                          {seus.length === 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              Nenhuma frente contratada
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                        <p className="flex items-center gap-2 truncate">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {contato?.nome ?? "Contato não cadastrado"}
                        </p>
                        {contato?.email && (
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0" /> {contato.email}
                          </p>
                        )}
                        <p className="flex items-center gap-2 truncate">
                          <UserCog className="h-3.5 w-3.5 shrink-0" /> {nomeDe(e.responsavel_id)}
                        </p>
                      </div>

                      <Link to={`/cs/${e.id}`}
                        className="group mt-auto flex items-center justify-between border-t pt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {seus.length > 0 ? "MRR" : "Tarefas em aberto"}
                          </p>
                          <p className="text-sm font-bold">
                            {seus.length > 0
                              ? formatCurrency(seus.reduce((s, p) => s + p.mrr, 0))
                              : abertas(e.id)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {abertas(e.id) > 0 && seus.length > 0 && (
                            <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              <ListChecks className="h-3 w-3" /> {abertas(e.id)}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </Link>

                      {seus.some((p) => p.renovacao) && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
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
