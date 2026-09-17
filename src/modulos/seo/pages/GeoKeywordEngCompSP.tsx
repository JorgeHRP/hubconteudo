import { Search, Shield, Link2, Sparkles, HelpCircle, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const intentData = [
  { label: "Informational", pct: 50, color: "bg-blue-500" },
  { label: "Commercial", pct: 25, color: "bg-amber-500" },
  { label: "Navigational", pct: 13, color: "bg-purple-500" },
  { label: "Transactional", pct: 13, color: "bg-emerald-500" },
];

const topSources = [
  "youtube.com",
  "querobolsa.com.br",
  "sp.senac.br",
  "uspprofissoes.usp.br",
  "fiap.com.br",
  "unip.br",
  "eseg.edu.br",
  "anhanguera.com",
];

const aiPrompts = [
  { prompt: "Quais são os melhores cursos de engenharia da computação em São Paulo?", source: "gemini" },
  { prompt: "Grade curricular de engenharia da computação em São Paulo", source: "chatgpt" },
  { prompt: "Onde encontro faculdades reconhecidas de engenharia da computação em SP?", source: "gemini" },
  { prompt: "Melhores cursos de engenharia da computação em São Paulo", source: "chatgpt" },
  { prompt: "Qual é o preço médio das mensalidades para engenharia da computação em SP?", source: "gemini" },
  { prompt: "Faculdades públicas com engenharia da computação na capital paulista", source: "chatgpt" },
  { prompt: "Quais instituições oferecem cursos de engenharia da computação com bolsa em SP?", source: "gemini" },
  { prompt: "Custo médio mensal de engenharia da computação em São Paulo", source: "chatgpt" },
  { prompt: "Como faço inscrição em um curso de engenharia da computação em SP?", source: "gemini" },
  { prompt: "Requisitos para ingressar em engenharia da computação em SP", source: "chatgpt" },
];

const SourceIcon = ({ source }: { source: string }) => {
  if (source === "gemini") {
    return <img src={geminiLogo} alt="Gemini" className="h-5 w-5 flex-shrink-0" />;
  }
  return <img src={chatgptLogo} alt="ChatGPT" className="h-5 w-5 flex-shrink-0" />;
};

const GeoKeywordEngCompSP = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-foreground">
          Summary <span className="text-sm font-normal text-muted-foreground">for</span>{" "}
          <span className="underline decoration-primary/30">curso de engenharia da computação são paulo</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Keyword Search Volume" value="—" icon={Search} subtitle="Sem dados" delay={0} />
        <StatCard title="SEO Difficulty" value="4" subtitle="LOW" icon={Shield} delay={1} />
        <StatCard title="Top Pages Backlinks" value="3" icon={Link2} delay={2} />
        <StatCard title="AI Visibility" value="Alto" subtitle="Presente em 2 IAs" icon={Sparkles} delay={3} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-4">
          <div className="flex flex-col items-center justify-center h-[120px] text-center">
            <p className="text-sm font-semibold text-foreground">No search volume data</p>
            <p className="text-xs text-muted-foreground mt-1">No search volume data available for this keyword. Use a broader term to populate this chart.</p>
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
            <span className="text-xs font-semibold text-muted-foreground">Brands Mentioned</span>
          </div>
          <div className="divide-y divide-border/30">
            {aiPrompts.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2 flex-1 pr-4">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-foreground/80">{item.prompt}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">Get AI Response</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoKeywordEngCompSP;


