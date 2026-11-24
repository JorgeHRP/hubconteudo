import { useState } from "react";
import { Bot, Sparkles, Search, FileText, BarChart3, ArrowRight, CheckCircle2, Zap, Globe, MessageSquare, Brain, Target, Newspaper, Link2, Quote, Shield, TrendingUp, Award, ExternalLink, Users } from "lucide-react";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

const steps = [
  {
    icon: Search,
    title: "1. Pesquisa de Intenção",
    desc: "O usuário faz uma pergunta a uma IA generativa (ChatGPT, Gemini, Perplexity…)",
    color: "bg-primary",
  },
  {
    icon: Brain,
    title: "2. Processamento da IA",
    desc: "A IA analisa milhões de fontes, ranqueia por autoridade, relevância e frescor do conteúdo",
    color: "bg-primary",
  },
  {
    icon: FileText,
    title: "3. Citação de Fontes",
    desc: "A IA seleciona e cita as fontes mais confiáveis na resposta — aqui entra o GEO",
    color: "bg-primary",
  },
  {
    icon: Target,
    title: "4. Visibilidade da Marca",
    desc: "Seu conteúdo aparece como referência na resposta, gerando tráfego e autoridade",
    color: "bg-primary",
  },
];

const tactics = [
  { icon: FileText, title: "Conteúdo Estruturado", desc: "Use headings claros, listas, tabelas e FAQ schema para facilitar a extração pela IA." },
  { icon: MessageSquare, title: "Responda Perguntas Diretamente", desc: "Comece parágrafos com respostas objetivas. IAs priorizam conteúdo que responde de forma concisa." },
  { icon: Globe, title: "Autoridade & E-E-A-T", desc: "Cite fontes, mostre expertise do autor, inclua dados verificáveis e atualizados." },
  { icon: BarChart3, title: "Dados Originais", desc: "Pesquisas, estatísticas próprias e benchmarks aumentam a chance de citação." },
  { icon: Zap, title: "Frescor do Conteúdo", desc: "Mantenha conteúdo atualizado. IAs favorecem informações recentes e revisadas." },
  { icon: Bot, title: "Menções em Múltiplas Fontes", desc: "Seja citado em fóruns, redes sociais e sites de autoridade para reforçar presença." },
];

