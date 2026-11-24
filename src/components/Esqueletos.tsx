import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Fileira de cartões de indicador enquanto os números carregam. */
export function EsqueletoIndicadores({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: quantidade }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Lista de linhas com avatar e duas linhas de texto. */
export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <Card aria-hidden>
      <CardContent className="divide-y p-0">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Tabela com cabeçalho e linhas. */
export function EsqueletoTabela({ linhas = 6, colunas = 4 }: { linhas?: number; colunas?: number }) {
  return (
    <Card aria-hidden className="overflow-hidden">
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: colunas }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: linhas }, (_, l) => (
        <div key={l} className="flex gap-4 border-b px-4 py-4 last:border-0">
          {Array.from({ length: colunas }, (_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </Card>
  );
}

/** Tela inteira: título, indicadores e uma lista. Para telas de detalhe que carregam de uma vez. */
export function EsqueletoPagina() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-6">
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
      </div>
      <EsqueletoIndicadores />
      <EsqueletoLista />
    </div>
  );
}
