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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Campo do dossiê: só aparece quando tem conteúdo. */
function Campo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{valor}</p>
    </div>
  );
}

export function DossieEmpresa({ empresaId }: { empresaId: string }) {
  const q = <T,>(chave: string, fn: () => Promise<T>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({ queryKey: [chave, empresaId], queryFn: fn });

  const { data: personas } = q("personas", () => listarPersonas(empresaId));
  const { data: produtos } = q("produtos", () => listarProdutos(empresaId));
  const { data: concorrentes } = q("concorrentes", () => listarConcorrentes(empresaId));
  const { data: reunioes } = q("reunioesEmpresa", () => listarReunioesEmpresa(empresaId));
  const { data: timeline } = q("timeline", () => listarTimeline(empresaId));
  const { data: documentos } = q("documentosEmpresa", () => listarDocumentosEmpresa(empresaId));
  const { data: escopos } = q("escopos", () => listarEscopos(empresaId));

  const conta = (n?: number) => (n ? ` (${n})` : "");

  return (
    <Tabs defaultValue="personas">
      <TabsList className="flex-wrap">
        <TabsTrigger value="personas"><UserSquare2 /> Personas{conta(personas?.length)}</TabsTrigger>
        <TabsTrigger value="produtos"><Package /> Produtos{conta(produtos?.length)}</TabsTrigger>
        <TabsTrigger value="concorrentes"><Swords /> Concorrentes{conta(concorrentes?.length)}</TabsTrigger>
        <TabsTrigger value="reunioes"><CalendarCheck /> Reuniões{conta(reunioes?.length)}</TabsTrigger>
        <TabsTrigger value="historico"><History /> Histórico{conta(timeline?.length)}</TabsTrigger>
        <TabsTrigger value="documentos"><FileText /> Documentos{conta(documentos?.length)}</TabsTrigger>
        <TabsTrigger value="escopo"><ScrollText /> Escopo{conta(escopos?.length)}</TabsTrigger>
      </TabsList>

      <TabsContent value="personas">
        {personas?.length === 0 ? (
          <EstadoVazio icone={UserSquare2} titulo="Nenhuma persona mapeada"
            descricao="Personas guiam pauta, criativo e segmentação. Cadastre quem a comunicação precisa alcançar." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {personas?.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-4 pt-4">
                  <div>
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.cargo, p.faixa_etaria, p.segmento].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {p.consciencia && (
                      <Badge variant="secondary" className="mt-1 text-[9px]">{p.consciencia}</Badge>
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
        {produtos?.length === 0 ? (
          <EstadoVazio icone={Package} titulo="Nenhum produto cadastrado"
            descricao="Cursos, planos ou serviços que a empresa vende — com ticket, público e meta comercial." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {produtos?.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.categoria ?? "—"}</p>
                    </div>
                    {p.status && <Badge variant="secondary" className="shrink-0 text-[9px]">{p.status}</Badge>}
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
        {concorrentes?.length === 0 ? (
          <EstadoVazio icone={Swords} titulo="Nenhum concorrente mapeado"
            descricao="Quem disputa o mesmo aluno ou cliente — forças, fraquezas e posicionamento." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {concorrentes?.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-4 pt-4">
                  <p className="font-semibold">{c.nome}</p>
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
        {reunioes?.length === 0 ? (
          <EstadoVazio icone={CalendarCheck} titulo="Nenhuma reunião registrada"
            descricao="Data, tema, participantes, ata e próximos passos de cada conversa com o cliente." />
        ) : (
          <div className="space-y-3">
            {reunioes?.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 pt-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{r.tema ?? "Reunião"}</p>
                    <div className="flex items-center gap-2">
                      {r.status && <Badge variant="secondary" className="text-[9px]">{r.status}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatDate(r.data)}</span>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-2">
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
        {timeline?.length === 0 ? (
          <EstadoVazio icone={History} titulo="Histórico vazio"
            descricao="Marcos da conta: troca de decisor, renegociação, mudança de escopo." />
        ) : (
          <div className="space-y-3">
            {timeline?.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{t.titulo}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.data)}</span>
                  </div>
                  {t.conteudo && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{t.conteudo}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="documentos">
        {documentos?.length === 0 ? (
          <EstadoVazio icone={FileText} titulo="Nenhum documento"
            descricao="Contratos, propostas e materiais da conta." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documentos?.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center gap-3 p-4 pt-4">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {[d.tipo, formatDate(d.data)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {d.link && (
                    <a href={d.link} target="_blank" rel="noreferrer"
                      className="shrink-0 text-xs font-medium text-primary hover:underline">
                      Abrir
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="escopo">
        {escopos?.length === 0 ? (
          <EstadoVazio icone={ScrollText} titulo="Escopo não registrado"
            descricao="O que foi contratado, o modelo de cobrança e desde quando." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {escopos?.map((e) => (
              <Card key={e.id}>
                <CardContent className="space-y-2 p-4 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium capitalize">{e.escopo}</p>
                    {e.modelo_cobranca && (
                      <Badge variant="secondary" className="text-[9px] capitalize">
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
