import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { articlesData } from "@/modulos/seo/data/sampleData";

type ArticleRow = typeof articlesData[0];

const renderLink = (maxW: string) => (value: any) => {
  const v = String(value ?? "");
  if (!v) return <span className="text-muted-foreground">—</span>;
  const href = v.startsWith("http") ? v : `https://${v}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`text-xs text-eseg-blue underline hover:text-eseg-blue/80 truncate inline-block ${maxW}`}
    >
      {v}
    </a>
  );
};

const columns: EditableColumn<ArticleRow>[] = [
  { header: "Destino", key: "destino", type: "select", options: ["Blog ESEG", "Backlink"], width: "130px" },
  { header: "Palavra-chave", key: "keyword", width: "180px" },
  { header: "Volume", key: "volume", type: "number" },
  { header: "KW Secundária", key: "secondaryKw", width: "160px" },
  { header: "Texto Âncora", key: "anchorText" },
  { header: "Links Internos", key: "internalLinks", type: "url", width: "200px", render: renderLink("max-w-[200px]") },
  { header: "Link Artigo", key: "articleLink", type: "url", render: renderLink("max-w-[250px]") },
  { header: "KW(s) for page", key: "keywordsForPage", type: "number" },
  { header: "Título", key: "title", width: "220px" },
  { header: "Meta Descrição", key: "metaDescription", width: "200px" },
  { header: "URL", key: "url", type: "url", render: renderLink("max-w-[250px]") },
  { header: "URL Publicação", key: "publishedUrl", type: "url", width: "200px", render: renderLink("max-w-[200px]") },
];


const createEmptyRow = (): ArticleRow => ({
  keyword: "", volume: 0, secondaryKw: "", anchorText: "", internalLinks: "",
  articleLink: "", publishLink: "", keywordsForPage: 0, title: "",
  metaDescription: "", url: "", publishedUrl: "", destino: "Blog ESEG",
});

const Articles = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Artigos</h1>
        <p className="text-muted-foreground text-sm mt-1">Clique em qualquer célula para editar</p>
      </div>
      <EditableDataTable
        data={articlesData}
        columns={columns}
        title="Artigos do Blog"
        createEmptyRow={createEmptyRow}
        storageKey="articles"
      />
    </div>
  );
};

export default Articles;


