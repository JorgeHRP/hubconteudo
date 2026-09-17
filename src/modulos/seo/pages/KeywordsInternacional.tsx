import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";

type IntlKeywordRow = {
  keyword: string;
  volume: number;
  difficulty: number;
  position: number;
  market: string;
  url: string;
  opportunity: boolean;
};

const intlKeywords: IntlKeywordRow[] = [
  { keyword: "study in brazil", volume: 6600, difficulty: 35, position: 0, market: "Global (EN)", url: "", opportunity: false },
  { keyword: "universities in são paulo", volume: 3200, difficulty: 42, position: 0, market: "Global (EN)", url: "", opportunity: false },
  { keyword: "business degree brazil", volume: 1900, difficulty: 28, position: 0, market: "Global (EN)", url: "", opportunity: false },
  { keyword: "mba in brazil for international students", volume: 1200, difficulty: 32, position: 0, market: "Global (EN)", url: "", opportunity: false },
  { keyword: "estudiar en brasil", volume: 2800, difficulty: 30, position: 0, market: "LATAM (ES)", url: "", opportunity: false },
  { keyword: "universidades en são paulo", volume: 1500, difficulty: 25, position: 0, market: "LATAM (ES)", url: "", opportunity: false },
  { keyword: "becas para estudiar en brasil", volume: 2100, difficulty: 38, position: 0, market: "LATAM (ES)", url: "", opportunity: false },
  { keyword: "étudier au brésil", volume: 1800, difficulty: 22, position: 0, market: "Europa (FR)", url: "", opportunity: false },
];

const columns: EditableColumn<IntlKeywordRow>[] = [
  { header: "Palavra-chave", key: "keyword", width: "300px" },
  { header: "Volume", key: "volume", type: "number" },
  { header: "Dificuldade", key: "difficulty", type: "number" },
  { header: "Posição", key: "position", type: "number" },
  { header: "Mercado", key: "market" },
  { header: "URL Alvo", key: "url", type: "url", width: "200px" },
  { header: "Oportunidade", key: "opportunity", type: "star" },
];

const createEmptyRow = (): IntlKeywordRow => ({
  keyword: "", volume: 0, difficulty: 0, position: 0, market: "", url: "", opportunity: false,
});

const KeywordsInternacional = () => (
  <div className="space-y-6">
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">Sobre esta aba</h3>
      <p className="text-sm text-foreground/80">
        Palavras-chave voltadas para o <strong>braço de internacionalização da ESEG</strong>. Foco em termos em inglês, espanhol e francês para atrair alunos internacionais interessados em estudar no Brasil.
      </p>
    </div>
    <EditableDataTable
      data={intlKeywords}
      columns={columns}
      title="Palavras-chave Internacionais"
      createEmptyRow={createEmptyRow}
      storageKey="keywords-internacional"
    />
  </div>
);

export default KeywordsInternacional;


