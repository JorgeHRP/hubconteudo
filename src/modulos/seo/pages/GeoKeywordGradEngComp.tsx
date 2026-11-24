import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import { Badge } from "@/components/ui/badge";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 130 }, { month: "Jul", value: 135 }, { month: "Set", value: 140 },
  { month: "Nov", value: 145 }, { month: "Jan", value: 150 }, { month: "Mar", value: 140 },
];

const intentData = [
  { label: "Informational", pct: 53, color: "bg-info" },
  { label: "Commercial", pct: 35, color: "bg-warning" },
  { label: "Navigational", pct: 6, color: "bg-accent" },
  { label: "Transactional", pct: 6, color: "bg-success" },
];

const topSources = [
  "youtube.com",
  "querobolsa.com.br",
  "fiap.com.br",
  "uninter.com",
  "unimetrocamp.com.br",
  "ruf.folha.uol.com.br",
];

const aiPrompts = [
  { prompt: "Quais são as melhores faculdades de graduação em engenharia da computação no Brasil?", intents: ["I"], source: "gemini" },
  { prompt: "Melhores universidades para engenharia da computação no Brasil.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Como funciona a grade curricular do curso de engenharia da computação?", intents: ["I"], source: "gemini" },
  { prompt: "Cursos online gratuitos de introdução à programação para engenharia.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Quais são as principais áreas de atuação para engenheiros da computação?", intents: ["I"], source: "gemini" },
  { prompt: "Requisitos de hardware para estudantes de engenharia da computação.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Quais cursos online recomendados para complementar a graduação em engenharia da computação?", intents: ["I", "C"], source: "gemini" },
  { prompt: "Bolsas de estudo para graduação em engenharia da computação.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Onde posso encontrar estágios para estudantes de engenharia da computação?", intents: ["N", "T"], source: "gemini" },
  { prompt: "Como escolher a melhor instituição para engenharia da computação.", intents: ["I", "C"], source: "chatgpt" },
];

const intentColors: Record<string, string> = {
  I: "border-info/20 bg-info/10 text-info",
  C: "border-warning/30 bg-warning/15 text-warning-strong",
  T: "border-success/20 bg-success/10 text-success",
  N: "border-accent/20 bg-accent/10 text-accent",
};

const SourceIcon = ({ source }: { source: string }) => {
  if (source === "gemini") {
    return <img src={geminiLogo} alt="Gemini" className="h-5 w-5 flex-shrink-0" />;
  }
  return <img src={chatgptLogo} alt="ChatGPT" className="h-5 w-5 flex-shrink-0" />;
};

const GeoKeywordGradEngComp = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card px-5 py-4 shadow-card">
        <h3 className="font-display text-base font-semibold leading-tight text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">graduação engenharia da computação</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="140" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="37" subtitle="MEDIUM" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="9" icon={Link2} delay={2} />
        <StatCard title="AI Visibility" value="Alto" subtitle="Presente em 2 IAs" icon={Sparkles} delay={3} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <h4 className="flex items-center gap-2 border-b px-5 py-3 font-display text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Volume de Busca (12 meses)
          </h4>
          <div className="flex h-48 items-end gap-2 px-5 pb-4 pt-5">
            {volumeData.map((d, i) => {
              const heightPx = ((d.value - minVol) / range) * 80 + 24;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs text-muted-foreground tabular-nums">{d.value}</span>
                  <div className={`w-full rounded-t bg-primary/70 animate-grow-up`} style={{ height: `${heightPx}px`, animationDelay: `${i * 0.1}s` }} />
                  <span className="text-xs text-muted-foreground">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <h4 className="flex items-center gap-2 border-b px-5 py-3 font-display text-sm font-semibold text-foreground">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Prompts Intent
          </h4>
          <div className="space-y-3 p-5">
            {intentData.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/80">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.pct}%</span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} animate-grow-right`} style={{ width: `${item.pct}%`, animationDelay: `${i * 0.15}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight text-foreground">Top Sources from AI Overview</h3>
            <p className="text-xs text-muted-foreground">Sites mais citados pelas IAs para esta keyword</p>
          </div>
        </div>
        <div className="grid gap-x-8 px-5 py-2 md:grid-cols-2">
          {topSources.map((source, i) => (
            <div key={i} className="flex min-w-0 items-center gap-3 border-b py-2.5 last:border-0">
              <span className="text-sm font-semibold text-muted-foreground w-6 text-right">{i + 1}.</span>
              <span className="text-sm text-foreground/80">{source}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold leading-tight text-foreground">AI Prompt Ideas</h3>
            <p className="text-xs text-muted-foreground">Prompts reais que usuários fazem às IAs sobre este tema</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-4 border-b bg-muted/50 px-5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intent</span>
          </div>
          <div className="divide-y">
            {aiPrompts.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/50">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-foreground/80">{item.prompt}</span>
                </div>
                <div className="flex shrink-0 gap-1">
                  {item.intents.map((intent, j) => (
                    <Badge key={j} variant="outline" className={`h-6 w-6 justify-center px-0 font-semibold ${intentColors[intent]}`}>
                      {intent}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoKeywordGradEngComp;


