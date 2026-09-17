import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Search, Mail, Phone, Briefcase, IdCard, HeartPulse, Clock, UserPlus, Plug,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listarIntegracoes, listarProfiles, papelDe } from "@/data/store";
import { getInitials, roleLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { ColaboradorDialog } from "@/components/ColaboradorDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Colaboradores() {
  const { temModulo, isGestor } = useAuth();
  const podeCadastrar = temModulo("colaboradores");
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Users}
        titulo="Colaboradores"
        subtitulo={`${filtrados.length} pessoa(s) no time`}
        acao={podeCadastrar ? <ColaboradorDialog /> : undefined}
      />

      {solides && !solides.conectada && isGestor && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <Plug className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">Sólides não conectada.</strong> Ao ligar a
            integração, o ponto registrado de cada pessoa aparece aqui e na ficha individual.
            Configure em Painel Admin → Integrações.
          </span>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cargo ou departamento…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={departamento} onValueChange={setDepartamento}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os departamentos</SelectItem>
            {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5 pt-5">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {getInitials(p.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.cargo ?? "—"}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1">
                  {p.departamento && (
                    <Badge variant="secondary" className="text-[10px]">{p.departamento}</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {roleLabels[papelDe(p.user_id)]}
                  </Badge>
                  {p.convite_enviado_em && (
                    <Badge variant="info" className="text-[10px]">Convite enviado</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {p.email}
                  </p>
                  {p.telefone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {p.telefone}
                    </p>
                  )}
                  {podeCadastrar && p.cpf && (
                    <p className="flex items-center gap-2">
                      <IdCard className="h-3.5 w-3.5 shrink-0" /> {p.cpf}
                    </p>
                  )}
                  {podeCadastrar && p.contato_emergencia_nome && (
                    <p className="flex items-center gap-2 truncate">
                      <HeartPulse className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      {p.contato_emergencia_nome} · {p.contato_emergencia_telefone}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    {p.data_admissao ? `Desde ${formatDate(p.data_admissao)}` : "Admissão não informada"}
                  </p>
                  {solides?.conectada && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" /> Ponto sincronizado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
