import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plane, Plus, Paperclip, Trash2, Send, Check, X, ChevronDown, ChevronRight, Receipt,
  Clock, CheckCircle2, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  adicionarDespesa, criarViagem, linkComprovante, listarProfiles, listarViagens, mudarStatusViagem,
  podeEnviarComprovante, removerDespesa, removerViagem,
} from "@/data/store";
import { COMPROVANTE_MAX_BYTES, COMPROVANTE_TIPOS } from "@/integrations/supabase/viagens";
import {
  despesaCategoriaLabels, formatCurrency, formatDate, viagemStatusLabels, viagemStatusVariant,
} from "@/lib/cs-data";
import type { DespesaCategoria, RelatorioViagem } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoIndicadores, EsqueletoLista } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Rótulo pequeno que abre cada seção. */
const rotuloSecao = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const viagemVazia = { titulo: "", destino: "", motivo: "", data_inicio: "", data_fim: "" };
const despesaVazia = {
  categoria: "transporte" as DespesaCategoria,
  descricao: "", data: "", valor: "", comprovante_nome: "",
};

/**
 * Abre o comprovante numa aba nova. A aba é aberta antes de pedir o link, ainda
 * dentro do clique: aberta depois da espera, o navegador a bloquearia como pop-up.
 */
async function abrirComprovante(caminho: string) {
  const aba = window.open("about:blank", "_blank");
  try {
    const url = await linkComprovante(caminho);
    if (aba) aba.location.href = url;
    else window.location.href = url;
  } catch (e) {
    aba?.close();
    toast.error((e as Error).message);
  }
}

const total = (r: RelatorioViagem) => r.despesas.reduce((s, d) => s + d.valor, 0);

