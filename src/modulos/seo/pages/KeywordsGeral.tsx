import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { geralKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";

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

const KeywordsGeral = () => (
  <div className="space-y-6">
    <div className="rounded-lg border bg-card p-4 shadow-card">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre esta aba</h3>
      <p className="text-sm text-foreground/80">
        Palavras-chave <strong>genéricas de cursos e áreas de conhecimento</strong> — termos de alto volume sem foco geográfico ou de marca.
      </p>
    </div>
    <EditableDataTable
      data={geralKeywords}
      columns={columns}
      title="Palavras-chave Gerais (33)"
      createEmptyRow={createEmptyRow}
      groupBy="pillar"
      storageKey="keywords-geral"
      rowClassName={getRowClassName}
    />
  </div>
);

export default KeywordsGeral;


