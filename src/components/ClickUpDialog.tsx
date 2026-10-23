import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder, List, Link2, Loader2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { estruturaClickUp, listarEmpresas, vincularClickUp } from "@/data/store";
import type { ClickUpEstrutura, ClickUpVinculo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
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
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lendo pastas e listas do ClickUp…
          </p>
        )}
        {estrutura.error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {(estrutura.error as Error).message}
          </p>
        )}

        {estrutura.data && (
          <>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={sugerirTodas}>
                <Wand2 /> Sugerir pelo nome
              </Button>
            </div>
            <div className="divide-y rounded-md border">
              {(empresas ?? []).map((e) => {
                const lista = atuais(e.id);
                return (
                  <div key={e.id} className="space-y-2 p-3">
                    <p className="text-sm font-medium">{e.nome_fantasia}</p>
                    {lista.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lista.map((v) => (
                          <Badge key={v.id} variant="secondary" className="gap-1 pr-1 text-[11px] font-normal">
                            {v.tipo === "pasta" ? <Folder className="h-3 w-3" /> : <List className="h-3 w-3" />}
                            {v.nome}
                            <button
                              type="button"
                              className="rounded p-0.5 hover:bg-muted"
                              title="Tirar"
                              onClick={() => mudar(e.id, lista.filter((x) => x.id !== v.id))}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Select value="" onValueChange={(chave) => adicionar(e.id, chave)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Adicionar pasta ou lista…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {grupos.map((g) => (
                          <SelectGroup key={g.espaco}>
                            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                              {g.espaco}
                            </p>
                            {g.opcoes.map((o) => (
                              <SelectItem key={`${o.tipo}:${o.id}`} value={`${o.tipo}:${o.id}`} className="text-xs">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
          <Button disabled={!alterou || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending && <Loader2 className="animate-spin" />} Salvar vínculos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
