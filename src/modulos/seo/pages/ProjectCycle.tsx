import { useState } from "react";

const planningItems = [
  "Estudo de Palavras-chave",
  "Relatórios Mensais de Resultados",
  "Relatórios de Ranking",
  "Análise de Concorrentes",
  "Tendências de SEO + GEO",
];

const accountItems = [
  "Gestão do Projeto",
  "Estratégia de KPIs",
  "Setup de Dashboard",
  "Desenvolvimento de Atividades",
  "Briefing + FUPs",
];

const inputPhases = [
  { num: 1, name: "START", sub: "Briefing, alinhamento de KPIs e Kick-off", highlight: true, desc: "Reunião inicial para alinhar objetivos, definir KPIs e estabelecer o plano de ação do projeto." },
  { num: 2, name: "Diagnósticos de SEO + GEO", sub: "", desc: "Auditoria técnica completa do site: rastreamento, indexação, velocidade, estrutura e erros." },
  { num: 3, name: "Estudo de palavras-chave", sub: "", desc: "Pesquisa e mapeamento das palavras-chave mais relevantes para o negócio e intenção de busca." },
];

const outputPhases = [
  { num: 4, label: "Planejamento de Conteúdo", color: "hsl(var(--primary))", desc: "Definição de pautas, calendário editorial e briefings para criação de conteúdo otimizado." },
  { num: 5, label: "Otimizações On-Page", color: "hsl(var(--primary) / 0.86)", desc: "Ajustes em titles, metas, headings, URLs, imagens e estrutura interna das páginas." },
  { num: 6, label: "Suporte / validação de melhorias", color: "hsl(var(--primary) / 0.72)", desc: "Acompanhamento da implementação técnica e validação das melhorias aplicadas pelo time de dev." },
  { num: 7, label: "Oportunidades Link Building", color: "hsl(var(--primary) / 0.86)", desc: "Identificação de oportunidades de backlinks de qualidade e parcerias estratégicas." },
  { num: 8, label: "Ações de Outreach", color: "hsl(var(--primary))", desc: "Execução de campanhas de outreach para aquisição de links e menções em sites relevantes." },
];

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const rotuloSecao = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const numeroEtapa =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary";

