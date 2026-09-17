import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";

type RenataKeywordRow = {
  keyword: string;
  volume: number;
  difficulty: number;
  position: number;
  parentTopic: string;
  url: string;
  opportunity: boolean;
};

const renataKeywords: RenataKeywordRow[] = [
  { keyword: "renata eseg", volume: 110, difficulty: 2, position: 1, parentTopic: "marca pessoal", url: "", opportunity: false },
  { keyword: "", volume: 0, difficulty: 0, position: 0, parentTopic: "", url: "", opportunity: false },
];

const columns: EditableColumn<RenataKeywordRow>[] = [
  { header: "Palavra-chave", key: "keyword", width: "250px" },
  { header: "Volume", key: "volume", type: "number" },
  { header: "Dificuldade", key: "difficulty", type: "number" },
  { header: "Posição", key: "position", type: "number" },
  { header: "Tópico Principal", key: "parentTopic", width: "200px" },
  { header: "URL Alvo", key: "url", type: "url", width: "250px" },
  { header: "Oportunidade", key: "opportunity", type: "star" },
];

const createEmptyRow = (): RenataKeywordRow => ({
  keyword: "", volume: 0, difficulty: 0, position: 0, parentTopic: "", url: "", opportunity: false,
});

const KeywordsRenata = () => (
  <div className="space-y-6">
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">Sobre esta aba</h3>
      <p className="text-sm text-foreground/80">
        Palavras-chave relacionadas à <strong>Renata</strong>. Acompanhamento de termos estratégicos para posicionamento de marca pessoal e autoridade no segmento educacional.
      </p>
    </div>
    <EditableDataTable
      data={renataKeywords}
      columns={columns}
      title="Palavras-chave Renata"
      createEmptyRow={createEmptyRow}
      storageKey="keywords-renata"
    />
  </div>
);

export default KeywordsRenata;


