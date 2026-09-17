import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 9200 }, { month: "Jul", value: 9500 }, { month: "Set", value: 9800 },
  { month: "Nov", value: 10200 }, { month: "Jan", value: 10000 }, { month: "Mar", value: 9900 },
];

const intentData = [
  { label: "Informational", pct: 50, color: "bg-blue-500" },
  { label: "Commercial", pct: 44, color: "bg-amber-500" },
  { label: "Navigational", pct: 4, color: "bg-purple-500" },
  { label: "Transactional", pct: 2, color: "bg-emerald-500" },
];

const autocompleteData = [
  { keyword: "curso auxiliar administra...", vol: 6600 },
  { keyword: "curso administração ead", vol: 2900 },
  { keyword: "curso administração gra...", vol: 2900 },
  { keyword: "curso de administração ...", vol: 1600 },
  { keyword: "quanto é 8 semestre", vol: 1000 },
];

const questionsData = [
  { keyword: "o que curso de administra...", vol: 1000 },
  { keyword: "quem cursa administraçã...", vol: 110 },
  { keyword: "o que é curso administra...", vol: 110 },
  { keyword: "o que significa curso de ad...", vol: 70 },
  { keyword: "o que é curso de administr...", vol: 70 },
];

const prepositionsData = [
  { keyword: "concurso administração...", vol: 27100 },
  { keyword: "curso para administração ...", vol: 1000 },
  { keyword: "curso para administração", vol: 260 },
  { keyword: "concurso administração ...", vol: 110 },
  { keyword: "curso parecido com admin...", vol: 70 },
];

const comparisonsData = [
  { keyword: "curso de administração e ...", vol: 40 },
  { keyword: "curso de administração e ...", vol: 40 },
  { keyword: "curso administração finan...", vol: 30 },
  { keyword: "curso de administração é ...", vol: 30 },
  { keyword: "curso de administração é ...", vol: 30 },
];

const aiPrompts = [
  { prompt: "Melhores plataformas online para curso de administração", intents: ["I", "C"], source: "gemini" },
  { prompt: "O que se estuda em administração de empresas?", intents: ["I"], source: "chatgpt" },
  { prompt: "Onde encontrar cursos de administração com certificado reconhecido", intents: ["N", "C"], source: "gemini" },
  { prompt: "Melhores universidades com curso de administração no Brasil.", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Como escolher um curso de administração para iniciantes", intents: ["I"], source: "gemini" },
  { prompt: "Diferenças entre administração presencial e a distância.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Cursos de administração com foco em gestão financeira", intents: ["I", "C"], source: "gemini" },
  { prompt: "Custo médio de mensalidade de faculdade de administração.", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Comparação de preços entre cursos de administração online", intents: ["C"], source: "gemini" },
  { prompt: "Quais as áreas de atuação para um administrador?", intents: ["I"], source: "chatgpt" },
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
          <span className="font-semibold text-foreground tabular-nums">{row.vol.toLocaleString()}</span>
        </div>
      ))}
    </div>
  </div>
);

const GeoKeywordCursoAdm = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">curso administração</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="9.9K" icon={Search} subtitle="HIGH" delay={0} />
        <StatCard title="SEO Difficulty" value="56" subtitle="MEDIUM" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="511" icon={Link2} delay={2} />
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

      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for curso administração</span>
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

export default GeoKeywordCursoAdm;


