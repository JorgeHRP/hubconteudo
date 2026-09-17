import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  listarEmpresas, listarEquipe, listarEquipes, listarProfiles, listarProjetos,
  listarStatus, listarTiposTarefa, salvarTarefa, type NovaTarefa,
} from "@/data/store";
import {
  funcaoEquipeLabels, prioridadeLabels, tipoProjetoLabels,
} from "@/lib/labels-clientes";
import type { PrioridadeTarefa, Tarefa } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const vazia: NovaTarefa = {
  titulo: "", descricao: null, empresa_id: null, projeto_id: null, responsaveis: [],
  status_id: "todo", tipo_id: null, parent_id: null,
  prioridade: "normal", prazo: null, estimativa_horas: null, etiquetas: [],
};

/**
 * Criação e edição de tarefa.
 * Usado tanto no quadro geral quanto dentro da ficha de uma empresa — quando
 * `empresaFixa` vem preenchida, a tarefa já nasce vinculada àquele cliente.
 */
export function TarefaDialog({
  tarefa,
  empresaFixa,
  gatilho,
}: {
  tarefa?: Tarefa;
  empresaFixa?: string;
  gatilho?: ReactNode;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<NovaTarefa>(vazia);
  const [etiquetas, setEtiquetas] = useState("");

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetos"], queryFn: listarProjetos });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: statusLista } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });
  const { data: tipos } = useQuery({ queryKey: ["tipos-tarefa"], queryFn: listarTiposTarefa });
  const { data: equipes } = useQuery({ queryKey: ["equipes"], queryFn: listarEquipes });
  const { data: equipe } = useQuery({
    queryKey: ["equipe", form.empresa_id],
    queryFn: () => listarEquipe(form.empresa_id!),
    enabled: Boolean(form.empresa_id),
  });

  useEffect(() => {
    if (!aberto) return;
    if (tarefa) {
      setForm({ ...tarefa });
      setEtiquetas(tarefa.etiquetas.join(", "));
    } else {
      setForm({ ...vazia, empresa_id: empresaFixa ?? null });
      setEtiquetas("");
    }
  }, [aberto, tarefa, empresaFixa]);

  const set = <K extends keyof NovaTarefa>(campo: K, valor: NovaTarefa[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const projetosDaEmpresa = (projetos ?? []).filter(
    (p) => form.empresa_id && p.empresa_id === form.empresa_id
  );

  const ativos = (profiles ?? []).filter((p) => p.ativo);
  const alocados = (equipe ?? [])
    .map((a) => ({ ...a, pessoa: ativos.find((p) => p.user_id === a.user_id) }))
    .filter((a) => a.pessoa);
  const idsAlocados = new Set(alocados.map((a) => a.user_id));
  const demais = ativos.filter((p) => !idsAlocados.has(p.user_id));

  const salvar = useMutation({
    mutationFn: () =>
      salvarTarefa({
        ...form,
        etiquetas: etiquetas.split(",").map((e) => e.trim()).filter(Boolean),
        id: tarefa?.id,
        criado_por: userId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      setAberto(false);
      toast.success(tarefa ? "Tarefa atualizada" : "Tarefa criada");
    },
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {gatilho ?? <Button size="sm"><Plus /> Nova tarefa</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Vincule ao cliente e à frente para a tarefa entrar nos indicadores daquela conta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="tf-tit">Título *</Label>
            <Input id="tf-tit" className="mt-1.5" value={form.titulo}
              placeholder="Relatório de mídia de setembro"
              onChange={(e) => set("titulo", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tf-desc">Descrição</Label>
            <Textarea id="tf-desc" className="mt-1.5" value={form.descricao ?? ""}
              onChange={(e) => set("descricao", e.target.value || null)} />
          </div>

          <div>
            <Label>Cliente</Label>
            <Select
              value={form.empresa_id ?? "nenhum"}
              disabled={Boolean(empresaFixa)}
              onValueChange={(v) => {
                set("empresa_id", v === "nenhum" ? null : v);
                set("projeto_id", null);
                set("responsaveis", []);
              }}
            >
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Interna (sem cliente)</SelectItem>
                {empresas?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Frente</Label>
            <Select
              value={form.projeto_id ?? "nenhum"}
              disabled={projetosDaEmpresa.length === 0}
              onValueChange={(v) => set("projeto_id", v === "nenhum" ? null : v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={projetosDaEmpresa.length ? "Selecione" : "Sem projeto"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Sem frente específica</SelectItem>
                {projetosDaEmpresa.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{tipoProjetoLabels[p.tipo]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label>Responsáveis</Label>

            {/* Atalho: joga o time inteiro na tarefa em vez de marcar um a um. */}
            {(equipes ?? []).filter((e) => e.membros.length > 0).length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Times:</span>
                {(equipes ?? []).filter((e) => e.membros.length > 0).map((eq) => {
                  const todoTime = eq.membros.every((m) => form.responsaveis.includes(m));
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      title={todoTime ? `Tirar o time ${eq.nome}` : `Adicionar o time ${eq.nome}`}
                      onClick={() =>
                        set("responsaveis", todoTime
                          ? form.responsaveis.filter((r) => !eq.membros.includes(r))
                          : [...new Set([...form.responsaveis, ...eq.membros])])
                      }
                      style={todoTime ? { backgroundColor: eq.cor, borderColor: eq.cor } : { borderColor: eq.cor, color: eq.cor }}
                      className="rounded-full border px-2 py-0.5 text-[11px] transition-colors"
                    >
                      <span className={todoTime ? "text-white" : undefined}>{eq.nome}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[...alocados.map((a) => ({ id: a.user_id, nome: a.pessoa!.nome, sufixo: funcaoEquipeLabels[a.funcao] })),
                ...demais.map((p) => ({ id: p.user_id, nome: p.nome, sufixo: null }))]
                .map((pessoa) => {
                  const marcado = form.responsaveis.includes(pessoa.id);
                  return (
                    <button
                      key={pessoa.id}
                      type="button"
                      onClick={() =>
                        set("responsaveis", marcado
                          ? form.responsaveis.filter((x) => x !== pessoa.id)
                          : [...form.responsaveis, pessoa.id])
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {pessoa.nome}
                      {pessoa.sufixo && (
                        <span className={cn("ml-1 text-[10px]", marcado ? "opacity-80" : "opacity-60")}>
                          · {pessoa.sufixo}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
            {form.empresa_id && alocados.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Nenhuma equipe alocada neste cliente ainda.
              </p>
            )}
          </div>

          <div>
            <Label>Tipo de trabalho</Label>
            <Select value={form.tipo_id ?? "nenhum"}
              onValueChange={(v) => set("tipo_id", v === "nenhum" ? null : v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sem tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Sem tipo</SelectItem>
                {tipos?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tf-prazo">Prazo</Label>
            <Input id="tf-prazo" type="date" className="mt-1.5" value={form.prazo ?? ""}
              onChange={(e) => set("prazo", e.target.value || null)} />
          </div>

          <div>
            <Label>Situação</Label>
            <Select value={form.status_id} onValueChange={(v) => set("status_id", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusLista?.map((st) => (
                  <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridade</Label>
            <Select value={form.prioridade}
              onValueChange={(v) => set("prioridade", v as PrioridadeTarefa)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(prioridadeLabels) as PrioridadeTarefa[]).map((p) => (
                  <SelectItem key={p} value={p}>{prioridadeLabels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tf-est">Estimativa (horas)</Label>
            <Input id="tf-est" type="number" step="0.5" className="mt-1.5"
              value={form.estimativa_horas ?? ""}
              onChange={(e) => set("estimativa_horas", e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tf-etq">Etiquetas</Label>
            <Input id="tf-etq" className="mt-1.5" value={etiquetas} placeholder="Separe por vírgula"
              onChange={(e) => setEtiquetas(e.target.value)} />
          </div>

          <Button className="sm:col-span-2" disabled={!form.titulo.trim() || salvar.isPending}
            onClick={() => salvar.mutate()}>
            {tarefa ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
