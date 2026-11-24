import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Wallet, Trophy, Percent, Briefcase, Plus, Pencil } from "lucide-react";
import { listarNegocios } from "@/data/store";
import { etapasFunil, formatCurrency, formatDate, produtoLabels } from "@/lib/cs-data";
import { FunilBarras, type EtapaFunilDados } from "@/components/FunilBarras";
import { NegocioDialog } from "@/components/NegocioDialog";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EsqueletoIndicadores, EsqueletoTabela } from "@/components/Esqueletos";
import { cn } from "@/lib/utils";

function Kpi({
  icone: Icone, rotulo, valor, tom = "bg-primary/10 text-primary",
}: {
  icone: typeof Wallet; rotulo: string; valor: string | number; tom?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p className="mt-1.5 break-words font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl">
            {valor}
          </p>
        </div>
        <span
          aria-hidden
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", tom)}
        >
          <Icone className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function Vendas() {
  const { data: negocios } = useQuery({
    queryKey: ["negocios"],
    queryFn: listarNegocios,
    refetchInterval: 60000,
  });

  const lista = negocios ?? [];
  const abertos = lista.filter((n) => n.status === "aberto");
  const ganhos = lista.filter((n) => n.status === "ganho");
  const perdidos = lista.filter((n) => n.status === "perdido");

  const pipeline = abertos.reduce((s, n) => s + n.valor, 0);
  const receita = ganhos.reduce((s, n) => s + n.valor, 0);
  const fechados = ganhos.length + perdidos.length;
  const conversao = fechados > 0 ? Math.round((ganhos.length / fechados) * 100) : 0;

  const dadosFunil: EtapaFunilDados[] = etapasFunil.map((e) => ({
    etapa: e.label,
    valor: lista.filter((n) => n.etapa === e.valor).reduce((s, n) => s + n.valor, 0),
    quantidade: lista.filter((n) => n.etapa === e.valor).length,
    tom: e.valor === "ganho" ? "success" : e.valor === "perdido" ? "destructive" : "primary",
  }));

  const porUnidade = Object.entries(
    ganhos.reduce<Record<string, number>>((acc, n) => {
      const chave = n.produto ? produtoLabels[n.produto] : "Sem unidade";
      acc[chave] = (acc[chave] ?? 0) + n.valor;
      return acc;
    }, {})
  )
    .map(([unidade, valor]) => ({ unidade, valor }))
    .sort((a, b) => b.valor - a.valor);

  const etapaLabel = (v: string) => etapasFunil.find((e) => e.valor === v)?.label ?? v;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={TrendingUp}
        titulo="Resultados de Vendas"
        subtitulo="Funil comercial — atualiza sozinho a cada 60 segundos"
        acao={<NegocioDialog gatilho={<Button><Plus /> Novo negócio</Button>} />}
      />

      {!negocios ? (
        <div role="status" aria-label="Carregando resultados de vendas" className="space-y-6">
          <EsqueletoIndicadores />
          <EsqueletoTabela linhas={6} colunas={5} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icone={Wallet} rotulo="Pipeline aberto" valor={formatCurrency(pipeline)} />
            <Kpi icone={Trophy} rotulo="Receita ganha" valor={formatCurrency(receita)} tom="bg-success/10 text-success" />
            <Kpi icone={Briefcase} rotulo="Negócios abertos" valor={abertos.length} />
            <Kpi icone={Percent} rotulo="Taxa de conversão" valor={`${conversao}%`} tom="bg-accent/10 text-accent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Funil por etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <FunilBarras dados={dadosFunil} />
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Receita por unidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {porUnidade.map((u) => {
                  const pct = receita > 0 ? (u.valor / receita) * 100 : 0;
                  return (
                    <div key={u.unidade}>
                      <div className="mb-1.5 flex justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-foreground">{u.unidade}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatCurrency(u.valor)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {porUnidade.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum negócio ganho ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {lista.length === 0 ? (
            <EstadoVazio
              icone={Briefcase}
              titulo="Nenhum negócio ainda"
              descricao="Cadastre os negócios em andamento. Quando o RD Station for conectado, os de lá entram aqui sozinhos."
            />
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 space-y-0 pb-4">
                <CardTitle className="text-base">Negócios</CardTitle>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {lista.length} no total · {abertos.length} em aberto
                </span>
              </CardHeader>
              <div className="border-t">
                <Table className="min-w-[34rem]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Negócio</TableHead>
                      <TableHead className="hidden md:table-cell">Empresa</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                      <TableHead className="hidden lg:table-cell">Origem</TableHead>
                      <TableHead className="hidden xl:table-cell">Fechamento</TableHead>
                      <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {n.nome}
                            {n.rd_deal_id && <Badge variant="outline">RD Station</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{n.empresa}</TableCell>
                        <TableCell>
                          <Badge
                            variant={n.etapa === "ganho" ? "success" : n.etapa === "perdido" ? "destructive" : "secondary"}
                            className="whitespace-nowrap"
                          >
                            {etapaLabel(n.etapa)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {formatCurrency(n.valor)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">{n.responsavel}</TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">{n.origem}</TableCell>
                        <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground xl:table-cell">
                          {formatDate(n.data_fechamento)}
                        </TableCell>
                        <TableCell className="p-2">
                          {!n.rd_deal_id && (
                            <NegocioDialog negocio={n} gatilho={
                              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={`Editar ${n.nome}`}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            } />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
