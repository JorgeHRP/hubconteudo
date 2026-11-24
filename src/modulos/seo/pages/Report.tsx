import { useRef, useState } from "react";
import { Download, FileText, TrendingUp, Link2, KeyRound, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

const months = [
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-01", label: "Janeiro 2026" },
];

const reportData: Record<string, {
  resumo: { keywords: number; artigos: number; backlinks: number; posicaoMedia: number; trafegoOrganico: number; paginasOtimizadas: number };
  destaques: string[];
  keywordsTop: { keyword: string; position: number; change: number }[];
  backlinksNew: { domain: string; da: number }[];
  progresso: { task: string; progress: number }[];
}> = {
  "2026-04": {
    resumo: { keywords: 12, artigos: 4, backlinks: 6, posicaoMedia: 10.2, trafegoOrganico: 2400, paginasOtimizadas: 6 },
    destaques: [
      "3 novos artigos publicados no blog",
      "Posição média melhorou de 12 para 10.2",
      "2 novos backlinks de alta autoridade (DA 65+)",
      "Core Web Vitals dentro da meta em todas as métricas",
      "15 páginas com meta tags otimizadas",
    ],
    keywordsTop: [
      { keyword: "faculdade eseg", position: 1, change: 0 },
      { keyword: "faculdade grupo etapa", position: 2, change: 1 },
      { keyword: "vestibular eseg 2026", position: 3, change: 2 },
      { keyword: "graduação engenharia de produção", position: 5, change: 3 },
      { keyword: "engenharia de produção salário", position: 7, change: -1 },
    ],
    backlinksNew: [
      { domain: "guiadoestudante.com.br", da: 72 },
      { domain: "educamaisbrasil.com.br", da: 65 },
    ],
    progresso: [
      { task: "Pesquisa de Palavras-chave", progress: 85 },
      { task: "Otimização On-Page", progress: 60 },
      { task: "Criação de Conteúdo", progress: 45 },
      { task: "Link Building", progress: 30 },
      { task: "Auditoria Técnica", progress: 100 },
    ],
  },
  "2026-03": {
    resumo: { keywords: 10, artigos: 2, backlinks: 4, posicaoMedia: 12, trafegoOrganico: 2100, paginasOtimizadas: 4 },
    destaques: [
      "Início da estratégia de link building",
      "Auditoria técnica concluída com 12 correções",
      "2 artigos publicados sobre graduação",
      "Melhoria de Core Web Vitals em 3 páginas",
    ],
    keywordsTop: [
      { keyword: "faculdade eseg", position: 1, change: 0 },
      { keyword: "faculdade grupo etapa", position: 3, change: 0 },
      { keyword: "vestibular eseg 2026", position: 5, change: 1 },
      { keyword: "graduação engenharia de produção", position: 8, change: 2 },
    ],
    backlinksNew: [
      { domain: "infomoney.com.br", da: 82 },
    ],
    progresso: [
      { task: "Pesquisa de Palavras-chave", progress: 70 },
      { task: "Otimização On-Page", progress: 40 },
      { task: "Criação de Conteúdo", progress: 25 },
      { task: "Link Building", progress: 15 },
      { task: "Auditoria Técnica", progress: 90 },
    ],
  },
};

const Report = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Relatório"
        descricao="Números de tráfego, posições e conversões"
        oQueEntraAqui="Aqui entram os números deste cliente, vindos do GA4 e do Search Console."
      />
    );
  }

  const [selectedMonth, setSelectedMonth] = useState("2026-04");
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const data = reportData[selectedMonth] || reportData["2026-04"];
  const monthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth;

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafb",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Relatorio_SEO_ESEG_${selectedMonth}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Relatório Mensal</h2>
          <p className="text-muted-foreground text-sm mt-1">Resumo de métricas e ações do projeto SEO</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]" aria-label="Mês do relatório">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border bg-card px-5 py-6 text-center shadow-card">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Relatório SEO — Faculdade ESEG</h2>
          <p className="mt-1 font-display text-base font-semibold text-primary">{monthLabel}</p>
          <p className="text-sm text-muted-foreground mt-2">Conteúdo Martech • Grupo Etapa</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: "Keywords", value: data.resumo.keywords, icon: KeyRound },
            { label: "Artigos", value: data.resumo.artigos, icon: FileText },
            { label: "Backlinks", value: data.resumo.backlinks, icon: Link2 },
            { label: "Posição Média", value: data.resumo.posicaoMedia, icon: TrendingUp },
            { label: "Tráfego Orgânico", value: data.resumo.trafegoOrganico.toLocaleString(), icon: BarChart3 },
            { label: "Páginas Otimizadas", value: data.resumo.paginasOtimizadas, icon: Globe },
          ].map((kpi, i) => (
            <div key={i} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-card">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-foreground">{kpi.value}</p>
              </div>
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <kpi.icon className="h-4 w-4" />
              </span>
            </div>
          ))}
        </div>

        {/* Destaques */}
        <div className="rounded-lg border bg-card p-5 shadow-card">
          <h3 className="mb-1 font-display text-base font-semibold text-foreground">Destaques do Mês</h3>
          <ol className="divide-y">
            {data.destaques.map((d, i) => (
              <li key={i} className="flex items-start gap-3 py-3 last:pb-0">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                <p className="text-sm text-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top Keywords */}
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h3 className="mb-1 font-display text-base font-semibold text-foreground">Top Keywords</h3>
            <ul className="divide-y">
              {data.keywordsTop.map((kw, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-8 shrink-0 font-display text-sm font-semibold tabular-nums text-muted-foreground">#{kw.position}</span>
                    <span className="min-w-0 text-sm font-medium text-foreground">{kw.keyword}</span>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${kw.change > 0 ? "text-success" : kw.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {kw.change > 0 ? `↑${kw.change}` : kw.change < 0 ? `↓${Math.abs(kw.change)}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progresso */}
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-display text-base font-semibold text-foreground">Progresso do Projeto</h3>
            <div className="space-y-4">
              {data.progresso.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{item.task}</span>
                    <span className="tabular-nums text-muted-foreground">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Novos Backlinks */}
        {data.backlinksNew.length > 0 && (
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-display text-base font-semibold text-foreground">Novos Backlinks Adquiridos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.backlinksNew.map((bl, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border p-3">
                  <Link2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{bl.domain}</p>
                    <p className="text-xs text-muted-foreground">DA: <span className="font-semibold text-success">{bl.da}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;


