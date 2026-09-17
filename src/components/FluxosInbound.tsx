import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Workflow, Plus, Trash2, ChevronUp, ChevronDown, Megaphone, LayoutTemplate,
  FileText, UserCheck, Mail, Timer, MessageCircle, GitBranch, Gauge, LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  adicionarNoFluxo, atualizarNoFluxo, listarFluxos, listarNosFluxo, moverNoFluxo,
  removerFluxo, removerNoFluxo, salvarFluxo,
} from "@/data/store";
import { blocosFluxo } from "@/lib/labels-clientes";
import type { FluxoInbound, TipoNoFluxo } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const icones: Record<string, typeof Mail> = {
  campanha: Megaphone,
  entrada_fluxo: LogIn,
  landing_page: LayoutTemplate,
  formulario: FileText,
  lead: UserCheck,
  enviar_email: Mail,
  espera: Timer,
  whatsapp: MessageCircle,
  condicao_resposta_form: GitBranch,
  lead_scoring: Gauge,
};

const tomDoTipo: Record<TipoNoFluxo, string> = {
  entrada: "border-primary/40 bg-primary/5 text-primary",
  automacao: "border-info/40 bg-info/5 text-info",
  condicao: "border-warning/40 bg-warning/5 text-warning",
  conversao: "border-success/40 bg-success/5 text-success",
};

const statusFluxo: Record<FluxoInbound["status"], { rotulo: string; variante: "outline" | "success" | "warning" }> = {
  rascunho: { rotulo: "Rascunho", variante: "outline" },
  ativo: { rotulo: "Ativo", variante: "success" },
  pausado: { rotulo: "Pausado", variante: "warning" },
};

/**
 * Réguas de nutrição do cliente. O fluxo é montado como uma sequência de blocos
 * (campanha, e-mail, espera, condição) — a mesma gramática do RD Station.
 */
