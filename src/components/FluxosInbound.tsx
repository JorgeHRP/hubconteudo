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
import { EsqueletoLista } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  entrada: "border-primary/20 bg-primary/10 text-primary",
  automacao: "border-info/20 bg-info/10 text-info",
  condicao: "border-warning/30 bg-warning/15 text-warning-strong",
  conversao: "border-success/20 bg-success/10 text-success",
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
    <div className="flex flex-wrap items-end gap-2 text-left">
      <div className="min-w-[12rem] flex-1">
        <Label htmlFor="novo-fluxo-nome" className="text-xs text-muted-foreground">Nome do novo fluxo</Label>
        <Input id="novo-fluxo-nome" className="mt-1.5" value={nome}
          placeholder="Fluxo · E-book Ensino Médio"
          onChange={(e) => setNome(e.target.value)} />
      </div>
      <Button disabled={!nome.trim()} onClick={() => criar.mutate()}>
        <Plus /> Criar
      </Button>
    </div>
  );

  if (!fluxos) {
    return (
      <div role="status" aria-label="Carregando fluxos">
        <EsqueletoLista linhas={3} />
      </div>
    );
  }

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
      <Card>
        <CardHeader className="border-b px-5 py-3.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-4 w-4 text-accent" aria-hidden /> Novo fluxo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">{criador}</CardContent>
      </Card>

      {lista.map((f) => (
        <Card key={f.id} className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <Input className="h-9 w-full font-medium sm:w-72" value={f.nome}
              aria-label="Nome do fluxo"
              onChange={(e) => gravar.mutate({ ...f, nome: e.target.value })} />

            <Select value={f.status}
              onValueChange={(v) => gravar.mutate({ ...f, status: v as FluxoInbound["status"] })}>
              <SelectTrigger className="h-9 w-32" aria-label={`Situação do fluxo ${f.nome}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(statusFluxo) as FluxoInbound["status"][]).map((st) => (
                  <SelectItem key={st} value={st}>{statusFluxo[st].rotulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant={statusFluxo[f.status].variante}>
              {statusFluxo[f.status].rotulo}
            </Badge>

            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-9 text-xs"
                aria-expanded={aberto === f.id}
                onClick={() => setAberto(aberto === f.id ? null : f.id)}>
                {aberto === f.id ? "Fechar" : "Abrir régua"}
                {aberto === f.id
                  ? <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
              </Button>
              <Button variant="ghost" size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                title="Remover fluxo" aria-label={`Remover fluxo ${f.nome}`}
                onClick={() => apagar.mutate(f.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {aberto === f.id && <Regua fluxoId={f.id} empresaId={empresaId} />}
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
    <div className="border-t bg-muted/50 p-4">
      {!nos ? (
        <div className="mb-4 space-y-2" role="status" aria-label="Carregando régua">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : lista.length === 0 ? (
        <p className="mb-4 rounded-md border border-dashed bg-card/60 px-3 py-4 text-center text-xs leading-relaxed text-muted-foreground">
          Fluxo vazio. Comece pela entrada — campanha ou landing page — e vá somando
          e-mails e esperas.
        </p>
      ) : (
        <ol className="mb-4">
          {lista.map((n, i) => {
            const Icone = icones[n.bloco] ?? Workflow;
            return (
              <li key={n.id}>
                {i > 0 && (
                  <div className="ml-[1.6rem] h-4 w-px bg-border" aria-hidden />
                )}
                <div className="group flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
                  <span aria-hidden
                    className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                      tomDoTipo[n.tipo])}>
                    <Icone className="h-4 w-4" />
                  </span>

                  <Input
                    className="h-9 min-w-[9rem] flex-1 border-transparent bg-transparent px-2 font-medium text-foreground shadow-none hover:border-input focus-visible:border-input sm:w-52 sm:flex-none"
                    aria-label="Nome do bloco"
                    value={n.rotulo}
                    onChange={(e) => mudar.mutate({ id: n.id, campos: { rotulo: e.target.value } })}
                  />

                  {n.bloco === "espera" ? (
                    <div className="flex items-center gap-1.5">
                      <Input type="number" min="0" className="h-9 w-20 tabular-nums text-foreground"
                        aria-label="Dias de espera"
                        value={n.espera_dias ?? 0}
                        onChange={(e) =>
                          mudar.mutate({ id: n.id, campos: { espera_dias: Number(e.target.value) } })
                        } />
                      <span className="text-xs text-muted-foreground">dias</span>
                    </div>
                  ) : (
                    <Input
                      className="h-9 min-w-[10rem] flex-1 border-transparent bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:border-input focus-visible:border-input"
                      placeholder="Descrição (opcional)"
                      aria-label={`Descrição do bloco ${n.rotulo}`}
                      value={n.descricao ?? ""}
                      onChange={(e) =>
                        mudar.mutate({ id: n.id, campos: { descricao: e.target.value || null } })
                      }
                    />
                  )}

                  {/* Quando o lead chega neste ponto, contado desde a entrada.
                      No bloco de espera seria redundante: ele já mostra a própria duração. */}
                  {n.bloco !== "espera" && diasAte(i) > 0 && (
                    <Badge variant="secondary" className="shrink-0 font-normal tabular-nums">
                      dia {diasAte(i)}
                    </Badge>
                  )}

                  {/* Em tela de toque as ações ficam sempre à vista; com mouse, aparecem ao passar ou focar. */}
                  <div className="ml-auto flex items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-9 w-9" disabled={i === 0}
                      title="Subir bloco" aria-label={`Subir bloco ${n.rotulo}`}
                      onClick={() => mover.mutate({ id: n.id, dir: -1 })}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9"
                      title="Descer bloco" aria-label={`Descer bloco ${n.rotulo}`}
                      disabled={i === lista.length - 1}
                      onClick={() => mover.mutate({ id: n.id, dir: 1 })}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      title="Remover bloco" aria-label={`Remover bloco ${n.rotulo}`}
                      onClick={() => apagar.mutate(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={bloco} onValueChange={setBloco}>
          <SelectTrigger className="h-9 min-w-[10rem] flex-1 bg-card sm:w-56 sm:flex-none" aria-label="Tipo de bloco"><SelectValue placeholder="Adicionar bloco" /></SelectTrigger>
          <SelectContent>
            {blocosFluxo.map((b) => (
              <SelectItem key={b.chave} value={b.chave}>{b.rotulo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-9" disabled={!bloco}
          onClick={() => adicionar.mutate()}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>

        {lista.length > 0 && (
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {lista.length === 1 ? "1 bloco" : `${lista.length} blocos`}
            {diasAte(lista.length) > 0 && ` · régua de ${diasAte(lista.length)} dias`}
          </span>
        )}
      </div>
    </div>
  );
}
