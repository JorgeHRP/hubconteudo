import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  v === "Baixo" ? "border-success/20 bg-success/10 text-success" :
  v === "Médio" ? "border-warning/30 bg-warning/15 text-warning-strong" :
  "border-destructive/20 bg-destructive/10 text-destructive";

const impactColor = (v: string) =>
  v === "Alto" ? "border-primary/20 bg-primary/10 text-primary" :
  v === "Médio" ? "border-info/20 bg-info/10 text-info" :
  "border-border bg-muted text-muted-foreground";

const sections: ChecklistSection[] = [
  {
    title: "Relevância do Conteúdo",
    icon: <ClipboardCheck className="h-4 w-4" />,
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
    icon: <Shield className="h-4 w-4" />,
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
    icon: <MousePointerClick className="h-4 w-4" />,
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
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" aria-hidden />
              <span className="font-display text-base font-semibold text-foreground">Progresso do Checklist</span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{checkedCount}/{totalItems} itens ({pct}%)</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t bg-muted/50 px-5 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-semibold uppercase tracking-wide text-muted-foreground">Esforço</span>
            <Badge variant="outline" className={effortColor("Baixo")}>Baixo</Badge>
            <Badge variant="outline" className={effortColor("Médio")}>Médio</Badge>
            <Badge variant="outline" className={effortColor("Alto")}>Alto</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-semibold uppercase tracking-wide text-muted-foreground">Impacto</span>
            <Badge variant="outline" className={impactColor("Alto")}>Alto</Badge>
            <Badge variant="outline" className={impactColor("Médio")}>Médio</Badge>
            <Badge variant="outline" className={impactColor("Baixo")}>Baixo</Badge>
          </div>
        </div>
      </Card>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.title} className="overflow-hidden">
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-5 py-4">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              {section.icon}
            </span>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <div className="divide-y">
            {section.items.map((item, i) => {
              const key = `${section.title}-${i}`;
              const done = !!checked[key];
              return (
                <div
                  key={key}
                  className={`flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors ${
                    done ? "bg-success/5 hover:bg-success/10" : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggle(key)}
                >
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggle(key)}
                    className="mt-0.5 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <span className={`flex-1 text-sm leading-relaxed ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.text}
                    </span>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge variant="outline" title="Esforço" className={effortColor(item.effort)}>
                        {item.effort}
                      </Badge>
                      <Badge variant="outline" title="Impacto" className={impactColor(item.impact)}>
                        {item.impact}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GeoChecklist;


