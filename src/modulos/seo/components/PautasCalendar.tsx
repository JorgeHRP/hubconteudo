import { CheckCircle, CalendarIcon, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Pauta } from "@/modulos/seo/data/pautasData";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const mesColors: Record<string, string> = {
  Janeiro: "border-l-blue-400",
  Fevereiro: "border-l-purple-400",
  Março: "border-l-pink-400",
  Abril: "border-l-rose-400",
  Maio: "border-l-orange-400",
  Junho: "border-l-amber-400",
  Julho: "border-l-yellow-400",
  Agosto: "border-l-lime-400",
  Setembro: "border-l-emerald-400",
  Outubro: "border-l-teal-400",
  Novembro: "border-l-cyan-400",
  Dezembro: "border-l-sky-400",
};

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
      <div className="glass-card p-12 text-center">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Nenhuma pauta aprovada ainda.</p>
        <p className="text-muted-foreground text-sm mt-1">Aprove pautas e defina o mês de publicação para vê-las aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="font-medium text-foreground">{aprovadas.length}</span>
          <span className="text-muted-foreground">pautas aprovadas</span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div className="text-sm text-muted-foreground">
          {mesesComPautas.length} meses com pautas programadas
        </div>
        {semMes.length > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="text-sm text-muted-foreground">
              {semMes.length} sem mês definido
            </div>
          </>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {mesesComPautas.map(mes => {
          const pautasDoMes = porMes[mes] || [];
          if (pautasDoMes.length === 0) return null;

          return (
            <div key={mes} className={`glass-card overflow-hidden border-l-4 ${mesColors[mes] || "border-l-primary"}`}>
              {/* Month header */}
              <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{mes}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pautasDoMes.length} {pautasDoMes.length === 1 ? "pauta" : "pautas"}
                </Badge>
              </div>

              {/* Pautas list */}
              <div className="divide-y divide-border">
                {pautasDoMes.map(pauta => (
                  <div key={pauta.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight">{pauta.titulo}</p>
                        {pauta.keyword && (
                          <p className="text-xs text-muted-foreground mt-1">KW: {pauta.keyword}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] h-5 bg-eseg-blue/10 text-eseg-blue border-0">
                            {pauta.tipoPublicacao}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-5">
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
        <div className="glass-card overflow-hidden border-l-4 border-l-muted-foreground/30">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-muted-foreground">Sem mês definido</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {semMes.length} {semMes.length === 1 ? "pauta" : "pautas"}
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {semMes.map(pauta => (
              <div key={pauta.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-tight">{pauta.titulo}</p>
                    {pauta.keyword && (
                      <p className="text-xs text-muted-foreground mt-1">KW: {pauta.keyword}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge variant="secondary" className="text-[10px] h-5 bg-eseg-blue/10 text-eseg-blue border-0">
                        {pauta.tipoPublicacao}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5">
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


