import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Wallet, Trophy, Percent, Briefcase } from "lucide-react";
import { listarNegocios } from "@/data/store";
import { etapasFunil, formatCurrency, formatDate, produtoLabels } from "@/lib/cs-data";
import { FunilBarras, type EtapaFunilDados } from "@/components/FunilBarras";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Kpi({ icone: Icone, rotulo, valor }: { icone: typeof Wallet; rotulo: string; valor: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <Icone className="h-4 w-4 text-primary" />
        </div>
        <p className="text-2xl font-bold">{valor}</p>
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
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone={Wallet} rotulo="Pipeline aberto" valor={formatCurrency(pipeline)} />
        <Kpi icone={Trophy} rotulo="Receita ganha" valor={formatCurrency(receita)} />
        <Kpi icone={Briefcase} rotulo="Negócios abertos" valor={abertos.length} />
        <Kpi icone={Percent} rotulo="Taxa de conversão" valor={`${conversao}%`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funil por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <FunilBarras dados={dadosFunil} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receita por unidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {porUnidade.map((u) => {
              const pct = receita > 0 ? (u.valor / receita) * 100 : 0;
              return (
                <div key={u.unidade}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="truncate">{u.unidade}</span>
                    <span className="shrink-0 font-medium">{formatCurrency(u.valor)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="gradient-primary h-full rounded-full" style={{ width: `${pct}%` }} />
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

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Negócios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Negócio</th>
                <th className="hidden p-3 font-medium md:table-cell">Empresa</th>
                <th className="p-3 font-medium">Etapa</th>
                <th className="p-3 font-medium">Valor</th>
                <th className="hidden p-3 font-medium lg:table-cell">Responsável</th>
                <th className="hidden p-3 font-medium lg:table-cell">Origem</th>
                <th className="hidden p-3 font-medium xl:table-cell">Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((n) => (
                <tr key={n.id} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-medium">{n.nome}</td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">{n.empresa}</td>
                  <td className="p-3">
                    <Badge
                      variant={n.etapa === "ganho" ? "success" : n.etapa === "perdido" ? "destructive" : "secondary"}
                      className="text-[9px]"
                    >
                      {etapaLabel(n.etapa)}
                    </Badge>
                  </td>
                  <td className="p-3">{formatCurrency(n.valor)}</td>
                  <td className="hidden p-3 text-muted-foreground lg:table-cell">{n.responsavel}</td>
                  <td className="hidden p-3 text-muted-foreground lg:table-cell">{n.origem}</td>
                  <td className="hidden p-3 text-muted-foreground xl:table-cell">{formatDate(n.data_fechamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
