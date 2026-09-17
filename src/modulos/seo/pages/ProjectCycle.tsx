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
  { num: 4, label: "Planejamento de Conteúdo", color: "hsl(var(--eseg-navy))", desc: "Definição de pautas, calendário editorial e briefings para criação de conteúdo otimizado." },
  { num: 5, label: "Otimizações On-Page", color: "hsl(var(--eseg-navy-light))", desc: "Ajustes em titles, metas, headings, URLs, imagens e estrutura interna das páginas." },
  { num: 6, label: "Suporte / validação de melhorias", color: "hsl(var(--eseg-gray))", desc: "Acompanhamento da implementação técnica e validação das melhorias aplicadas pelo time de dev." },
  { num: 7, label: "Oportunidades Link Building", color: "hsl(var(--eseg-navy-light))", desc: "Identificação de oportunidades de backlinks de qualidade e parcerias estratégicas." },
  { num: 8, label: "Ações de Outreach", color: "hsl(var(--eseg-navy))", desc: "Execução de campanhas de outreach para aquisição de links e menções em sites relevantes." },
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

export default function ProjectCycle() {
  const total = outputPhases.length;
  const cx = 250, cy = 250;
  const innerR = 115;
  const outerR = 220;
  const textR = 168;
  const gap = 3;
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  return (
    <div className="cycle-page min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="cycle-orb cycle-orb-1" />
      <div className="cycle-orb cycle-orb-2" />
      <div className="cycle-orb cycle-orb-3" />

      {/* Title */}
      <div className="cycle-fade-1 mb-8 text-center relative z-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Ciclo do Projeto</h1>
        <p className="text-white/50 mt-2 text-sm">Planejamento e cronograma das etapas do projeto SEO + GEO</p>
      </div>

      {/* INPUTS bar */}
      <div className="w-full max-w-[700px] mx-auto cycle-fade-2 mb-5 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-white/80 tracking-wide">INPUTS</span>
          <div className="flex-1 border-t border-dashed border-white/20" />
          <span className="text-white/40 text-xs">▶</span>
        </div>
        <div className="flex gap-0">
          {inputPhases.map((phase, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={i}
                className="flex-1 relative py-5 px-5 text-center text-white group cursor-pointer"
                title={phase.desc}
                style={{
                  background: phase.highlight ? "linear-gradient(135deg, #7C3AED, #06B6D4)" : "rgba(255,255,255,0.08)",
                  clipPath: isFirst
                    ? "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)"
                    : "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%)",
                  backdropFilter: phase.highlight ? "none" : "blur(12px)",
                }}
              >
                <span className="absolute top-1.5 left-3 text-[10px] font-bold opacity-60">{phase.num}</span>
                <p className="text-sm font-bold leading-tight">{phase.name}</p>
                {phase.sub && <p className="text-[10px] mt-1 opacity-70 leading-tight">{phase.sub}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center cycle-fade-3 mb-3 relative z-10">
        <svg width="24" height="48" viewBox="0 0 24 48">
          <defs><linearGradient id="arrowDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#06B6D4"/></linearGradient></defs>
          <line x1="12" y1="0" x2="12" y2="38" stroke="url(#arrowDown)" strokeWidth="2" strokeDasharray="4 3" />
          <polygon points="6,36 12,48 18,36" fill="#06B6D4" />
        </svg>
      </div>

      {/* Wheel */}
      <div className="flex justify-center cycle-fade-4 mb-10 relative z-10">
        <div className="relative w-[520px] h-[520px]">
          {/* Glow behind wheel */}
          <div className="absolute inset-0 rounded-full bg-accent/5 blur-3xl scale-110" />
          <svg viewBox="0 0 500 500" className="w-full h-full relative">
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>

            {/* Segments - glassmorphism */}
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
                <g key={i} className={`segment-fade segment-fade-${i} segment-hover`}
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
                  <path d={segPath} fill={phase.color} opacity="0.55" className="segment-bg" />
                  <path d={segPath} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" className="segment-overlay" />
                  <text
                    x={cx + (outerR - 16) * Math.cos(((angleStart + 10) * Math.PI) / 180)}
                    y={cy + (outerR - 16) * Math.sin(((angleStart + 10) * Math.PI) / 180)}
                    textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize="10" fontWeight="700" opacity="0.5"
                  >{phase.num}</text>
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize="12" fontWeight="600" className="select-none">
                    {lines.map((line, li) => (
                      <tspan key={li} x={tx} dy={li === 0 ? `${-(lines.length - 1) * 7}` : "15"}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {/* Center circle - glassmorphism */}
            <circle cx={cx} cy={cy} r="96" fill="rgba(0,0,0,0.35)" stroke="none" />
            <circle cx={cx} cy={cy} r="98" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={cx} y={cy - 22} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">OUTPUTS</text>
            <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9.5">Relatório de resultados +</text>
            <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9.5">dashboards de monitoramento</text>

            {/* Recycling arrows with gradient */}
            {[0, 120, 240].map((offsetDeg, idx) => {
              const r = outerR + 14;
              const s2 = (offsetDeg - 90) * Math.PI / 180;
              const e2 = (offsetDeg + 90 - 90) * Math.PI / 180;
              const x1 = cx + r * Math.cos(s2);
              const y1 = cy + r * Math.sin(s2);
              const x2 = cx + r * Math.cos(e2);
              const y2 = cy + r * Math.sin(e2);
              return (
                <g key={idx} className="recycle-arrow">
                  <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none" stroke="url(#arrowGrad)" strokeWidth="3.5" strokeLinecap="round" />
                  <polygon points="-7,-5.5 9,0 -7,5.5" fill="url(#arrowGrad)"
                    transform={`translate(${x2},${y2}) rotate(${offsetDeg + 90})`} />
                </g>
              );
            })}

            {/* Pulsing glow ring */}
            <circle cx={cx} cy={cy} r="98" fill="none" stroke="url(#arrowGrad)" strokeWidth="2" className="pulse-ring" />
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-50 cycle-tooltip"
              style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -120%)" }}
            >
              <div className="cycle-glass-card rounded-xl px-4 py-3 max-w-[220px] text-center shadow-2xl">
                <p className="text-xs text-white/90 leading-relaxed">{tooltip.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategy + Account - glassmorphism cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-[600px] cycle-fade-5 relative z-10">
        <div className="cycle-glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white text-center mb-4">Planning & Strategy</h3>
          <div className="space-y-2">
            {planningItems.map((item) => (
              <div key={item} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-center">
                <span className="text-xs font-medium text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cycle-glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-center mb-4 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">Account Management</h3>
          <div className="space-y-2">
            {accountItems.map((item) => (
              <div key={item} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-center">
                <span className="text-xs font-medium text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .cycle-page {
          background: linear-gradient(145deg, #0a0a0a 0%, #0d1117 30%, #111827 60%, #0a0a0a 100%);
        }

        /* Floating gradient orbs */
        .cycle-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .cycle-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%);
          top: 10%; left: -10%;
          animation: floatOrb 12s ease-in-out infinite;
        }
        .cycle-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
          bottom: 5%; right: -5%;
          animation: floatOrb 15s ease-in-out 3s infinite reverse;
        }
        .cycle-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: floatOrb 10s ease-in-out 1s infinite;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        /* Glassmorphism card */
        .cycle-glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        /* Staggered fade-in */
        @keyframes cycleFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cycle-fade-1 { animation: cycleFadeIn 0.7s ease-out 0.1s both; }
        .cycle-fade-2 { animation: cycleFadeIn 0.7s ease-out 0.35s both; }
        .cycle-fade-3 { animation: cycleFadeIn 0.5s ease-out 0.6s both; }
        .cycle-fade-4 { animation: cycleFadeIn 0.9s ease-out 0.8s both; }
        .cycle-fade-5 { animation: cycleFadeIn 0.7s ease-out 2s both; }

        /* Segments */
        @keyframes segFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .segment-fade { transform-origin: 250px 250px; }
        .segment-fade-0 { animation: segFadeIn 0.5s ease-out 1s both; }
        .segment-fade-1 { animation: segFadeIn 0.5s ease-out 1.15s both; }
        .segment-fade-2 { animation: segFadeIn 0.5s ease-out 1.3s both; }
        .segment-fade-3 { animation: segFadeIn 0.5s ease-out 1.45s both; }
        .segment-fade-4 { animation: segFadeIn 0.5s ease-out 1.6s both; }

        /* Recycling arrows */
        .recycle-arrow {
          transform-origin: 250px 250px;
          animation: spinRecycle 8s linear 1.8s infinite;
        }
        @keyframes spinRecycle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Pulsing ring */
        .pulse-ring {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.05; stroke-width: 1; }
          50% { opacity: 0.35; stroke-width: 3; }
        }

        /* Segment hover */
        .segment-hover { transition: filter 0.2s, transform 0.2s; }
        .segment-hover:hover { filter: brightness(1.3); transform: scale(1.04); }
        .segment-hover:hover .segment-bg { opacity: 0.8 !important; }

        /* Tooltip animation */
        .cycle-tooltip { animation: tooltipIn 0.2s ease-out both; }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-50%, -110%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -120%) scale(1); }
        }
      `}</style>
    </div>
  );
}


