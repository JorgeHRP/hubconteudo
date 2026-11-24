import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import { Badge } from "@/components/ui/badge";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 10 }, { month: "Jul", value: 14 }, { month: "Set", value: 16 },
  { month: "Nov", value: 12 }, { month: "Jan", value: 18 }, { month: "Mar", value: 14 },
];

const intentData = [
  { label: "Informational", pct: 50, color: "bg-info" },
  { label: "Commercial", pct: 28, color: "bg-warning" },
  { label: "Navigational", pct: 11, color: "bg-accent" },
  { label: "Transactional", pct: 11, color: "bg-success" },
];

const autocompleteData = [
  { keyword: "faculdade engenharia de produção valor", vol: 320 },
  { keyword: "faculdade engenharia de produção presen...", vol: 30 },
  { keyword: "faculdade engenharia de produção preço", vol: 30 },
  { keyword: "faculdade engenharia de produção quanto...", vol: 20 },
  { keyword: "faculdade engenharia de produção anhang...", vol: 0 },
];

const questionsData = [
  { keyword: "faculdade de engenharia de produção sp", vol: 30 },
  { keyword: "faculdade de engenharia de produção em s...", vol: 0 },
  { keyword: "faculdade de engenharia de produção em s...", vol: 0 },
];

const prepositionsData: { keyword: string; vol: number }[] = [];

const comparisonsData = [
  { keyword: "faculdade engenharia de produção usp", vol: 0 },
  { keyword: "faculdades publicas de engenharia de prod...", vol: 0 },
];

const topSources = [
  "querobolsa.com.br",
  "pucsp.br",
  "www5.usp.br",
  "cursos.cruzeirodosul.edu.br",
  "cursos.cruzeirodosulvirtual.com.br",
  "cursos.ceunsp.edu.br",
  "portal.uscs.edu.br",
  "anhanguera.com",
  "portal.fei.edu.br",
  "uninter.com",
];

const aiPrompts = [
  { prompt: "Quais são as melhores faculdades de engenharia de produção em São Paulo?", intents: ["I"], source: "gemini" },
  { prompt: "Melhores faculdades de engenharia de produção em São Paulo", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Como funciona o processo seletivo para engenharia de produção em instituições de São Paulo?", intents: ["I", "T"], source: "gemini" },
  { prompt: "Custo mensal de curso de engenharia de produção em SP", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Quais faculdades oferecem bolsas para engenharia de produção em São Paulo?", intents: ["C", "T"], source: "gemini" },
  { prompt: "Requisitos de admissão para engenharia de produção na capital paulista", intents: ["I"], source: "chatgpt" },
  { prompt: "Onde posso encontrar avaliações de cursos de engenharia de produção em São Paulo?", intents: ["I", "N"], source: "gemini" },
  { prompt: "Bolsas de estudo para engenharia de produção em instituições privadas de SP", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Existe algum curso de engenharia de produção com ensino híbrido em São Paulo?", intents: ["I", "N"], source: "gemini" },
  { prompt: "Opções de engenharia de produção a distância em São Paulo", intents: ["I", "C"], source: "chatgpt" },
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

const KeywordTable = ({ title, data }: { title: string; data: { keyword: string; vol: number }[] }) => (
  <div className="overflow-hidden rounded-lg border bg-card shadow-card">
    <h4 className="border-b px-4 py-3 font-display text-sm font-semibold text-foreground">{title}</h4>
    {data.length > 0 ? (
      <div className="divide-y px-4">
        {data.map((row, i) => (
          <div key={i} className="flex items-center gap-2 py-2 text-sm">
            <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-foreground">{row.keyword}</span>
            <span className="font-semibold text-foreground tabular-nums">{row.vol.toLocaleString()}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="px-4 py-3 text-sm text-muted-foreground">No matches. Try searching a similar keyword.</p>
    )}
  </div>
);

const GeoKeywordEngProducaoSP = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card px-5 py-4 shadow-card">
        <h3 className="font-display text-base font-semibold leading-tight text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">faculdade engenharia de produção são paulo</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="10" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="5" subtitle="LOW" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="10" icon={Link2} delay={2} />
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
            <h3 className="font-display text-base font-semibold leading-tight text-foreground">Google Search Results</h3>
            <p className="text-xs text-muted-foreground">Sites mais bem posicionados no Google para esta keyword</p>
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

      <div>
        <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2 font-display text-base font-semibold text-foreground">
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for faculdade engenharia de produção são paulo</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <KeywordTable title="Google Autocomplete" data={autocompleteData} />
          <KeywordTable title="Questions" data={questionsData} />
          <KeywordTable title="Prepositions" data={prepositionsData} />
          <KeywordTable title="Comparisons" data={comparisonsData} />
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

export default GeoKeywordEngProducaoSP;


