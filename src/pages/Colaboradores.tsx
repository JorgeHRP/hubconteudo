import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Search, Mail, Phone, Briefcase, IdCard, HeartPulse, Clock, UserPlus, Plug,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listarIntegracoes, listarProfiles, papelDe } from "@/data/store";
import { roleLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { ColaboradorDialog } from "@/components/ColaboradorDialog";
import { AvatarPessoa } from "@/components/AvatarPessoa";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Colaboradores() {
  const { temModulo, isGestor, isMaster, loginReal } = useAuth();
  const veDadosPessoais = temModulo("colaboradores");
  // Com o banco ligado, criar conta de acesso é ação do master (função manage-users).
  const podeCadastrar = loginReal ? isMaster : veDadosPessoais;
  const [busca, setBusca] = useState("");
  const [departamento, setDepartamento] = useState("todos");

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });

  const solides = integracoes?.find((i) => i.chave === "solides");

  const departamentos = Array.from(
    new Set((profiles ?? []).map((p) => p.departamento).filter(Boolean) as string[])
  ).sort();

  const filtrados = (profiles ?? []).filter((p) => {
    const t = busca.toLowerCase();
    const bate =
      p.nome.toLowerCase().includes(t) ||
      (p.cargo ?? "").toLowerCase().includes(t) ||
      (p.departamento ?? "").toLowerCase().includes(t);
    return bate && (departamento === "todos" || p.departamento === departamento) && p.ativo;
  });

  const carregando = profiles === undefined;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Users}
        titulo="Colaboradores"
        subtitulo={`${filtrados.length} pessoa(s) no time`}
        acao={podeCadastrar ? <ColaboradorDialog /> : undefined}
      />

      <div className="space-y-4">
        {solides && !solides.conectada && isGestor && (
          <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/10 p-4 text-sm text-muted-foreground">
            <Plug className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
            <span>
              <strong className="font-semibold text-foreground">Sólides não conectada.</strong> Ao ligar a
              integração, o ponto registrado de cada pessoa aparece aqui e na ficha individual.
              Configure em Painel Admin → Integrações.
            </span>
          </div>
        )}

        <Card>
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Buscar por nome, cargo ou departamento…"
                aria-label="Buscar colaborador"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={departamento} onValueChange={setDepartamento}>
              <SelectTrigger className="sm:w-60" aria-label="Filtrar por departamento"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os departamentos</SelectItem>
                {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {carregando ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Carregando">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <div className="space-y-2 border-t pt-4">
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <EstadoVazio
            icone={UserPlus}
            titulo={busca || departamento !== "todos" ? "Ninguém com esse filtro" : "Nenhum colaborador cadastrado"}
            descricao={
              busca || departamento !== "todos"
                ? "Ajuste a busca ou o departamento para ver outras pessoas."
                : "Cadastre a primeira pessoa do time. O acesso ao sistema e o repositório de contracheques são criados junto."
            }
            acao={podeCadastrar && !busca ? <ColaboradorDialog /> : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    <AvatarPessoa nome={p.nome} foto={p.foto_url} className="h-12 w-12 shrink-0"
                      classeIniciais="bg-primary/10 text-primary font-semibold" />
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold leading-tight text-foreground" title={p.nome}>
                        {p.nome}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.cargo ?? "—"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.departamento && (
                      <Badge variant="secondary">{p.departamento}</Badge>
                    )}
                    <Badge variant="outline">
                      {roleLabels[papelDe(p.user_id)]}
                    </Badge>
                    {p.convite_enviado_em && (
                      <Badge variant="info">Convite enviado</Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 border-t pt-4 text-sm text-muted-foreground">
                    <p className="flex min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate" title={p.email}>{p.email}</span>
                    </p>
                    {p.telefone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" aria-hidden /> {p.telefone}
                      </p>
                    )}
                    {veDadosPessoais && p.cpf && (
                      <p className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 shrink-0" aria-hidden /> {p.cpf}
                      </p>
                    )}
                    {veDadosPessoais && p.contato_emergencia_nome && (
                      <p className="flex min-w-0 items-center gap-2">
                        <HeartPulse className="h-4 w-4 shrink-0 text-destructive" aria-label="Contato de emergência" />
                        <span className="truncate">
                          {p.contato_emergencia_nome} · {p.contato_emergencia_telefone}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0" aria-hidden />
                      {p.data_admissao ? `Desde ${formatDate(p.data_admissao)}` : "Admissão não informada"}
                    </p>
                    {solides?.conectada && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-success" aria-hidden /> Ponto sincronizado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
