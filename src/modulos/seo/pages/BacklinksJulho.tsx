import { Link2, Globe, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const topMetrics = [
  { label: "Domain Authority", value: "41", badge: "GOOD", badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Shield },
  { label: "Referring Domains", value: "550", badge: "GOOD", badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Globe },
  { label: "Backlinks", value: "15,768", badge: "GOOD", badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Link2, sub: "NoFollow: 879" },
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
    <div className="glass-card p-3 text-xs border border-border/30">
      <p className="font-semibold text-foreground mb-1">{label}</p>
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
        <h1 className="text-2xl font-bold gradient-text">Backlinks Julho</h1>
        <p className="text-muted-foreground text-sm mt-1">eseg.edu.br — Dados atualizados em Julho 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topMetrics.map((m) => (
          <div key={m.label} className="glass-card-hover p-5 space-y-2">
            <div className="flex items-center gap-2">
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{m.value}</span>
              {m.badge && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${m.badgeColor}`}>{m.badge}</span>
              )}
            </div>
            {m.sub && <p className="text-xs text-muted-foreground">{m.sub}</p>}
          </div>
        ))}
      </div>

      <div className="glass-card p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backlinks Over Time</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={backlinksOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltipLine />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="backlinks" name="Backlinks" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: "#f87171" }} />
              <Line yAxisId="right" type="monotone" dataKey="domains" name="Referring Domains" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: "#fbbf24" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BacklinksJulho;


