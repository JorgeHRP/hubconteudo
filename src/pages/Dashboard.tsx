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
import { EsqueletoIndicadores } from "@/components/Esqueletos";

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
  },
  {
    titulo: "Meus contracheques",
    descricao: "Holerites e documentos pessoais",
    rota: "/contracheques",
    icone: Receipt,
  },
  {
    titulo: "Relatório de viagem",
    descricao: "Lançar despesas e comprovantes",
    rota: "/viagens",
    icone: Plane,
  },
  {
    titulo: "Manual interno",
    descricao: "Processos e combinados da empresa",
    rota: "/manual",
    icone: BookMarked,
  },
  {
    titulo: "Ativos da marca",
    descricao: "Logos, brandbook e templates",
    rota: "/ativos",
    icone: Palette,
  },
  {
    titulo: "Colaboradores",
    descricao: "Time, contatos e cadastro",
    rota: "/colaboradores",
    icone: UserPlus,
  },
];

const linkDiscreto =
  "rounded-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Kpi({ icone: Icone, rotulo, valor }: { icone: typeof Users; rotulo: string; valor: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold leading-none">{valor}</p>
        </div>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Icone className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}

/** Linhas de espera para as listas dos cartões, enquanto os dados chegam. */
function LinhasEspera({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="divide-y border-t" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="space-y-2 px-5 py-3">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
    </div>
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
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
          {saudacao()}, {primeiroNome} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está o resumo da Conteúdo Martech hoje.
        </p>
      </div>

      {carregando ? (
        <EsqueletoIndicadores />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icone={Users} rotulo="Colaboradores ativos" valor={profiles.filter((p) => p.ativo).length} />
          <Kpi icone={Megaphone} rotulo="Avisos fixados" valor={fixados.length} />
          <Kpi icone={ClipboardList} rotulo="Solicitações abertas" valor={abertas} />
          <Kpi icone={GraduationCap} rotulo="Treinamentos" valor={cursos.length} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pin className="h-4 w-4 text-accent" aria-hidden /> Avisos fixados
              </CardTitle>
              <Link to="/feed" className={`inline-flex items-center gap-1 text-xs ${linkDiscreto}`}>
                Ver o mural completo <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </CardHeader>
            {!posts ? (
              <LinhasEspera linhas={2} />
            ) : fixados.length === 0 ? (
              <div className="flex items-center gap-3 border-t px-5 py-4">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                >
                  <Newspaper className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm">Nenhum aviso fixado.</p>
                  <Link to="/feed" className={`text-xs ${linkDiscreto}`}>
                    Publicar o primeiro comunicado
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y border-t">
                {fixados.map((p) => {
                  const autor = profiles?.find((x) => x.user_id === p.autor_id);
                  return (
                    <li key={p.id} className="px-5 py-3">
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{p.conteudo}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {autor?.nome} · {formatDate(p.created_at.slice(0, 10))}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Atalhos rápidos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {atalhos.map(({ titulo, descricao, rota, icone: Icone }) => (
                <Link
                  key={rota}
                  to={rota}
                  className="group flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  >
                    <Icone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{descricao}</p>
                  </div>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-accent"
                  />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-accent" aria-hidden /> Próximos eventos
              </CardTitle>
            </CardHeader>
            {!eventos ? (
              <LinhasEspera />
            ) : proximos.length === 0 ? (
              <p className="border-t px-5 py-4 text-sm text-muted-foreground">
                Nada agendado.{" "}
                <Link to="/calendario" className={linkDiscreto}>
                  Abrir calendário
                </Link>
              </p>
            ) : (
              <ul className="divide-y border-t">
                {proximos.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-muted text-center">
                      <span className="text-xs leading-none text-muted-foreground">
                        {new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                      <span className="mt-0.5 font-display text-sm font-semibold leading-none">
                        {e.data.slice(8)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.titulo}</p>
                      <Badge variant="secondary" className="mt-1 capitalize">{e.tipo}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cake className="h-4 w-4 text-accent" aria-hidden /> Aniversariantes do mês
              </CardTitle>
            </CardHeader>
            {!profiles ? (
              <LinhasEspera />
            ) : aniversariantes.length === 0 ? (
              <p className="border-t px-5 py-4 text-sm text-muted-foreground">Nenhum aniversário este mês.</p>
            ) : (
              <ul className="divide-y border-t">
                {aniversariantes.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="truncate">{p.nome}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {p.data_nascimento?.slice(8)}/{p.data_nascimento?.slice(5, 7)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
