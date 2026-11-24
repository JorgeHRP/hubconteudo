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
import { EsqueletoLista } from "@/components/Esqueletos";
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

  const { data: equipes, isLoading: carregando } = useQuery({ queryKey: ["equipes"], queryFn: listarEquipes });
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
        <CardContent className="p-5">
          <Label htmlFor="eq-nova"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nova equipe
          </Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input id="eq-nova" className="sm:w-56" placeholder="Ex.: Performance" value={nova}
              onChange={(e) => setNova(e.target.value)} />
            <div className="-mx-1 flex flex-wrap" role="group" aria-label="Cor da equipe">
              {cores.map((c, i) => (
                <button key={c} type="button" onClick={() => setCor(c)}
                  aria-label={`Cor ${i + 1}`} aria-pressed={cor === c}
                  className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-8 sm:w-8">
                  <span style={{ backgroundColor: c }}
                    className={cn("flex h-6 w-6 items-center justify-center rounded-full",
                      cor === c && "ring-2 ring-foreground ring-offset-2 ring-offset-card")}>
                    {cor === c && <Check className="h-3 w-3 text-white" aria-hidden />}
                  </span>
                </button>
              ))}
            </div>
            <Button size="sm" disabled={!nova.trim()} className="sm:ml-auto"
              onClick={() => { gravar.mutate({ nome: nova.trim(), cor }); setNova(""); }}>
              <Plus /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      {carregando ? (
        <div role="status" aria-label="Carregando equipes">
          <EsqueletoLista linhas={3} />
        </div>
      ) : (equipes ?? []).length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhuma equipe"
          descricao="Crie times como Tráfego, Conteúdo ou SEO para organizar quem faz o quê."
        />
      ) : (
        (equipes ?? []).map((eq) => (
          <Card key={eq.id}>
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4">
                <div className="flex min-w-0 flex-1 basis-56 items-center gap-2.5">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: eq.cor }} aria-hidden />
                  <Input className="h-9 min-w-0 font-medium sm:max-w-56" value={eq.nome}
                    aria-label="Nome da equipe"
                    onChange={(e) => gravar.mutate({ ...eq, nome: e.target.value })} />
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {eq.membros.length === 1 ? "1 pessoa" : `${eq.membros.length} pessoas`}
                  </span>
                </div>
                <div className="-mx-1 flex flex-wrap" role="group" aria-label={`Cor da equipe ${eq.nome}`}>
                  {cores.map((c, i) => (
                    <button key={c} type="button" onClick={() => gravar.mutate({ ...eq, cor: c })}
                      aria-label={`Cor ${i + 1}`} aria-pressed={eq.cor === c}
                      className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-7 sm:w-7">
                      <span style={{ backgroundColor: c }}
                        className={cn("flex h-5 w-5 items-center justify-center rounded-full",
                          eq.cor === c && "ring-2 ring-foreground ring-offset-2 ring-offset-card")}>
                        {eq.cor === c && <Check className="h-3 w-3 text-white" aria-hidden />}
                      </span>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="icon"
                  className="ml-auto h-9 w-9 text-muted-foreground hover:text-destructive"
                  title="Remover equipe" aria-label={`Remover a equipe ${eq.nome}`}
                  onClick={() => apagar.mutate(eq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 border-t bg-muted/50 px-5 py-4">
                {ativos.map((p) => {
                  const dentro = eq.membros.includes(p.user_id);
                  return (
                    <button key={p.user_id} type="button" aria-pressed={dentro}
                      onClick={() => alternar.mutate({ equipe: eq.id, pessoa: p.user_id })}
                      style={dentro ? { backgroundColor: eq.cor, borderColor: eq.cor } : undefined}
                      className={cn("inline-flex min-h-9 items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-8",
                        dentro ? "font-medium text-white" : "bg-card text-muted-foreground hover:text-foreground")}>
                      {dentro && <Check className="h-3 w-3 shrink-0" aria-hidden />}
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
