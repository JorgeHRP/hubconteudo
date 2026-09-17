import { useState } from "react";
import { allKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";
import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
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
  if (val.includes("✅")) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (val.includes("⚠️")) return "bg-amber-100 dark:bg-amber-900/40";
  if (row.dificuldade?.includes("ESEG")) return "bg-blue-100 dark:bg-blue-900/40";
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
      <div className="glass-card p-5 border-2 border-primary/30">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          📋 Selecionadas ({selectedSimWords.length + selectedConsiderarWords.length})
        </h3>
        {selectedSimWords.length > 0 || selectedConsiderarWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedSimWords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">✅ Sim ({selectedSimWords.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSimWords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedConsiderarWords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">⚠️ Considerar ({selectedConsiderarWords.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedConsiderarWords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma palavra-chave selecionada ainda. Marque nas listas abaixo.</p>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">Total de keywords</p>
          <p className="text-3xl font-bold text-foreground mt-1">{simList.length + considerarList.length}</p>
          <p className="text-xs text-muted-foreground mt-1">analisadas</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">Volume total/mês</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalVolume.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">buscas estimadas</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">SEO Difficulty médio</p>
          <p className="text-3xl font-bold text-foreground mt-1">{avgKd.toFixed(1).replace(".", ",")}</p>
          <p className="text-xs text-muted-foreground mt-1">dificuldade baixa</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">CPC médio</p>
          <p className="text-3xl font-bold text-foreground mt-1">R$3,79</p>
          <p className="text-xs text-muted-foreground mt-1">valor comercial médio</p>
        </div>
      </div>

      {/* Classification */}
      <div className="glass-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Classificação das Keywords</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-emerald-200 dark:bg-emerald-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{simList.length}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">✅ Sim</p>
          </div>
          <div className="rounded-xl bg-amber-200 dark:bg-amber-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-amber-900 dark:text-amber-200">{considerarList.length}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">⚠️ Considerar</p>
          </div>
        </div>
      </div>

      {/* Keyword Lists with checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SIM list */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ✅ Sim ({simList.length})
            </h3>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={handleSave} className="h-7 px-2 text-xs">
                <Save className="w-3 h-3 mr-1" /> Salvar
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              value={newSim}
              onChange={e => setNewSim(e.target.value)}
              placeholder="Nova palavra-chave..."
              className="h-8 text-sm"
              onKeyDown={e => e.key === "Enter" && addSim()}
            />
            <Button size="sm" onClick={addSim} className="h-8 px-3">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {simList.map((kw, i) => (
              <label
                key={`${kw}-${i}`}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${
                  selectedSim.has(kw) ? "bg-emerald-100 dark:bg-emerald-900/40" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSim.has(kw)}
                  onChange={() => toggleSim(kw)}
                  className="w-3.5 h-3.5 rounded border-emerald-400 text-emerald-600 accent-emerald-600"
                />
                <span className="text-foreground">{kw}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CONSIDERAR list */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              ⚠️ Considerar ({considerarList.length})
            </h3>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={handleSave} className="h-7 px-2 text-xs">
                <Save className="w-3 h-3 mr-1" /> Salvar
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              value={newConsiderar}
              onChange={e => setNewConsiderar(e.target.value)}
              placeholder="Nova palavra-chave..."
              className="h-8 text-sm"
              onKeyDown={e => e.key === "Enter" && addConsiderar()}
            />
            <Button size="sm" onClick={addConsiderar} className="h-8 px-3">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {considerarList.map((kw, i) => (
              <label
                key={`${kw}-${i}`}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm ${
                  selectedConsiderar.has(kw) ? "bg-amber-100 dark:bg-amber-900/40" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedConsiderar.has(kw)}
                  onChange={() => toggleConsiderar(kw)}
                  className="w-3.5 h-3.5 rounded border-amber-400 text-amber-600 accent-amber-600"
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


