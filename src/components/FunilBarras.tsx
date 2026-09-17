import { formatCurrency } from "@/lib/cs-data";
import { cn } from "@/lib/utils";

export interface EtapaFunilDados {
  etapa: string;
  valor: number;
  quantidade: number;
  tom: "primary" | "success" | "destructive";
}

const fundo: Record<EtapaFunilDados["tom"], string> = {
  primary: "gradient-primary",
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
    <div className="space-y-3">
      {dados.map((d) => {
        const pct = (d.valor / maximo) * 100;
        return (
          <div key={d.etapa} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium">{d.etapa}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatCurrency(d.valor)}
                <span className="ml-2 text-[10px]">
                  {d.quantidade} {d.quantidade === 1 ? "negócio" : "negócios"}
                </span>
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-md bg-muted">
              <div
                className={cn("h-full rounded-md transition-all duration-500", fundo[d.tom])}
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
