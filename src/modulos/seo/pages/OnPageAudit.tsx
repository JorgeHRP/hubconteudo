import { useState } from "react";
import { Monitor, Smartphone, AlertTriangle, Globe, Link2, KeyRound, Search, Timer, MousePointerClick, Move, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

interface SpeedMetric {
  label: string;
  value: string;
  unit: string;
  status: "good" | "needs-improvement" | "poor";
  description: string;
  max: number;
  current: number;
}

interface AuditDataset {
  crawlDate: string;
  topMetrics: { label: string; value: string; badge: string; badgeColor: string; icon: any }[];
  pageStatus: { label: string; value: number; color: string }[];
  totalPages: number;
  issuesDiscovered: number;
  seoIssues: { priority: number; pages: number; issue: string }[];
  desktopSpeed: SpeedMetric[];
  mobileSpeed: SpeedMetric[];
}

const badgeGreat = "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";

const aprilData: AuditDataset = {
  crawlDate: "April 07, 2026",
  topMetrics: [
    { label: "On-Page SEO Score", value: "72", badge: "GREAT", badgeColor: badgeGreat, icon: Search },
    { label: "Organic Monthly Traffic", value: "4,606", badge: "GREAT", badgeColor: badgeGreat, icon: Globe },
    { label: "Organic Keywords", value: "279", badge: "GREAT", badgeColor: badgeGreat, icon: KeyRound },
    { label: "Backlinks", value: "14,800", badge: "GREAT", badgeColor: badgeGreat, icon: Link2 },
  ],
  pageStatus: [
    { label: "Successful", value: 2875, color: "bg-emerald-400" },
    { label: "Redirected", value: 2053, color: "bg-cyan-400" },
    { label: "Broken", value: 72, color: "bg-amber-400" },
    { label: "Blocked", value: 0, color: "bg-red-400" },
  ],
  totalPages: 5000,
  issuesDiscovered: 6988,
  seoIssues: [
    { priority: 1, pages: 665, issue: "have multiple meta description tags" },
    { priority: 2, pages: 1185, issue: "with broken links" },
    { priority: 3, pages: 127, issue: "have a low word count" },
    { priority: 4, pages: 1105, issue: "with duplicate <title> tags" },
    { priority: 5, pages: 329, issue: "with duplicate meta descriptions" },
    { priority: 6, pages: 144, issue: "without a H1 heading" },
    { priority: 7, pages: 843, issue: "with a long loading time" },
    { priority: 8, pages: 1, issue: "with no content compression enabled" },
    { priority: 9, pages: 71, issue: "returned 4XX status code" },
    { priority: 10, pages: 988, issue: "with no meta description" },
  ],
  desktopSpeed: [
    { label: "Load Time", value: "3.56", unit: "s", status: "needs-improvement", description: "Tempo de carregamento do conteúdo principal. Ideal: < 2.5s", max: 10, current: 3.56 },
    { label: "Interactivity", value: "1,912.96", unit: "ms", status: "poor", description: "Tempo de bloqueio para interação do usuário. Ideal: < 200ms", max: 2000, current: 1912.96 },
    { label: "Visual Stability", value: "0.42", unit: "", status: "poor", description: "Estabilidade visual durante carregamento. Ideal: < 0.1", max: 1, current: 0.42 },
  ],
  mobileSpeed: [
    { label: "Load Time", value: "78.91", unit: "s", status: "poor", description: "Tempo de carregamento do conteúdo principal. Ideal: < 2.5s", max: 10, current: 10 },
    { label: "Interactivity", value: "1,196.00", unit: "ms", status: "poor", description: "Tempo de bloqueio para interação do usuário. Ideal: < 200ms", max: 2000, current: 1196 },
    { label: "Visual Stability", value: "0.16", unit: "", status: "needs-improvement", description: "Estabilidade visual durante carregamento. Ideal: < 0.1", max: 1, current: 0.16 },
  ],
};

const juneData: AuditDataset = {
  crawlDate: "July 21, 2026",
  topMetrics: [
    { label: "On-Page SEO Score", value: "80", badge: "GREAT", badgeColor: badgeGreat, icon: Search },
    { label: "Organic Monthly Traffic", value: "6,922", badge: "GREAT", badgeColor: badgeGreat, icon: Globe },
    { label: "Organic Keywords", value: "813", badge: "GREAT", badgeColor: badgeGreat, icon: KeyRound },
    { label: "Backlinks", value: "15,768", badge: "GREAT", badgeColor: badgeGreat, icon: Link2 },
  ],
  pageStatus: [
    { label: "Successful", value: 3897, color: "bg-emerald-400" },
    { label: "Redirected", value: 1103, color: "bg-cyan-400" },
    { label: "Broken", value: 0, color: "bg-amber-400" },
    { label: "Blocked", value: 0, color: "bg-red-400" },
  ],
  totalPages: 5000,
  issuesDiscovered: 6404,
  seoIssues: [
    { priority: 1, pages: 216, issue: "with duplicate <title> tags" },
    { priority: 2, pages: 54, issue: "with duplicate meta descriptions" },
    { priority: 3, pages: 1, issue: "have a low word count" },
  ],
  desktopSpeed: [
    { label: "Load Time", value: "0.93", unit: "s", status: "good", description: "Tempo de carregamento do conteúdo principal. Ideal: < 2.5s", max: 10, current: 0.93 },
    { label: "Interactivity", value: "734.50", unit: "ms", status: "poor", description: "Tempo de bloqueio para interação do usuário. Ideal: < 200ms", max: 2000, current: 734.5 },
    { label: "Visual Stability", value: "0.23", unit: "", status: "needs-improvement", description: "Estabilidade visual durante carregamento. Ideal: < 0.1", max: 1, current: 0.23 },
  ],
  mobileSpeed: [
    { label: "Load Time", value: "4.89", unit: "s", status: "poor", description: "Tempo de carregamento do conteúdo principal. Ideal: < 2.5s", max: 10, current: 4.89 },
    { label: "Interactivity", value: "3,718.49", unit: "ms", status: "poor", description: "Tempo de bloqueio para interação do usuário. Ideal: < 200ms", max: 2000, current: 2000 },
    { label: "Visual Stability", value: "0.00", unit: "", status: "good", description: "Estabilidade visual durante carregamento. Ideal: < 0.1", max: 1, current: 0 },
  ],
};

const statusColors: Record<string, string> = {
  good: "text-emerald-400",
  "needs-improvement": "text-amber-400",
  poor: "text-red-400",
};
const statusLabels: Record<string, string> = { good: "BOM", "needs-improvement": "MELHORAR", poor: "RUIM" };
const statusBadge: Record<string, string> = {
  good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  "needs-improvement": "border-amber-400/30 bg-amber-400/10 text-amber-400",
  poor: "border-red-400/30 bg-red-400/10 text-red-400",
};

const SpeedBar = ({ metric }: { metric: SpeedMetric }) => {
  const pct = Math.min((metric.current / metric.max) * 100, 100);
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {metric.label === "Load Time" && <Timer className="h-4 w-4" />}
        {metric.label === "Interactivity" && <MousePointerClick className="h-4 w-4" />}
        {metric.label === "Visual Stability" && <Move className="h-4 w-4" />}
        {metric.label}
      </div>
      <p className="text-xs text-muted-foreground/70">{metric.description}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${statusColors[metric.status]}`}>{metric.value}</span>
        <span className="text-sm text-muted-foreground">{metric.unit}</span>
        <span className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadge[metric.status]}`}>
          {statusLabels[metric.status]}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: metric.status === "good" ? "hsl(160, 84%, 39%)" : metric.status === "needs-improvement" ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
          }}
        />
      </div>
    </div>
  );
};

