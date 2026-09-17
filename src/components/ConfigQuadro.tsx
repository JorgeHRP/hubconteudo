import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings2, Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  listarStatus, listarTiposTarefa, removerStatus, removerTipoTarefa,
  reordenarStatus, salvarStatus, salvarTipoTarefa,
} from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Paleta sugerida — evita cor digitada à mão que não conversa com o resto da tela. */
const cores = [
  "#64748b", "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

function SeletorCor({ valor, aoTrocar }: { valor: string; aoTrocar: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cores.map((c) => (
        <button key={c} type="button" onClick={() => aoTrocar(c)}
          style={{ backgroundColor: c }}
          className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-transform",
            valor === c ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110")}>
          {valor === c && <Check className="h-3 w-3 text-white" />}
        </button>
      ))}
    </div>
  );
}

/**
 * Configuração do quadro: as colunas e os tipos de trabalho deixam de ser fixos
 * no código e passam a ser definidos pela agência.
 */
export function ConfigQuadro() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [novoStatus, setNovoStatus] = useState("");
  const [corStatus, setCorStatus] = useState(cores[1]);
  const [novoTipo, setNovoTipo] = useState("");
  const [corTipo, setCorTipo] = useState(cores[5]);

  const { data: colunas } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });
  const { data: tipos } = useQuery({ queryKey: ["tipos-tarefa"], queryFn: listarTiposTarefa });

  const atualizar = () => {
    qc.invalidateQueries({ queryKey: ["status-tarefa"] });
    qc.invalidateQueries({ queryKey: ["tipos-tarefa"] });
    qc.invalidateQueries({ queryKey: ["tarefas"] });
  };
  const erro = (e: Error) => toast.error(e.message);

  const gravarStatus = useMutation({ mutationFn: salvarStatus, onSuccess: atualizar, onError: erro });
  const apagarStatus = useMutation({ mutationFn: removerStatus, onSuccess: atualizar, onError: erro });
  const ordenar = useMutation({ mutationFn: reordenarStatus, onSuccess: atualizar, onError: erro });
  const gravarTipo = useMutation({ mutationFn: salvarTipoTarefa, onSuccess: atualizar, onError: erro });
  const apagarTipo = useMutation({ mutationFn: removerTipoTarefa, onSuccess: atualizar, onError: erro });

  const lista = colunas ?? [];

  const mover = (i: number, direcao: -1 | 1) => {
    const ids = lista.map((c) => c.id);
    const j = i + direcao;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    ordenar.mutate(ids);
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 /> Configurar quadro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar quadro</DialogTitle>
          <DialogDescription>
            Ajuste as colunas e os tipos de trabalho ao jeito da agência. As tarefas
            existentes acompanham as mudanças.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colunas">
          <TabsList>
            <TabsTrigger value="colunas">Colunas</TabsTrigger>
            <TabsTrigger value="tipos">Tipos de trabalho</TabsTrigger>
          </TabsList>

          <TabsContent value="colunas" className="space-y-2">
            {lista.map((c, i) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
                <Input className="h-8 w-40" value={c.label}
                  onChange={(e) => gravarStatus.mutate({ ...c, label: e.target.value })} />
                <SeletorCor valor={c.cor} aoTrocar={(cor) => gravarStatus.mutate({ ...c, cor })} />

                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={c.concluido === true}
                    onChange={(e) => gravarStatus.mutate({ ...c, concluido: e.target.checked })} />
                  conta como entregue
                </label>

                <div className="ml-auto flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0}
                    onClick={() => mover(i, -1)}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === lista.length - 1}
                    onClick={() => mover(i, 1)}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => apagarStatus.mutate(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-dashed p-3">
              <Label className="text-xs">Nova coluna</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Input className="h-8 w-48" placeholder="Ex.: Aguardando cliente" value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)} />
                <SeletorCor valor={corStatus} aoTrocar={setCorStatus} />
                <Button size="sm" className="h-8" disabled={!novoStatus.trim()}
                  onClick={() => {
                    gravarStatus.mutate({ label: novoStatus.trim(), cor: corStatus });
                    setNovoStatus("");
                  }}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Uma coluna só pode ser excluída depois que estiver vazia. A coluna marcada como
              “conta como entregue” é a que alimenta os indicadores de conclusão.
            </p>
          </TabsContent>

          <TabsContent value="tipos" className="space-y-2">
            {(tipos ?? []).map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${t.cor}22`, color: t.cor }}>
                  {t.label || "sem nome"}
                </span>
                <Input className="h-8 w-40" value={t.label}
                  onChange={(e) => gravarTipo.mutate({ ...t, label: e.target.value })} />
                <SeletorCor valor={t.cor} aoTrocar={(cor) => gravarTipo.mutate({ ...t, cor })} />
                <Button variant="ghost" size="icon" className="ml-auto h-7 w-7"
                  onClick={() => apagarTipo.mutate(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <div className="rounded-lg border border-dashed p-3">
              <Label className="text-xs">Novo tipo</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Input className="h-8 w-48" placeholder="Ex.: Social media" value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)} />
                <SeletorCor valor={corTipo} aoTrocar={setCorTipo} />
                <Button size="sm" className="h-8" disabled={!novoTipo.trim()}
                  onClick={() => {
                    gravarTipo.mutate({ label: novoTipo.trim(), cor: corTipo });
                    setNovoTipo("");
                  }}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Excluir um tipo não apaga tarefas — elas só ficam sem tipo.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
