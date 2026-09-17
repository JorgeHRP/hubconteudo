import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Search, FileText, Link2, Settings, BarChart3, PenTool } from "lucide-react";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

interface WeeklyEntry {
  category: string;
  icon: React.ElementType;
  items: string[];
}

interface WeekData {
  entries: WeeklyEntry[];
  summary: string;
}

const weeklyData: Record<string, Record<string, WeekData>> = {
  "2026-04": {
    "1": {
      summary: "Foco em produção de conteúdo e otimização de páginas de curso.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Publicação do artigo 'Faculdade de Administração em SP: Guia Completo'",
          "Otimização de meta tags em 5 páginas de curso",
          "Revisão de heading tags (H1-H3) na homepage",
        ]},
        { category: "Análises", icon: Search, items: [
          "Análise de gap de keywords vs FGV e Insper — 12 oportunidades identificadas",
          "Monitoramento de posições: 3 keywords subiram para top 10",
        ]},
        { category: "Conteúdo", icon: PenTool, items: [
          "Briefing criado para artigo sobre Engenharia de Produção",
          "Revisão de 2 artigos em rascunho",
        ]},
        { category: "Técnico", icon: Settings, items: [
          "Implementação de Schema FAQ na página de Administração",
          "Correção de canonical tags em 3 URLs duplicadas",
        ]},
      ],
    },
    "2": {
      summary: "Semana de link building e análise competitiva.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Publicação do artigo 'Engenharia de Produção: O que faz e onde estudar'",
          "Outreach para 8 sites de educação para link building",
          "Atualização de alt text em 20 imagens do site",
        ]},
        { category: "Análises", icon: Search, items: [
          "Relatório de concorrentes: Mackenzie lançou 5 novos artigos de blog",
          "Análise de CTR no Search Console — 4 páginas com CTR abaixo de 2%",
        ]},
        { category: "Link Building", icon: Link2, items: [
          "Backlink conquistado: guiadoestudante.com.br (DA 72)",
          "3 propostas de guest post enviadas",
        ]},
      ],
    },
    "3": {
      summary: "Otimizações técnicas e preparação de conteúdo para maio.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Otimização de velocidade: compressão de imagens em 15 páginas",
          "Implementação de breadcrumb schema em páginas de curso",
          "Atualização de sitemap.xml com novas URLs",
        ]},
        { category: "Análises", icon: Search, items: [
          "Core Web Vitals: LCP melhorou de 2.8s para 2.1s",
          "Auditoria de backlinks: 2 links tóxicos identificados e rejeitados",
        ]},
        { category: "Conteúdo", icon: PenTool, items: [
          "Briefing para 3 artigos de maio finalizado",
          "Calendário editorial de maio aprovado",
        ]},
        { category: "Relatórios", icon: BarChart3, items: [
          "Dashboard atualizado com dados de março",
          "Relatório mensal de março entregue ao cliente",
        ]},
      ],
    },
    "4": {
      summary: "Fechamento do mês com foco em resultados e planejamento.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Publicação de 2 artigos finais do mês",
          "Backlink conquistado: educamaisbrasil.com.br (DA 65)",
          "Otimização de 15 meta descriptions",
        ]},
        { category: "Análises", icon: Search, items: [
          "Posição média do mês: 10.2 (meta: 12) — ✅ Meta batida",
          "Tráfego orgânico +14% vs março",
          "4 keywords entraram no top 10",
        ]},
        { category: "Planejamento", icon: FileText, items: [
          "Definição de metas para maio",
          "Priorização de quick wins: 5 keywords posição 11-15",
          "Alinhamento de estratégia com equipe ESEG",
        ]},
      ],
    },
  },
  "2026-03": {
    "1": {
      summary: "Início do projeto e setup de ferramentas.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Setup de tracking no Google Search Console e Analytics",
          "Configuração do Ubersuggest para monitoramento de keywords",
          "Auditoria técnica inicial do site eseg.edu.br",
        ]},
        { category: "Análises", icon: Search, items: [
          "Levantamento de 458 keywords no gap analysis",
          "Benchmark inicial dos concorrentes (FGV, Insper, Mackenzie, São Judas, Mauá)",
        ]},
      ],
    },
    "2": {
      summary: "Definição de estratégia e início das otimizações.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Seleção de 12 keywords prioritárias para tracking",
          "Início da otimização on-page: homepage e página de graduação",
          "Criação do calendário editorial Q2 2026",
        ]},
        { category: "Análises", icon: Search, items: [
          "Análise de intenção de busca para keywords selecionadas",
          "Mapeamento de URLs existentes vs keywords alvo",
        ]},
      ],
    },
    "3": {
      summary: "Produção de conteúdo e correções técnicas.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Correção de 12 erros de indexação encontrados na auditoria",
          "Primeiro artigo publicado: 'Graduação em SP'",
          "Otimização de Core Web Vitals em 3 páginas críticas",
        ]},
        { category: "Técnico", icon: Settings, items: [
          "Implementação de robots.txt otimizado",
          "Correção de redirecionamentos 301 em 8 URLs",
        ]},
      ],
    },
    "4": {
      summary: "Fechamento do primeiro mês com baseline estabelecida.",
      entries: [
        { category: "O que foi feito", icon: CheckCircle, items: [
          "Segundo artigo publicado no blog",
          "Backlink conquistado: infomoney.com.br (DA 82)",
          "Auditoria técnica 100% finalizada",
        ]},
        { category: "Análises", icon: Search, items: [
          "Baseline de posições estabelecida para todas as 12 keywords",
          "Posição média inicial: 15.3",
        ]},
      ],
    },
  },
};

