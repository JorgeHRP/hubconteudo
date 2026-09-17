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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Relatório Mensal</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumo de métricas e ações do projeto SEO</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} disabled={exporting} style={{ background: "var(--gradient-primary)" }}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Header */}
        <div className="glass-card p-8 text-center animate-fade-in-up">
          <h2 className="text-xl font-bold text-foreground">Relatório SEO — Faculdade ESEG</h2>
          <p className="text-lg font-semibold gradient-text mt-1">{monthLabel}</p>
          <p className="text-sm text-muted-foreground mt-2">Conteúdo Martech • Grupo Etapa</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Keywords", value: data.resumo.keywords, icon: KeyRound },
            { label: "Artigos", value: data.resumo.artigos, icon: FileText },
            { label: "Backlinks", value: data.resumo.backlinks, icon: Link2 },
            { label: "Posição Média", value: data.resumo.posicaoMedia, icon: TrendingUp },
            { label: "Tráfego Orgânico", value: data.resumo.trafegoOrganico.toLocaleString(), icon: BarChart3 },
            { label: "Páginas Otimizadas", value: data.resumo.paginasOtimizadas, icon: Globe },
          ].map((kpi, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <kpi.icon className="h-5 w-5 mx-auto mb-2 text-eseg-blue" />
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Destaques */}
        <div className="glass-card p-6 animate-fade-in-up-delay-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Destaques do Mês</h3>
          <div className="space-y-3">
            {data.destaques.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-eseg-blue/10 text-eseg-blue flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <p className="text-sm text-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Keywords */}
          <div className="glass-card p-6 animate-fade-in-up-delay-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Keywords</h3>
            <div className="space-y-3">
              {data.keywordsTop.map((kw, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{kw.position}</span>
                    <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                  </div>
                  <span className={`text-sm font-bold ${kw.change > 0 ? "text-emerald-600" : kw.change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                    {kw.change > 0 ? `↑${kw.change}` : kw.change < 0 ? `↓${Math.abs(kw.change)}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progresso */}
          <div className="glass-card p-6 animate-fade-in-up-delay-2">
            <h3 className="text-lg font-semibold text-foreground mb-4">Progresso do Projeto</h3>
            <div className="space-y-4">
              {data.progresso.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{item.task}</span>
                    <span className="text-muted-foreground">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Novos Backlinks */}
        {data.backlinksNew.length > 0 && (
          <div className="glass-card p-6 animate-fade-in-up-delay-3">
            <h3 className="text-lg font-semibold text-foreground mb-4">Novos Backlinks Adquiridos</h3>
            <div className="flex flex-wrap gap-4">
              {data.backlinksNew.map((bl, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                  <Link2 className="h-5 w-5 text-eseg-blue" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{bl.domain}</p>
                    <p className="text-xs text-muted-foreground">DA: <span className="font-bold text-emerald-600">{bl.da}</span></p>
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


