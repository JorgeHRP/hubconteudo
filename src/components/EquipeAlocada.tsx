import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UsersRound, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { alocarNaEquipe, listarEquipe, listarProfiles, removerAlocacao } from "@/data/store";
import { funcaoEquipeLabels, funcaoEquipeTom } from "@/lib/labels-clientes";
import { getInitials } from "@/lib/mock-data";
import type { FuncaoEquipe } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const funcoes = Object.keys(funcaoEquipeLabels) as FuncaoEquipe[];

/** Quem da agência atende esta conta. Alimenta o responsável das tarefas do cliente. */
export function EquipeAlocada({ empresaId }: { empresaId: string }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ user_id: "", funcao: "cs" as FuncaoEquipe, principal: true });

  const { data: equipe } = useQuery({
    queryKey: ["equipe", empresaId],
    queryFn: () => listarEquipe(empresaId),
  });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["equipe", empresaId] });
    qc.invalidateQueries({ queryKey: ["equipe"] });
    // O cadastro de empresas mostra o resumo da equipe no card.
    qc.invalidateQueries({ queryKey: ["alocacoes"] });
    qc.invalidateQueries({ queryKey: ["empresas"] });
    qc.invalidateQueries({ queryKey: ["empresa", empresaId] });
  };

  const alocar = useMutation({
    mutationFn: () => alocarNaEquipe({ ...form, empresa_id: empresaId }),
    onSuccess: () => {
      setAberto(false);
      setForm({ user_id: "", funcao: "cs", principal: true });
      recarregar();
      toast.success("Pessoa alocada na conta");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerAlocacao(id),
    onSuccess: () => { recarregar(); toast.success("Alocação removida"); },
  });

  const ativos = (profiles ?? []).filter((p) => p.ativo);
  const nomeDe = (id: string) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";
  const cargoDe = (id: string) => profiles?.find((p) => p.user_id === id)?.cargo ?? null;

  const dialogo = (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus /> Alocar pessoa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alocar na conta</DialogTitle>
          <DialogDescription>
            Quem está alocado aparece primeiro na hora de escolher o responsável de uma
            tarefa deste cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pessoa</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {ativos.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.nome}{p.cargo ? ` — ${p.cargo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Só o master cadastrado: a lista parece quebrada sem esta explicação. */}
            {ativos.length <= 1 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                A lista mostra os colaboradores ativos do sistema. Para alocar mais gente,
                cadastre em{" "}
                <Link to="/colaboradores" className="underline hover:text-foreground">
                  Colaboradores
                </Link>
                .
              </p>
            )}
          </div>
          <div>
            <Label>Função na conta</Label>
            <Select value={form.funcao}
              onValueChange={(v) => setForm({ ...form, funcao: v as FuncaoEquipe })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {funcoes.map((f) => (
                  <SelectItem key={f} value={f}>{funcaoEquipeLabels[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={form.principal}
              onChange={(e) => setForm({ ...form, principal: e.target.checked })}
              className="h-3.5 w-3.5 accent-[hsl(var(--primary))]" />
            Principal desta função
            {form.funcao === "cs" && " (vira o responsável da conta)"}
          </label>
          <Button className="w-full" disabled={!form.user_id} onClick={() => alocar.mutate()}>
            Alocar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Equipe alocada</p>
        {dialogo}
      </div>

      {equipe?.length === 0 ? (
        <EstadoVazio
          icone={UsersRound}
          titulo="Ninguém alocado nesta conta"
          descricao="Defina quem atende este cliente em cada frente. Quem está alocado aparece primeiro ao escolher o responsável de uma tarefa."
          acao={dialogo}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipe?.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 p-4 pt-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-[10px]">{getInitials(nomeDe(a.user_id))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nomeDe(a.user_id)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", funcaoEquipeTom[a.funcao])}>
                      {funcaoEquipeLabels[a.funcao]}
                    </span>
                    {a.principal && (
                      <Badge variant="info" className="gap-1 text-[9px]">
                        <Star className="h-2.5 w-2.5" /> Principal
                      </Badge>
                    )}
                  </div>
                  {cargoDe(a.user_id) && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">{cargoDe(a.user_id)}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={() => remover.mutate(a.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