const categoryColors: Record<string, string> = {
  "O que foi feito": "bg-emerald-100 text-emerald-700",
  "Análises": "bg-blue-100 text-blue-700",
  "Conteúdo": "bg-purple-100 text-purple-700",
  "Técnico": "bg-amber-100 text-amber-700",
  "Link Building": "bg-cyan-100 text-cyan-700",
  "Relatórios": "bg-indigo-100 text-indigo-700",
  "Planejamento": "bg-rose-100 text-rose-700",
};

const WeeklyUpdates = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Atualizações Semanais"
        descricao="O que andou na semana"
        oQueEntraAqui="Aqui entram os avanços semanais deste projeto."
      />
    );
  }

  const [selectedMonth, setSelectedMonth] = useState("2026-04");
  const [selectedWeek, setSelectedWeek] = useState("1");

  const monthData = weeklyData[selectedMonth];
  const weekData = monthData?.[selectedWeek];

  const monthLabel = selectedMonth === "2026-04" ? "Abril 2026" : selectedMonth === "2026-03" ? "Março 2026" : selectedMonth;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Atualizações Semanais</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhamento semanal das ações de SEO</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSelectedWeek("1"); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-04">Abril 2026</SelectItem>
            <SelectItem value="2026-03">Março 2026</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {["1", "2", "3", "4"].map((week) => {
            const hasData = monthData?.[week];
            return (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                disabled={!hasData}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedWeek === week
                    ? "bg-primary text-primary-foreground shadow-md"
                    : hasData
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                }`}
              >
                Semana {week}
              </button>
            );
          })}
        </div>
      </div>

      {weekData ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="glass-card p-5 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "var(--gradient-accent)" }}>
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Resumo — Semana {selectedWeek} de {monthLabel}</p>
                <p className="text-sm text-muted-foreground">{weekData.summary}</p>
              </div>
            </div>
          </div>

          {/* Entries */}
          {weekData.entries.map((entry, i) => {
            const Icon = entry.icon;
            const colorClass = categoryColors[entry.category] || "bg-muted text-foreground";
            return (
              <div key={i} className="glass-card-hover p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                    <Icon className="inline h-3 w-3 mr-1" />
                    {entry.category}
                  </span>
                </div>
                <div className="space-y-2 pl-1">
                  {entry.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-eseg-blue mt-2" />
                      <p className="text-sm text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Nenhuma atualização disponível para este período.</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyUpdates;


