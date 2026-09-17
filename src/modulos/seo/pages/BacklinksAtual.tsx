import { Link2, Globe, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";

const topMetrics = [
  { label: "Domain Authority", value: "40", badge: "GOOD", badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Shield },
  { label: "Referring Domains", value: "469", icon: Globe },
  { label: "Backlinks", value: "14,800", badge: "GOOD", badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Link2, sub: "NoFollow: 529" },
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
];

const newLostDomains = [
  { date: "Mar 10", new: 2, lost: 0 },
  { date: "Mar 11", new: 2, lost: 0 },
  { date: "Mar 12", new: 5, lost: 0 },
  { date: "Mar 13", new: 3, lost: -1 },
  { date: "Mar 14", new: 2, lost: -1 },
  { date: "Mar 16", new: 3, lost: 0 },
  { date: "Mar 17", new: 1, lost: -1 },
  { date: "Mar 18", new: 1, lost: -1 },
  { date: "Mar 19", new: 1, lost: 0 },
  { date: "Mar 20", new: 1, lost: 0 },
  { date: "Mar 22", new: 0, lost: 0 },
  { date: "Mar 25", new: 3, lost: -1 },
  { date: "Mar 28", new: 1, lost: -1 },
  { date: "Mar 31", new: 2, lost: -1 },
  { date: "Apr 04", new: 1, lost: -1 },
  { date: "Apr 07", new: 1, lost: -1 },
  { date: "Apr 10", new: 1, lost: 0 },
];

const domainsByDA = [
  { range: "1-10", count: 128 },
  { range: "11-20", count: 170 },
  { range: "21-30", count: 42 },
  { range: "31-40", count: 38 },
  { range: "41-50", count: 26 },
  { range: "51-60", count: 22 },
  { range: "61-70", count: 18 },
  { range: "71-80", count: 10 },
  { range: "81-90", count: 8 },
  { range: "91-100", count: 7 },
];

const anchorTexts = [
  { text: "eseg", backlinks: 779 },
  { text: "www.eseg.edu.br", backlinks: 31 },
  { text: "faculdade eseg", backlinks: 22 },
  { text: "eseg faculdade do grupo etapa", backlinks: 20 },
  { text: "site", backlinks: 16 },
  { text: "(sem texto)", backlinks: 15 },
];

const backlinksList = [
  { title: "best10k.com | few of top websites | page no. 291", source: "best10k.com/domain-list-291", target: "eseg.edu.br/", nofollow: true, da: 4, pa: 10, spam: 84, anchor: "eseg.edu.br", firstSeen: "01/01/2026", lastSeen: "04/04/2026" },
  { title: "sasdlc.org/business/conhec-areas-profissoes...", source: "sasdlc.org/business/...", target: "blog.eseg.edu.br/conheca-4-profissoes...", nofollow: true, da: 9, pa: 14, spam: 82, anchor: "profissões em alta conheça 12 que estão sempre e...", firstSeen: "07/28/2021", lastSeen: "07/28/2021" },
  { title: "vokal tokat mobilya como ser um bom advogado...", source: "myscape.org/como-ser-um-bom-advogado-k.html", target: "blog.eseg.edu.br/wp-content/uploads/...", nofollow: false, da: 7, pa: 13, spam: 82, anchor: "o que é preciso para ser advogado blog conexão c...", firstSeen: "04/06/2024", lastSeen: "04/06/2024" },
  { title: "pdfcrop.biz/view/ebook/...", source: "pdfcrop.biz/view/ebook/...", target: "reservada.eseg.edu.br/graduacao/biblioteca/...", nofollow: false, da: 15, pa: 15, spam: 79, anchor: "", firstSeen: "09/24/2017", lastSeen: "09/24/2017" },
  { title: "beststrollersreview.net/colegio-etapa-bolsas...", source: "beststrollersreview.net/colegio-etapa-bolsas-k.html", target: "eseg.edu.br/media/bancos/historia-etapa/...", nofollow: false, da: 13, pa: 14, spam: 79, anchor: "grupo etapa", firstSeen: "02/20/2022", lastSeen: "09/09/2022" },
  { title: "Advogado para crimes de calúnia e difamação", source: "o2multi.com/advogado-para-defesa-em-crimes...", target: "blog.eseg.edu.br/quanto-ganha-um-advogado...", nofollow: true, da: 23, pa: 17, spam: 77, anchor: "honorários advocatícios", firstSeen: "03/24/2026", lastSeen: "03/27/2026" },
  { title: "Prof. Filippo Valiante Filho - English", source: "prof.valiante.info/inicio/english", target: "eseg.edu.br/", nofollow: false, da: 8, pa: 12, spam: 77, anchor: "eseg college", firstSeen: "06/09/2025", lastSeen: "03/31/2026" },
  { title: "unitedhuntsman.com/faculdades-com-bolsas...", source: "unitedhuntsman.com/faculdades-com-bolsas...", target: "blog.eseg.edu.br/wp-content/uploads/...", nofollow: false, da: 5, pa: 13, spam: 77, anchor: "bolsas de estudo como ingressar na faculdade atra...", firstSeen: "05/30/2023", lastSeen: "05/30/2023" },
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

const BacklinksAtual = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Backlinks Atual</h1>
        <p className="text-muted-foreground text-sm mt-1">eseg.edu.br — Dados atualizados em Abril 2026</p>
      </div>

      {/* Top Metrics */}
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

      {/* Backlinks Over Time */}
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
              <Line yAxisId="left" type="monotone" dataKey="backlinks" name="Backlinks" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: "#7C3AED" }} />
              <Line yAxisId="right" type="monotone" dataKey="domains" name="Referring Domains" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3, fill: "#06B6D4" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New & Lost Referring Domains */}
      <div className="glass-card p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New & Lost Referring Domains</p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={newLostDomains}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltipLine />} />
              <Legend />
              <Bar dataKey="new" name="New" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" name="Lost" fill="#f87171" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Referring Domains by DA + Anchor Text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referring Domains by DA</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainsByDA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltipLine />} />
                <Bar dataKey="count" name="Domains" radius={[4, 4, 0, 0]}>
                  {domainsByDA.map((_, i) => (
                    <Cell key={i} fill={`hsl(${260 - i * 8}, 60%, ${50 + i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anchor Text Distribution</p>
          <div className="space-y-1">
            {anchorTexts.map((a) => (
              <div key={a.text} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/10 transition-colors">
                <span className="text-sm text-foreground">{a.text}</span>
                <span className="text-sm font-bold text-foreground">{a.backlinks.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spam Backlinks Table */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Spam Backlinks</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-3xl">
            Backlinks com alto Spam Score são links de baixa qualidade ou potencialmente tóxicos que podem prejudicar o rankeamento do site. 
            É recomendado monitorar e, se necessário, rejeitar esses links via Google Disavow Tool para proteger a autoridade do domínio.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Source & Target</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-12">NF</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-12">DA</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-12">PA</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-16">Spam</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2">Anchor Text</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-24">First Seen</th>
                <th className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 px-2 w-24">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {backlinksList.map((bl, i) => (
                <tr key={i} className={`border-b border-border/10 hover:bg-muted/5 transition-colors ${bl.spam >= 80 ? "bg-red-500/5" : ""}`}>
                  <td className="py-3 px-2">
                    <p className="font-medium text-foreground text-xs">{bl.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Source: {bl.source}</p>
                    <p className="text-[10px] text-muted-foreground">Target: {bl.target}</p>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {bl.nofollow && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-400">NF</span>}
                  </td>
                  <td className="py-3 px-2 text-center text-foreground">{bl.da}</td>
                  <td className="py-3 px-2 text-center text-foreground">{bl.pa}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-xs font-semibold ${bl.spam >= 80 ? "text-red-400" : bl.spam >= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {bl.spam}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-muted-foreground max-w-[200px] truncate">{bl.anchor || "—"}</td>
                  <td className="py-3 px-2 text-center text-xs text-muted-foreground">{bl.firstSeen}</td>
                  <td className="py-3 px-2 text-center text-xs text-muted-foreground">{bl.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BacklinksAtual;


