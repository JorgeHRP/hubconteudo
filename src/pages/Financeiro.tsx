import { useQuery } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plug, Plane, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { listarIntegracoes, listarViagens } from "@/data/store";
import { formatCurrency, viagemStatusLabels, viagemStatusVariant } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Kpi({
  icone: Icone, rotulo, valor, pendente,
}: {
  icone: typeof Wallet; rotulo: string; valor: string; pendente?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <Icone className="h-4 w-4 text-primary" />
        </div>
        <p className={pendente ? "text-2xl font-bold text-muted-foreground/40" : "text-2xl font-bold"}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Financeiro() {
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });
  const { data: viagens } = useQuery({ queryKey: ["viagens"], queryFn: listarViagens });

  const contaAzul = integracoes?.find((i) => i.chave === "conta_azul");
  const alfaix = integracoes?.find((i) => i.chave === "alfaix");
  const contabilConectada = Boolean(contaAzul?.conectada || alfaix?.conectada);

  const aReembolsar = (viagens ?? []).filter((v) => v.status === "aprovado");
  const totalReembolso = aReembolsar.reduce(
    (s, v) => s + v.despesas.reduce((x, d) => x + d.valor, 0), 0
  );
  const aguardando = (viagens ?? []).filter((v) => v.status === "enviado");

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Wallet}
        titulo="Dashboard Financeiro"
        subtitulo="Receitas, despesas e reembolsos da operação"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone={TrendingUp} rotulo="Receita do mês" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} />
        <Kpi icone={TrendingDown} rotulo="Despesa do mês" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} />
        <Kpi icone={PiggyBank} rotulo="Resultado" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} />
        <Kpi icone={Plane} rotulo="Reembolsos a pagar" valor={formatCurrency(totalReembolso)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!contabilConectada ? (
            <EstadoVazio
              icone={Plug}
              titulo="Nenhuma fonte contábil conectada"
              descricao="Ligue o Conta Azul para trazer o relatório completo de receitas, despesas e fluxo de caixa. A planilha Alfaix entra como fonte complementar de controle."
              acao={
                <Button asChild variant="outline">
                  <Link to="/admin">Ir para Integrações <ArrowRight /></Link>
                </Button>
              }
            />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Movimentação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aguardando a primeira sincronização.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reembolsos de viagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                <p className="text-lg font-bold">{aguardando.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Aprovados a pagar</p>
                <p className="text-lg font-bold">{aReembolsar.length}</p>
              </div>
            </div>

            {[...aguardando, ...aReembolsar].slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                <span className="min-w-0 truncate">{v.titulo}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs">
                    {formatCurrency(v.despesas.reduce((s, d) => s + d.valor, 0))}
                  </span>
                  <Badge variant={viagemStatusVariant[v.status]} className="text-[9px]">
                    {viagemStatusLabels[v.status]}
                  </Badge>
                </div>
              </div>
            ))}

            {aguardando.length === 0 && aReembolsar.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum reembolso em aberto.
              </p>
            )}

            <Button variant="outline" className="w-full" asChild>
              <Link to="/viagens">Abrir relatórios de viagem</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fontes de dados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[contaAzul, alfaix].filter(Boolean).map((i) => (
            <div key={i!.chave} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{i!.nome}</p>
                <p className="text-xs text-muted-foreground">{i!.descricao}</p>
              </div>
              <Badge variant={i!.conectada ? "success" : "secondary"} className="shrink-0 text-[9px]">
                {i!.conectada ? "Conectada" : "Não conectada"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
