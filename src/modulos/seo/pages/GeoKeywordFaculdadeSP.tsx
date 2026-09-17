import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 500 }, { month: "Jul", value: 550 }, { month: "Set", value: 520 },
  { month: "Nov", value: 580 }, { month: "Jan", value: 610 }, { month: "Mar", value: 590 },
];

const intentData = [
  { label: "Informational", pct: 56, color: "bg-blue-500" },
  { label: "Commercial", pct: 31, color: "bg-amber-500" },
  { label: "Transactional", pct: 13, color: "bg-emerald-500" },
  { label: "Navigational", pct: 2, color: "bg-purple-500" },
];

const autocompleteData = [
  { keyword: "faculdade são paulo sp", vol: 390 },
  { keyword: "faculdades sao paulo", vol: 210 },
  { keyword: "faculdade particular de medicina em sao ...", vol: 90 },
  { keyword: "faculdade particular em são paulo", vol: 90 },
  { keyword: "faculdade particular rolim de moura", vol: 70 },
];

const questionsData = [
  { keyword: "qual a melhor faculdade particular de são ...", vol: 30 },
  { keyword: "porque faculdade publica é melhor que pa...", vol: 20 },
  { keyword: "o que é faculdade particular", vol: 20 },
  { keyword: "qual melhor faculdade de sp", vol: 10 },
  { keyword: "faculdade particular sao paulo medicina", vol: 0 },
];

const prepositionsData = [
  { keyword: "faculdade particular sp", vol: 70 },
  { keyword: "faculdade particular perto de mim", vol: 50 },
  { keyword: "para fazer faculdade particular precisa faz...", vol: 10 },
  { keyword: "faculdade particular são paulo bem avaliada...", vol: 0 },
  { keyword: "faculdade particular são paulo direito", vol: 0 },
];

const comparisonsData = [
  { keyword: "faculdade particular ou pública", vol: 20 },
  { keyword: "faculdade particular ou federal", vol: 20 },
  { keyword: "faculdade particular vale a pena", vol: 10 },
  { keyword: "faculdade particulares sao paulo", vol: 0 },
  { keyword: "faculdade particular ou privada", vol: 0 },
];

const aiPrompts = [
  { prompt: "Quais são as melhores faculdades particulares em São Paulo para cursos de engenharia?", intents: ["I"], source: "gemini" },
  { prompt: "Melhores faculdades privadas em São Paulo para direito.", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Como faço para me inscrever em uma faculdade particular em São Paulo?", intents: ["T"], source: "gemini" },
  { prompt: "Preço médio mensalidade faculdade particular SP.", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Quais faculdades particulares em São Paulo oferecem bolsas de estudo?", intents: ["I", "C"], source: "gemini" },
  { prompt: "Faculdades particulares com bolsa de estudo em SP.", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Qual é o preço médio das mensalidades nas faculdades particulares em São Paulo?", intents: ["I"], source: "gemini" },
  { prompt: "Processo de admissão faculdades privadas São Paulo.", intents: ["I", "T"], source: "chatgpt" },
  { prompt: "Faculdades particulares em São Paulo com ensino a distância reconhecido.", intents: ["I"], source: "gemini" },
  { prompt: "Cursos de engenharia em instituições privadas na capital paulista.", intents: ["I", "C"], source: "chatgpt" },
];

const SourceIcon = ({ source }: { source: string }) => {
  if (source === "gemini") {
    return <img src={geminiLogo} alt="Gemini" className="h-5 w-5 flex-shrink-0" />;
  }
  return <img src={chatgptLogo} alt="ChatGPT" className="h-5 w-5 flex-shrink-0" />;
};

const intentColors: Record<string, string> = {
  I: "bg-blue-500 text-white",
  C: "bg-amber-500 text-white",
  T: "bg-emerald-500 text-white",
  N: "bg-purple-500 text-white",
};

const KeywordTable = ({ title, data }: { title: string; data: { keyword: string; vol: number }[] }) => (
  <div className="glass-card p-4 space-y-3">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    <div className="space-y-2">
      {data.map((row, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <Plus className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-foreground/80 truncate">{row.keyword}</span>
          <span className="font-semibold text-foreground tabular-nums">{row.vol}</span>
        </div>
      ))}
    </div>
  </div>
);

const GeoKeywordFaculdadeSP = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">faculdade particular são paulo</span>
        </h3>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="590" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="52" subtitle="MEDIUM" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="31K" icon={Link2} delay={2} />
        <StatCard title="AI Visibility" value="Alto" subtitle="Presente em 3 IAs" icon={Sparkles} delay={3} />
      </div>

      {/* Volume Chart + Intent */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Volume Trend */}
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
                  <span className="text-[10px] text-muted-foreground tabular-nums">{d.value}</span>
                  <div
                    className={`w-full rounded-t bg-gradient-to-t from-primary/60 to-primary/20 animate-grow-up`} style={{ ...{ height: `${heightPx}px` }, animationDelay: `${i * 0.1}s` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Intent Distribution */}
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
                  <div
                    className={`h-full rounded-full ${item.color} animate-grow-right`}
                    style={{ width: `${item.pct}%`, animationDelay: `${i * 0.15}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword Ideas */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for faculdade particular são paulo</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <KeywordTable title="Google Autocomplete" data={autocompleteData} />
          <KeywordTable title="Questions" data={questionsData} />
          <KeywordTable title="Prepositions" data={prepositionsData} />
          <KeywordTable title="Comparisons" data={comparisonsData} />
        </div>
      </div>

      {/* AI Prompt Ideas */}
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

export default GeoKeywordFaculdadeSP;


