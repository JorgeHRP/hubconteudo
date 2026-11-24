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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Rótulo pequeno que abre cada seção do diálogo. */
const rotuloSecao = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

/** Paleta sugerida — evita cor digitada à mão que não conversa com o resto da tela. */
const cores = [
  "#64748b", "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

function SeletorCor({ valor, aoTrocar }: { valor: string; aoTrocar: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cor">
      {cores.map((c, i) => (
        <button key={c} type="button" onClick={() => aoTrocar(c)}
          aria-label={`Cor ${i + 1} de ${cores.length}`} aria-pressed={valor === c}
          style={{ backgroundColor: c }}
          className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            valor === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : "hover:ring-2 hover:ring-border hover:ring-offset-1 hover:ring-offset-card")}>
          {valor === c && <Check className="h-3.5 w-3.5 text-white" />}
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
      <DialogContent className="max-h-[90vh] max-w-2xl gap-5 overflow-y-auto p-5 sm:p-6">
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

          <TabsContent value="colunas" className="space-y-4">
            <section className="space-y-2">
              <p className={rotuloSecao}>Colunas do quadro</p>
              {lista.length > 0 && (
                <div className="divide-y overflow-hidden rounded-lg border">
                  {lista.map((c, i) => (
                    <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} aria-hidden />
                      <Input className="h-9 min-w-0 flex-1 basis-40 sm:max-w-[13rem]" value={c.label}
                        aria-label="Nome da coluna"
                        onChange={(e) => gravarStatus.mutate({ ...c, label: e.target.value })} />
                      <SeletorCor valor={c.cor} aoTrocar={(cor) => gravarStatus.mutate({ ...c, cor })} />

                      <label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={c.concluido === true}
                          className="h-4 w-4 accent-primary"
                          onChange={(e) => gravarStatus.mutate({ ...c, concluido: e.target.checked })} />
                        conta como entregue
                      </label>

                      <div className="ml-auto flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9" disabled={i === 0}
                          title="Mover para cima" aria-label={`Mover a coluna ${c.label} para cima`}
                          onClick={() => mover(i, -1)}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" disabled={i === lista.length - 1}
                          title="Mover para baixo" aria-label={`Mover a coluna ${c.label} para baixo`}
                          onClick={() => mover(i, 1)}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Excluir coluna" aria-label={`Excluir a coluna ${c.label}`}
                          onClick={() => apagarStatus.mutate(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-lg border border-dashed bg-muted/50 p-4">
              <p className={rotuloSecao}>Nova coluna</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Input className="h-9 min-w-0 flex-1 basis-48 bg-card sm:max-w-[15rem]"
                  placeholder="Ex.: Aguardando cliente" value={novoStatus} aria-label="Nome da nova coluna"
                  onChange={(e) => setNovoStatus(e.target.value)} />
                <SeletorCor valor={corStatus} aoTrocar={setCorStatus} />
                <Button size="sm" className="ml-auto h-9" disabled={!novoStatus.trim()}
                  onClick={() => {
                    gravarStatus.mutate({ label: novoStatus.trim(), cor: corStatus });
                    setNovoStatus("");
                  }}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </section>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Uma coluna só pode ser excluída depois que estiver vazia. A coluna marcada como
              “conta como entregue” é a que alimenta os indicadores de conclusão.
            </p>
          </TabsContent>

          <TabsContent value="tipos" className="space-y-4">
            <section className="space-y-2">
              <p className={rotuloSecao}>Tipos de trabalho</p>
              {(tipos ?? []).length > 0 && (
                <div className="divide-y overflow-hidden rounded-lg border">
                  {(tipos ?? []).map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                      <span className="inline-flex max-w-[9rem] items-center truncate rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${t.cor}22`, color: t.cor }}>
                        {t.label || "sem nome"}
                      </span>
                      <Input className="h-9 min-w-0 flex-1 basis-40 sm:max-w-[13rem]" value={t.label}
                        aria-label="Nome do tipo de trabalho"
                        onChange={(e) => gravarTipo.mutate({ ...t, label: e.target.value })} />
                      <SeletorCor valor={t.cor} aoTrocar={(cor) => gravarTipo.mutate({ ...t, cor })} />
                      <Button variant="ghost" size="icon"
                        className="ml-auto h-9 w-9 text-muted-foreground hover:text-destructive"
                        title="Excluir tipo" aria-label={`Excluir o tipo ${t.label}`}
                        onClick={() => apagarTipo.mutate(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-lg border border-dashed bg-muted/50 p-4">
              <p className={rotuloSecao}>Novo tipo</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Input className="h-9 min-w-0 flex-1 basis-48 bg-card sm:max-w-[15rem]"
                  placeholder="Ex.: Social media" value={novoTipo} aria-label="Nome do novo tipo"
                  onChange={(e) => setNovoTipo(e.target.value)} />
                <SeletorCor valor={corTipo} aoTrocar={setCorTipo} />
                <Button size="sm" className="ml-auto h-9" disabled={!novoTipo.trim()}
                  onClick={() => {
                    gravarTipo.mutate({ label: novoTipo.trim(), cor: corTipo });
                    setNovoTipo("");
                  }}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
            </section>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Excluir um tipo não apaga tarefas — elas só ficam sem tipo.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
