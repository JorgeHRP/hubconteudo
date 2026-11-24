import { CheckCircle, CalendarIcon, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Pauta } from "@/modulos/seo/data/pautasData";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface PautasCalendarProps {
  pautas: Pauta[];
  mesFilter?: string;
}

const PautasCalendar = ({ pautas, mesFilter = "all" }: PautasCalendarProps) => {
  const aprovadas = pautas.filter(p => p.status === "Pauta Aprovada");
  
  const porMes: Record<string, Pauta[]> = {};
  const semMes: Pauta[] = [];

  aprovadas.forEach(p => {
    if (p.mesPublicacao && MESES.includes(p.mesPublicacao)) {
      if (!porMes[p.mesPublicacao]) porMes[p.mesPublicacao] = [];
      porMes[p.mesPublicacao].push(p);
    } else {
      semMes.push(p);
    }
  });

  const mesesComPautas = MESES.filter(m => porMes[m]?.length).filter(m => mesFilter === "all" || m === mesFilter);

  if (aprovadas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card/60 px-6 py-12 text-center">
        <CalendarIcon className="mx-auto mb-3 h-8 w-8 text-accent" aria-hidden />
        <p className="font-display text-base font-semibold text-foreground">Nenhuma pauta aprovada ainda.</p>
        <p className="text-muted-foreground text-sm mt-1">Aprove pautas e defina o mês de publicação para vê-las aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-3 shadow-card">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-success" aria-hidden />
          <span className="font-medium text-foreground">{aprovadas.length}</span>
          <span className="text-muted-foreground">pautas aprovadas</span>
        </div>
        <span className="hidden text-muted-foreground sm:inline" aria-hidden>•</span>
        <div className="text-sm text-muted-foreground">
          {mesesComPautas.length} meses com pautas programadas
        </div>
        {semMes.length > 0 && (
          <>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden>•</span>
            <div className="text-sm text-muted-foreground">
              {semMes.length} sem mês definido
            </div>
          </>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mesesComPautas.map(mes => {
          const pautasDoMes = porMes[mes] || [];
          if (pautasDoMes.length === 0) return null;

          return (
            <div key={mes} className="overflow-hidden rounded-lg border bg-card shadow-card">
              {/* Month header */}
              <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="text-sm font-semibold text-foreground">{mes}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pautasDoMes.length} {pautasDoMes.length === 1 ? "pauta" : "pautas"}
                </Badge>
              </div>

              {/* Pautas list */}
              <div className="divide-y divide-border">
                {pautasDoMes.map(pauta => (
                  <div key={pauta.id} className="px-4 py-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">{pauta.titulo}</p>
                        {pauta.keyword && (
                          <p className="text-xs text-muted-foreground mt-1">KW: {pauta.keyword}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <Badge variant="info">
                            {pauta.tipoPublicacao}
                          </Badge>
                          <Badge variant="outline" className="font-normal text-muted-foreground">
                            {pauta.categoria}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sem mês definido */}
      {semMes.length > 0 && mesFilter === "all" && (
        <div className="overflow-hidden rounded-lg border border-dashed bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Sem mês definido</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {semMes.length} {semMes.length === 1 ? "pauta" : "pautas"}
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {semMes.map(pauta => (
              <div key={pauta.id} className="px-4 py-3 transition-colors hover:bg-muted/40">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">{pauta.titulo}</p>
                    {pauta.keyword && (
                      <p className="text-xs text-muted-foreground mt-1">KW: {pauta.keyword}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge variant="info">
                        {pauta.tipoPublicacao}
                      </Badge>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {pauta.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PautasCalendar;


