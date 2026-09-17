import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 10 }, { month: "Jul", value: 12 }, { month: "Set", value: 8 },
  { month: "Nov", value: 10 }, { month: "Jan", value: 14 }, { month: "Mar", value: 10 },
];

const intentData = [
  { label: "Informational", pct: 56, color: "bg-blue-500" },
  { label: "Commercial", pct: 31, color: "bg-amber-500" },
  { label: "Transactional", pct: 6, color: "bg-emerald-500" },
  { label: "Navigational", pct: 6, color: "bg-purple-500" },
];

const autocompleteData = [
  { keyword: "curso de administração em são paulo", vol: 30 },
  { keyword: "curso tecnico de administração sao paulo", vol: 0 },
  { keyword: "curso administração de empresas sao paulo", vol: 0 },
  { keyword: "curso administração 6 meses", vol: 0 },
  { keyword: "curso administração sao quantos anos", vol: 0 },
];

const questionsData = [
  { keyword: "quem cursa administração pode trabalh...", vol: 110 },
  { keyword: "o que é curso de administração pública", vol: 70 },
  { keyword: "porque cursar administração", vol: 40 },
  { keyword: "administração é curso superior", vol: 20 },
  { keyword: "curso de administração são quantos perío...", vol: 10 },
];

const prepositionsData = [
  { keyword: "curso parecido com administração", vol: 70 },
  { keyword: "curso administração semipresencial", vol: 40 },
  { keyword: "curso de administração sem ser faculdade", vol: 10 },
  { keyword: "curso de administração proximo a mim", vol: 0 },
  { keyword: "tipo curso de administração", vol: 0 },
];

const comparisonsData = [
  { keyword: "curso administracao sao paulo", vol: 0 },
  { keyword: "curso adm sao paulo", vol: 0 },
];

const aiPrompts = [
  { prompt: "Quais são os melhores cursos de administração em São Paulo?", intents: ["I"], source: "gemini" },
  { prompt: "Melhores cursos de administração na cidade de São Paulo.", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Onde posso encontrar cursos de administração com certificado reconhecido em São Paulo?", intents: ["I", "C"], source: "gemini" },
  { prompt: "Requisitos para ingressar num curso de administração em SP", intents: ["I"], source: "chatgpt" },
  { prompt: "Como funciona a matrícula para cursos de administração em instituições de São Paulo?", intents: ["T"], source: "gemini" },
  { prompt: "Duração média de um curso superior de administração em São Paulo", intents: ["I"], source: "chatgpt" },
  { prompt: "Quais escolas oferecem cursos de administração à distância com sede em São Paulo?", intents: ["I", "N"], source: "gemini" },
  { prompt: "Custo de propinas para cursos de administração em São Paulo", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Quais são os preços médios dos cursos de administração em São Paulo?", intents: ["I", "C"], source: "gemini" },
  { prompt: "Opções de cursos de administração à distância em São Paulo", intents: ["C", "I"], source: "chatgpt" },
];

const intentColors: Record<string, string> = {
  I: "bg-blue-500 text-white",
  C: "bg-amber-500 text-white",
  T: "bg-emerald-500 text-white",
  N: "bg-purple-500 text-white",
};

const SourceIcon = ({ source }: { source: string }) => {
  if (source === "gemini") {
    return <img src={geminiLogo} alt="Gemini" className="h-5 w-5 flex-shrink-0" />;
  }
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
          <span className="font-semibold text-foreground tabular-nums">{row.vol}</span>
        </div>
      ))}
    </div>
  </div>
);

const GeoKeywordCursoAdmSP = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">curso administração são paulo</span>
        </h3>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="10" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="24" subtitle="LOW" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="3K" icon={Link2} delay={2} />
        <StatCard title="AI Visibility" value="Alto" subtitle="Presente em 2 IAs" icon={Sparkles} delay={3} />
      </div>

      {/* Volume Chart + Intent */}
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
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for curso administração são paulo</span>
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

export default GeoKeywordCursoAdmSP;