const GeoOverview = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="GEO — Visão geral"
        descricao="Panorama de presença em IA"
        oQueEntraAqui="Aqui entra o panorama de presença deste cliente nas respostas de IA."
      />
    );
  }

  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="space-y-6">
      {/* O que é GEO */}
      <div className="space-y-5 overflow-hidden rounded-lg border bg-card p-5 shadow-card">
        <div className="-mx-5 -mt-5 flex items-center gap-3 border-b px-5 py-4">
          <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-foreground">O que é GEO?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Generative Engine Optimization</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-foreground/80 leading-relaxed">
              <strong>GEO (Generative Engine Optimization)</strong> é a prática de otimizar conteúdo para que ele seja 
              <strong> citado e referenciado por IAs generativas</strong> como ChatGPT, Google Gemini, Perplexity e Microsoft Copilot.
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Diferente do SEO tradicional, que foca em rankear nos resultados de busca, o GEO foca em fazer seu conteúdo 
              ser <strong>a fonte escolhida</strong> quando uma IA responde a uma pergunta do usuário.
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Com o crescimento das buscas via IA (estimativa de <strong>40% dos usuários</strong> já usando IA para pesquisas em 2025), 
              estar presente nas respostas generativas é essencial para a visibilidade da marca.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO vs GEO</h3>
            <div className="space-y-2">
              {[
                { seo: "Ranquear em links azuis", geo: "Ser citado na resposta da IA" },
                { seo: "Palavras-chave no título", geo: "Responder perguntas de forma direta" },
                { seo: "Backlinks", geo: "Menções em múltiplas fontes" },
                { seo: "CTR na SERP", geo: "Frequência de citação" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 rounded-md bg-muted p-2 text-muted-foreground">{row.seo}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" aria-hidden />
                  <span className="flex-1 rounded-md bg-primary/10 p-2 font-medium text-foreground">{row.geo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Infográfico Animado — Como Aparecer nas IAs */}
      <div className="space-y-5 overflow-hidden rounded-lg border bg-card p-5 shadow-card">
        <div className="-mx-5 -mt-5 flex items-center gap-3 border-b px-5 py-4">
          <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-foreground">Como Aparecer nas IAs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">O caminho do conteúdo até a citação</p>
          </div>
        </div>

        {/* Animated Timeline */}
        <div className="space-y-6">
          {/* Icons + Progress Bar Row */}
          <div className="relative flex items-center justify-between px-4 md:px-12">
            {/* Progress line behind icons */}
            <div className="absolute left-12 right-12 top-1/2 hidden h-1 -translate-y-1/2 rounded-full bg-muted md:block">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === activeStep;
              const isPast = i <= activeStep;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  type="button"
                  aria-label={step.title}
                  aria-pressed={isActive}
                  className="relative z-10 flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ${
                    isActive ? `border-transparent ${step.color}` : isPast ? "border-success/30 bg-card" : "bg-muted"
                  }`}>
                    {isPast && !isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Text Cards Row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              const isPast = i <= activeStep;
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  type="button"
                  aria-pressed={isActive}
                  className={`rounded-md border p-4 text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    isActive
                      ? "border-primary/30 bg-primary/5"
                      : isPast
                      ? "bg-card hover:bg-muted/50"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <h4 className={`mb-1 font-display text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                    isActive ? "text-foreground/80" : "text-muted-foreground"
                  }`}>
                    {step.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-advance */}
        <div className="flex justify-center">
          {steps.map((step, i) => (
            <button
              key={i}
              type="button"
              aria-label={step.title}
              aria-pressed={i === activeStep}
              onClick={() => setActiveStep(i)}
              className="group flex h-9 min-w-[1.75rem] items-center justify-center rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeStep ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Táticas para Aparecer */}
      <div className="space-y-5 overflow-hidden rounded-lg border bg-card p-5 shadow-card">
        <h2 className="-mx-5 -mt-5 border-b px-5 py-4 font-display text-base font-semibold leading-tight text-foreground">Táticas para Aparecer nas Respostas de IA</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tactics.map((tactic, i) => {
            const Icon = tactic.icon;
            return (
              <div
                key={i}
                className="rounded-md border p-4"
              >
                <div className="flex items-start gap-3">
                  <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-semibold text-foreground">{tactic.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tactic.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessoria de Imprensa | Digital PR */}
      <div className="space-y-5 overflow-hidden rounded-lg border bg-card p-5 shadow-card">
        <div className="-mx-5 -mt-5 flex items-center gap-3 border-b px-5 py-4">
          <div aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Newspaper className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-foreground">Assessoria de Imprensa | Digital PR</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Estratégia essencial para autoridade de domínio e citações em IA</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">
          A <strong>Assessoria de Imprensa Digital (Digital PR)</strong> é um dos pilares mais importantes para o sucesso em SEO + GEO. 
          Ela atua diretamente no <strong>aumento da autoridade de domínio (DA)</strong> da ESEG, gerando menções, backlinks de qualidade 
          e citações em veículos de alta credibilidade — fatores que as IAs generativas utilizam para decidir quais fontes referenciar.
        </p>

        {/* Por que é importante */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-foreground">Por que é importante para a ESEG?</h3>
            </div>
            <ul className="space-y-2">
              {[
                "IAs como ChatGPT e Gemini priorizam fontes com alta autoridade de domínio",
                "Backlinks de portais de notícia aumentam o DA significativamente",
                "Menções em veículos confiáveis reforçam o E-E-A-T (Experiência, Expertise, Autoridade, Confiança)",
                "Quanto mais citada a ESEG for em fontes diversas, maior a chance de aparecer nas respostas de IA",
                "Digital PR gera tráfego de referência qualificado além do orgânico",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-foreground">Impacto no GEO</h3>
            </div>
            <ul className="space-y-2">
              {[
                "Fontes citadas em múltiplos veículos têm maior peso nas respostas generativas",
                "IAs cruzam referências — ser mencionado em 5+ fontes aumenta exponencialmente a citação",
                "Conteúdo da ESEG publicado em portais de autoridade é indexado mais rápido",
                "Press releases com dados originais da ESEG viram referência para IAs",
                "Entrevistas e artigos de opinião de professores aumentam a expertise percebida",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fontes Citadas & Backlinks */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-foreground">Fontes Citadas</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Quando a ESEG é mencionada como fonte em portais de notícia, blogs especializados e publicações acadêmicas, 
              as IAs generativas passam a reconhecer a instituição como <strong>autoridade no tema</strong>.
            </p>
            <div className="space-y-2">
              {[
                { type: "Portais de Educação", desc: "Guia do Estudante, Quero Bolsa, Educa Mais Brasil" },
                { type: "Veículos de Imprensa", desc: "Folha, Estadão, Valor Econômico, Exame" },
                { type: "Publicações Acadêmicas", desc: "Artigos e pesquisas em revistas indexadas" },
                { type: "Blogs & Influenciadores", desc: "Especialistas em educação e carreira" },
              ].map((source, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <ExternalLink className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden />
                  <div>
                    <span className="font-semibold text-foreground">{source.type}:</span>{" "}
                    <span className="text-muted-foreground">{source.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-accent" aria-hidden />
              <h3 className="font-display text-sm font-semibold text-foreground">Backlinks de Qualidade</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cada menção em um veículo de autoridade gera um <strong>backlink valioso</strong> que aumenta o Domain Authority (DA) 
              da ESEG, melhorando tanto o ranqueamento orgânico quanto a presença em respostas de IA.
            </p>
            <div className="space-y-2">
              {[
                { metric: "DA 60+", desc: "Links de portais como Folha, Estadão — alto impacto" },
                { metric: "DA 40-60", desc: "Links de portais de educação — impacto médio-alto" },
                { metric: "DA 20-40", desc: "Links de blogs e sites regionais — impacto consistente" },
                { metric: "Diversidade", desc: "Links de domínios variados valem mais que muitos do mesmo" },
              ].map((bl, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Award className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-accent" aria-hidden />
                  <div>
                    <span className="font-semibold text-foreground">{bl.metric}:</span>{" "}
                    <span className="text-muted-foreground">{bl.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estratégias de Digital PR */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" aria-hidden />
            <h3 className="font-display text-sm font-semibold text-foreground">Estratégias de Digital PR para a ESEG</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Press Releases", desc: "Divulgar pesquisas, rankings, novos cursos e conquistas da ESEG para a imprensa" },
              { title: "Artigos de Opinião", desc: "Professores e coordenadores publicando em veículos como especialistas" },
              { title: "Dados & Pesquisas", desc: "Produzir estudos originais que sirvam de fonte para jornalistas e IAs" },
              { title: "Eventos & Webinars", desc: "Cobertura de imprensa de eventos acadêmicos e parcerias institucionais" },
              { title: "Parcerias Editoriais", desc: "Colaborações com portais de educação para conteúdo co-branded" },
              { title: "Gestão de Menções", desc: "Monitorar e amplificar menções espontâneas da ESEG na mídia e redes" },
            ].map((strategy, i) => (
              <div key={i} className="rounded-md bg-muted/50 p-3">
                <h4 className="mb-1 text-sm font-semibold text-foreground">{strategy.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{strategy.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoOverview;


