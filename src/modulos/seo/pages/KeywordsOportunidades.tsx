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
  if (val.includes("✅")) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (val.includes("⚠️")) return "bg-amber-100 dark:bg-amber-900/40";
  if (row.dificuldade?.includes("ESEG")) return "bg-blue-100 dark:bg-blue-900/40";
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
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">Total oportunidades</p>
          <p className="text-3xl font-bold text-foreground mt-1">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">palavras selecionadas</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-muted-foreground">Volume total/mês</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalVolume.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">buscas estimadas</p>
        </div>
        <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 p-5">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">✅ Investir</p>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{sim}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">alta prioridade</p>
        </div>
        <div className="rounded-xl bg-amber-100 dark:bg-amber-900/40 p-5">
          <p className="text-xs text-amber-700 dark:text-amber-300">⚠️ Considerar</p>
          <p className="text-3xl font-bold text-amber-900 dark:text-amber-200 mt-1">{considerar}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">potencial</p>
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


