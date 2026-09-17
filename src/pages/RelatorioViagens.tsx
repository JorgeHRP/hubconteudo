import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plane, Plus, Paperclip, Trash2, Send, Check, X, ChevronDown, ChevronRight, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  adicionarDespesa, criarViagem, listarProfiles, listarViagens, mudarStatusViagem,
  removerDespesa, removerViagem,
} from "@/data/store";
import {
  despesaCategoriaLabels, formatCurrency, formatDate, viagemStatusLabels, viagemStatusVariant,
} from "@/lib/cs-data";
import type { DespesaCategoria, RelatorioViagem } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const viagemVazia = { titulo: "", destino: "", motivo: "", data_inicio: "", data_fim: "" };
const despesaVazia = {
  categoria: "transporte" as DespesaCategoria,
  descricao: "", data: "", valor: "", comprovante_nome: "",
};

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
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [motivoReprova, setMotivoReprova] = useState("");

  const { data: viagens } = useQuery({ queryKey: ["viagens"], queryFn: listarViagens });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["viagens"] });
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
      }),
    onSuccess: () => {
      setDespesaEm(null);
      setDespesa(despesaVazia);
      invalidar();
      toast.success("Despesa lançada");
    },
  });

  const tirarDespesa = useMutation({
    mutationFn: ({ r, d }: { r: string; d: string }) => removerDespesa(r, d),
    onSuccess: invalidar,
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
  });

  const excluir = useMutation({
    mutationFn: (id: string) => removerViagem(id),
    onSuccess: () => { invalidar(); toast.success("Relatório excluído"); },
  });

  const todos = viagens ?? [];
  const meus = todos.filter((v) => v.colaborador_id === userId);
  const paraAprovar = todos.filter((v) => v.status === "enviado");

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
      <div className="space-y-3">
        {itens.map((v) => {
          const aberto = expandido === v.id;
          const meu = v.colaborador_id === userId;
          const editavel = meu && (v.status === "rascunho" || v.status === "reprovado");
          return (
            <Card key={v.id}>
              <CardContent className="p-4 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                    onClick={() => setExpandido(aberto ? null : v.id)}
                  >
                    {aberto
                      ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{v.titulo}</span>
                        <Badge variant={viagemStatusVariant[v.status]} className="text-[9px]">
                          {viagemStatusLabels[v.status]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {mostrarDono && <span className="font-medium">{nomeDe(v.colaborador_id)} · </span>}
                        {v.destino} · {formatDate(v.data_inicio)} a {formatDate(v.data_fim)} ·{" "}
                        {v.despesas.length} despesa(s)
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold">{formatCurrency(total(v))}</span>
                    {editavel && (
                      <>
                        <Button
                          size="sm"
                          disabled={v.despesas.length === 0}
                          onClick={() => mudarStatus.mutate({ id: v.id, status: "enviado" })}
                        >
                          <Send /> Enviar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => excluir.mutate(v.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
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
                  <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    Financeiro: {v.observacao_financeiro}
                  </p>
                )}

                {reprovando === v.id && (
                  <div className="mt-3 space-y-2 rounded-md border p-3">
                    <Label htmlFor={`rep-${v.id}`}>Motivo da reprovação</Label>
                    <Textarea id={`rep-${v.id}`} value={motivoReprova}
                      onChange={(e) => setMotivoReprova(e.target.value)}
                      placeholder="O que precisa ser corrigido" />
                    <div className="flex gap-2">
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
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">{v.motivo}</p>

                    {v.despesas.length > 0 && (
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="p-2 font-medium">Categoria</th>
                            <th className="p-2 font-medium">Descrição</th>
                            <th className="hidden p-2 font-medium sm:table-cell">Data</th>
                            <th className="p-2 font-medium">Comprovante</th>
                            <th className="p-2 text-right font-medium">Valor</th>
                            {editavel && <th className="w-8" />}
                          </tr>
                        </thead>
                        <tbody>
                          {v.despesas.map((d) => (
                            <tr key={d.id} className="border-b last:border-0">
                              <td className="p-2">
                                <Badge variant="secondary" className="text-[9px]">
                                  {despesaCategoriaLabels[d.categoria]}
                                </Badge>
                              </td>
                              <td className="p-2">{d.descricao}</td>
                              <td className="hidden p-2 text-muted-foreground sm:table-cell">
                                {formatDate(d.data)}
                              </td>
                              <td className="p-2">
                                {d.comprovante_nome ? (
                                  <span className="flex items-center gap-1 text-xs text-primary">
                                    <Paperclip className="h-3 w-3" /> {d.comprovante_nome}
                                  </span>
                                ) : (
                                  <span className="text-xs text-destructive">sem comprovante</span>
                                )}
                              </td>
                              <td className="p-2 text-right font-medium">{formatCurrency(d.valor)}</td>
                              {editavel && (
                                <td className="p-2">
                                  <button onClick={() => tirarDespesa.mutate({ r: v.id, d: d.id })}>
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {editavel && (
                      despesaEm === v.id ? (
                        <div className="mt-3 grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                          <div>
                            <Label>Categoria</Label>
                            <Select value={despesa.categoria}
                              onValueChange={(x) => setDespesa({ ...despesa, categoria: x as DespesaCategoria })}>
                              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
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
                          <div className="sm:col-span-2">
                            <Label htmlFor="d-comp">Comprovante</Label>
                            <Input id="d-comp" className="mt-1.5" value={despesa.comprovante_nome}
                              placeholder="nota-fiscal-taxi.pdf"
                              onChange={(e) => setDespesa({ ...despesa, comprovante_nome: e.target.value })} />
                            <p className="mt-1 text-xs text-muted-foreground">
                              O upload do arquivo entra junto com o Storage do Supabase.
                            </p>
                          </div>
                          <div className="flex gap-2 sm:col-span-2">
                            <Button size="sm" variant="outline" onClick={() => setDespesaEm(null)}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              disabled={!despesa.descricao.trim() || !despesa.data || !despesa.valor}
                              onClick={() => addDespesa.mutate(v.id)}
                            >
                              Lançar despesa
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="mt-3"
                          onClick={() => { setDespesaEm(v.id); setDespesa(despesaVazia); }}>
                          <Plus /> Adicionar despesa
                        </Button>
                      )
                    )}

                    {v.avaliado_por && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Avaliado por {nomeDe(v.avaliado_por)} em{" "}
                        {new Date(v.avaliado_em!).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  const novoRelatorio = (
    <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
      <DialogTrigger asChild><Button><Plus /> Novo relatório</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo relatório de viagem</DialogTitle>
          <DialogDescription>
            Depois de criar, você lança cada despesa com o comprovante e envia para aprovação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
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
          <Button
            className="w-full"
            disabled={!form.titulo.trim() || !form.destino.trim() || !form.data_inicio || !form.data_fim}
            onClick={() => criar.mutate()}
          >
            Criar relatório
          </Button>
        </div>
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

      {podeAprovar ? (
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="aprovar">
              <Receipt /> Para aprovar {paraAprovar.length > 0 && `(${paraAprovar.length})`}
            </TabsTrigger>
            <TabsTrigger value="meus">Meus relatórios</TabsTrigger>
            <TabsTrigger value="todos">Todos ({todos.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="aprovar"><ListaViagens itens={paraAprovar} mostrarDono /></TabsContent>
          <TabsContent value="meus"><ListaViagens itens={meus} /></TabsContent>
          <TabsContent value="todos"><ListaViagens itens={todos} mostrarDono /></TabsContent>
        </Tabs>
      ) : (
        <ListaViagens itens={meus} />
      )}
    </div>
  );
}
