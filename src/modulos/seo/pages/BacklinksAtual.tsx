import { Link2, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";

const topMetrics = [
  { label: "Domain Authority", value: "40", badge: "GOOD", badgeColor: "border-success/20 bg-success/10 text-success", icon: Shield },
  { label: "Referring Domains", value: "469", icon: Globe },
  { label: "Backlinks", value: "14,800", badge: "GOOD", badgeColor: "border-success/20 bg-success/10 text-success", icon: Link2, sub: "NoFollow: 529" },
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
    <div className="rounded-md border bg-popover p-3 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
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
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Backlinks Atual</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">eseg.edu.br — Dados atualizados em Abril 2026</p>
      </div>

      {/* Top Metrics */}
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

      {/* Backlinks Over Time */}
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

      {/* New & Lost Referring Domains */}
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-card sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New & Lost Referring Domains</p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={newLostDomains}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltipLine />} />
              <Legend />
              <Bar dataKey="new" name="New" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="lost" name="Lost" fill="hsl(var(--destructive))" radius={[0, 0, 3, 3]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Referring Domains by DA + Anchor Text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4 rounded-lg border bg-card p-4 shadow-card sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referring Domains by DA</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainsByDA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltipLine />} />
                <Bar dataKey="count" name="Domains" radius={[3, 3, 0, 0]}>
                  {domainsByDA.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--primary))" fillOpacity={1 - i * 0.06} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-card sm:p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anchor Text Distribution</p>
          <div className="divide-y">
            {anchorTexts.map((a) => (
              <div key={a.text} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 break-words text-sm text-foreground">{a.text}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{a.backlinks.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spam Backlinks Table */}
      <Card className="overflow-hidden">
        <div className="border-b px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spam Backlinks</p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Backlinks com alto Spam Score são links de baixa qualidade ou potencialmente tóxicos que podem prejudicar o rankeamento do site. 
            É recomendado monitorar e, se necessário, rejeitar esses links via Google Disavow Tool para proteger a autoridade do domínio.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Source & Target</TableHead>
                <TableHead className="w-12 text-center">NF</TableHead>
                <TableHead className="w-12 text-center">DA</TableHead>
                <TableHead className="w-12 text-center">PA</TableHead>
                <TableHead className="w-16 text-center">Spam</TableHead>
                <TableHead>Anchor Text</TableHead>
                <TableHead className="w-24 whitespace-nowrap text-center">First Seen</TableHead>
                <TableHead className="w-24 whitespace-nowrap text-center">Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlinksList.map((bl, i) => (
                <TableRow key={i} className={`transition-colors ${bl.spam >= 80 ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-muted/50"}`}>
                  <TableCell className="max-w-[320px]">
                    <p className="text-sm font-medium text-foreground">{bl.title}</p>
                    <p className="mt-0.5 break-all text-xs text-muted-foreground">Source: {bl.source}</p>
                    <p className="break-all text-xs text-muted-foreground">Target: {bl.target}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    {bl.nofollow && <Badge variant="warning" className="px-1.5">NF</Badge>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">{bl.da}</TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">{bl.pa}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold tabular-nums ${bl.spam >= 80 ? "text-destructive" : bl.spam >= 60 ? "text-warning-strong" : "text-success"}`}>
                      {bl.spam}%
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{bl.anchor || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-center text-xs text-muted-foreground">{bl.firstSeen}</TableCell>
                  <TableCell className="whitespace-nowrap text-center text-xs text-muted-foreground">{bl.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default BacklinksAtual;


