import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, Megaphone, ClipboardList, GraduationCap, Pin, CalendarDays, Cake, ArrowRight,
  FileSignature, Receipt, BookMarked, Palette, Plane, UserPlus, Newspaper,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  listarCursos, listarEventos, listarPosts, listarProfiles, listarSolicitacoes,
} from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const atalhos = [
  {
    titulo: "Abrir solicitação",
    descricao: "RH, TI, Financeiro ou Facilities",
    rota: "/solicitacoes",
    icone: FileSignature,
    tom: "bg-primary/10 text-primary",
  },
  {
    titulo: "Meus contracheques",
    descricao: "Holerites e documentos pessoais",
    rota: "/contracheques",
    icone: Receipt,
    tom: "bg-accent/10 text-accent",
  },
  {
    titulo: "Relatório de viagem",
    descricao: "Lançar despesas e comprovantes",
    rota: "/viagens",
    icone: Plane,
    tom: "bg-info/10 text-info",
  },
  {
    titulo: "Manual interno",
    descricao: "Processos e combinados da empresa",
    rota: "/manual",
    icone: BookMarked,
    tom: "bg-warning/10 text-warning",
  },
  {
    titulo: "Ativos da marca",
    descricao: "Logos, brandbook e templates",
    rota: "/ativos",
    icone: Palette,
    tom: "bg-success/10 text-success",
  },
  {
    titulo: "Colaboradores",
    descricao: "Time, contatos e cadastro",
    rota: "/colaboradores",
    icone: UserPlus,
    tom: "bg-secondary text-secondary-foreground",
  },
];

function Kpi({ icone: Icone, rotulo, valor }: { icone: typeof Users; rotulo: string; valor: number | string }) {
  return (
    <Card>
      <CardContent className="p-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <Icone className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold">{valor}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: listarPosts });
  const { data: eventos } = useQuery({ queryKey: ["eventos"], queryFn: listarEventos });
  const { data: solicitacoes } = useQuery({ queryKey: ["solicitacoes"], queryFn: listarSolicitacoes });
  const { data: cursos } = useQuery({ queryKey: ["cursos"], queryFn: listarCursos });

  const carregando = !profiles || !posts || !eventos || !solicitacoes || !cursos;

  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = hoje.slice(5, 7);

  const fixados = posts?.filter((p) => p.fixado) ?? [];
  const proximos = eventos?.filter((e) => e.data >= hoje && e.tipo !== "aniversario").slice(0, 4) ?? [];
  const aniversariantes =
    profiles
      ?.filter((p) => p.data_nascimento?.slice(5, 7) === mesAtual)
      .sort((a, b) =>
        (a.data_nascimento ?? "").slice(8).localeCompare((b.data_nascimento ?? "").slice(8))
      ) ?? [];
  const abertas = solicitacoes?.filter((s) => s.status !== "concluida").length ?? 0;

  const primeiroNome = profile?.nome.split(" ")[0] ?? "";

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {saudacao()}, {primeiroNome} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está o resumo da Conteúdo Martech hoje.
        </p>
      </div>

      {carregando ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icone={Users} rotulo="Colaboradores ativos" valor={profiles.filter((p) => p.ativo).length} />
          <Kpi icone={Megaphone} rotulo="Avisos fixados" valor={fixados.length} />
          <Kpi icone={ClipboardList} rotulo="Solicitações abertas" valor={abertas} />
          <Kpi icone={GraduationCap} rotulo="Treinamentos" valor={cursos.length} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pin className="h-4 w-4 text-primary" /> Avisos fixados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fixados.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
                  <Newspaper className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm">Nenhum aviso fixado.</p>
                    <Link to="/feed" className="text-xs font-medium text-primary hover:underline">
                      Publicar o primeiro comunicado
                    </Link>
                  </div>
                </div>
              ) : (
                fixados.map((p) => {
                  const autor = profiles?.find((x) => x.user_id === p.autor_id);
                  return (
                    <div key={p.id} className="rounded-md border-l-2 border-primary bg-muted/30 p-3">
                      <p className="text-sm">{p.conteudo}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {autor?.nome} · {formatDate(p.created_at.slice(0, 10))}
                      </p>
                    </div>
                  );
                })
              )}
              <Link
                to="/feed"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver o mural completo <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atalhos rápidos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {atalhos.map(({ titulo, descricao, rota, icone: Icone, tom }) => (
                <Link
                  key={rota}
                  to={rota}
                  className="flex items-center gap-3 rounded-md border p-3 transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tom}`}>
                    <Icone className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{descricao}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" /> Próximos eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proximos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nada agendado.{" "}
                  <Link to="/calendario" className="font-medium text-primary hover:underline">
                    Abrir calendário
                  </Link>
                </p>
              ) : (
                proximos.map((e) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-muted text-center">
                      <span className="text-[10px] leading-none text-muted-foreground">
                        {new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                      <span className="text-sm font-bold leading-tight">{e.data.slice(8)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.titulo}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[9px]">{e.tipo}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cake className="h-4 w-4 text-accent" /> Aniversariantes do mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {aniversariantes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aniversário este mês.</p>
              ) : (
                aniversariantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{p.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.data_nascimento?.slice(8)}/{p.data_nascimento?.slice(5, 7)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
