import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Folder, List, Link2, Loader2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { estruturaClickUp, listarEmpresas, vincularClickUp } from "@/data/store";
import type { ClickUpEstrutura, ClickUpVinculo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Opcao extends ClickUpVinculo {
  /** Texto do menu: "Pasta › Lista" para listas de pasta. */
  rotulo: string;
}

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function opcoesDe(estrutura: ClickUpEstrutura | undefined): { espaco: string; opcoes: Opcao[] }[] {
  const grupos: { espaco: string; opcoes: Opcao[] }[] = [];
  for (const w of estrutura?.workspaces ?? []) {
    for (const e of w.espacos) {
      const opcoes: Opcao[] = [];
      const base = `https://app.clickup.com/${w.id}/v`;
      for (const p of e.pastas) {
        opcoes.push({
          tipo: "pasta", id: p.id, nome: p.nome, url: `${base}/f/${p.id}`, rotulo: `${p.nome} (pasta inteira)`,
        });
        for (const l of p.listas) {
          opcoes.push({
            tipo: "lista", id: l.id, nome: `${p.nome} › ${l.nome}`, url: `${base}/li/${l.id}`,
            rotulo: `${p.nome} › ${l.nome}`,
          });
        }
      }
      for (const l of e.listas) {
        opcoes.push({ tipo: "lista", id: l.id, nome: l.nome, url: `${base}/li/${l.id}`, rotulo: l.nome });
      }
      grupos.push({ espaco: e.nome, opcoes });
    }
  }
  return grupos;
}

/** Pasta com o nome da empresa; sem pasta, uma lista com o nome dela. */
function sugerir(nome: string, opcoes: Opcao[]): ClickUpVinculo | null {
  const alvo = normalizar(nome);
  if (alvo.length < 3) return null;
  const parecido = (o: Opcao) => {
    const n = normalizar(o.tipo === "lista" ? o.nome.split(" › ").pop()! : o.nome);
    return n === alvo || (n.length >= 4 && (n.includes(alvo) || alvo.includes(n)));
  };
  const achado =
    opcoes.find((o) => o.tipo === "pasta" && normalizar(o.nome) === alvo) ??
    opcoes.find((o) => o.tipo === "pasta" && parecido(o)) ??
    opcoes.find((o) => o.tipo === "lista" && parecido(o));
  return achado ? { tipo: achado.tipo, id: achado.id, nome: achado.nome, url: achado.url } : null;
}

/** Master liga cada empresa da carteira às pastas e listas dela no ClickUp. */
export function ClickUpDialog() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [vinculos, setVinculos] = useState<Record<string, ClickUpVinculo[]>>({});

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas, enabled: aberto });
  const estrutura = useQuery({
    queryKey: ["clickup-estrutura"],
    queryFn: estruturaClickUp,
    enabled: aberto,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const grupos = useMemo(() => opcoesDe(estrutura.data), [estrutura.data]);
  const todas = useMemo(() => grupos.flatMap((g) => g.opcoes), [grupos]);

  function abrir(v: boolean) {
    if (v) setVinculos({});
    setAberto(v);
  }

  const atuais = (id: string) =>
    vinculos[id] ?? empresas?.find((e) => e.id === id)?.clickup_vinculos ?? [];

  const mudar = (id: string, lista: ClickUpVinculo[]) => setVinculos((v) => ({ ...v, [id]: lista }));

  function adicionar(empresa_id: string, chave: string) {
    const o = todas.find((x) => `${x.tipo}:${x.id}` === chave);
    if (!o || atuais(empresa_id).some((v) => v.id === o.id)) return;
    mudar(empresa_id, [...atuais(empresa_id), { tipo: o.tipo, id: o.id, nome: o.nome, url: o.url }]);
  }

  function sugerirTodas() {
    let n = 0;
    const novos: Record<string, ClickUpVinculo[]> = {};
    for (const e of empresas ?? []) {
      if (atuais(e.id).length) continue;
      const s = sugerir(e.nome_fantasia, todas);
      if (s) { novos[e.id] = [s]; n++; }
    }
    setVinculos((v) => ({ ...v, ...novos }));
    toast.info(n ? `${n} sugestão(ões) pelo nome. Confira antes de salvar.` : "Nenhuma pasta com nome parecido.");
  }

  const salvar = useMutation({
    mutationFn: async () => {
      for (const [id, lista] of Object.entries(vinculos)) await vincularClickUp(id, lista);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setAberto(false);
      toast.success("Vínculos salvos. Clique em Sincronizar agora para trazer as tarefas.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alterou = Object.keys(vinculos).length > 0;

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Link2 /> Vincular clientes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clientes no ClickUp</DialogTitle>
          <DialogDescription>
            Escolha a pasta (ou listas soltas) de cada cliente. Uma lista escolhida direto vale mais
            que a pasta onde ela está.
          </DialogDescription>
        </DialogHeader>

        {estrutura.isLoading && (
          <div role="status" className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Lendo pastas e listas do ClickUp…
            </p>
            <div className="divide-y rounded-lg border" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2.5 p-3">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
        {estrutura.error && (
          <p role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{(estrutura.error as Error).message}</span>
          </p>
        )}

        {estrutura.data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clientes da carteira
              </p>
              <Button variant="outline" size="sm" onClick={sugerirTodas}>
                <Wand2 /> Sugerir pelo nome
              </Button>
            </div>
            <div className="divide-y rounded-lg border">
              {(empresas ?? []).map((e) => {
                const lista = atuais(e.id);
                return (
                  <div key={e.id} className="space-y-2.5 p-3">
                    <p className="break-words text-sm font-medium">{e.nome_fantasia}</p>
                    {lista.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lista.map((v) => (
                          <Badge key={v.id} variant="secondary" className="max-w-full gap-1 py-0 pr-0.5 font-normal">
                            {v.tipo === "pasta"
                              ? <Folder className="h-3 w-3 shrink-0" aria-hidden />
                              : <List className="h-3 w-3 shrink-0" aria-hidden />}
                            <span className="min-w-0 truncate">{v.nome}</span>
                            <button
                              type="button"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              title="Tirar"
                              aria-label={`Tirar ${v.nome}`}
                              onClick={() => mudar(e.id, lista.filter((x) => x.id !== v.id))}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Select value="" onValueChange={(chave) => adicionar(e.id, chave)}>
                      <SelectTrigger className="h-9 text-sm"
                        aria-label={`Adicionar pasta ou lista para ${e.nome_fantasia}`}>
                        <SelectValue placeholder="Adicionar pasta ou lista…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {grupos.map((g) => (
                          <SelectGroup key={g.espaco}>
                            <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {g.espaco}
                            </p>
                            {g.opcoes.map((o) => (
                              <SelectItem key={`${o.tipo}:${o.id}`} value={`${o.tipo}:${o.id}`}>
                                {o.rotulo}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button disabled={!alterou || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending && <Loader2 className="animate-spin" />} Salvar vínculos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