export default function RelatorioViagens() {
  const { userId, temModulo } = useAuth();
  const qc = useQueryClient();
  const podeAprovar = temModulo("viagens_aprovacao");

  const [novoAberto, setNovoAberto] = useState(false);
  const [form, setForm] = useState(viagemVazia);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [aba, setAba] = useState("aprovar");
  const [despesaEm, setDespesaEm] = useState<string | null>(null);
  const [despesa, setDespesa] = useState(despesaVazia);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const comUpload = podeEnviarComprovante();
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [motivoReprova, setMotivoReprova] = useState("");

  const { data: viagens, isLoading: carregando } = useQuery({ queryKey: ["viagens"], queryFn: listarViagens });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["viagens"] });
  const falhou = (e: Error) => toast.error(e.message);
  const nomeDe = (id: string | null) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";

  const criar = useMutation({
    mutationFn: () => criarViagem({ ...form, colaborador_id: userId! }),
    onSuccess: (nova) => {
      setNovoAberto(false);
      setForm(viagemVazia);
      setExpandido(nova.id);
      setAba("meus");
      invalidar();
      toast.success("Relatório criado. Agora adicione as despesas e os comprovantes.");
    },
    onError: falhou,
  });

  const addDespesa = useMutation({
    mutationFn: (relatorio_id: string) =>
      adicionarDespesa(relatorio_id, {
        categoria: despesa.categoria,
        descricao: despesa.descricao.trim(),
        data: despesa.data,
        valor: Number(despesa.valor) || 0,
        comprovante_nome: despesa.comprovante_nome.trim() || null,
        comprovante_url: null,
      }, arquivo && userId ? { dono_id: userId, arquivo } : null),
    onSuccess: () => {
      setDespesaEm(null);
      setDespesa(despesaVazia);
      setArquivo(null);
      invalidar();
      toast.success("Despesa lançada");
    },
    onError: falhou,
  });

  const tirarDespesa = useMutation({
    mutationFn: ({ r, d }: { r: string; d: string }) => removerDespesa(r, d),
    onSuccess: invalidar,
    onError: falhou,
  });

  const mudarStatus = useMutation({
    mutationFn: ({ id, status, obs }: { id: string; status: RelatorioViagem["status"]; obs?: string }) =>
      mudarStatusViagem(id, status, userId!, obs),
    onSuccess: (_d, v) => {
      invalidar();
      setReprovando(null);
      setMotivoReprova("");
      const msg: Record<string, string> = {
        enviado: "Relatório enviado para o financeiro",
        aprovado: "Relatório aprovado",
        reprovado: "Relatório reprovado",
        pago: "Reembolso registrado",
      };
      toast.success(msg[v.status] ?? "Status atualizado");
    },
    onError: (e: Error) => { invalidar(); falhou(e); },
  });

  const excluir = useMutation({
    mutationFn: (id: string) => removerViagem(id),
    onSuccess: () => { invalidar(); toast.success("Relatório excluído"); },
    onError: falhou,
  });

  const todos = viagens ?? [];
  const meus = todos.filter((v) => v.colaborador_id === userId);
  const paraAprovar = todos.filter((v) => v.status === "enviado");

  // Totais do topo: só somam o que a lista já traz (todos para quem aprova, os próprios para os demais).
  const base = podeAprovar ? todos : meus;
  const somar = (itens: RelatorioViagem[]) => itens.reduce((s, v) => s + total(v), 0);
  const doStatus = (status: RelatorioViagem["status"]) => base.filter((v) => v.status === status);
  const resumo = [
    { rotulo: "Total lançado", itens: base, icone: Receipt, tom: "bg-primary/10 text-primary" },
    { rotulo: "Em análise", itens: doStatus("enviado"), icone: Clock, tom: "bg-warning/15 text-warning-strong" },
    { rotulo: "Aprovado, a reembolsar", itens: doStatus("aprovado"), icone: CheckCircle2, tom: "bg-success/10 text-success" },
    { rotulo: "Reembolsado", itens: doStatus("pago"), icone: Wallet, tom: "bg-info/10 text-info" },
  ];

  // Chamada como função, não como <ListaViagens />: declarada aqui dentro, como
  // componente ela seria recriada a cada tecla e os campos perderiam o foco.
  function ListaViagens({ itens, mostrarDono }: { itens: RelatorioViagem[]; mostrarDono?: boolean }) {
    if (itens.length === 0) {
      return (
        <EstadoVazio
          icone={Plane}
          titulo={mostrarDono ? "Nada aguardando aprovação" : "Nenhum relatório de viagem"}
          descricao={
            mostrarDono
              ? "Quando alguém enviar um relatório, ele aparece aqui para análise do financeiro."
              : "Crie um relatório, lance as despesas com os comprovantes e envie para o financeiro aprovar."
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {itens.map((v) => {
          const aberto = expandido === v.id;
          const meu = v.colaborador_id === userId;
          const editavel = meu && (v.status === "rascunho" || v.status === "reprovado");
          return (
            <Card key={v.id} className="overflow-hidden">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
                  <button
                    type="button"
                    aria-expanded={aberto}
                    className="flex min-w-0 flex-1 basis-64 items-start gap-2.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => setExpandido(aberto ? null : v.id)}
                  >
                    {aberto
                      ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold leading-snug">{v.titulo}</span>
                        <Badge variant={viagemStatusVariant[v.status]}>
                          {viagemStatusLabels[v.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {mostrarDono && <span className="font-medium text-foreground">{nomeDe(v.colaborador_id)} · </span>}
                        {v.destino} · {formatDate(v.data_inicio)} a {formatDate(v.data_fim)} ·{" "}
                        {v.despesas.length} despesa(s)
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-display text-base font-semibold tabular-nums">{formatCurrency(total(v))}</span>
                    {editavel && (
                      <>
                        <Button
                          size="sm"
                          disabled={v.despesas.length === 0}
                          onClick={() => mudarStatus.mutate({ id: v.id, status: "enviado" })}
                        >
                          <Send /> Enviar
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Excluir relatório" aria-label={`Excluir o relatório ${v.titulo}`}
                          onClick={() => excluir.mutate(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {podeAprovar && v.status === "enviado" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setReprovando(v.id)}>
                          <X /> Reprovar
                        </Button>
                        <Button size="sm"
                          onClick={() => mudarStatus.mutate({ id: v.id, status: "aprovado" })}>
                          <Check /> Aprovar
                        </Button>
                      </>
                    )}
                    {podeAprovar && v.status === "aprovado" && (
                      <Button size="sm" variant="outline"
                        onClick={() => mudarStatus.mutate({ id: v.id, status: "pago" })}>
                        Marcar como reembolsado
                      </Button>
                    )}
                  </div>
                </div>

                {v.observacao_financeiro && (
                  <div className="mx-4 mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Financeiro</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-destructive">{v.observacao_financeiro}</p>
                  </div>
                )}

                {reprovando === v.id && (
                  <div className="mx-4 mb-4 space-y-3 rounded-lg border bg-muted/50 p-4">
                    <Label htmlFor={`rep-${v.id}`} className={rotuloSecao}>Motivo da reprovação</Label>
                    <Textarea id={`rep-${v.id}`} value={motivoReprova} className="bg-card"
                      onChange={(e) => setMotivoReprova(e.target.value)}
                      placeholder="O que precisa ser corrigido" />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button size="sm" variant="outline" onClick={() => setReprovando(null)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm" variant="destructive" disabled={!motivoReprova.trim()}
                        onClick={() => mudarStatus.mutate({
                          id: v.id, status: "reprovado", obs: motivoReprova.trim(),
                        })}
                      >
                        Confirmar reprovação
                      </Button>
                    </div>
                  </div>
                )}

                {aberto && (
                  <div className="space-y-5 border-t bg-muted/50 p-4">
                    {v.motivo && (
                      <section className="space-y-1.5">
                        <p className={rotuloSecao}>Motivo da viagem</p>
                        <p className="whitespace-pre-wrap text-sm text-foreground">{v.motivo}</p>
                      </section>
                    )}

                    <section className="space-y-2">
                      <p className={rotuloSecao}>Despesas</p>
                      {v.despesas.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma despesa lançada ainda.</p>
                      )}
                      {v.despesas.length > 0 && (
                        <div className="overflow-hidden rounded-lg border bg-card">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead>Categoria</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="hidden sm:table-cell">Data</TableHead>
                                <TableHead>Comprovante</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                {editavel && <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {v.despesas.map((d) => (
                                <TableRow key={d.id}>
                                  <TableCell>
                                    <Badge variant="secondary" className="whitespace-nowrap">
                                      {despesaCategoriaLabels[d.categoria]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="min-w-[9rem]">{d.descricao}</TableCell>
                                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground sm:table-cell">
                                    {formatDate(d.data)}
                                  </TableCell>
                                  <TableCell>
                                    {d.comprovante_url ? (
                                      <button
                                        type="button"
                                        className="flex max-w-[14rem] items-center gap-1.5 rounded-sm text-left text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                        title="Abrir o comprovante"
                                        onClick={() => abrirComprovante(d.comprovante_url!)}
                                      >
                                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{d.comprovante_nome ?? "comprovante"}</span>
                                      </button>
                                    ) : d.comprovante_nome ? (
                                      <span className="flex max-w-[14rem] items-center gap-1.5 text-xs text-muted-foreground"
                                        title="Só o nome foi informado; o arquivo não foi enviado">
                                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{d.comprovante_nome}</span>
                                      </span>
                                    ) : (
                                      <Badge variant="destructive" className="whitespace-nowrap">sem comprovante</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                                    {formatCurrency(d.valor)}
                                  </TableCell>
                                  {editavel && (
                                    <TableCell className="py-1 pl-0 pr-1.5">
                                      <button
                                        type="button"
                                        title="Remover despesa" aria-label={`Remover a despesa ${d.descricao}`}
                                        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                        onClick={() => tirarDespesa.mutate({ r: v.id, d: d.id })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-3 py-2.5 text-sm">
                            <span className="font-medium text-muted-foreground">Total do relatório</span>
                            <span className="font-display font-semibold tabular-nums">{formatCurrency(total(v))}</span>
                          </div>
                        </div>
                      )}
                    </section>

                    {editavel && (
                      despesaEm === v.id ? (
                        <div className="space-y-4 rounded-lg border bg-card p-4">
                          <p className="font-display text-base font-semibold">Nova despesa</p>

                          <section className="space-y-3">
                            <p className={rotuloSecao}>Dados da despesa</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <Label>Categoria</Label>
                                <Select value={despesa.categoria}
                                  onValueChange={(x) => setDespesa({ ...despesa, categoria: x as DespesaCategoria })}>
                                  <SelectTrigger className="mt-1.5" aria-label="Categoria"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(despesaCategoriaLabels).map(([k, l]) => (
                                      <SelectItem key={k} value={k}>{l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="d-data">Data</Label>
                                <Input id="d-data" type="date" className="mt-1.5" value={despesa.data}
                                  onChange={(e) => setDespesa({ ...despesa, data: e.target.value })} />
                              </div>
                              <div>
                                <Label htmlFor="d-desc">Descrição</Label>
                                <Input id="d-desc" className="mt-1.5" value={despesa.descricao}
                                  placeholder="Táxi aeroporto → hotel"
                                  onChange={(e) => setDespesa({ ...despesa, descricao: e.target.value })} />
                              </div>
                              <div>
                                <Label htmlFor="d-valor">Valor (R$)</Label>
                                <Input id="d-valor" type="number" step="0.01" className="mt-1.5"
                                  value={despesa.valor}
                                  onChange={(e) => setDespesa({ ...despesa, valor: e.target.value })} />
                              </div>
                            </div>
                          </section>

                          <section className="space-y-3 border-t pt-4">
                            <p className={rotuloSecao}>Comprovante</p>
                            <div className="flex items-start gap-3 rounded-md border border-dashed bg-muted/50 p-4">
                              <span aria-hidden
                                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent sm:flex">
                                <Paperclip className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                {comUpload ? (
                                  <>
                                    <Label htmlFor="d-comp">Arquivo do comprovante</Label>
                                    <Input id="d-comp" type="file" className="mt-1.5 cursor-pointer bg-card"
                                      accept={COMPROVANTE_TIPOS.join(",")}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        if (f && f.size > COMPROVANTE_MAX_BYTES) {
                                          toast.error("O comprovante passa de 10 MB.");
                                          e.target.value = "";
                                          setArquivo(null);
                                          return;
                                        }
                                        setArquivo(f);
                                      }} />
                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                      PDF ou foto, até 10 MB. Só você e quem aprova viagens conseguem abrir.
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <Label htmlFor="d-comp">Nome do arquivo</Label>
                                    <Input id="d-comp" className="mt-1.5 bg-card" value={despesa.comprovante_nome}
                                      placeholder="nota-fiscal-taxi.pdf"
                                      onChange={(e) => setDespesa({ ...despesa, comprovante_nome: e.target.value })} />
                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                      No modo de demonstração fica só o nome do arquivo.
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </section>

                          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                            <Button size="sm" variant="outline"
                              onClick={() => { setDespesaEm(null); setArquivo(null); }}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              disabled={!despesa.descricao.trim() || !despesa.data || !despesa.valor || addDespesa.isPending}
                              onClick={() => addDespesa.mutate(v.id)}
                            >
                              {addDespesa.isPending ? "Enviando…" : "Lançar despesa"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="bg-card"
                          onClick={() => { setDespesaEm(v.id); setDespesa(despesaVazia); setArquivo(null); }}>
                          <Plus /> Adicionar despesa
                        </Button>
                      )
                    )}

                    {v.avaliado_por && (
                      <p className="text-xs text-muted-foreground">
                        Avaliado por {nomeDe(v.avaliado_por)} em{" "}
                        {new Date(v.avaliado_em!).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  const novoRelatorio = (
    <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
      <DialogTrigger asChild><Button><Plus /> Novo relatório</Button></DialogTrigger>
      <DialogContent className="gap-5 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Novo relatório de viagem</DialogTitle>
          <DialogDescription>
            Depois de criar, você lança cada despesa com o comprovante e envia para aprovação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className={rotuloSecao}>Dados da viagem</p>
          <div>
            <Label htmlFor="v-tit">Título</Label>
            <Input id="v-tit" className="mt-1.5" value={form.titulo}
              placeholder="Visita ao Colégio X" onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="v-dest">Destino</Label>
            <Input id="v-dest" className="mt-1.5" value={form.destino}
              placeholder="Cidade / estado" onChange={(e) => setForm({ ...form, destino: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="v-ini">Início</Label>
              <Input id="v-ini" type="date" className="mt-1.5" value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="v-fim">Fim</Label>
              <Input id="v-fim" type="date" className="mt-1.5" value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="v-mot">Motivo</Label>
            <Textarea id="v-mot" className="mt-1.5" value={form.motivo}
              placeholder="Objetivo da viagem" onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2 border-t pt-4 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            disabled={!form.titulo.trim() || !form.destino.trim() || !form.data_inicio || !form.data_fim}
            onClick={() => criar.mutate()}
          >
            Criar relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Plane}
        titulo="Relatório de Viagens"
        subtitulo="Despesas de viagem com comprovante, para aprovação do financeiro"
        acao={novoRelatorio}
      />

      {carregando ? (
        <div role="status" aria-label="Carregando relatórios" className="space-y-6">
          <EsqueletoIndicadores />
          <EsqueletoLista linhas={3} />
        </div>
      ) : (
        <div className="space-y-6">
          {base.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {resumo.map((k) => (
                <Card key={k.rotulo}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
                        {formatCurrency(somar(k.itens))}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{k.itens.length} relatório(s)</p>
                    </div>
                    <span aria-hidden
                      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", k.tom)}>
                      <k.icone className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {podeAprovar ? (
            <Tabs value={aba} onValueChange={setAba}>
              <TabsList className="h-auto max-w-full flex-wrap justify-start">
                <TabsTrigger value="aprovar">
                  <Receipt /> Para aprovar {paraAprovar.length > 0 && `(${paraAprovar.length})`}
                </TabsTrigger>
                <TabsTrigger value="meus">Meus relatórios</TabsTrigger>
                <TabsTrigger value="todos">Todos ({todos.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="aprovar">{ListaViagens({ itens: paraAprovar, mostrarDono: true })}</TabsContent>
              <TabsContent value="meus">{ListaViagens({ itens: meus })}</TabsContent>
              <TabsContent value="todos">{ListaViagens({ itens: todos, mostrarDono: true })}</TabsContent>
            </Tabs>
          ) : (
            ListaViagens({ itens: meus })
          )}
        </div>
      )}
    </div>
  );
}