const AuditReport = ({ data }: { data: AuditDataset }) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const speedData = device === "desktop" ? data.desktopSpeed : data.mobileSpeed;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">eseg.edu.br — Last Crawl: {data.crawlDate}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.topMetrics.map((m) => (
          <div key={m.label} className="glass-card-hover p-5 space-y-2">
            <div className="flex items-center gap-2">
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{m.value}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${m.badgeColor}`}>{m.badge}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Pages Crawled</p>
            <p className="text-4xl font-bold text-foreground">{data.totalPages.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              We've crawled <strong>{data.totalPages.toLocaleString()}</strong> pages and found <strong>0</strong> blocked pages.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Page Status</p>
            <div className="space-y-3">
              {data.pageStatus.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${s.color}`} />
                    <span className="text-sm text-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mt-4 bg-muted/20">
              {data.pageStatus.filter(s => s.value > 0).map((s) => (
                <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${(s.value / data.totalPages) * 100}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">SEO Issues Discovered</p>
            <p className="text-4xl font-bold text-foreground">{data.issuesDiscovered.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Top SEO Issues</p>
            <div className="space-y-1">
              {data.seoIssues.slice(0, 5).map((issue) => (
                <div key={issue.priority} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{issue.priority}</span>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm">
                      <strong style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {issue.pages} pages
                      </strong>{" "}
                      <span className="text-muted-foreground">{issue.issue}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Site Speed</p>
            <p className="text-xs text-muted-foreground/70 max-w-2xl">
              Velocidade e experiência do usuário são cruciais para SEO. Baseado em dados reais dos últimos 28 dias.
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/20">
            <button onClick={() => setDevice("desktop")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${device === "desktop" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button onClick={() => setDevice("mobile")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${device === "mobile" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {speedData.map((m) => <SpeedBar key={m.label} metric={m} />)}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All SEO Issues</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-20">Priority</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-24">Type</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Opportunity</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-24">Pages</th>
              </tr>
            </thead>
            <tbody>
              {data.seoIssues.map((issue) => (
                <tr key={issue.priority} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                  <td className="py-3.5 px-2"><span className="text-sm font-bold text-foreground">{issue.priority}</span></td>
                  <td className="py-3.5 px-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-400">SEO Issue</span>
                  </td>
                  <td className="py-3.5 px-2"><span className="text-sm text-foreground">{issue.issue}</span></td>
                  <td className="py-3.5 px-2 text-right">
                    <span className="text-sm font-bold" style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {issue.pages.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---- Antes vs Depois ----
interface CompareRow {
  label: string;
  before: number;
  after: number;
  format?: (n: number) => string;
  higherIsBetter: boolean;
  unit?: string;
}

const fmtInt = (n: number) => n.toLocaleString();
const fmtDec = (n: number) => n.toFixed(2);

const compareMetrics: CompareRow[] = [
  { label: "On-Page SEO Score", before: 72, after: 80, format: fmtInt, higherIsBetter: true },
  { label: "Organic Monthly Traffic", before: 4606, after: 6922, format: fmtInt, higherIsBetter: true },
  { label: "Organic Keywords", before: 279, after: 813, format: fmtInt, higherIsBetter: true },
  { label: "Backlinks", before: 14800, after: 15768, format: fmtInt, higherIsBetter: true },
  { label: "Successful Pages", before: 2875, after: 3897, format: fmtInt, higherIsBetter: true },
  { label: "Broken Pages", before: 72, after: 0, format: fmtInt, higherIsBetter: false },
  { label: "SEO Issues Discovered", before: 6988, after: 6404, format: fmtInt, higherIsBetter: false },
  { label: "Desktop Load Time", before: 3.56, after: 0.93, format: fmtDec, higherIsBetter: false, unit: "s" },
  { label: "Desktop Interactivity", before: 1912.96, after: 734.5, format: fmtDec, higherIsBetter: false, unit: "ms" },
  { label: "Desktop Visual Stability", before: 0.42, after: 0.23, format: fmtDec, higherIsBetter: false, unit: "" },
  { label: "Mobile Load Time", before: 78.91, after: 4.89, format: fmtDec, higherIsBetter: false, unit: "s" },
  { label: "Mobile Interactivity", before: 1196, after: 3718.49, format: fmtDec, higherIsBetter: false, unit: "ms" },
  { label: "Mobile Visual Stability", before: 0.16, after: 0.0, format: fmtDec, higherIsBetter: false, unit: "" },
];

const CompareView = () => {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Comparativo entre o crawl de <strong>Abril/2026</strong> e <strong>Junho/2026</strong>.
      </p>

      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Métrica</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Antes (Abr)</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Depois (Jun)</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-32">Variação</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-24">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {compareMetrics.map((row) => {
                const fmt = row.format ?? fmtInt;
                const diff = row.after - row.before;
                const pct = row.before === 0 ? 0 : (diff / row.before) * 100;
                const improved = row.higherIsBetter ? diff > 0 : diff < 0;
                const unchanged = diff === 0;
                const color = unchanged ? "text-muted-foreground" : improved ? "text-emerald-400" : "text-red-400";
                const Icon = unchanged ? Minus : improved ? TrendingUp : TrendingDown;
                const badge = unchanged
                  ? "border-muted-foreground/30 bg-muted/10 text-muted-foreground"
                  : improved
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  : "border-red-400/30 bg-red-400/10 text-red-400";
                const label = unchanged ? "IGUAL" : improved ? "MELHOROU" : "PIOROU";
                return (
                  <tr key={row.label} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                    <td className="py-3.5 px-2 text-sm text-foreground">
                      {row.label}
                      {row.label === "Mobile Interactivity" && (
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-md">
                          Ajustes realizados, mas as plataformas demoram até 28 dias para considerar essa otimização.
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right text-sm text-muted-foreground tabular-nums">
                      {fmt(row.before)}{row.unit ? ` ${row.unit}` : ""}
                    </td>
                    <td className="py-3.5 px-2 text-right text-sm font-semibold text-foreground tabular-nums">
                      {fmt(row.after)}{row.unit ? ` ${row.unit}` : ""}
                    </td>
                    <td className={`py-3.5 px-2 text-right text-sm font-bold tabular-nums ${color}`}>
                      <div className="flex items-center justify-end gap-1">
                        <Icon className="h-3.5 w-3.5" />
                        {diff > 0 ? "+" : ""}{fmt(diff)} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${badge}`}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destaque</p>
          <p className="text-lg font-bold text-emerald-400">+191% em keywords orgânicas</p>
          <p className="text-xs text-muted-foreground">De 279 para 813 palavras-chave rankeadas.</p>
        </div>
        <div className="glass-card p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destaque</p>
          <p className="text-lg font-bold text-emerald-400">+50% em tráfego orgânico</p>
          <p className="text-xs text-muted-foreground">De 4.606 para 6.922 visitantes/mês.</p>
        </div>
        <div className="glass-card p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destaque</p>
          <p className="text-lg font-bold text-emerald-400">Zero páginas quebradas</p>
          <p className="text-xs text-muted-foreground">De 72 páginas com erro para 0.</p>
        </div>
      </div>
    </div>
  );
};

const OnPageAudit = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Auditoria On-Page"
        descricao="Comparativo técnico das páginas"
        oQueEntraAqui="Aqui entram os dados da auditoria técnica deste site."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">SEO On-Page Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">Relatórios de auditoria comparativos por período</p>
      </div>

      <Tabs defaultValue="june" className="space-y-6">
        <TabsList>
          <TabsTrigger value="april">Abril 2026</TabsTrigger>
          <TabsTrigger value="june">Junho 2026</TabsTrigger>
          <TabsTrigger value="compare">Antes vs Depois</TabsTrigger>
        </TabsList>

        <TabsContent value="april"><AuditReport data={aprilData} /></TabsContent>
        <TabsContent value="june"><AuditReport data={juneData} /></TabsContent>
        <TabsContent value="compare"><CompareView /></TabsContent>
      </Tabs>
    </div>
  );
};

export default OnPageAudit;


