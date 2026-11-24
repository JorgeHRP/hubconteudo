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
import { EsqueletoIndicadores, EsqueletoLista } from "@/components/Esqueletos";
import { cn } from "@/lib/utils";

function Kpi({
  icone: Icone, rotulo, valor, pendente, tom = "bg-primary/10 text-primary",
}: {
  icone: typeof Wallet; rotulo: string; valor: string; pendente?: boolean; tom?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p
            className={cn(
              "mt-1.5 break-words font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl",
              pendente && "text-muted-foreground/50"
            )}
          >
            {valor}
          </p>
          {pendente && <p className="mt-1 text-xs text-muted-foreground">Sem fonte conectada</p>}
        </div>
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            pendente ? "bg-muted text-muted-foreground" : tom
          )}
        >
          <Icone className="h-4 w-4" />
        </span>
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

      {!integracoes || !viagens ? (
        <div role="status" aria-label="Carregando dados financeiros" className="space-y-6">
          <EsqueletoIndicadores />
          <EsqueletoLista linhas={4} />
        </div>
      ) : (
      <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone={TrendingUp} rotulo="Receita do mês" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} tom="bg-success/10 text-success" />
        <Kpi icone={TrendingDown} rotulo="Despesa do mês" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} tom="bg-destructive/10 text-destructive" />
        <Kpi icone={PiggyBank} rotulo="Resultado" valor={contabilConectada ? formatCurrency(0) : "—"} pendente={!contabilConectada} />
        <Kpi icone={Plane} rotulo="Reembolsos a pagar" valor={formatCurrency(totalReembolso)} tom="bg-accent/10 text-accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="min-w-0 lg:col-span-2">
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-accent" aria-hidden /> Movimentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                  Aguardando a primeira sincronização.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4 text-accent" aria-hidden /> Reembolsos de viagem
            </CardTitle>
          </CardHeader>

          <div className="grid grid-cols-2 divide-x border-t bg-muted/50">
            <div className="px-5 py-3">
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
              <p className="mt-1 font-display text-xl font-semibold leading-none tabular-nums">{aguardando.length}</p>
            </div>
            <div className="px-5 py-3">
              <p className="text-xs text-muted-foreground">Aprovados a pagar</p>
              <p className="mt-1 font-display text-xl font-semibold leading-none tabular-nums">{aReembolsar.length}</p>
            </div>
          </div>

          {aguardando.length === 0 && aReembolsar.length === 0 ? (
            <p className="border-t px-5 py-6 text-center text-sm text-muted-foreground">
              Nenhum reembolso em aberto.
            </p>
          ) : (
            <ul className="divide-y border-t">
              {[...aguardando, ...aReembolsar].slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.titulo}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(v.despesas.reduce((s, d) => s + d.valor, 0))}
                    </p>
                  </div>
                  <Badge variant={viagemStatusVariant[v.status]} className="shrink-0 whitespace-nowrap">
                    {viagemStatusLabels[v.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t p-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/viagens">Abrir relatórios de viagem <ArrowRight /></Link>
            </Button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4 text-accent" aria-hidden /> Fontes de dados
          </CardTitle>
        </CardHeader>
        <ul className="divide-y border-t">
          {[contaAzul, alfaix].filter(Boolean).map((i) => (
            <li key={i!.chave} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-medium">{i!.nome}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{i!.descricao}</p>
              </div>
              <Badge variant={i!.conectada ? "success" : "secondary"} className="shrink-0 whitespace-nowrap">
                {i!.conectada ? "Conectada" : "Não conectada"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
      </div>
      )}
    </div>
  );
}
