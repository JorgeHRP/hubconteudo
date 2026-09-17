import { Search, TrendingUp, Shield, Link2, Sparkles, HelpCircle, Plus, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const volumeData = [
  { month: "Mai", value: 200 }, { month: "Jul", value: 220 }, { month: "Set", value: 230 },
  { month: "Nov", value: 210 }, { month: "Jan", value: 240 }, { month: "Mar", value: 210 },
];

const intentData = [
  { label: "Informational", pct: 50, color: "bg-blue-500" },
  { label: "Commercial", pct: 38, color: "bg-amber-500" },
  { label: "Navigational", pct: 6, color: "bg-purple-500" },
  { label: "Transactional", pct: 6, color: "bg-emerald-500" },
];

const autocompleteData = [
  { keyword: "faculdade de economia quantos anos", vol: 720 },
  { keyword: "faculdade de economia ufba", vol: 590 },
  { keyword: "faculdade de economia ufjf", vol: 390 },
  { keyword: "faculdade de economia valor", vol: 390 },
  { keyword: "melhor faculdade de economia sp", vol: 260 },
];

const questionsData = [
  { keyword: "quem faz faculdade de economia é o que", vol: 10 },
  { keyword: "faculdade de economia administração e co...", vol: 0 },
  { keyword: "como fazer faculdade de economia", vol: 0 },
  { keyword: "economia faculdade publica sp", vol: 0 },
  { keyword: "qual a melhor faculdade de economia de s...", vol: 0 },
];

const prepositionsData = [
  { keyword: "economia semipresencial", vol: 40 },
  { keyword: "faculdade de economia semipresencial", vol: 10 },
  { keyword: "faculdade com curso de economia em sp", vol: 0 },
  { keyword: "compensa fazer faculdade de economia", vol: 0 },
  { keyword: "economia faculdade federal sp", vol: 0 },
];

const comparisonsData = [
  { keyword: "faculdade de economia em são paulo", vol: 90 },
  { keyword: "faculdade de economia vale a pena", vol: 70 },
  { keyword: "faculdade de economia ou ciencias econo...", vol: 20 },
  { keyword: "faculdade de economia são paulo", vol: 10 },
  { keyword: "faculdade de economia ead sp", vol: 0 },
];

const aiPrompts = [
  { prompt: "Quais são as melhores faculdades de economia em São Paulo?", intents: ["I"], source: "gemini" },
  { prompt: "Melhores faculdades de economia em São Paulo", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Como faço para me inscrever em uma faculdade de economia em SP?", intents: ["T"], source: "gemini" },
  { prompt: "Custo médio mensal faculdade economia SP privada", intents: ["I", "C"], source: "chatgpt" },
  { prompt: "Faculdades de economia em SP com cursos presenciais e online.", intents: ["I", "C"], source: "gemini" },
  { prompt: "Requisitos para entrar em cursos de economia em SP", intents: ["I"], source: "chatgpt" },
  { prompt: "Quais faculdades de economia em São Paulo oferecem bolsas de estudo?", intents: ["I", "C"], source: "gemini" },
  { prompt: "Programas de bolsa de estudo para economia em São Paulo", intents: ["C", "I"], source: "chatgpt" },
  { prompt: "Endereço e telefone das principais faculdades de economia em SP.", intents: ["N"], source: "gemini" },
  { prompt: "Opções de cursos de economia noturnos em SP", intents: ["C", "I"], source: "chatgpt" },
];

const topSources = [
  "insper.edu.br",
  "uspprofissoes.usp.br",
  "fia.com.br",
  "ruf.folha.uol.com.br",
  "fecap.br",
  "querobolsa.com.br",
  "eesp.fgv.br",
  "cursos.cruzeirodosul.edu.br",
  "fea.usp.br",
  "unip.br",
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

const GeoKeywordEconomiaSP = () => {
  const maxVol = Math.max(...volumeData.map(d => d.value));
  const minVol = Math.min(...volumeData.map(d => d.value));
  const range = maxVol - minVol || 1;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">faculdade de economia sp</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="210" icon={Search} subtitle="Volume mensal" delay={0} />
        <StatCard title="SEO Difficulty" value="35" subtitle="LOW" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="2.9K" icon={Link2} delay={2} />
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

      {/* Top Sources from AI Overview */}
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

      {/* Keyword Ideas */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          Keyword Ideas <span className="text-sm font-normal text-muted-foreground">for faculdade de economia sp</span>
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

export default GeoKeywordEconomiaSP;


