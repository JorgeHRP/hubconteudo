import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 2800 }, { month: "Jul", value: 2850 }, { month: "Set", value: 2900 },
  { month: "Nov", value: 2950 }, { month: "Jan", value: 3100 }, { month: "Mar", value: 2900 },
];

const intentData = [
  { label: "Informational", pct: 53, color: "bg-blue-500" },
  { label: "Commercial", pct: 33, color: "bg-amber-500" },
  { label: "Navigational", pct: 7, color: "bg-purple-500" },
  { label: "Transactional", pct: 7, color: "bg-emerald-500" },
];

const autocompleteData = [
  { keyword: "cursos de graduação o que é", vol: 1600 },
  { keyword: "cursos de graduação ead", vol: 720 },
  { keyword: "cursos de pos graduação gratuito", vol: 720 },
  { keyword: "cursos de graduação ead gratuitos", vol: 590 },
  { keyword: "cursos de graduação da usp", vol: 320 },
];

const questionsData = [
  { keyword: "o que é cursos de graduação", vol: 1300 },
  { keyword: "o que significa cursos de graduação", vol: 90 },
  { keyword: "o que são cursos de graduação", vol: 70 },
  { keyword: "quais são os cursos de graduação", vol: 70 },
  { keyword: "é graduação", vol: 20 },
];

const prepositionsData = [
  { keyword: "cursos para graduação", vol: 1300 },
  { keyword: "para cursos", vol: 170 },
  { keyword: "cursos de graduação com menor duração", vol: 40 },
  { keyword: "cursos de graduação com maior emprega...", vol: 40 },
  { keyword: "bioestatística para cursos de graduação d...", vol: 10 },
];

const comparisonsData = [
  { keyword: "cursos de graduação diferentes", vol: 10 },
  { keyword: "cursos de graduação em 6 meses", vol: 0 },
  { keyword: "cursos de graduação ead gratuitos 2023", vol: 0 },
  { keyword: "cursos de graduação insper", vol: 0 },
  { keyword: "cursos de graduação é o que", vol: 0 },
];

const topSources = [
  "querobolsa.com.br",
  "querobolsa.com.br",
  "blogdoead.com.br",
  "unip.br",
  "ifmg.edu.br",
  "ufpa.br",
  "portal.uniasselvi.com.br",
  "ifpr.edu.br",
  "portal.mec.gov.br",
  "uninter.com",
];

const aiPrompts = [
  { prompt: "Quais são os melhores cursos de graduação oferecidos por universidades privadas no Brasil?", intents: ["I"], source: "gemini" },
  { prompt: "Quais os cursos de graduação mais procurados no Brasil?", intents: ["I"], source: "chatgpt" },
  { prompt: "Como comparar cursos de graduação online com os presenciais?", intents: ["I"], source: "gemini" },
  { prompt: "Opções de graduação com alta empregabilidade.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Onde encontrar plataformas que vendem cursos de graduação reconhecidos pelo MEC?", intents: ["N", "C"], source: "gemini" },
  { prompt: "Melhores áreas para estudar em universidades brasileiras.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Quais instituições têm os cursos de graduação mais bem avaliados no Enade?", intents: ["I"], source: "gemini" },
  { prompt: "Comparar instituições de ensino superior públicas e privadas.", intents: ["I", "C"], source: "chatgpt" },
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

const GeoKeywordCursosGrad = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">cursos de graduação</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="2.9K" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="68" subtitle="MEDIUM" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="866" icon={Link2} delay={2} />
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
            <h3 className="text-lg font-bold text-foreground">Google Search Results</h3>
            <p className="text-xs text-muted-foreground">Sites mais bem posicionados no Google para esta keyword</p>
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
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for cursos de graduação</span>
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

export default GeoKeywordCursosGrad;


