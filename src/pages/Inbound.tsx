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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", estourou ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className={cn("mt-1 text-[11px]", estourou ? "font-medium text-destructive" : "text-muted-foreground")}>
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
          {lista.length > 0 && (
            <section>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { rotulo: "Pontos contratados", valor: formatPontos(totais.contratados), icone: Coins, tom: "text-primary" },
                  { rotulo: "Pontos planejados", valor: formatPontos(totais.planejados), icone: TrendingUp, tom: "text-info" },
                  { rotulo: "Pontos entregues", valor: formatPontos(totais.entregues), icone: TrendingUp, tom: "text-success" },
                  { rotulo: "Planos acima do contrato", valor: totais.estourados, icone: AlertTriangle, tom: "text-destructive" },
                ].map((k) => (
                  <Card key={k.rotulo}>
                    <CardContent className="p-4 pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{k.rotulo}</p>
                        <k.icone className={cn("h-4 w-4", k.tom)} />
                      </div>
                      <p className="text-2xl font-bold">{k.valor}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clientes com Inbound · {mesLegivel(mes)}
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lista.map((c) => (
                  <Card key={c.empresa.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4 pt-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.empresa.nome_fantasia}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.empresa.segmento ?? "Sem segmento"}
                          </p>
                        </div>
                        {c.estourou && (
                          <Badge variant="destructive" className="shrink-0 text-[9px]">Estourou</Badge>
                        )}
                      </div>

                      <div className="mb-2 flex items-baseline gap-1.5">
                        <span className="text-xl font-bold">{formatPontos(c.planejados)}</span>
                        <span className="text-xs text-muted-foreground">
                          de {formatPontos(c.contratados)} pts
                        </span>
                      </div>

                      <Consumo pct={c.percentual} estourou={c.estourou} />

                      <div className="mt-3 flex items-center justify-between border-t pt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {formatPontos(c.entregues)} pts entregues
                        </span>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link to={`/inbound/${c.empresa.id}`}>Abrir <ArrowRight /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 pt-4">
            <Label className="text-xs">Novo serviço</Label>
            <div className="mt-1.5 flex flex-wrap items-end gap-2">
              <div className="min-w-[14rem] flex-1">
                <Input placeholder="Nome do serviço" value={nome}
                  onChange={(e) => setNome(e.target.value)} />
              </div>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaInbound)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasInbound.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min="1" placeholder="pontos" className="w-28" value={pontos}
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

        {porCategoria.map(({ cat, itens }) => (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium", categoriaInboundTom[cat])}>
                {cat}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {itens.length === 1 ? "1 serviço" : `${itens.length} serviços`}
              </span>
            </div>
            <Card>
              <CardContent className="divide-y p-0">
                {itens.map((i) => (
                  <div key={i.id} className="group flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <Input className="h-8 border-0 px-0 font-medium shadow-none focus-visible:ring-0"
                        value={i.nome}
                        onChange={(e) => gravar.mutate({ ...i, nome: e.target.value })} />
                      {i.descricao && (
                        <p className="text-[11px] text-muted-foreground">{i.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Input type="number" className="h-8 w-24 text-right" value={i.pontos}
                        onChange={(e) => gravar.mutate({ ...i, pontos: Number(e.target.value) })} />
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Desativar serviço"
                      onClick={() => desativar.mutate(i.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        <p className="text-[11px] text-muted-foreground">
          Desativar um serviço só o tira da lista de escolha. Os planos que já o usaram
          guardam o nome e a pontuação do dia do lançamento.
        </p>
      </div>
    );
  }
}
