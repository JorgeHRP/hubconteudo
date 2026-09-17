import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { competitorData } from "@/modulos/seo/data/sampleData";

type CompRow = {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  esegPos: number;
  esegUrl: string;
  fgvPos: number;
  fgvUrl: string;
  insperPos: number;
  insperUrl: string;
  mackenziePos: number;
  mackenzieUrl: string;
  saoJudasPos: number;
  saoJudasUrl: string;
  mauaPos: number;
  mauaUrl: string;
};

const flatData: CompRow[] = competitorData.map(r => ({
  keyword: r.keyword,
  volume: r.volume,
  difficulty: r.difficulty,
  cpc: r.cpc,
  esegPos: r.eseg.position,
  esegUrl: r.eseg.url,
  fgvPos: r.fgv.position,
  fgvUrl: r.fgv.url,
  insperPos: r.insper.position,
  insperUrl: r.insper.url,
  mackenziePos: r.mackenzie.position,
  mackenzieUrl: r.mackenzie.url,
  saoJudasPos: r.saoJudas.position,
  saoJudasUrl: r.saoJudas.url,
  mauaPos: r.maua.position,
  mauaUrl: r.maua.url,
}));

const columns: EditableColumn<CompRow>[] = [
  { header: "Keyword", key: "keyword", width: "180px" },
  { header: "Volume", key: "volume", type: "number" },
  { header: "Difficulty", key: "difficulty", type: "number" },
  { header: "CPC", key: "cpc", type: "number" },
  { header: "ESEG Pos", key: "esegPos", type: "number" },
  { header: "ESEG URL", key: "esegUrl", type: "url", width: "160px" },
  { header: "FGV Pos", key: "fgvPos", type: "number" },
  { header: "FGV URL", key: "fgvUrl", type: "url", width: "140px" },
  { header: "INSPER Pos", key: "insperPos", type: "number" },
  { header: "INSPER URL", key: "insperUrl", type: "url", width: "140px" },
  { header: "MACKENZIE Pos", key: "mackenziePos", type: "number" },
  { header: "MACKENZIE URL", key: "mackenzieUrl", type: "url", width: "140px" },
  { header: "São Judas Pos", key: "saoJudasPos", type: "number" },
  { header: "São Judas URL", key: "saoJudasUrl", type: "url", width: "140px" },
  { header: "MAUÁ Pos", key: "mauaPos", type: "number" },
  { header: "MAUÁ URL", key: "mauaUrl", type: "url", width: "140px" },
];

const createEmptyRow = (): CompRow => ({
  keyword: "", volume: 0, difficulty: 0, cpc: 0,
  esegPos: 0, esegUrl: "", fgvPos: 0, fgvUrl: "",
  insperPos: 0, insperUrl: "", mackenziePos: 0, mackenzieUrl: "",
  saoJudasPos: 0, saoJudasUrl: "", mauaPos: 0, mauaUrl: "",
});

const Competitors = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Palavras-chave Concorrentes</h1>
        <p className="text-muted-foreground text-sm mt-1">Clique em qualquer célula para editar</p>
      </div>
      <EditableDataTable
        data={flatData}
        columns={columns}
        title="Análise Competitiva"
        createEmptyRow={createEmptyRow}
        storageKey="competitors"
      />
    </div>
  );
};

export default Competitors;


