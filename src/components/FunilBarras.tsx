import { formatCurrency } from "@/lib/cs-data";
import { cn } from "@/lib/utils";

export interface EtapaFunilDados {
  etapa: string;
  valor: number;
  quantidade: number;
  tom: "primary" | "success" | "destructive";
}

const fundo: Record<EtapaFunilDados["tom"], string> = {
  primary: "bg-primary",
  success: "bg-success",
  destructive: "bg-destructive",
};

/**
 * Funil por etapa em barras horizontais.
 * Feito em CSS com os tokens do design system — sem biblioteca de gráfico.
 */
export function FunilBarras({ dados }: { dados: EtapaFunilDados[] }) {
  const maximo = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <div className="space-y-4">
      {dados.map((d) => {
        const pct = (d.valor / maximo) * 100;
        return (
          <div key={d.etapa}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-xs font-medium text-foreground">{d.etapa}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">{formatCurrency(d.valor)}</span>
                <span className="ml-2">
                  {d.quantidade} {d.quantidade === 1 ? "negócio" : "negócios"}
                </span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-500", fundo[d.tom])}
                style={{ width: `${Math.max(pct, d.valor > 0 ? 2 : 0)}%` }}
                title={`${d.etapa}: ${formatCurrency(d.valor)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
