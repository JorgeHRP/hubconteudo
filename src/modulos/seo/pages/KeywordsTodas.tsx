import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { allKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";

const columns: EditableColumn<KeywordAnalysisRow>[] = [
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

const KeywordsTodas = () => (
  <div className="space-y-6">
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">Sobre esta aba</h3>
      <p className="text-sm text-foreground/80">
        Visão consolidada de <strong>todas as {allKeywords.length} palavras-chave analisadas</strong> para o projeto SEO da ESEG. Inclui volume de busca, dificuldade SEO/Paga, score e recomendação de investimento.
      </p>
    </div>
    <EditableDataTable
      data={allKeywords}
      columns={columns}
      title="Todas as Palavras-chave"
      createEmptyRow={createEmptyRow}
      groupBy="pillar"
      storageKey="keywords-todas"
      rowClassName={getRowClassName}
    />
  </div>
);

export default KeywordsTodas;


