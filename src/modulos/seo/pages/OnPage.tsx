import EditableDataTable, { type EditableColumn } from "@/modulos/seo/components/EditableDataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { onPageData } from "@/modulos/seo/data/sampleData";
import {
  novasOtimizacoesData,
  alteracoesData,
  performanceData,
  redirectData,
  metaDescricaoCursosData,
  principaisOtimizacoes,
} from "@/modulos/seo/data/novasOtimizacoesData";

type OnPageRow = typeof onPageData[0];

const columns: EditableColumn<OnPageRow>[] = [
  { header: "URL", key: "url", type: "url", width: "250px" },
  { header: "Tipo de Página", key: "pageType" },
  { header: "Nº Keywords", key: "keywordCount", type: "number" },
  { header: "Título", key: "title", width: "200px" },
  { header: "Meta Descrição", key: "metaDescription", width: "220px" },
  { header: "Otimizações", key: "optimizations", width: "180px" },
  { header: "URL Otimizada", key: "optimizedUrl", type: "url", width: "220px" },
];

const createEmptyRow = (): OnPageRow => ({
  url: "", pageType: "", keywordCount: 0, title: "",
  metaDescription: "", optimizations: "", optimizedUrl: "",
});

type OtimRow = { url: string; otimizacoes: string };
const otimColumns: EditableColumn<OtimRow>[] = [
  { header: "URL", key: "url", type: "url", width: "480px" },
  { header: "Otimizações realizadas", key: "otimizacoes", width: "320px" },
];

type AlterRow = { url: string; data: string; motivo: string; status: string };
const alterColumns: EditableColumn<AlterRow>[] = [
  { header: "URL / Alteração", key: "url", type: "url", width: "420px" },
  { header: "Data de Solicitação", key: "data", width: "150px" },
  { header: "Motivo", key: "motivo", width: "220px" },
  { header: "Status", key: "status", width: "180px" },
];

type PerfRow = { url: string; loadMs: string; ok: string };
const perfColumns: EditableColumn<PerfRow>[] = [
  { header: "URL", key: "url", type: "url", width: "520px" },
  { header: "Tempo total de carregamento (ms)", key: "loadMs", width: "220px" },
  { header: "OK?", key: "ok", width: "100px" },
];

type RedirRow = { url: string; novaUrl: string; codigo: string; acessos: string; ultimoAcesso: string };
const redirColumns: EditableColumn<RedirRow>[] = [
  { header: "URL Antiga", key: "url", type: "url", width: "380px" },
  { header: "Nova URL", key: "novaUrl", type: "url", width: "380px" },
  { header: "Código", key: "codigo", width: "90px" },
  { header: "Acessos", key: "acessos", width: "90px" },
  { header: "Último Acesso", key: "ultimoAcesso", width: "130px" },
];

type MetaCursoRow = { curso: string; antiga: string; nova: string };
const metaCursoColumns: EditableColumn<MetaCursoRow>[] = [
  { header: "Curso", key: "curso", width: "220px" },
  { header: "Meta Descrição Antiga", key: "antiga", width: "380px" },
  { header: "Meta Descrição Nova", key: "nova", width: "380px" },
];

const OnPage = () => {
  const totalOtimizacoes =
    novasOtimizacoesData.length +
    alteracoesData.length +
    metaDescricaoCursosData.length +
    redirectData.length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">SEO On-Page</h1>
        <p className="text-muted-foreground text-sm mt-1">Clique em qualquer célula para editar</p>
      </div>

      <Tabs defaultValue="paginas" className="w-full">
        <TabsList>
          <TabsTrigger value="paginas">Páginas Otimizadas</TabsTrigger>
          <TabsTrigger value="novas">Novas Otimizações</TabsTrigger>
        </TabsList>

        <TabsContent value="paginas" className="mt-4">
          <EditableDataTable
            data={onPageData}
            columns={columns}
            title="Páginas Otimizadas"
            createEmptyRow={createEmptyRow}
            storageKey="on-page"
          />
        </TabsContent>

        <TabsContent value="novas" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total de Otimizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold gradient-text">{totalOtimizacoes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {novasOtimizacoesData.length} on-page · {alteracoesData.length} alterações · {metaDescricaoCursosData.length} metas · {redirectData.length} redirects
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo — Principais Otimizações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {principaisOtimizacoes.map((o) => (
                    <li key={o.item} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span><span className="font-semibold">{o.item}:</span> <span className="text-muted-foreground">{o.descricao}</span></span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <EditableDataTable
            data={novasOtimizacoesData}
            columns={otimColumns}
            title="Otimizações realizadas por URL"
            createEmptyRow={() => ({ url: "", otimizacoes: "" })}
            storageKey="novas-otimizacoes"
          />
          <EditableDataTable
            data={alteracoesData}
            columns={alterColumns}
            title="Alterações solicitadas"
            createEmptyRow={() => ({ url: "", data: "", motivo: "", status: "" })}
            storageKey="novas-otimizacoes-alteracoes"
          />
          <EditableDataTable
            data={metaDescricaoCursosData}
            columns={metaCursoColumns}
            title="Otimizações Meta Descrição — Cursos"
            createEmptyRow={() => ({ curso: "", antiga: "", nova: "" })}
            storageKey="novas-otimizacoes-meta-cursos"
          />
          <EditableDataTable
            data={performanceData}
            columns={perfColumns}
            title="Performance / Tempo de carregamento"
            createEmptyRow={() => ({ url: "", loadMs: "", ok: "" })}
            storageKey="novas-otimizacoes-performance"
          />
          <EditableDataTable
            data={redirectData}
            columns={redirColumns}
            title="Redirecionamentos (301)"
            createEmptyRow={() => ({ url: "", novaUrl: "", codigo: "301", acessos: "0", ultimoAcesso: "-" })}
            storageKey="novas-otimizacoes-redirects"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OnPage;