export function FluxosInbound({ empresaId }: { empresaId: string }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const { data: fluxos } = useQuery({
    queryKey: ["fluxos", empresaId], queryFn: () => listarFluxos(empresaId),
  });

  const atualizar = () => qc.invalidateQueries({ queryKey: ["fluxos", empresaId] });

  const criar = useMutation({
    mutationFn: () => salvarFluxo({ empresa_id: empresaId, nome: nome.trim() }),
    onSuccess: (f) => {
      atualizar(); setNome("");
      if (f) setAberto(f.id);
      toast.success("Fluxo criado");
    },
  });
  const gravar = useMutation({ mutationFn: salvarFluxo, onSuccess: atualizar });
  const apagar = useMutation({
    mutationFn: removerFluxo,
    onSuccess: () => { atualizar(); toast.success("Fluxo removido"); },
  });

  const lista = fluxos ?? [];

  const criador = (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[16rem] flex-1">
        <Label className="text-xs">Novo fluxo</Label>
        <Input className="mt-1.5" value={nome}
          placeholder="Fluxo · E-book Ensino Médio"
          onChange={(e) => setNome(e.target.value)} />
      </div>
      <Button disabled={!nome.trim()} onClick={() => criar.mutate()}>
        <Plus /> Criar
      </Button>
    </div>
  );

  if (lista.length === 0) {
    return (
      <EstadoVazio
        icone={Workflow}
        titulo="Nenhum fluxo de nutrição"
        descricao="Monte a régua que o lead percorre depois de converter: campanha, landing page, formulário, e-mails e esperas."
        acao={<div className="w-full max-w-md">{criador}</div>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 pt-4">{criador}</CardContent></Card>

      {lista.map((f) => (
        <Card key={f.id}>
          <CardContent className="p-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input className="h-8 w-64 font-medium" value={f.nome}
                onChange={(e) => gravar.mutate({ ...f, nome: e.target.value })} />

              <Select value={f.status}
                onValueChange={(v) => gravar.mutate({ ...f, status: v as FluxoInbound["status"] })}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusFluxo) as FluxoInbound["status"][]).map((st) => (
                    <SelectItem key={st} value={st}>{statusFluxo[st].rotulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant={statusFluxo[f.status].variante} className="text-[10px]">
                {statusFluxo[f.status].rotulo}
              </Badge>

              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs"
                  onClick={() => setAberto(aberto === f.id ? null : f.id)}>
                  {aberto === f.id ? "Fechar" : "Abrir régua"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => apagar.mutate(f.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {aberto === f.id && <Regua fluxoId={f.id} empresaId={empresaId} />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A sequência de blocos de um fluxo. */
function Regua({ fluxoId, empresaId }: { fluxoId: string; empresaId: string }) {
  const qc = useQueryClient();
  const [bloco, setBloco] = useState("");

  const { data: nos } = useQuery({
    queryKey: ["nos-fluxo", fluxoId], queryFn: () => listarNosFluxo(fluxoId),
  });

  const atualizar = () => {
    qc.invalidateQueries({ queryKey: ["nos-fluxo", fluxoId] });
    qc.invalidateQueries({ queryKey: ["fluxos", empresaId] });
  };

  const adicionar = useMutation({
    mutationFn: () => {
      const def = blocosFluxo.find((b) => b.chave === bloco)!;
      return adicionarNoFluxo({
        fluxo_id: fluxoId,
        tipo: def.tipo,
        bloco: def.chave,
        rotulo: def.rotulo,
        descricao: null,
        espera_dias: def.chave === "espera" ? 1 : null,
      });
    },
    onSuccess: () => { atualizar(); setBloco(""); },
  });
  const mudar = useMutation({
    mutationFn: ({ id, campos }: { id: string; campos: Parameters<typeof atualizarNoFluxo>[1] }) =>
      atualizarNoFluxo(id, campos),
    onSuccess: atualizar,
  });
  const mover = useMutation({
    mutationFn: ({ id, dir }: { id: string; dir: -1 | 1 }) => moverNoFluxo(id, dir),
    onSuccess: atualizar,
  });
  const apagar = useMutation({ mutationFn: removerNoFluxo, onSuccess: atualizar });

  const lista = nos ?? [];
  const diasAte = (i: number) =>
    lista.slice(0, i).reduce((s, n) => s + (n.espera_dias ?? 0), 0);

  return (
    <div className="mt-4 border-t pt-4">
      {lista.length === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Fluxo vazio. Comece pela entrada — campanha ou landing page — e vá somando
          e-mails e esperas.
        </p>
      ) : (
        <div className="mb-3 space-y-0">
          {lista.map((n, i) => {
            const Icone = icones[n.bloco] ?? Workflow;
            return (
              <div key={n.id}>
                {i > 0 && (
                  <div className="ml-[1.15rem] h-4 w-px bg-border" aria-hidden />
                )}
                <div className={cn("group flex flex-wrap items-center gap-2 rounded-lg border p-2.5",
                  tomDoTipo[n.tipo])}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    <Icone className="h-4 w-4" />
                  </span>

                  <Input
                    className="h-8 w-52 border-0 bg-transparent px-1 font-medium text-foreground shadow-none focus-visible:ring-0"
                    value={n.rotulo}
                    onChange={(e) => mudar.mutate({ id: n.id, campos: { rotulo: e.target.value } })}
                  />

                  {n.bloco === "espera" ? (
                    <div className="flex items-center gap-1.5">
                      <Input type="number" min="0" className="h-8 w-16 text-foreground"
                        value={n.espera_dias ?? 0}
                        onChange={(e) =>
                          mudar.mutate({ id: n.id, campos: { espera_dias: Number(e.target.value) } })
                        } />
                      <span className="text-[11px] text-muted-foreground">dias</span>
                    </div>
                  ) : (
                    <Input
                      className="h-8 min-w-[10rem] flex-1 border-0 bg-transparent px-1 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      placeholder="Descrição (opcional)"
                      value={n.descricao ?? ""}
                      onChange={(e) =>
                        mudar.mutate({ id: n.id, campos: { descricao: e.target.value || null } })
                      }
                    />
                  )}

                  {/* Quando o lead chega neste ponto, contado desde a entrada.
                      No bloco de espera seria redundante: ele já mostra a própria duração. */}
                  {n.bloco !== "espera" && diasAte(i) > 0 && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      dia {diasAte(i)}
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0}
                      onClick={() => mover.mutate({ id: n.id, dir: -1 })}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      disabled={i === lista.length - 1}
                      onClick={() => mover.mutate({ id: n.id, dir: 1 })}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => apagar.mutate(n.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={bloco} onValueChange={setBloco}>
          <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Adicionar bloco" /></SelectTrigger>
          <SelectContent>
            {blocosFluxo.map((b) => (
              <SelectItem key={b.chave} value={b.chave}>{b.rotulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8" disabled={!bloco}
          onClick={() => adicionar.mutate()}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>

        {lista.length > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {lista.length === 1 ? "1 bloco" : `${lista.length} blocos`}
            {diasAte(lista.length) > 0 && ` · régua de ${diasAte(lista.length)} dias`}
          </span>
        )}
      </div>
    </div>
  );
}
