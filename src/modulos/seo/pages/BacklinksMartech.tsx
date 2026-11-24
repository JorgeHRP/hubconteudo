import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { backlinksData } from "@/modulos/seo/data/sampleData";

type BacklinkRow = typeof backlinksData[0];

const columns: EditableColumn<BacklinkRow>[] = [
  { header: "Texto Âncora", key: "anchorText", width: "180px" },
  { header: "Domínio", key: "domain", width: "200px" },
  { header: "Status", key: "status" },
  { header: "Link Publicação", key: "publishLink", type: "url", width: "250px" },
  { header: "DA", key: "domainAuthority", type: "number" },
];

const createEmptyRow = (): BacklinkRow => ({
  anchorText: "", domain: "", status: "Pendente", publishLink: "", domainAuthority: 0,
});

const BacklinksMartech = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Backlinks Conteúdo Martech</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Clique em qualquer célula para editar</p>
      </div>
      <EditableDataTable
        data={backlinksData}
        columns={columns}
        title="Backlinks"
        createEmptyRow={createEmptyRow}
        storageKey="backlinks-martech"
      />
    </div>
  );
};

export default BacklinksMartech;


