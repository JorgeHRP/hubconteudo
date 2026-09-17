import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ListChecks, FileText, CalendarRange, MessageSquare, Plus, Trash2,
  ChevronDown, ChevronRight, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  atualizarFerramenta, buscarImplantacao, criarNotaImplantacao, listarEmpresas,
  listarNotasImplantacao, listarProfiles, removerNotaImplantacao,
} from "@/data/store";
import {
  ferramentaLabels, statusItemLabels, statusItemVariant,
  type FaseImplantacao, type Ferramenta, type ItemChecklist, type StatusItem,
} from "@/modulos/rd/roteiros";
import { formatDate } from "@/lib/cs-data";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const statusPossiveis = Object.keys(statusItemLabels) as StatusItem[];

export default function ImplantacaoDetalhe() {
  const { id = "" } = useParams();
  const { userId, profile } = useAuth();
  const qc = useQueryClient();

  const [ferramenta, setFerramenta] = useState<string | null>(null);
  const [fasesAbertas, setFasesAbertas] = useState<Record<string, boolean>>({});
  const [nota, setNota] = useState({ conteudo: "", link: "", anexo: "" });

  const { data: imp } = useQuery({ queryKey: ["implantacao", id], queryFn: () => buscarImplantacao(id) });
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: notas } = useQuery({
    queryKey: ["notas-implantacao", id],
    queryFn: () => listarNotasImplantacao(id),
  });

  const salvar = useMutation({
    mutationFn: ({ f, mudanca }: { f: string; mudanca: Record<string, unknown> }) =>
      atualizarFerramenta(id, f, mudanca),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["implantacao", id] });
      qc.invalidateQueries({ queryKey: ["implantacoes"] });
    },
  });

  const addNota = useMutation({
    mutationFn: () =>
      criarNotaImplantacao({
        implantacao_id: id,
        autor_id: userId,
        autor_nome: profile?.nome ?? "—",
        conteudo: nota.conteudo.trim(),
        link_reuniao: nota.link.trim() || null,
        anexo_nome: nota.anexo.trim() || null,
      }),
    onSuccess: () => {
      setNota({ conteudo: "", link: "", anexo: "" });
      qc.invalidateQueries({ queryKey: ["notas-implantacao", id] });
      toast.success("Anotação registrada");
    },
  });

  if (!imp) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Carregando implantação…</p>;
  }

  const ferramentaAtual = ferramenta ?? imp.ferramentas[0];
  const dados = imp.dados[ferramentaAtual];
  const fases = (dados?.fases ?? []) as FaseImplantacao[];
  const empresa = empresas?.find((e) => e.id === imp.empresa_id);
  const nomeDe = (uid: string | null) => profiles?.find((p) => p.user_id === uid)?.nome ?? "—";

  const itens = fases.flatMap((f) => f.items ?? []);
  const feitos = itens.filter((i) => i.status === "concluido" || i.status === "nao_se_aplica").length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;

  /** Grava a alteração de um item dentro do roteiro daquela ferramenta. */
  function mudarItem(faseId: string, itemId: string, mudanca: Partial<ItemChecklist>) {
    const novas = fases.map((f) =>
      f.id !== faseId
        ? f
        : { ...f, items: f.items.map((i) => (i.id === itemId ? { ...i, ...mudanca } : i)) }
    );
    salvar.mutate({ f: ferramentaAtual, mudanca: { fases: novas } });
  }

  return (
    <div className="animate-fade-in">
      <Link to="/projetos-rd" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Implantações
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Rocket className="h-6 w-6 text-primary" />
            {empresa?.nome_fantasia ?? "Cliente"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {imp.ferramentas.map((f) => ferramentaLabels[f as Ferramenta]).join(" · ")} ·
            iniciada em {formatDate(imp.created_at.slice(0, 10))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{pct}%</p>
          <p className="text-xs text-muted-foreground">{feitos} de {itens.length} itens</p>
        </div>
      </div>

      {/* seletor de ferramenta */}
      {imp.ferramentas.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {imp.ferramentas.map((f) => (
            <button
              key={f}
              onClick={() => setFerramenta(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                f === ferramentaAtual
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {ferramentaLabels[f as Ferramenta]}
            </button>
          ))}
        </div>
      )}

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist"><ListChecks /> Checklist</TabsTrigger>
          <TabsTrigger value="cronograma"><CalendarRange /> Cronograma</TabsTrigger>
          <TabsTrigger value="escopo"><FileText /> Escopo</TabsTrigger>
          <TabsTrigger value="notas"><MessageSquare /> Anotações ({notas?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* ---------- checklist ---------- */}
        <TabsContent value="checklist" className="space-y-3">
          {fases.map((fase) => {
            const aberta = fasesAbertas[fase.id] ?? true;
            const daFase = fase.items ?? [];
            const okFase = daFase.filter(
              (i) => i.status === "concluido" || i.status === "nao_se_aplica"
            ).length;

            return (
              <Card key={fase.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setFasesAbertas((s) => ({ ...s, [fase.id]: !aberta }))}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {aberta
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{fase.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {okFase}/{daFase.length}
                    </span>
                    <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full",
                        okFase === daFase.length && daFase.length > 0 ? "bg-success" : "gradient-primary")}
                        style={{ width: `${daFase.length ? (okFase / daFase.length) * 100 : 0}%` }} />
                    </div>
                  </button>

                  {aberta && (
                    <div className="border-t">
                      {daFase.map((item) => (
                        <div key={item.id}
                          className="flex flex-wrap items-center gap-2 border-b p-3 last:border-0">
                          <span className={cn("min-w-0 flex-1 text-sm",
                            item.status === "concluido" && "text-muted-foreground line-through")}>
                            {item.task}
                          </span>

                          <Select
                            value={item.status}
                            onValueChange={(v) => mudarItem(fase.id, item.id, { status: v as StatusItem })}
                          >
                            <SelectTrigger className="h-7 w-40 shrink-0 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {statusPossiveis.map((s) => (
                                <SelectItem key={s} value={s}>{statusItemLabels[s]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={item.responsible || "nenhum"}
                            onValueChange={(v) =>
                              mudarItem(fase.id, item.id, { responsible: v === "nenhum" ? "" : v })
                            }
                          >
                            <SelectTrigger className="h-7 w-36 shrink-0 text-xs">
                              <SelectValue placeholder="Responsável" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nenhum">Sem responsável</SelectItem>
                              {profiles?.filter((p) => p.ativo).map((p) => (
                                <SelectItem key={p.user_id} value={p.nome}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            className="h-7 w-36 shrink-0 text-xs"
                            value={item.date}
                            onChange={(e) => mudarItem(fase.id, item.id, { date: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ---------- cronograma: derivado do checklist ---------- */}
        <TabsContent value="cronograma">
          {itens.filter((i) => i.date).length === 0 ? (
            <EstadoVazio
              icone={CalendarRange}
              titulo="Nenhuma data definida"
              descricao="O cronograma é montado a partir das datas do checklist — não se edita separadamente. Preencha as datas dos itens e eles aparecem aqui em ordem."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Data</th>
                      <th className="p-3 font-medium">Item</th>
                      <th className="hidden p-3 font-medium sm:table-cell">Fase</th>
                      <th className="hidden p-3 font-medium md:table-cell">Responsável</th>
                      <th className="p-3 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fases
                      .flatMap((f) => (f.items ?? []).map((i) => ({ ...i, fase: f.name })))
                      .filter((i) => i.date)
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((i) => (
                        <tr key={i.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-3 tabular-nums">{formatDate(i.date)}</td>
                          <td className="p-3">{i.task}</td>
                          <td className="hidden p-3 text-muted-foreground sm:table-cell">{i.fase}</td>
                          <td className="hidden p-3 text-muted-foreground md:table-cell">
                            {i.responsible || "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant={statusItemVariant[i.status]} className="text-[9px]">
                              {statusItemLabels[i.status]}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------- escopo ---------- */}
        <TabsContent value="escopo">
          <Card>
            <CardContent className="p-5 pt-5">
              <Label htmlFor="escopo">Escopo contratado — {ferramentaLabels[ferramentaAtual as Ferramenta]}</Label>
              <Textarea
                id="escopo"
                className="mt-2 min-h-[240px]"
                defaultValue={dados?.escopo ?? ""}
                placeholder="Descreva o que foi contratado para esta ferramenta."
                onBlur={(e) => {
                  if (e.target.value !== (dados?.escopo ?? "")) {
                    salvar.mutate({ f: ferramentaAtual, mudanca: { escopo: e.target.value } });
                    toast.success("Escopo salvo");
                  }
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                O escopo é por ferramenta, porque muda a cada implantação. Salva ao sair do campo.
              </p>

              <div className="mt-4 border-t pt-4">
                <Label>Responsável pela ferramenta</Label>
                <Select
                  value={dados?.responsavel_id ?? "nenhum"}
                  onValueChange={(v) =>
                    salvar.mutate({
                      f: ferramentaAtual,
                      mudanca: { responsavel_id: v === "nenhum" ? null : v },
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5 sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem responsável</SelectItem>
                    {profiles?.filter((p) => p.ativo).map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada ferramenta tem o seu — não existe responsável geral da implantação.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- anotações ---------- */}
        <TabsContent value="notas" className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4 pt-4">
              <Textarea
                placeholder="Registrar uma decisão, um combinado, o que ficou de uma reunião…"
                value={nota.conteudo}
                onChange={(e) => setNota({ ...nota, conteudo: e.target.value })}
                className="resize-none border-0 bg-muted/40 focus-visible:ring-1"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Link da reunião (opcional)" value={nota.link}
                  onChange={(e) => setNota({ ...nota, link: e.target.value })} className="h-9 text-xs" />
                <Input placeholder="Nome da transcrição anexada (opcional)" value={nota.anexo}
                  onChange={(e) => setNota({ ...nota, anexo: e.target.value })} className="h-9 text-xs" />
              </div>
              <Button size="sm" disabled={!nota.conteudo.trim()} onClick={() => addNota.mutate()}>
                <Plus /> Registrar
              </Button>
            </CardContent>
          </Card>

          {notas?.length === 0 ? (
            <EstadoVazio
              icone={MessageSquare}
              titulo="Nenhuma anotação"
              descricao="Registre aqui o que foi decidido em cada conversa — fica com autor, data e o link da reunião."
            />
          ) : (
            notas?.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4 pt-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{n.autor_nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("pt-BR")}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={async () => {
                          await removerNotaImplantacao(n.id);
                          qc.invalidateQueries({ queryKey: ["notas-implantacao", id] });
                        }}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{n.conteudo}</p>
                  {(n.link_reuniao || n.anexo_nome) && (
                    <div className="mt-2 flex flex-wrap gap-3 border-t pt-2 text-xs">
                      {n.link_reuniao && (
                        <a href={n.link_reuniao} target="_blank" rel="noreferrer"
                          className="font-medium text-primary hover:underline">
                          Abrir reunião
                        </a>
                      )}
                      {n.anexo_nome && (
                        <span className="text-muted-foreground">📎 {n.anexo_nome}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-xs text-muted-foreground">
        Responsável da conta: {nomeDe(empresa?.responsavel_id ?? null)}
      </p>
    </div>
  );
}
