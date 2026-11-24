import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { spKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";

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
  if (val.includes("✅")) return "bg-success/10";
  if (val.includes("⚠️")) return "bg-warning/15";
  if (row.dificuldade?.includes("ESEG")) return "bg-info/10";
  return "";
};

const KeywordsSP = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-card p-4 shadow-card">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre esta aba</h3>
      <p className="text-sm text-foreground/80">
        Palavras-chave com foco <strong>regional em São Paulo</strong> — SEO local para captar alunos na cidade.
      </p>
    </div>
    <EditableDataTable
      data={spKeywords}
      columns={columns}
      title="Palavras-chave São Paulo (80)"
      createEmptyRow={createEmptyRow}
      groupBy="pillar"
      storageKey="keywords-sp"
      rowClassName={getRowClassName}
    />
  </div>
);

export default KeywordsSP;


