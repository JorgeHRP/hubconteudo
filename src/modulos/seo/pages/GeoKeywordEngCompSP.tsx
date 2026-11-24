import { Search, Shield, Link2, Sparkles, HelpCircle, Globe } from "lucide-react";
import StatCard from "@/modulos/seo/components/StatCard";
import geminiLogo from "@/assets/gemini-logo.svg";
import chatgptLogo from "@/assets/chatgpt-logo.svg";

const intentData = [
  { label: "Informational", pct: 50, color: "bg-info" },
  { label: "Commercial", pct: 25, color: "bg-warning" },
  { label: "Navigational", pct: 13, color: "bg-accent" },
  { label: "Transactional", pct: 13, color: "bg-success" },
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
      <div className="rounded-lg border bg-card px-5 py-4 shadow-card">
        <h3 className="font-display text-base font-semibold leading-tight text-foreground">
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
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <div className="flex h-full min-h-[10rem] flex-col items-center justify-center p-5 text-center">
            <p className="text-sm font-semibold text-foreground">No search volume data</p>
            <p className="text-xs text-muted-foreground mt-1">No search volume data available for this keyword. Use a broader term to populate this chart.</p>
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
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brands Mentioned</span>
          </div>
          <div className="divide-y">
            {aiPrompts.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-muted/50">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <SourceIcon source={item.source} />
                  <span className="text-sm text-foreground/80">{item.prompt}</span>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground max-sm:hidden">Get AI Response</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoKeywordEngCompSP;


