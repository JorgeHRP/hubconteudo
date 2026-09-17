import { useRef, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GeoOverview from "./GeoOverview";
import GeoChecklist from "./GeoChecklist";
import GeoKeywordFaculdadeSP from "./GeoKeywordFaculdadeSP";
import GeoKeywordCursoAdmSP from "./GeoKeywordCursoAdmSP";
import GeoKeywordCursoAdm from "./GeoKeywordCursoAdm";
import GeoKeywordEconomiaSP from "./GeoKeywordEconomiaSP";
import GeoKeywordEngProducaoSP from "./GeoKeywordEngProducaoSP";
import GeoKeywordDireitoSP from "./GeoKeywordDireitoSP";
import GeoKeywordEngCompSP from "./GeoKeywordEngCompSP";
import GeoKeywordFacEngComp from "./GeoKeywordFacEngComp";
import GeoKeywordGradEngComp from "./GeoKeywordGradEngComp";
import GeoKeywordMelhoresFacSP from "./GeoKeywordMelhoresFacSP";
import GeoKeywordCursosGrad from "./GeoKeywordCursosGrad";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

const GeoHub = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="GEO"
        descricao="Visibilidade nos buscadores generativos"
        oQueEntraAqui="Aqui entram as palavras-chave e os levantamentos de GEO deste cliente."
      />
    );
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">GEO — Generative Engine Optimization</h1>
        <p className="text-muted-foreground text-sm mt-1">Otimização para mecanismos de busca generativos (IA)</p>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <div className="relative mb-6">
          {canScrollLeft && (
            <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 border border-border/50 shadow-sm hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
          )}
          <div ref={scrollRef} className="overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
            <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 flex-nowrap w-max gap-1 p-1">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="checklist">Checklist GEO</TabsTrigger>
              <TabsTrigger value="faculdade-sp">Faculdade Particular SP</TabsTrigger>
              <TabsTrigger value="curso-adm-sp">Curso Adm SP</TabsTrigger>
              <TabsTrigger value="curso-adm">Curso Adm</TabsTrigger>
              <TabsTrigger value="economia-sp">Economia SP</TabsTrigger>
              <TabsTrigger value="eng-producao-sp">Eng. Produção SP</TabsTrigger>
              <TabsTrigger value="direito-sp">Direito SP</TabsTrigger>
              <TabsTrigger value="eng-comp-sp">Eng. Comp SP</TabsTrigger>
              <TabsTrigger value="fac-eng-comp">Fac. Eng. Comp</TabsTrigger>
              <TabsTrigger value="grad-eng-comp">Grad. Eng. Comp</TabsTrigger>
              <TabsTrigger value="melhores-fac-sp">Melhores Fac. SP</TabsTrigger>
              <TabsTrigger value="cursos-grad">Cursos Graduação</TabsTrigger>
            </TabsList>
          </div>
          {canScrollRight && (
            <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 border border-border/50 shadow-sm hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>
        <TabsContent value="overview"><GeoOverview /></TabsContent>
        <TabsContent value="checklist"><GeoChecklist /></TabsContent>
        <TabsContent value="faculdade-sp"><GeoKeywordFaculdadeSP /></TabsContent>
        <TabsContent value="curso-adm-sp"><GeoKeywordCursoAdmSP /></TabsContent>
        <TabsContent value="curso-adm"><GeoKeywordCursoAdm /></TabsContent>
        <TabsContent value="economia-sp"><GeoKeywordEconomiaSP /></TabsContent>
        <TabsContent value="eng-producao-sp"><GeoKeywordEngProducaoSP /></TabsContent>
        <TabsContent value="direito-sp"><GeoKeywordDireitoSP /></TabsContent>
        <TabsContent value="eng-comp-sp"><GeoKeywordEngCompSP /></TabsContent>
        <TabsContent value="fac-eng-comp"><GeoKeywordFacEngComp /></TabsContent>
        <TabsContent value="grad-eng-comp"><GeoKeywordGradEngComp /></TabsContent>
        <TabsContent value="melhores-fac-sp"><GeoKeywordMelhoresFacSP /></TabsContent>
        <TabsContent value="cursos-grad"><GeoKeywordCursosGrad /></TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoHub;