export default function ProjectCycle() {
  const total = outputPhases.length;
  const cx = 250, cy = 250;
  const innerR = 115;
  const outerR = 220;
  const textR = 168;
  const gap = 3;
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  return (
    <div className="max-w-7xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Ciclo do Projeto</h2>
        <p className="mt-1 text-sm text-muted-foreground">Planejamento e cronograma das etapas do projeto SEO + GEO</p>
      </div>

      {/* INPUTS */}
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <p className={rotuloSecao}>Inputs</p>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {inputPhases.map((phase, i) => (
            <li
              key={i}
              className={`rounded-md border p-3 ${phase.highlight ? "border-primary/30 bg-primary/5" : ""}`}
            >
              <div className="flex items-start gap-2.5">
                <span className={numeroEtapa}>{phase.num}</span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold leading-snug text-foreground">{phase.name}</p>
                  {phase.sub && <p className="mt-0.5 text-xs font-medium text-primary">{phase.sub}</p>}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{phase.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Wheel */}
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <p className={rotuloSecao}>Outputs</p>
        <div className="mt-3 grid items-center gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <div className="relative mx-auto aspect-square w-full max-w-[480px]">
            <svg
              viewBox="0 0 500 500"
              className="relative h-full w-full"
              role="img"
              aria-label="Ciclo contínuo das etapas 4 a 8 do projeto"
            >
              {/* Segments */}
              {outputPhases.map((phase, i) => {
                const segAngle = 360 / total;
                const angleStart = i * segAngle - 90 + gap / 2;
                const angleEnd = (i + 1) * segAngle - 90 - gap / 2;
                const midAngle = (angleStart + angleEnd) / 2;
                const startRad = (angleStart * Math.PI) / 180;
                const endRad = (angleEnd * Math.PI) / 180;
                const midRad = (midAngle * Math.PI) / 180;
                const largeArc = angleEnd - angleStart > 180 ? 1 : 0;

                const x1o = cx + outerR * Math.cos(startRad);
                const y1o = cy + outerR * Math.sin(startRad);
                const x2o = cx + outerR * Math.cos(endRad);
                const y2o = cy + outerR * Math.sin(endRad);
                const x1i = cx + innerR * Math.cos(endRad);
                const y1i = cy + innerR * Math.sin(endRad);
                const x2i = cx + innerR * Math.cos(startRad);
                const y2i = cy + innerR * Math.sin(startRad);

                const tx = cx + textR * Math.cos(midRad);
                const ty = cy + textR * Math.sin(midRad);
                const lines = splitText(phase.label, 14);
                const segPath = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;

                return (
                  <g key={i} className="segment-hover"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const svgEl = (e.currentTarget.closest('.relative') as HTMLElement);
                      if (!svgEl) return;
                      const rect = svgEl.getBoundingClientRect();
                      const px = ((tx / 500) * rect.width);
                      const py = ((ty / 500) * rect.height);
                      setTooltip({ text: phase.desc, x: px, y: py });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <path d={segPath} fill={phase.color} className="segment-bg" />
                    <text
                      x={cx + (outerR - 16) * Math.cos(((angleStart + 10) * Math.PI) / 180)}
                      y={cy + (outerR - 16) * Math.sin(((angleStart + 10) * Math.PI) / 180)}
                      textAnchor="middle" dominantBaseline="central"
                      fill="hsl(var(--primary-foreground))" fontSize="11" fontWeight="700" opacity="0.7"
                    >{phase.num}</text>
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
                      fill="hsl(var(--primary-foreground))" fontSize="13" fontWeight="600" className="select-none">
                      {lines.map((line, li) => (
                        <tspan key={li} x={tx} dy={li === 0 ? `${-(lines.length - 1) * 7}` : "15"}>{line}</tspan>
                      ))}
                    </text>
                  </g>
                );
              })}

              {/* Center circle */}
              <circle cx={cx} cy={cy} r="98" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1.5" />
              <text x={cx} y={cy - 20} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="18" fontWeight="700">OUTPUTS</text>
              <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">Relatório de resultados +</text>
              <text x={cx} y={cy + 20} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">dashboards de monitoramento</text>

              {/* Recycling arrows */}
              {[0, 120, 240].map((offsetDeg, idx) => {
                const r = outerR + 14;
                const s2 = (offsetDeg - 90) * Math.PI / 180;
                const e2 = (offsetDeg + 90 - 90) * Math.PI / 180;
                const x1 = cx + r * Math.cos(s2);
                const y1 = cy + r * Math.sin(s2);
                const x2 = cx + r * Math.cos(e2);
                const y2 = cy + r * Math.sin(e2);
                return (
                  <g key={idx}>
                    <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                      fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" />
                    <polygon points="-7,-5.5 9,0 -7,5.5" fill="hsl(var(--accent))"
                      transform={`translate(${x2},${y2}) rotate(${offsetDeg + 90})`} />
                  </g>
                );
              })}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none absolute z-50"
                style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -120%)" }}
              >
                <div className="max-w-[220px] rounded-md border bg-popover px-3 py-2 text-center text-popover-foreground shadow-pop">
                  <p className="text-xs leading-relaxed">{tooltip.text}</p>
                </div>
              </div>
            )}
          </div>

          <ol className="divide-y">
            {outputPhases.map((phase) => (
              <li key={phase.num} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
                <span className={numeroEtapa}>{phase.num}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{phase.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{phase.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Strategy + Account */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="font-display text-base font-semibold text-foreground">Planning & Strategy</h3>
          <ul className="mt-2 divide-y">
            {planningItems.map((item) => (
              <li key={item} className="py-2.5 text-sm text-foreground last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="font-display text-base font-semibold text-foreground">Account Management</h3>
          <ul className="mt-2 divide-y">
            {accountItems.map((item) => (
              <li key={item} className="py-2.5 text-sm text-foreground last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <style>{`
        .segment-hover .segment-bg { transition: opacity 0.15s; }
        .segment-hover:hover .segment-bg { opacity: 0.85; }
      `}</style>
    </div>
  );
}
