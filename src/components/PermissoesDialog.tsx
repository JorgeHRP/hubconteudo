import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Shield } from "lucide-react";
import { toast } from "sonner";
import { definirModulos, modulosDe } from "@/data/store";
import { moduloDescricoes, moduloLabels } from "@/lib/mock-data";
import type { AppModulo, AppRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const modulos = Object.keys(moduloLabels) as AppModulo[];

/** Só apresentação: em que bloco cada painel aparece na lista. O que não estiver aqui cai em "Outros". */
const gruposVisuais: { rotulo: string; itens: AppModulo[] }[] = [
  { rotulo: "Operação", itens: ["clientes", "tarefas", "cs", "colaboradores"] },
  { rotulo: "Comercial e financeiro", itens: ["vendas", "financeiro", "viagens_aprovacao"] },
  { rotulo: "Frentes de entrega", itens: ["inbound", "sites", "social"] },
  { rotulo: "Painéis externos", itens: ["trafego", "seo_geo", "projetos_rd"] },
];
const agrupados = new Set(gruposVisuais.flatMap((g) => g.itens));
const grupos = [
  ...gruposVisuais.map((g) => ({ rotulo: g.rotulo, itens: g.itens.filter((m) => modulos.includes(m)) })),
  { rotulo: "Outros", itens: modulos.filter((m) => !agrupados.has(m)) },
].filter((g) => g.itens.length > 0);

export function PermissoesDialog({
  userId,
  nome,
  papel,
}: {
  userId: string;
  nome: string;
  papel: AppRole;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<AppModulo[]>([]);

  function abrir(v: boolean) {
    if (v) setSelecionados(modulosDe(userId));
    setAberto(v);
  }

  const salvar = useMutation({
    mutationFn: () => definirModulos(userId, selecionados),
    onSuccess: () => {
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success(`Permissões de ${nome} atualizadas`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ehMaster = papel === "master";

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Permissões" aria-label={`Permissões de ${nome}`}>
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissões — {nome}</DialogTitle>
          <DialogDescription>
            {ehMaster
              ? "Master enxerga todos os painéis por definição."
              : "Marque os painéis que esta pessoa poderá acessar."}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
          {grupos.map((g) => (
            <section key={g.rotulo} aria-label={g.rotulo}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.rotulo}
                </h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {g.itens.filter((m) => ehMaster || selecionados.includes(m)).length} de {g.itens.length}
                </span>
              </div>
              <div className="divide-y overflow-hidden rounded-md border bg-card">
                {g.itens.map((m) => {
                  const ativo = ehMaster || selecionados.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      role="checkbox"
                      aria-checked={ativo}
                      disabled={ehMaster}
                      onClick={() =>
                        setSelecionados((s) =>
                          s.includes(m) ? s.filter((x) => x !== m) : [...s, m]
                        )
                      }
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-70",
                        ativo ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                          ativo ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"
                        )}
                      >
                        {ativo && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-medium", !ativo && "text-foreground/80")}>
                          {moduloLabels[m]}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {moduloDescricoes[m]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs tabular-nums text-muted-foreground">
            {ehMaster ? modulos.length : selecionados.length} de {modulos.length} painéis liberados
          </p>
          <Button disabled={ehMaster} onClick={() => salvar.mutate()}>Salvar permissões</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
