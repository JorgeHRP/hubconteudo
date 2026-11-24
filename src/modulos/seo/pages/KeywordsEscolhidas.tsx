import { useState } from "react";
import { allKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";
import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";

const escolhidas = allKeywords.filter(k => k.valeInvestir.includes("✅") || k.valeInvestir.includes("⚠️"));

const kwColumns: EditableColumn<KeywordAnalysisRow>[] = [
  { header: "Palavra-chave", key: "keyword", width: "280px" },
  { header: "Volume", key: "volume", type: "number" },
  { header: "KD SEO", key: "difSeo", type: "number" },
  { header: "KD Paga", key: "difPaga", type: "number" },
  { header: "Dificuldade", key: "dificuldade" },
  { header: "Prazo", key: "prazo" },
  { header: "Score", key: "score", type: "number" },
  { header: "Vale Investir", key: "valeInvestir" },
  { header: "Pillar Page", key: "pillarPage", type: "url", width: "250px" },
  { header: "Oportunidade", key: "opportunity", type: "star" },
];

const createEmptyRow = (): KeywordAnalysisRow => ({
  keyword: "", volume: 0, difSeo: 0, difPaga: 0, dificuldade: "", prazo: "", score: 0, valeInvestir: "", pillarPage: "", pillar: "", opportunity: false,
});

const getRowClassName = (row: KeywordAnalysisRow): string => {
  const val = row.valeInvestir || "";
  if (val.includes("✅")) return "bg-success/10";
  if (val.includes("⚠️")) return "bg-warning/15";
  if (row.dificuldade?.includes("ESEG")) return "bg-info/10";
  return "";
};

const LISTS_KEY = "keywords-escolhidas-lists";
const SELECTED_KEY = "keywords-escolhidas-selected";

const defaultSim = allKeywords
  .filter(k => k.valeInvestir.includes("✅"))
  .map(k => k.keyword);

const defaultConsiderar = allKeywords
  .filter(k => k.valeInvestir.includes("⚠️"))
  .map(k => k.keyword);

interface ListsShape { sim: string[]; considerar: string[]; }
interface SelectedShape { sim: string[]; considerar: string[]; }

const KeywordsEscolhidas = () => {
  const tracker = useModificationTracker(LISTS_KEY);
  const comecaVazio = useComecaVazio();
  const { value: lists, save: saveLists } = useSharedData<ListsShape>(
    LISTS_KEY,
    comecaVazio ? { sim: [], considerar: [] } : { sim: defaultSim, considerar: defaultConsiderar }
  );
  // Seleções armazenadas por palavra (não por índice) para sobreviver a edições/realtime
  const { value: selected, save: saveSelected } = useSharedData<SelectedShape>(
    SELECTED_KEY,
    { sim: [], considerar: [] }
  );

  const simList = lists.sim;
  const considerarList = lists.considerar;
  const selectedSim = new Set(selected.sim);
  const selectedConsiderar = new Set(selected.considerar);

  const [newSim, setNewSim] = useState("");
  const [newConsiderar, setNewConsiderar] = useState("");

  const updateLists = async (next: ListsShape, changeMsg: string) => {
    await saveLists(next);
    tracker.trackSave(changeMsg);
  };

  const updateSelected = async (next: SelectedShape) => {
    await saveSelected(next);
  };

  const totalVolume = allKeywords
    .filter(k => k.valeInvestir.includes("✅") || k.valeInvestir.includes("⚠️"))
    .reduce((s, k) => s + k.volume, 0);

  const avgKd = (() => {
    const filtered = allKeywords.filter(k => k.valeInvestir.includes("✅") || k.valeInvestir.includes("⚠️"));
    return filtered.reduce((s, k) => s + k.difSeo, 0) / filtered.length;
  })();

  const handleSave = async () => {
    await saveLists({ sim: simList, considerar: considerarList });
    tracker.trackSave("Salvamento manual da lista");
    toast.success("Lista salva e compartilhada!");
  };

  const addSim = async () => {
    const v = newSim.trim();
    if (!v) return;
    const next = { sim: [...simList, v], considerar: considerarList };
    setNewSim("");
    await updateLists(next, `Adicionou "${v}" em Sim`);
  };

  const addConsiderar = async () => {
    const v = newConsiderar.trim();
    if (!v) return;
    const next = { sim: simList, considerar: [...considerarList, v] };
    setNewConsiderar("");
    await updateLists(next, `Adicionou "${v}" em Considerar`);
  };



  const toggleSim = async (kw: string) => {
    const next = new Set(selectedSim);
    next.has(kw) ? next.delete(kw) : next.add(kw);
    await updateSelected({ sim: Array.from(next), considerar: Array.from(selectedConsiderar) });
    tracker.trackSave(`${next.has(kw) ? "Marcou" : "Desmarcou"} "${kw}" em Sim`);
  };

  const toggleConsiderar = async (kw: string) => {
    const next = new Set(selectedConsiderar);
    next.has(kw) ? next.delete(kw) : next.add(kw);
    await updateSelected({ sim: Array.from(selectedSim), considerar: Array.from(next) });
    tracker.trackSave(`${next.has(kw) ? "Marcou" : "Desmarcou"} "${kw}" em Considerar`);
  };

  const selectedSimWords = simList.filter(kw => selectedSim.has(kw));
  const selectedConsiderarWords = considerarList.filter(kw => selectedConsiderar.has(kw));

  return (
    <div className="space-y-6">
      {/* Confirmation box - always visible at top */}
      <div className="rounded-lg border border-primary/30 bg-card p-4 shadow-card sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          📋 Selecionadas ({selectedSimWords.length + selectedConsiderarWords.length})
        </h3>
        {selectedSimWords.length > 0 || selectedConsiderarWords.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {selectedSimWords.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-success">✅ Sim ({selectedSimWords.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSimWords.map((kw, i) => (
                    <Badge key={i} variant="success" className="font-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedConsiderarWords.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-warning-strong">⚠️ Considerar ({selectedConsiderarWords.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedConsiderarWords.map((kw, i) => (
                    <Badge key={i} variant="warning" className="font-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma palavra-chave selecionada ainda. Marque nas listas abaixo.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total de keywords</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{simList.length + considerarList.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">analisadas</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Volume total/mês</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{totalVolume.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">buscas estimadas</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">SEO Difficulty médio</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{avgKd.toFixed(1).replace(".", ",")}</p>
          <p className="mt-1 text-xs text-muted-foreground">dificuldade baixa</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">CPC médio</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">R$3,79</p>
          <p className="mt-1 text-xs text-muted-foreground">valor comercial médio</p>
        </div>
      </div>

      {/* Classification */}
      <div className="rounded-lg border bg-card p-4 shadow-card sm:p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classificação das Keywords</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-md border border-success/20 bg-success/10 p-4 text-center">
            <p className="font-display text-2xl font-semibold text-success">{simList.length}</p>
            <p className="mt-1 text-sm text-success">✅ Sim</p>
          </div>
          <div className="rounded-md border border-warning/30 bg-warning/15 p-4 text-center">
            <p className="font-display text-2xl font-semibold text-warning-strong">{considerarList.length}</p>
            <p className="mt-1 text-sm text-warning-strong">⚠️ Considerar</p>
          </div>
        </div>
      </div>

      {/* Keyword Lists with checkboxes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* SIM list */}
        <div className="rounded-lg border bg-card p-4 shadow-card sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-success">
              ✅ Sim ({simList.length})
            </h3>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={handleSave} className="h-9 px-3 text-xs">
                <Save className="mr-1 h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          </div>
          <div className="mb-3 flex gap-2">
            <Input
              value={newSim}
              onChange={e => setNewSim(e.target.value)}
              placeholder="Nova palavra-chave..."
              aria-label="Nova palavra-chave para a lista Sim"
              className="h-9 text-sm"
              onKeyDown={e => e.key === "Enter" && addSim()}
            />
            <Button size="sm" onClick={addSim} className="h-9 w-9 shrink-0 px-0" aria-label="Adicionar palavra-chave à lista Sim">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
            {simList.map((kw, i) => (
              <label
                key={`${kw}-${i}`}
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedSim.has(kw) ? "bg-success/10" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSim.has(kw)}
                  onChange={() => toggleSim(kw)}
                  className="h-4 w-4 shrink-0 rounded border-input accent-[hsl(var(--success))]"
                />
                <span className="text-foreground">{kw}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CONSIDERAR list */}
        <div className="rounded-lg border bg-card p-4 shadow-card sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-warning-strong">
              ⚠️ Considerar ({considerarList.length})
            </h3>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={handleSave} className="h-9 px-3 text-xs">
                <Save className="mr-1 h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          </div>
          <div className="mb-3 flex gap-2">
            <Input
              value={newConsiderar}
              onChange={e => setNewConsiderar(e.target.value)}
              placeholder="Nova palavra-chave..."
              aria-label="Nova palavra-chave para a lista Considerar"
              className="h-9 text-sm"
              onKeyDown={e => e.key === "Enter" && addConsiderar()}
            />
            <Button size="sm" onClick={addConsiderar} className="h-9 w-9 shrink-0 px-0" aria-label="Adicionar palavra-chave à lista Considerar">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
            {considerarList.map((kw, i) => (
              <label
                key={`${kw}-${i}`}
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedConsiderar.has(kw) ? "bg-warning/15" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedConsiderar.has(kw)}
                  onChange={() => toggleConsiderar(kw)}
                  className="h-4 w-4 shrink-0 rounded border-input accent-[hsl(var(--warning))]"
                />
                <span className="text-foreground">{kw}</span>
              </label>
            ))}
          </div>
        </div>
      </div>


      <EditableDataTable
        data={escolhidas}
        columns={kwColumns}
        title="Palavras-chave Escolhidas"
        createEmptyRow={createEmptyRow}
        groupBy="pillar"
        storageKey="keywords-escolhidas"
        rowClassName={getRowClassName}
      />
    </div>
  );
};

export default KeywordsEscolhidas;


