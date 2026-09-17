import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Zap, Shield, MousePointerClick } from "lucide-react";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

interface ChecklistItem {
  text: string;
  effort: "Baixo" | "Médio" | "Alto";
  impact: "Baixo" | "Médio" | "Alto";
}

interface ChecklistSection {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

const effortColor = (v: string) =>
  v === "Baixo" ? "bg-green-500/20 text-green-400 border-green-500/30" :
  v === "Médio" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
  "bg-red-500/20 text-red-400 border-red-500/30";

const impactColor = (v: string) =>
  v === "Alto" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
  v === "Médio" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
  "bg-muted text-muted-foreground border-border";

const sections: ChecklistSection[] = [
  {
    title: "Relevância do Conteúdo",
    icon: <ClipboardCheck className="h-5 w-5 text-primary" />,
    items: [
      { text: "Criar textos que respondam perguntas objetivamente nos primeiros parágrafos", effort: "Médio", impact: "Alto" },
      { text: "Criar conteúdo original — experiências pessoais, estudos, comparativos", effort: "Alto", impact: "Alto" },
      { text: "Estruturar o conteúdo em perguntas e respostas (FAQs) para facilitar a extração da IA", effort: "Médio", impact: "Alto" },
      { text: "Abordar keywords long tail (especificidades)", effort: "Baixo", impact: "Alto" },
      { text: "Adicionar conteúdo visual relevante — GIFs, infográficos, prints, vídeos", effort: "Alto", impact: "Alto" },
      { text: "Adotar linguagem clara, concisa e neutra nos conteúdos", effort: "Baixo", impact: "Alto" },
      { text: "Revisar conteúdos publicados a cada 3 meses para mapear atualizações necessárias", effort: "Médio", impact: "Médio" },
      { text: "Garantir métricas adequadas de performance (CLS, LCP, INP e TTFB)", effort: "Alto", impact: "Alto" },
      { text: "Promover User Generated Content no domínio (comentários, FAQ, depoimentos)", effort: "Alto", impact: "Alto" },
      { text: "Usar listas numeradas e bullets para melhorar a escaneabilidade", effort: "Baixo", impact: "Médio" },
      { text: "Adicionar marcação de dados estruturados (Schema Markup) para contexto do conteúdo", effort: "Alto", impact: "Alto" },
      { text: "Garantir títulos e descrições diretos e informativos para uso pela IA", effort: "Baixo", impact: "Alto" },
      { text: "Trabalhar subtítulos estratégicos (H2, H3) que resumos de IA podem aproveitar", effort: "Médio", impact: "Alto" },
      { text: "Criar conteúdos de nicho que abordam temas não explorados pela concorrência", effort: "Alto", impact: "Alto" },
      { text: "Escrever de forma humanizada e autêntica, diferenciando-se de conteúdos gerados por IA", effort: "Médio", impact: "Alto" },
      { text: "Utilizar cases, exemplos práticos e depoimentos reais para agregar credibilidade", effort: "Médio", impact: "Alto" },
      { text: "Evitar pop-ups invasivos — a IA pode penalizar páginas com experiência ruim", effort: "Baixo", impact: "Médio" },
    ],
  },
  {
    title: "Autoridade e Confiabilidade",
    icon: <Shield className="h-5 w-5 text-cyan-400" />,
    items: [
      { text: "Criar páginas de autoria bem definidas — nomes, cargos e bios dos autores", effort: "Médio", impact: "Alto" },
      { text: "Referenciar fontes confiáveis — mostrar que o conteúdo tem embasamento real", effort: "Baixo", impact: "Alto" },
      { text: "Links externos de qualidade — prospectar menções em sites com alta autoridade", effort: "Alto", impact: "Alto" },
      { text: "Permitir e incentivar comentários para aumentar interação e percepção de comunidade", effort: "Médio", impact: "Alto" },
      { text: "Criar conteúdo interativo — quizzes, calculadoras e enquetes", effort: "Alto", impact: "Alto" },
      { text: "Utilizar redes sociais e backlinks para aumentar a visibilidade do conteúdo", effort: "Médio", impact: "Alto" },
      { text: "Certificar-se de que a informação está bem contextualizada e precisa", effort: "Médio", impact: "Alto" },
    ],
  },
  {
    title: "Interação e Conversão",
    icon: <MousePointerClick className="h-5 w-5 text-yellow-400" />,
    items: [
      { text: "Usar CTAs diretos e persuasivos, adaptados para IA generativa", effort: "Baixo", impact: "Alto" },
      { text: "Fornecer resumos curtos antes dos CTAs para aumentar a retenção", effort: "Baixo", impact: "Médio" },
      { text: "Criar seções de conteúdo recomendadas para manter o usuário navegando", effort: "Médio", impact: "Alto" },
      { text: "Oferecer conteúdos complementares através de links internos bem posicionados", effort: "Médio", impact: "Alto" },
      { text: "Testar novas palavras-chave conversacionais — a IA responde a perguntas mais naturais", effort: "Médio", impact: "Alto" },
      { text: "Analisar relatórios de tráfego da busca generativa, identificando padrões e oportunidades", effort: "Alto", impact: "Alto" },
    ],
  },
];

const GeoChecklist = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="GEO — Checklist"
        descricao="Itens de otimização para IA"
        oQueEntraAqui="Aqui entra o checklist de GEO deste cliente."
      />
    );
  }

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalItems = sections.reduce((a, s) => a + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Progresso do Checklist</span>
          </div>
          <span className="text-sm text-muted-foreground">{checkedCount}/{totalItems} itens ({pct}%)</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card p-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground">Esforço:</span>
          <Badge variant="outline" className={effortColor("Baixo")}>Baixo</Badge>
          <Badge variant="outline" className={effortColor("Médio")}>Médio</Badge>
          <Badge variant="outline" className={effortColor("Alto")}>Alto</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground">Impacto:</span>
          <Badge variant="outline" className={impactColor("Alto")}>Alto</Badge>
          <Badge variant="outline" className={impactColor("Médio")}>Médio</Badge>
          <Badge variant="outline" className={impactColor("Baixo")}>Baixo</Badge>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            {section.icon}
            <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
          </div>
          <div className="space-y-2">
            {section.items.map((item, i) => {
              const key = `${section.title}-${i}`;
              const done = !!checked[key];
              return (
                <div
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    done
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card/50 border-border/50 hover:border-border"
                  }`}
                  onClick={() => toggle(key)}
                >
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggle(key)}
                    className="mt-0.5"
                  />
                  <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.text}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${effortColor(item.effort)}`}>
                      {item.effort}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${impactColor(item.impact)}`}>
                      {item.impact}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GeoChecklist;


