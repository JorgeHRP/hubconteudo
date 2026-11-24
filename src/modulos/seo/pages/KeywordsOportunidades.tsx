import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { allKeywords, type KeywordAnalysisRow } from "@/modulos/seo/data/keywordsAnalysisData";

// Keywords that must always be included
const mustInclude = [
  "faculdade particular são paulo",
  "cursos de graduação",
  "tipos de graduação",
  "curso de administração",
  "faculdade de administração",
  "bacharel em administração",
  "graduação em administração",
  "faculdade de advocacia",
  "quanto tempo dura a faculdade de direito",
  "faculdades de direito são paulo",
  "economia faculdade",
  "graduação em economia",
  "faculdade de economia sp",
  "faculdade de engenharia da computação",
  "curso de engenharia da computação",
  "graduação engenharia da computação",
  "engenharia de produção",
  "faculdade engenharia de produção",
  "curso de engenharia de produção",
  "graduação em engenharia de produção",
  "curso de gestão de empresa",
  "curso de gestão empresarial",
  "curso gestão de negócios",
  "pós graduação presencial sp",
  "cursos profissionalizantes",
  "cursos técnicos são paulo",
];

const oportunidades = allKeywords.filter(k => {
  const val = k.valeInvestir || "";
  if (val.includes("✅") || val.includes("⚠️")) return true;
  if (mustInclude.includes(k.keyword.toLowerCase())) return true;
  return false;
});

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

const KeywordsOportunidades = () => {
  const total = oportunidades.length;
  const totalVolume = oportunidades.reduce((s, k) => s + k.volume, 0);
  const sim = oportunidades.filter(k => k.valeInvestir.includes("✅")).length;
  const considerar = oportunidades.filter(k => k.valeInvestir.includes("⚠️")).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total oportunidades</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{total}</p>
          <p className="mt-1 text-xs text-muted-foreground">palavras selecionadas</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Volume total/mês</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{totalVolume.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-xs text-muted-foreground">buscas estimadas</p>
        </div>
        <div className="rounded-lg border border-success/20 bg-success/10 p-4">
          <p className="text-xs font-medium text-success">✅ Investir</p>
          <p className="mt-1 font-display text-2xl font-semibold text-success">{sim}</p>
          <p className="mt-1 text-xs text-muted-foreground">alta prioridade</p>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/15 p-4">
          <p className="text-xs font-medium text-warning-strong">⚠️ Considerar</p>
          <p className="mt-1 font-display text-2xl font-semibold text-warning-strong">{considerar}</p>
          <p className="mt-1 text-xs text-muted-foreground">potencial</p>
        </div>
      </div>

      <EditableDataTable
        data={oportunidades}
        columns={columns}
        title="Oportunidades"
        createEmptyRow={createEmptyRow}
        groupBy="pillar"
        storageKey="keywords-oportunidades"
        rowClassName={getRowClassName}
      />
    </div>
  );
};

export default KeywordsOportunidades;


