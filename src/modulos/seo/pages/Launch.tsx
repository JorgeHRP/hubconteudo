import { useState } from "react";
import { Check, Send, Sparkles, FileText, Link2, Globe, KeyRound, Settings, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

interface Update {
  id: number;
  category: string;
  text: string;
  week: string;
  month: string;
  timestamp: string;
}

const categories = [
  { value: "conteudo", label: "Conteúdo", icon: PenTool, suggestions: [
    "Publicação do artigo sobre [tema] no blog",
    "Revisão e otimização de [X] artigos existentes",
    "Briefing criado para novo artigo: [título]",
    "Atualização de conteúdo antigo: [URL]",
  ]},
  { value: "onpage", label: "SEO On-Page", icon: Globe, suggestions: [
    "Otimização de meta tags em [X] páginas",
    "Implementação de Schema [tipo] na página [URL]",
    "Revisão de heading tags (H1-H3) em [X] páginas",
    "Atualização de alt text em [X] imagens",
    "Correção de canonical tags em [X] URLs",
  ]},
  { value: "linkbuilding", label: "Link Building", icon: Link2, suggestions: [
    "Backlink conquistado: [domínio] (DA [X])",
    "Outreach para [X] sites de educação",
    "Guest post publicado em [domínio]",
    "[X] propostas de parceria enviadas",
  ]},
  { value: "keywords", label: "Palavras-chave", icon: KeyRound, suggestions: [
    "[X] keywords subiram para o top 10",
    "Nova keyword rastreada: [keyword] (vol. [X])",
    "Posição média melhorou de [X] para [Y]",
    "Análise de gap identificou [X] oportunidades",
  ]},
  { value: "tecnico", label: "Técnico", icon: Settings, suggestions: [
    "Correção de [X] erros de indexação",
    "Melhoria de Core Web Vitals: LCP de [X]s para [Y]s",
    "Atualização de sitemap.xml com [X] novas URLs",
    "Correção de redirecionamentos 301 em [X] URLs",
    "Otimização de velocidade: compressão de imagens em [X] páginas",
  ]},
  { value: "analise", label: "Análises", icon: FileText, suggestions: [
    "Relatório de concorrentes: [concorrente] lançou [X] novos artigos",
    "Análise de CTR no Search Console — [X] páginas com CTR abaixo de 2%",
    "Auditoria de backlinks: [X] links tóxicos identificados",
    "Análise de lacunas vs [concorrente] concluída",
  ]},
];

const months = ["Abril 2026", "Março 2026", "Fevereiro 2026", "Janeiro 2026"];
const weeks = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

const Launch = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Lançamento"
        descricao="Cronograma de publicação por mês e semana"
        oQueEntraAqui="Aqui entra o cronograma de publicação deste cliente, mês a mês."
      />
    );
  }

  const [selectedCategory, setSelectedCategory] = useState("conteudo");
  const [selectedMonth, setSelectedMonth] = useState("Abril 2026");
  const [selectedWeek, setSelectedWeek] = useState("Semana 1");
  const [customText, setCustomText] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [updates, setUpdates] = useState<Update[]>([]);

  const currentCategory = categories.find(c => c.value === selectedCategory)!;

  const toggleSuggestion = (index: number) => {
    const next = new Set(selectedSuggestions);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedSuggestions(next);
  };

  const handlePublish = () => {
    const items: string[] = [];

    selectedSuggestions.forEach(i => {
      if (currentCategory.suggestions[i]) {
        items.push(currentCategory.suggestions[i]);
      }
    });

    if (customText.trim()) {
      items.push(customText.trim());
    }

    if (items.length === 0) {
      toast.error("Selecione ou escreva pelo menos uma atualização");
      return;
    }

    const newUpdates = items.map((text, i) => ({
      id: Date.now() + i,
      category: currentCategory.label,
      text,
      week: selectedWeek,
      month: selectedMonth,
      timestamp: new Date().toLocaleString("pt-BR"),
    }));

    setUpdates(prev => [...newUpdates, ...prev]);
    setSelectedSuggestions(new Set());
    setCustomText("");
    toast.success(`${items.length} atualização(ões) lançada(s)!`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Lançamento de Atualizações</h2>
        <p className="text-muted-foreground text-sm mt-1">Selecione ou escreva o que foi feito para adicionar às Atualizações Semanais</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]" aria-label="Mês"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[140px]" aria-label="Semana"><SelectValue /></SelectTrigger>
          <SelectContent>
            {weeks.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => { setSelectedCategory(cat.value); setSelectedSuggestions(new Set()); }}
              aria-pressed={selectedCategory === cat.value}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                selectedCategory === cat.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sugestões */}
      <div className="rounded-lg border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <h3 className="font-display text-base font-semibold text-foreground">Sugestões — {currentCategory.label}</h3>
        </div>
        <div className="space-y-2">
          {currentCategory.suggestions.map((suggestion, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                selectedSuggestions.has(i) ? "border-primary/30 bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={selectedSuggestions.has(i)}
                onCheckedChange={() => toggleSuggestion(i)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground">{suggestion}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Ou escreva sua própria atualização:</p>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Ex: Publicação do artigo sobre MBA em Gestão..."
            aria-label="Sua própria atualização"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handlePublish} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            Lançar Atualização ({selectedSuggestions.size + (customText.trim() ? 1 : 0)})
          </Button>
        </div>
      </div>

      {/* Histórico */}
      {updates.length > 0 && (
        <div className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="mb-1 font-display text-base font-semibold text-foreground">Atualizações Lançadas</h3>
          <ul className="divide-y">
            {updates.map(update => (
              <li key={update.id} className="flex items-start gap-3 py-3 last:pb-0">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{update.text}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-info/20 bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{update.category}</span>
                    <span className="text-xs text-muted-foreground">{update.month} • {update.week}</span>
                    <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Launch;


