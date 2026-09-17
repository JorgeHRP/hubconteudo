import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 1200 }, { month: "Jul", value: 1250 }, { month: "Set", value: 1280 },
  { month: "Nov", value: 1300 }, { month: "Jan", value: 1400 }, { month: "Mar", value: 1300 },
];

const intentData = [
  { label: "Informational", pct: 75, color: "bg-blue-500" },
  { label: "Commercial", pct: 25, color: "bg-amber-500" },
  { label: "Navigational", pct: 2, color: "bg-purple-500" },
  { label: "Transactional", pct: 2, color: "bg-emerald-500" },
];

const autocompleteData = [
  { keyword: "melhores faculdades particulares de me...", vol: 720 },
  { keyword: "melhores faculdades de fisioterapia sp", vol: 320 },
  { keyword: "melhores faculdades de jornalismo sp", vol: 320 },
  { keyword: "melhores faculdades particulares de fort...", vol: 210 },
  { keyword: "melhores faculdades particulares de ti e...", vol: 170 },
];

const questionsData = [
  { keyword: "melhores faculdades particulares de sp m...", vol: 50 },
  { keyword: "melhores faculdades particulares de sp di...", vol: 20 },
  { keyword: "quais são as melhores faculdades particu...", vol: 20 },
  { keyword: "melhores faculdades particulares de sp 2...", vol: 20 },
  { keyword: "melhores faculdades particulares de sp p...", vol: 20 },
];

const prepositionsData = [
  { keyword: "melhores faculdades particulares de sp par...", vol: 0 },
  { keyword: "melhores faculdades particulares de sp par...", vol: 0 },
  { keyword: "melhores faculdades particulares de sp par...", vol: 0 },
];

const comparisonsData = [
  { keyword: "melhores faculdades particulares de sp 2...", vol: 10 },
  { keyword: "melhores faculdades particulares de sp p...", vol: 10 },
  { keyword: "melhores faculdades particulares de sp lista", vol: 0 },
  { keyword: "melhores faculdades particulares de sp par...", vol: 0 },
  { keyword: "melhores faculdades particulares de sp 2022", vol: 0 },
];

const topSources = [
  "querobolsa.com.br",
  "comerciosaopaulo.com.br",
  "unoeste.br",
  "hospital.mackenzie.br",
];

const aiPrompts = [
  { prompt: "Quais são as melhores faculdades particulares de São Paulo para cursos de engenharia?", intents: ["I"], source: "gemini" },
  { prompt: "Quais as instituições de ensino superior privadas mais conceituadas em São Paulo?", intents: ["I"], source: "chatgpt" },
  { prompt: "Onde posso encontrar rankings confiáveis das melhores faculdades particulares em SP?", intents: ["I"], source: "gemini" },
  { prompt: "Ranking das melhores universidades particulares em SP.", intents: ["I"], source: "chatgpt" },
  { prompt: "Quais faculdades particulares em São Paulo oferecem os melhores programas de negócios?", intents: ["I"], source: "gemini" },
  { prompt: "Faculdades privadas paulistas com boa reputação acadêmica.", intents: ["I"], source: "chatgpt" },
  { prompt: "Como comparar mensalidades das principais faculdades particulares de São Paulo?", intents: ["C"], source: "gemini" },
  { prompt: "Custo médio das mensalidades em universidades particulares na capital paulista.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Quais são as faculdades particulares mais recomendadas para medicina em São Paulo?", intents: ["I"], source: "gemini" },
  { prompt: "Opções de bolsas de estudo para faculdades particulares em São Paulo.", intents: ["I", "C"], source: "chatgpt" },
];

const intentColors: Record<string, string> = {
  I: "bg-blue-500 text-white",
  C: "bg-amber-500 text-white",
  T: "bg-emerald-500 text-white",
  N: "bg-purple-500 text-white",
};

const SourceIcon = ({ source }: { source: string }) => {
  if (source === "gemini") return <img src={geminiLogo} alt="Gemini" className="h-5 w-5 flex-shrink-0" />;
  return <img src={chatgptLogo} alt="ChatGPT" className="h-5 w-5 flex-shrink-0" />;
};

const KeywordTable = ({ title, data }: { title: string; data: { keyword: string; vol: number }[] }) => (
  <div className="glass-card p-4 space-y-3">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    <div className="space-y-2">
      {data.map((row, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-foreground/80 truncate">{row.keyword}</span>
          <span className="font-semibold text-foreground tabular-nums">{row.vol.toLocaleString()}</span>
        </div>
      ))}
    </div>
  </div>
);

const GeoKeywordMelhoresFacSP = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">melhores faculdades particulares de sp</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="1.3K" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="18" subtitle="LOW" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="11" icon={Link2} delay={2} />
        <StatCard title="AI Visibility" value="Alto" subtitle="Presente em 2 IAs" icon={Sparkles} delay={3} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Volume de Busca (12 meses)
          </h4>
          <div className="flex items-end gap-2" style={{ height: "120px" }}>
            {volumeData.map((d, i) => {
              const heightPx = ((d.value - minVol) / range) * 80 + 24;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{(d.value / 1000).toFixed(1)}K</span>
                  <div className={`w-full rounded-t bg-gradient-to-t from-primary/60 to-primary/20 animate-grow-up`} style={{ height: `${heightPx}px`, animationDelay: `${i * 0.1}s` }} />
                  <span className="text-[10px] text-muted-foreground">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Prompts Intent
          </h4>
          <div className="space-y-3">
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

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Top Sources from AI Overview</h3>
            <p className="text-xs text-muted-foreground">Sites mais citados pelas IAs para esta keyword</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          {topSources.map((source, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <span className="text-sm font-semibold text-muted-foreground w-6 text-right">{i + 1}.</span>
              <span className="text-sm text-foreground/80">{source}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for melhores faculdades particulares de sp</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <KeywordTable title="Google Autocomplete" data={autocompleteData} />
          <KeywordTable title="Questions" data={questionsData} />
          <KeywordTable title="Prepositions" data={prepositionsData} />
          <KeywordTable title="Comparisons" data={comparisonsData} />
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">AI Prompt Ideas</h3>
            <p className="text-xs text-muted-foreground">Prompts reais que usuários fazem às IAs sobre este tema</p>
          </div>
        </div>
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">Prompt</span>
            <span className="text-xs font-semibold text-muted-foreground">Intent</span>
          </div>
          <div className="divide-y divide-border/30">
            {aiPrompts.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 flex-1 pr-4">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-foreground/80">{item.prompt}</span>
                </div>
                <div className="flex gap-1">
                  {item.intents.map((intent, j) => (
                    <span key={j} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${intentColors[intent]}`}>
                      {intent}
                    </span>
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

export default GeoKeywordMelhoresFacSP;


