import { Link2, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const topMetrics = [
  { label: "Domain Authority", value: "41", badge: "GOOD", badgeColor: "border-success/20 bg-success/10 text-success", icon: Shield },
  { label: "Referring Domains", value: "550", badge: "GOOD", badgeColor: "border-success/20 bg-success/10 text-success", icon: Globe },
  { label: "Backlinks", value: "15,768", badge: "GOOD", badgeColor: "border-success/20 bg-success/10 text-success", icon: Link2, sub: "NoFollow: 879" },
];

const backlinksOverTime = [
  { month: "Jul 2023", backlinks: 800, domains: 50 },
  { month: "Oct 2023", backlinks: 22000, domains: 350 },
  { month: "Jan 2024", backlinks: 21000, domains: 380 },
  { month: "Apr 2024", backlinks: 22500, domains: 400 },
  { month: "Jul 2024", backlinks: 23000, domains: 410 },
  { month: "Oct 2024", backlinks: 20000, domains: 390 },
  { month: "Jan 2025", backlinks: 24000, domains: 420 },
  { month: "Apr 2025", backlinks: 18000, domains: 370 },
  { month: "Jul 2025", backlinks: 14000, domains: 340 },
  { month: "Oct 2025", backlinks: 13500, domains: 330 },
  { month: "Jan 2026", backlinks: 14200, domains: 450 },
  { month: "Apr 2026", backlinks: 14800, domains: 471 },
  { month: "Jul 2026", backlinks: 15768, domains: 550 },
];

const CustomTooltipLine = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-md border bg-popover p-3 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

const BacklinksJulho = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Backlinks Julho</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">eseg.edu.br — Dados atualizados em Julho 2026</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {topMetrics.map((m) => (
          <div key={m.label} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-card">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-display text-2xl font-semibold text-foreground">{m.value}</span>
                {m.badge && (
                  <Badge variant="outline" className={`uppercase ${m.badgeColor}`}>{m.badge}</Badge>
                )}
              </div>
              {m.sub && <p className="mt-1 text-xs text-muted-foreground">{m.sub}</p>}
            </div>
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <m.icon className="h-4 w-4" />
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-card sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Backlinks Over Time</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={backlinksOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltipLine />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="backlinks" name="Backlinks" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              <Line yAxisId="right" type="monotone" dataKey="domains" name="Referring Domains" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--accent))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BacklinksJulho;


