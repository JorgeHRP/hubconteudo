import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import {
  alternarMembroEquipe, listarEquipes, listarProfiles, removerEquipe, salvarEquipe,
} from "@/data/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoVazio } from "@/components/EstadoVazio";
import { cn } from "@/lib/utils";

const cores = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b",
];

/**
 * Times fixos da agência. A alocação por cliente continua sendo feita na ficha
 * de cada conta — aqui é só quem pertence a qual time.
 */
export function EquipesAgencia() {
  const qc = useQueryClient();
  const [nova, setNova] = useState("");
  const [cor, setCor] = useState(cores[6]);

  const { data: equipes } = useQuery({ queryKey: ["equipes"], queryFn: listarEquipes });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const atualizar = () => qc.invalidateQueries({ queryKey: ["equipes"] });
  const erro = (e: Error) => toast.error(e.message);

  const gravar = useMutation({ mutationFn: salvarEquipe, onSuccess: atualizar, onError: erro });
  const apagar = useMutation({
    mutationFn: removerEquipe,
    onSuccess: () => { atualizar(); toast.success("Equipe removida"); },
    onError: erro,
  });
  const alternar = useMutation({
    mutationFn: ({ equipe, pessoa }: { equipe: string; pessoa: string }) =>
      alternarMembroEquipe(equipe, pessoa),
    onSuccess: atualizar,
    onError: erro,
  });

  const ativos = (profiles ?? []).filter((p) => p.ativo);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 pt-4">
          <Label className="text-xs">Nova equipe</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Input className="h-9 w-56" placeholder="Ex.: Performance" value={nova}
              onChange={(e) => setNova(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {cores.map((c) => (
                <button key={c} type="button" onClick={() => setCor(c)}
                  style={{ backgroundColor: c }}
                  className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-transform",
                    cor === c ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110")}>
                  {cor === c && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
            <Button size="sm" disabled={!nova.trim()}
              onClick={() => { gravar.mutate({ nome: nova.trim(), cor }); setNova(""); }}>
              <Plus /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      {(equipes ?? []).length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhuma equipe"
          descricao="Crie times como Tráfego, Conteúdo ou SEO para organizar quem faz o quê."
        />
      ) : (
        (equipes ?? []).map((eq) => (
          <Card key={eq.id}>
            <CardContent className="p-4 pt-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: eq.cor }} />
                <Input className="h-8 w-48" value={eq.nome}
                  onChange={(e) => gravar.mutate({ ...eq, nome: e.target.value })} />
                <div className="flex flex-wrap gap-1.5">
                  {cores.map((c) => (
                    <button key={c} type="button" onClick={() => gravar.mutate({ ...eq, cor: c })}
                      style={{ backgroundColor: c }}
                      className={cn("flex h-5 w-5 items-center justify-center rounded-full transition-transform",
                        eq.cor === c ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110")}>
                      {eq.cor === c && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {eq.membros.length === 1 ? "1 pessoa" : `${eq.membros.length} pessoas`}
                </span>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8"
                  onClick={() => apagar.mutate(eq.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ativos.map((p) => {
                  const dentro = eq.membros.includes(p.user_id);
                  return (
                    <button key={p.user_id} type="button"
                      onClick={() => alternar.mutate({ equipe: eq.id, pessoa: p.user_id })}
                      style={dentro ? { backgroundColor: eq.cor, borderColor: eq.cor } : undefined}
                      className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors",
                        dentro ? "text-white" : "text-muted-foreground hover:bg-muted")}>
                      {p.nome}
                    </button>
                  );
                })}
                {ativos.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum colaborador ativo para incluir.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
