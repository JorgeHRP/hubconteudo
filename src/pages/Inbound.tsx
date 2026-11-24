import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Magnet, ArrowRight, Plus, Trash2, Coins, TrendingUp, AlertTriangle, Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listarCatalogoInbound, listarClientesInbound, removerItemCatalogo, salvarItemCatalogo,
} from "@/data/store";
import {
  categoriaInboundTom, categoriasInbound, formatPontos, mesAtual, mesLegivel,
} from "@/lib/labels-clientes";
import type { CategoriaInbound } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CarteiraDaFrente } from "@/components/CarteiraDaFrente";
import { EsqueletoIndicadores, EsqueletoLista } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Barra de consumo: passou do contratado, fica vermelha. */
function Consumo({ pct, estourou }: { pct: number | null; estourou: boolean }) {
  if (pct === null) {
    return <p className="text-xs text-muted-foreground">Sem contrato lançado neste mês.</p>;
  }
  return (
    <>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full transition-all", estourou ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className={cn("mt-1.5 text-xs tabular-nums", estourou ? "font-medium text-destructive" : "text-muted-foreground")}>
        {pct}% do contratado{estourou && " — plano acima do contrato"}
      </p>
    </>
  );
}

export default function Inbound() {
  const qc = useQueryClient();
  const [mes] = useState(mesAtual());

  const { data: clientes } = useQuery({
    queryKey: ["clientes-inbound", mes],
    queryFn: () => listarClientesInbound(mes),
  });
  const { data: catalogo } = useQuery({
    queryKey: ["catalogo-inbound"], queryFn: listarCatalogoInbound,
  });

  const lista = clientes ?? [];
  const totais = {
    contratados: lista.reduce((s, c) => s + c.contratados, 0),
    planejados: lista.reduce((s, c) => s + c.planejados, 0),
    entregues: lista.reduce((s, c) => s + c.entregues, 0),
    estourados: lista.filter((c) => c.estourou).length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Magnet}
        titulo="Inbound"
        subtitulo={`Consumo de pontos, pautas e réguas de nutrição · ${mesLegivel(mes)}`}
      />

      <Tabs defaultValue="carteira">
        <TabsList>
          <TabsTrigger value="carteira"><Building2 /> Carteira</TabsTrigger>
          <TabsTrigger value="catalogo"><Coins /> Catálogo</TabsTrigger>
        </TabsList>

        <TabsContent value="carteira" className="space-y-6">
          {!clientes && (
            <div role="status" aria-label="Carregando consumo de pontos">
              <EsqueletoIndicadores />
            </div>
          )}

          {lista.length > 0 && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { rotulo: "Pontos contratados", valor: formatPontos(totais.contratados), icone: Coins, tom: "bg-primary/10 text-primary" },
                  { rotulo: "Pontos planejados", valor: formatPontos(totais.planejados), icone: TrendingUp, tom: "bg-info/10 text-info" },
                  { rotulo: "Pontos entregues", valor: formatPontos(totais.entregues), icone: TrendingUp, tom: "bg-success/10 text-success" },
                  { rotulo: "Planos acima do contrato", valor: totais.estourados, icone: AlertTriangle, tom: "bg-destructive/10 text-destructive" },
                ].map((k) => (
                  <Card key={k.rotulo}>
                    <CardContent className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                        <p className="mt-1.5 font-display text-2xl font-semibold leading-none tabular-nums">{k.valor}</p>
                      </div>
                      <span aria-hidden
                        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", k.tom)}>
                        <k.icone className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Clientes com Inbound · {mesLegivel(mes)}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {lista.map((c) => (
                    <Card key={c.empresa.id}
                      className={cn("flex flex-col transition-colors hover:border-primary/30",
                        c.estourou && "border-destructive/40")}>
                      <CardContent className="flex-1 p-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.empresa.nome_fantasia}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.empresa.segmento ?? "Sem segmento"}
                            </p>
                          </div>
                          {c.estourou && (
                            <Badge variant="destructive" className="shrink-0">Estourou</Badge>
                          )}
                        </div>

                        <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
                          <span className="font-display text-xl font-semibold tabular-nums">{formatPontos(c.planejados)}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            de {formatPontos(c.contratados)} pts
                          </span>
                        </div>

                        <Consumo pct={c.percentual} estourou={c.estourou} />
                      </CardContent>
                      <div className="flex items-center justify-between gap-2 border-t px-4 py-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatPontos(c.entregues)} pts entregues
                        </span>
                        <Button asChild variant="ghost" size="sm" className="-mr-2 h-9 text-xs">
                          <Link to={`/inbound/${c.empresa.id}`}
                            aria-label={`Abrir o inbound de ${c.empresa.nome_fantasia}`}>
                            Abrir <ArrowRight />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Quem já tem a frente aparece acima, com o consumo do mês. Aqui fica
              o resto da carteira, com o botão que gera o projeto. */}
          <CarteiraDaFrente
            tipo="inbound"
            destino={(id) => `/inbound/${id}`}
            esconderComProjeto={lista.length > 0}
          />
        </TabsContent>

        <TabsContent value="catalogo">
          <Catalogo />
        </TabsContent>
      </Tabs>
    </div>
  );

  function Catalogo() {
    const [nome, setNome] = useState("");
    const [pontos, setPontos] = useState("");
    const [categoria, setCategoria] = useState<CategoriaInbound>("Conteúdo");

    const atualizar = () => qc.invalidateQueries({ queryKey: ["catalogo-inbound"] });
    const gravar = useMutation({ mutationFn: salvarItemCatalogo, onSuccess: atualizar });
    const desativar = useMutation({
      mutationFn: removerItemCatalogo,
      onSuccess: () => { atualizar(); toast.success("Serviço desativado"); },
    });

    const ativos = (catalogo ?? []).filter((c) => c.ativo);
    const porCategoria = categoriasInbound
      .map((cat) => ({ cat, itens: ativos.filter((i) => i.categoria === cat) }))
      .filter((g) => g.itens.length > 0);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b px-5 py-3.5">
            <CardTitle className="text-base">Novo serviço</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="sm:min-w-[14rem] sm:flex-1">
                <Input placeholder="Nome do serviço" aria-label="Nome do serviço" value={nome}
                  onChange={(e) => setNome(e.target.value)} />
              </div>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaInbound)}>
                <SelectTrigger className="sm:w-44" aria-label="Categoria"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasInbound.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min="1" placeholder="pontos" aria-label="Pontos" className="sm:w-28" value={pontos}
                onChange={(e) => setPontos(e.target.value)} />
              <Button disabled={!nome.trim() || !pontos}
                onClick={() => {
                  gravar.mutate({ nome: nome.trim(), categoria, pontos: Number(pontos) });
                  setNome(""); setPontos("");
                }}>
                <Plus /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {!catalogo && (
          <div role="status" aria-label="Carregando catálogo">
            <EsqueletoLista linhas={4} />
          </div>
        )}

        {porCategoria.map(({ cat, itens }) => (
          <Card key={cat} className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b bg-muted/50 px-4 py-2.5">
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", categoriaInboundTom[cat])}>
                {cat}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {itens.length === 1 ? "1 serviço" : `${itens.length} serviços`}
              </span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {itens.map((i) => (
                <div key={i.id} className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 transition-colors hover:bg-muted/40">
                  <div className="min-w-[12rem] flex-1">
                    <Input className="h-9 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input focus-visible:border-input focus-visible:bg-card sm:-ml-2"
                      aria-label="Nome do serviço"
                      value={i.nome}
                      onChange={(e) => gravar.mutate({ ...i, nome: e.target.value })} />
                    {i.descricao && (
                      <p className="mt-0.5 text-xs text-muted-foreground sm:px-0">{i.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" className="h-9 w-24 bg-card text-right tabular-nums" value={i.pontos}
                      aria-label={`Pontos de ${i.nome}`}
                      onChange={(e) => gravar.mutate({ ...i, pontos: Number(e.target.value) })} />
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                  <Button variant="ghost" size="icon"
                    className="h-9 w-9 text-muted-foreground transition-opacity hover:text-destructive [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                    title="Desativar serviço" aria-label={`Desativar serviço ${i.nome}`}
                    onClick={() => desativar.mutate(i.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Desativar um serviço só o tira da lista de escolha. Os planos que já o usaram
          guardam o nome e a pontuação do dia do lançamento.
        </p>
      </div>
    );
  }
}
