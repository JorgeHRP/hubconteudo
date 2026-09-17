import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
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
  });

  const ehMaster = papel === "master";

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Permissões">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permissões — {nome}</DialogTitle>
          <DialogDescription>
            {ehMaster
              ? "Master enxerga todos os painéis por definição."
              : "Marque os painéis que esta pessoa poderá acessar."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {modulos.map((m) => {
            const ativo = ehMaster || selecionados.includes(m);
            return (
              <button
                key={m}
                disabled={ehMaster}
                onClick={() =>
                  setSelecionados((s) =>
                    s.includes(m) ? s.filter((x) => x !== m) : [...s, m]
                  )
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors disabled:opacity-60",
                  ativo ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  ativo ? "border-primary bg-primary" : "border-input"
                )}>
                  {ativo && <span className="text-[10px] leading-none text-primary-foreground">✓</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{moduloLabels[m]}</p>
                  <p className="text-xs text-muted-foreground">{moduloDescricoes[m]}</p>
                </div>
              </button>
            );
          })}
        </div>
        <Button disabled={ehMaster} onClick={() => salvar.mutate()}>Salvar permissões</Button>
      </DialogContent>
    </Dialog>
  );
}
