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
  if (status === "good") return "text-emerald-600";
  if (status === "needs-improvement") return "text-amber-500";
  return "text-red-500";
};

const getVitalBg = (status: string) => {
  if (status === "good") return "bg-emerald-100";
  if (status === "needs-improvement") return "bg-amber-100";
  return "bg-red-100";
};

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
        <h1 className="text-2xl font-bold gradient-text">Visão Geral do Projeto</h1>
        <p className="text-muted-foreground text-sm mt-1">Dashboard SEO — Faculdade ESEG</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Palavras-chave" value="12" subtitle="Rastreadas" icon={KeyRound} trend={{ value: 15, positive: true }} delay={0} />
        <StatCard title="Artigos" value="4" subtitle="Publicados" icon={FileText} trend={{ value: 33, positive: true }} delay={1} />
        <StatCard title="Backlinks" value="6" subtitle="Ativos" icon={Link2} trend={{ value: 20, positive: true }} delay={2} />
        <StatCard title="Posição Média" value="10.2" subtitle="Google" icon={TrendingUp} trend={{ value: 25, positive: true }} delay={3} />
      </div>

      {/* Status das Pautas (tempo real) */}
      <div className="glass-card p-6 animate-fade-in-up-delay-1">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Status das Pautas</h3>
              <p className="text-xs text-muted-foreground">Atualizado em tempo real entre todos os usuários</p>
            </div>
          </div>
          <Link to="/pautas" className="text-xs text-eseg-blue hover:underline">Ver detalhes →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <p className="text-3xl font-bold text-foreground">{pautasStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-50">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-1">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">{pautasStats.aprovadas}</p>
            <p className="text-xs text-muted-foreground mt-1">Aprovadas</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-1">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{pautasStats.negadas}</p>
            <p className="text-xs text-muted-foreground mt-1">Negadas</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-1">
              <Wrench className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{pautasStats.internas}</p>
            <p className="text-xs text-muted-foreground mt-1">Fazer Interno</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/30">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-muted-foreground">{pautasStats.pendentes}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="glass-card p-6 animate-fade-in-up-delay-1">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg" style={{ background: "var(--gradient-accent)" }}>
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Core Web Vitals</h3>
            <p className="text-xs text-muted-foreground">Métricas de performance — eseg.edu.br</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {coreWebVitals.map((vital) => {
            const pct = Math.min((vital.value / vital.target) * 100, 100);
            return (
              <div key={vital.name} className="text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${getVitalBg(vital.status)} mb-3`}>
                  <span className={`text-lg font-bold ${getVitalColor(vital.status)}`}>
                    {vital.value}{vital.unit && <span className="text-xs ml-0.5">{vital.unit}</span>}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{vital.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{vital.label}</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${vital.status === "good" ? "bg-emerald-500" : vital.status === "needs-improvement" ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground/60 mt-1">Meta: {vital.target}{vital.unit}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 animate-fade-in-up-delay-1">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Tráfego Orgânico</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="organic" fill="hsl(var(--eseg-blue))" radius={[6, 6, 0, 0]} name="Orgânico" />
              <Bar dataKey="direct" fill="hsl(var(--eseg-cyan))" radius={[6, 6, 0, 0]} name="Direto" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 animate-fade-in-up-delay-2">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Evolução de Posição Média</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={positionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis reversed fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Line type="monotone" dataKey="position" stroke="hsl(var(--eseg-navy))" strokeWidth={3} dot={{ fill: "hsl(var(--eseg-blue))", r: 5 }} name="Posição" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="glass-card p-6 animate-fade-in-up-delay-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Quick Wins</h3>
              <p className="text-xs text-muted-foreground">Keywords na posição 11-20 com maior potencial</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickWins.map((kw) => (
              <div key={kw.cluster + kw.targetPage} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all hover:translate-y-[-2px] cursor-default">
                <div className="flex items-start justify-between mb-2">
                  <span className="badge-pending">#{kw.position}</span>
                  <span className="text-xs text-muted-foreground">{kw.parentTopic}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{kw.cluster}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-sm font-bold text-foreground">{kw.volume.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dificuldade</p>
                    <p className="text-sm font-bold text-foreground">{kw.difficulty}</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs text-muted-foreground">Potencial</p>
                    <p className="text-sm font-bold text-emerald-600">↑ Top 10</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 animate-fade-in-up-delay-2">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Progresso do Projeto</h3>
          <div className="space-y-4">
            {projectProgress.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.task}</span>
                  <span className="text-muted-foreground">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 animate-fade-in-up-delay-3">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Últimas Atualizações</h3>
          <div className="space-y-4">
            {recentUpdates.map((update, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-lg h-fit" style={{ background: "var(--gradient-accent)" }}>
                  <Eye className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{update.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{update.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{update.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;


