import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

const gscData = [
  { query: "eseg", clicks: 4014, impressions: 12957, ctr: 30.98, position: 2.85, isInternal: true },
  { query: "portal do aluno eseg", clicks: 1739, impressions: 2122, ctr: 81.95, position: 1.32, isInternal: true },
  { query: "eseg portal do aluno", clicks: 1240, impressions: 1557, ctr: 79.64, position: 1.53, isInternal: true },
  { query: "eseg area do aluno", clicks: 897, impressions: 1148, ctr: 78.14, position: 1.55, isInternal: true },
  { query: "faculdade eseg", clicks: 405, impressions: 1776, ctr: 22.80, position: 1.29, isInternal: true },
  { query: "area do aluno eseg", clicks: 341, impressions: 435, ctr: 78.39, position: 2.87, isInternal: true },
  { query: "eseg faculdade", clicks: 263, impressions: 1057, ctr: 24.88, position: 1.38, isInternal: true },
  { query: "portal eseg", clicks: 208, impressions: 252, ctr: 82.54, position: 1.00, isInternal: true },
  { query: "canvas eseg", clicks: 185, impressions: 1913, ctr: 9.67, position: 1.98, isInternal: true },
  { query: "melhores profissões", clicks: 161, impressions: 4554, ctr: 3.54, position: 2.67, isInternal: false },
  { query: "arquivos para corte a laser em mdf gratuito", clicks: 142, impressions: 1568, ctr: 9.06, position: 3.74, isInternal: false },
  { query: "portal aluno eseg", clicks: 120, impressions: 140, ctr: 85.71, position: 1.00, isInternal: true },
  { query: "eseg canvas", clicks: 93, impressions: 1158, ctr: 8.03, position: 2.11, isInternal: true },
  { query: "melhores empregos", clicks: 77, impressions: 2631, ctr: 2.93, position: 2.55, isInternal: false },
  { query: "eseg aluno", clicks: 72, impressions: 92, ctr: 78.26, position: 1.00, isInternal: true },
  { query: "melhores profissões no brasil", clicks: 59, impressions: 1390, ctr: 4.24, position: 2.20, isInternal: false },
  { query: "filmes sobre economia", clicks: 52, impressions: 442, ctr: 11.76, position: 2.25, isInternal: false },
  { query: "melhores trabalhos", clicks: 48, impressions: 1116, ctr: 4.30, position: 2.16, isInternal: false },
  { query: "trabalhos", clicks: 41, impressions: 6652, ctr: 0.62, position: 1.16, isInternal: false },
  { query: "faculdade etapa", clicks: 41, impressions: 304, ctr: 13.49, position: 1.70, isInternal: true },
  { query: "filme sobre economia", clicks: 36, impressions: 186, ctr: 19.35, position: 3.50, isInternal: false },
  { query: "melhores cursos de faculdade para o futuro", clicks: 35, impressions: 4144, ctr: 0.84, position: 3.78, isInternal: false },
  { query: "tipos de direito", clicks: 35, impressions: 4130, ctr: 0.85, position: 4.23, isInternal: false },
  { query: "arquivos para corte a laser", clicks: 32, impressions: 414, ctr: 7.73, position: 4.12, isInternal: false },
  { query: "profissão", clicks: 31, impressions: 21642, ctr: 0.14, position: 5.00, isInternal: false },
  { query: "melhores empregos do brasil", clicks: 30, impressions: 594, ctr: 5.05, position: 2.35, isInternal: false },
  { query: "melhores profissoes", clicks: 30, impressions: 512, ctr: 5.86, position: 2.62, isInternal: false },
  { query: "eseg etapa", clicks: 30, impressions: 70, ctr: 42.86, position: 2.31, isInternal: true },
  { query: "trabalho", clicks: 29, impressions: 22867, ctr: 0.13, position: 1.76, isInternal: false },
  { query: "programação web", clicks: 29, impressions: 2734, ctr: 1.06, position: 4.46, isInternal: false },
  { query: "faculdades do futuro", clicks: 28, impressions: 744, ctr: 3.76, position: 1.76, isInternal: false },
  { query: "melhores profissões do brasil", clicks: 28, impressions: 516, ctr: 5.43, position: 3.78, isInternal: false },
  { query: "google docs vs libreoffice writer", clicks: 28, impressions: 515, ctr: 5.44, position: 6.98, isInternal: false },
  { query: "canva eseg", clicks: 28, impressions: 214, ctr: 13.08, position: 1.94, isInternal: true },
  { query: "8 semestres são quantos anos", clicks: 27, impressions: 30584, ctr: 0.09, position: 3.80, isInternal: false },
  { query: "quais são as melhores profissões", clicks: 27, impressions: 777, ctr: 3.47, position: 3.00, isInternal: false },
  { query: "eseg valor mensalidade", clicks: 27, impressions: 234, ctr: 11.54, position: 1.86, isInternal: true },
  { query: "eseg.canvas", clicks: 27, impressions: 57, ctr: 47.37, position: 1.88, isInternal: true },
  { query: "profissões", clicks: 25, impressions: 40827, ctr: 0.06, position: 3.64, isInternal: false },
  { query: "imediatismo", clicks: 25, impressions: 7443, ctr: 0.34, position: 2.72, isInternal: false },
  { query: "filmes de economia", clicks: 25, impressions: 132, ctr: 18.94, position: 2.11, isInternal: false },
  { query: "eseg valor mensalidade direito", clicks: 24, impressions: 122, ctr: 19.67, position: 2.00, isInternal: true },
  { query: "quais as melhores profissões", clicks: 23, impressions: 472, ctr: 4.87, position: 1.73, isInternal: false },
  { query: "trabalhos bons", clicks: 23, impressions: 458, ctr: 5.02, position: 1.94, isInternal: false },
  { query: "arquivos para corte laser grátis", clicks: 23, impressions: 272, ctr: 8.46, position: 3.64, isInternal: false },
  { query: "eseg cursos", clicks: 23, impressions: 147, ctr: 15.65, position: 1.86, isInternal: true },
  { query: "eseg direito", clicks: 22, impressions: 228, ctr: 9.65, position: 6.50, isInternal: true },
  { query: "ava eseg", clicks: 22, impressions: 24, ctr: 91.67, position: 1.00, isInternal: true },
  { query: "moldes para corte a laser em mdf grátis", clicks: 20, impressions: 96, ctr: 20.83, position: 2.30, isInternal: false },
];

