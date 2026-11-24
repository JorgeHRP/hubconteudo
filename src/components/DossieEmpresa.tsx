import { useQuery } from "@tanstack/react-query";
import {
  UserSquare2, Package, Swords, CalendarCheck, History, FileText, ScrollText,
} from "lucide-react";
import {
  listarConcorrentes, listarDocumentosEmpresa, listarEscopos, listarPersonas,
  listarProdutos, listarReunioesEmpresa, listarTimeline,
} from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Campo do dossiê: só aparece quando tem conteúdo. */
function Campo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{valor}</p>
    </div>
  );
}

/** Espera de uma aba enquanto os dados dela chegam. */
function Espera() {
  return (
    <div role="status" aria-label="Carregando">
      <EsqueletoLista linhas={3} />
    </div>
  );
}

export function DossieEmpresa({ empresaId }: { empresaId: string }) {
  const q = <T,>(chave: string, fn: () => Promise<T>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({ queryKey: [chave, empresaId], queryFn: fn });

  const { data: personas, isLoading: esperaPersonas } = q("personas", () => listarPersonas(empresaId));
  const { data: produtos, isLoading: esperaProdutos } = q("produtos", () => listarProdutos(empresaId));
  const { data: concorrentes, isLoading: esperaConcorrentes } = q("concorrentes", () => listarConcorrentes(empresaId));
  const { data: reunioes, isLoading: esperaReunioes } = q("reunioesEmpresa", () => listarReunioesEmpresa(empresaId));
  const { data: timeline, isLoading: esperaTimeline } = q("timeline", () => listarTimeline(empresaId));
  const { data: documentos, isLoading: esperaDocumentos } = q("documentosEmpresa", () => listarDocumentosEmpresa(empresaId));
  const { data: escopos, isLoading: esperaEscopos } = q("escopos", () => listarEscopos(empresaId));

  const conta = (n?: number) => (n ? ` (${n})` : "");

  return (
    <Tabs defaultValue="personas">
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        <TabsTrigger value="personas"><UserSquare2 /> Personas{conta(personas?.length)}</TabsTrigger>
        <TabsTrigger value="produtos"><Package /> Produtos{conta(produtos?.length)}</TabsTrigger>
        <TabsTrigger value="concorrentes"><Swords /> Concorrentes{conta(concorrentes?.length)}</TabsTrigger>
        <TabsTrigger value="reunioes"><CalendarCheck /> Reuniões{conta(reunioes?.length)}</TabsTrigger>
        <TabsTrigger value="historico"><History /> Histórico{conta(timeline?.length)}</TabsTrigger>
        <TabsTrigger value="documentos"><FileText /> Documentos{conta(documentos?.length)}</TabsTrigger>
        <TabsTrigger value="escopo"><ScrollText /> Escopo{conta(escopos?.length)}</TabsTrigger>
      </TabsList>

      <TabsContent value="personas">
        {esperaPersonas ? <Espera /> : personas?.length === 0 ? (
          <EstadoVazio icone={UserSquare2} titulo="Nenhuma persona mapeada"
            descricao="Personas guiam pauta, criativo e segmentação. Cadastre quem a comunicação precisa alcançar." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            {personas?.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="border-b pb-3">
                    <p className="font-display font-semibold">{p.nome}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[p.cargo, p.faixa_etaria, p.segmento].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {p.consciencia && (
                      <Badge variant="secondary" className="mt-2">{p.consciencia}</Badge>
                    )}
                  </div>
                  <Campo rotulo="Objetivos" valor={p.objetivos} />
                  <Campo rotulo="Dores" valor={p.dores} />
                  <Campo rotulo="Objeções" valor={p.objecoes} />
                  <Campo rotulo="Gatilhos" valor={p.gatilhos} />
                  <Campo rotulo="Canais" valor={p.canais} />
                  <Campo rotulo="Conteúdo ideal" valor={p.conteudo_ideal} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="produtos">
        {esperaProdutos ? <Espera /> : produtos?.length === 0 ? (
          <EstadoVazio icone={Package} titulo="Nenhum produto cadastrado"
            descricao="Cursos, planos ou serviços que a empresa vende — com ticket, público e meta comercial." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            {produtos?.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2 border-b pb-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold">{p.nome}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.categoria ?? "—"}</p>
                    </div>
                    {p.status && <Badge variant="secondary" className="shrink-0">{p.status}</Badge>}
                  </div>
                  <Campo rotulo="Descrição" valor={p.descricao} />
                  <Campo rotulo="Público" valor={p.publico} />
                  <Campo rotulo="Ticket médio" valor={p.ticket_medio} />
                  <Campo rotulo="Meta comercial" valor={p.meta_comercial} />
                  <Campo rotulo="Diferenciais" valor={p.diferenciais} />
                  <Campo rotulo="Dores que resolve" valor={p.dores_resolvidas} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="concorrentes">
        {esperaConcorrentes ? <Espera /> : concorrentes?.length === 0 ? (
          <EstadoVazio icone={Swords} titulo="Nenhum concorrente mapeado"
            descricao="Quem disputa o mesmo aluno ou cliente — forças, fraquezas e posicionamento." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            {concorrentes?.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-5">
                  <p className="border-b pb-3 font-display font-semibold">{c.nome}</p>
                  <Campo rotulo="Posicionamento" valor={c.posicionamento} />
                  <Campo rotulo="Forças" valor={c.forcas} />
                  <Campo rotulo="Fraquezas" valor={c.fraquezas} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reunioes">
        {esperaReunioes ? <Espera /> : reunioes?.length === 0 ? (
          <EstadoVazio icone={CalendarCheck} titulo="Nenhuma reunião registrada"
            descricao="Data, tema, participantes, ata e próximos passos de cada conversa com o cliente." />
        ) : (
          <div className="space-y-4">
            {reunioes?.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <p className="min-w-0 font-display font-semibold">{r.tema ?? "Reunião"}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.status && <Badge variant="secondary">{r.status}</Badge>}
                      <span className="text-xs tabular-nums text-muted-foreground">{formatDate(r.data)}</span>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-3">
                    <Campo rotulo="Participantes" valor={r.participantes} />
                    <Campo rotulo="Responsável" valor={r.responsavel} />
                    <Campo rotulo="Ata" valor={r.ata} />
                    <Campo rotulo="Próximos passos" valor={r.proximos_passos} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="historico">
        {esperaTimeline ? <Espera /> : timeline?.length === 0 ? (
          <EstadoVazio icone={History} titulo="Histórico vazio"
            descricao="Marcos da conta: troca de decisor, renegociação, mudança de escopo." />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {timeline?.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="min-w-0 text-sm font-medium">{t.titulo}</p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDate(t.data)}</span>
                  </div>
                  {t.conteudo && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                      {t.conteudo}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="documentos">
        {esperaDocumentos ? <Espera /> : documentos?.length === 0 ? (
          <EstadoVazio icone={FileText} titulo="Nenhum documento"
            descricao="Contratos, propostas e materiais da conta." />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {documentos?.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <span aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[d.tipo, formatDate(d.data)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {d.link && (
                    <a href={d.link} target="_blank" rel="noreferrer"
                      aria-label={`Abrir ${d.nome}`}
                      className="inline-flex h-9 shrink-0 items-center rounded-md px-2 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      Abrir
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="escopo">
        {esperaEscopos ? <Espera /> : escopos?.length === 0 ? (
          <EstadoVazio icone={ScrollText} titulo="Escopo não registrado"
            descricao="O que foi contratado, o modelo de cobrança e desde quando." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
            {escopos?.map((e) => (
              <Card key={e.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 font-display font-semibold capitalize">{e.escopo}</p>
                    {e.modelo_cobranca && (
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {e.modelo_cobranca}
                      </Badge>
                    )}
                  </div>
                  <Campo rotulo="Desde" valor={e.inicio ? formatDate(e.inicio.slice(0, 10)) : null} />
                  <Campo rotulo="Observações" valor={e.observacoes} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
