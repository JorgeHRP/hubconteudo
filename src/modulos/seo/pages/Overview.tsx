import { KeyRound, FileText, Link2, TrendingUp, Eye, Zap, Target, CheckCircle, XCircle, Wrench, Clock } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import { projectProgress, recentUpdates, keywordsData } from "@/modulos/seo/data/sampleData";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { type Pauta, STORAGE_KEY as PAUTAS_KEY } from "@/modulos/seo/data/pautasData";
import { Link } from "react-router-dom";

const trafficData = [
  { month: "Out", organic: 1200, direct: 800 },
  { month: "Nov", organic: 1450, direct: 850 },
  { month: "Dez", organic: 1380, direct: 900 },
  { month: "Jan", organic: 1600, direct: 920 },
  { month: "Fev", organic: 1850, direct: 950 },
  { month: "Mar", organic: 2100, direct: 980 },
  { month: "Abr", organic: 2400, direct: 1050 },
];

const positionData = [
  { month: "Out", position: 28 },
  { month: "Nov", position: 24 },
  { month: "Dez", position: 22 },
  { month: "Jan", position: 18 },
  { month: "Fev", position: 15 },
  { month: "Mar", position: 12 },
  { month: "Abr", position: 10 },
];

const coreWebVitals = [
  { name: "LCP", value: 2.1, unit: "s", target: 2.5, status: "good" as const, label: "Largest Contentful Paint" },
  { name: "INP", value: 180, unit: "ms", target: 200, status: "good" as const, label: "Interaction to Next Paint" },
  { name: "CLS", value: 0.08, unit: "", target: 0.1, status: "good" as const, label: "Cumulative Layout Shift" },
  { name: "FCP", value: 1.4, unit: "s", target: 1.8, status: "good" as const, label: "First Contentful Paint" },
  { name: "TTFB", value: 620, unit: "ms", target: 800, status: "good" as const, label: "Time to First Byte" },
  { name: "Speed Index", value: 3.2, unit: "s", target: 3.4, status: "needs-improvement" as const, label: "Speed Index" },
];

const getVitalColor = (status: string) => {
  if (status === "good") return "text-success";
  if (status === "needs-improvement") return "text-warning-strong";
  return "text-destructive";
};

const getVitalBg = (status: string) => {
  if (status === "good") return "bg-success/10";
  if (status === "needs-improvement") return "bg-warning/15";
  return "bg-destructive/10";
};

const cartao = "rounded-lg border bg-card p-5 text-card-foreground shadow-card";
const tituloCartao = "font-display text-base font-semibold text-foreground";
const chipIcone = "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary";

const quickWins = keywordsData
  .filter(kw => kw.position >= 11 && kw.position <= 20)
  .sort((a, b) => b.volume - a.volume);

const Overview = () => {
  const { value: pautas } = useSharedData<Pauta[] | null>(PAUTAS_KEY, null);
  const pautasArr = Array.isArray(pautas) ? pautas : [];
  const pautasStats = {
    total: pautasArr.length,
    aprovadas: pautasArr.filter(p => p.status === "Pauta Aprovada").length,
    negadas: pautasArr.filter(p => p.status === "Negada").length,
    internas: pautasArr.filter(p => p.status === "Fazer Internamente").length,
    pendentes: pautasArr.filter(p => p.status === "Pendente").length,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Visão Geral do Projeto</h2>
        <p className="text-muted-foreground text-sm mt-1">Dashboard SEO — Faculdade ESEG</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Palavras-chave" value="12" subtitle="Rastreadas" icon={KeyRound} trend={{ value: 15, positive: true }} delay={0} />
        <StatCard title="Artigos" value="4" subtitle="Publicados" icon={FileText} trend={{ value: 33, positive: true }} delay={1} />
        <StatCard title="Backlinks" value="6" subtitle="Ativos" icon={Link2} trend={{ value: 20, positive: true }} delay={2} />
        <StatCard title="Posição Média" value="10.2" subtitle="Google" icon={TrendingUp} trend={{ value: 25, positive: true }} delay={3} />
      </div>

      {/* Status das Pautas (tempo real) */}
      <div className={cartao}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className={chipIcone}>
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className={tituloCartao}>Status das Pautas</h3>
              <p className="text-xs text-muted-foreground">Atualizado em tempo real entre todos os usuários</p>
            </div>
          </div>
          <Link
            to="/pautas"
            className="rounded-sm text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Ver detalhes →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">Total</p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-foreground">{pautasStats.total}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-success" aria-hidden /> Aprovadas
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-success">{pautasStats.aprovadas}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden /> Negadas
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-destructive">{pautasStats.negadas}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 text-warning-strong" aria-hidden /> Fazer Interno
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-warning-strong">{pautasStats.internas}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden /> Pendentes
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-muted-foreground">{pautasStats.pendentes}</p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className={cartao}>
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden className={chipIcone}>
            <Zap className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className={tituloCartao}>Core Web Vitals</h3>
            <p className="text-xs text-muted-foreground">Métricas de performance — eseg.edu.br</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {coreWebVitals.map((vital) => {
            const pct = Math.min((vital.value / vital.target) * 100, 100);
            return (
              <div key={vital.name} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{vital.name}</p>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${getVitalBg(vital.status)}`} aria-hidden>
                    <span className={`h-2 w-2 rounded-full ${vital.status === "good" ? "bg-success" : vital.status === "needs-improvement" ? "bg-warning" : "bg-destructive"}`} />
                  </span>
                </div>
                <p className={`mt-1.5 font-display text-2xl font-semibold leading-none ${getVitalColor(vital.status)}`}>
                  {vital.value}{vital.unit && <span className="ml-0.5 text-xs">{vital.unit}</span>}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{vital.label}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${vital.status === "good" ? "bg-success" : vital.status === "needs-improvement" ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Meta: {vital.target}{vital.unit}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${cartao} min-w-0`}>
          <h3 className={`${tituloCartao} mb-4`}>Tráfego Orgânico</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 }} />
              <Bar dataKey="organic" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Orgânico" />
              <Bar dataKey="direct" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} name="Direto" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${cartao} min-w-0`}>
          <h3 className={`${tituloCartao} mb-4`}>Evolução de Posição Média</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={positionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis reversed fontSize={12} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 }} />
              <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} name="Posição" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className={cartao}>
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className={chipIcone}>
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className={tituloCartao}>Quick Wins</h3>
              <p className="text-xs text-muted-foreground">Keywords na posição 11-20 com maior potencial</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((kw) => (
              <div key={kw.cluster + kw.targetPage} className="rounded-md border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="inline-flex items-center rounded-md border border-warning/30 bg-warning/15 px-2 py-0.5 text-xs font-medium tabular-nums text-warning-strong">#{kw.position}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">{kw.parentTopic}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{kw.cluster}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">{kw.volume.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dificuldade</p>
                    <p className="text-sm font-semibold text-foreground">{kw.difficulty}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Potencial</p>
                    <p className="text-sm font-semibold text-success">↑ Top 10</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cartao}>
          <h3 className={`${tituloCartao} mb-4`}>Progresso do Projeto</h3>
          <div className="space-y-4">
            {projectProgress.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{item.task}</span>
                  <span className="tabular-nums text-muted-foreground">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className={cartao}>
          <h3 className={`${tituloCartao} mb-1`}>Últimas Atualizações</h3>
          <ul className="divide-y">
            {recentUpdates.map((update, i) => (
              <li key={i} className="flex gap-3 py-3 last:pb-0">
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Eye className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{update.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{update.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{update.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Overview;