const KeywordsGSC = () => {
  const totalClicks = gscData.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = gscData.reduce((sum, d) => sum + d.impressions, 0);
  const avgCTR = (totalClicks / totalImpressions * 100).toFixed(2);
  const avgPosition = (gscData.reduce((sum, d) => sum + d.position, 0) / gscData.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Sobre esta aba</h3>
        <p className="text-sm text-foreground/80">
          Dados extraídos diretamente do <strong>Google Search Console</strong>, mostrando as <strong>50 palavras-chave que mais geram cliques</strong> para o site da ESEG. Os números abaixo referem-se apenas a essas 50 queries, não ao total do site. 
          As linhas em <span className="text-red-400 font-semibold">vermelho</span> indicam buscas de navegação interna (alunos e professores buscando o portal), que não representam tráfego de novos visitantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Cliques", value: totalClicks.toLocaleString() },
          { label: "Total de Impressões", value: totalImpressions.toLocaleString() },
          { label: "CTR Médio", value: `${avgCTR}%` },
          { label: "Posição Média", value: avgPosition },
        ].map((m) => (
          <div key={m.label} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-xl font-bold gradient-text mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Top Queries — Google Search Console</h3>
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Vermelho = acesso de alunos/professores</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="table-header">Query</TableHead>
                <TableHead className="table-header text-right">Cliques</TableHead>
                <TableHead className="table-header text-right">Impressões</TableHead>
                <TableHead className="table-header text-right">CTR</TableHead>
                <TableHead className="table-header text-right">Posição Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gscData.map((row, i) => (
                <TableRow
                  key={i}
                  className={`transition-colors ${row.isInternal ? "bg-red-500/10 hover:bg-red-500/20" : "hover:bg-muted/30"}`}
                >
                  <TableCell className={`text-sm font-medium ${row.isInternal ? "text-red-400" : ""}`}>
                    {row.query}
                    {row.isInternal && (
                      <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">interno</span>
                    )}
                  </TableCell>
                  <TableCell className={`text-sm text-right ${row.isInternal ? "text-red-400/80" : ""}`}>{row.clicks.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm text-right ${row.isInternal ? "text-red-400/80" : ""}`}>{row.impressions.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm text-right ${row.isInternal ? "text-red-400/80" : ""}`}>{row.ctr.toFixed(2)}%</TableCell>
                  <TableCell className={`text-sm text-right ${row.isInternal ? "text-red-400/80" : ""}`}>{row.position.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default KeywordsGSC;


