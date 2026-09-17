import { useState } from "react";
import { ExternalLink, Globe, Search, Link2, BarChart3, Users, FileText, FolderTree, FileQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConteudoSeo } from "@/modulos/seo/hooks/useConteudoSeo";
import { SecaoEditavel, ListaEditavel } from "@/modulos/seo/components/SecaoEditavel";

interface CardAuditoria {
  title: string;
  /** Nome do ícone; guardado como texto para sobreviver ao salvamento. */
  icone?: string;
  description: string;
  link: string;
}

const icones: Record<string, typeof Globe> = {
  Globe, Search, Link2, BarChart3, Users, FileText, FolderTree,
};
const iconeDe = (nome?: string) => icones[nome ?? ""] ?? FileQuestion;

/**
 * Estrutura em branco: os mesmos oito blocos de auditoria que a agência entrega,
 * sem os links. É o esqueleto que o time preenche para cada cliente.
 */
const auditoriaVazia: CardAuditoria[] = [
  { title: "Auditoria Site", icone: "Globe", description: "", link: "" },
  { title: "Auditoria SEO On-Page Site", icone: "Search", description: "", link: "" },
  { title: "Auditoria SEO Off-Page Site", icone: "Link2", description: "", link: "" },
  { title: "Análise SERP", icone: "BarChart3", description: "", link: "" },
  { title: "Análise de Concorrentes", icone: "Users", description: "", link: "" },
  { title: "Auditoria Blog", icone: "FileText", description: "", link: "" },
  { title: "Auditoria SEO Off-Page Blog", icone: "Link2", description: "", link: "" },
  { title: "Auditoria de Estrutura de URLs e Arquitetura", icone: "FolderTree", description: "", link: "" },
];

const auditCards: CardAuditoria[] = [
  {
    title: "Auditoria Site",
    icone: "Globe",
    description: "Análise completa da saúde técnica do site, incluindo velocidade de carregamento, erros de rastreamento, indexação, Core Web Vitals e compatibilidade mobile.",
    link: "https://drive.google.com/file/d/1ikZjzNzmMbK40SzZ8UOvUQJALriEaAJY/view?usp=drive_link",
  },
  {
    title: "Auditoria SEO On-Page Site",
    icone: "Search",
    description: "Revisão de títulos, meta descrições, headings (H1-H6), uso de palavras-chave, imagens otimizadas e estrutura de conteúdo de cada página do site.",
    link: "https://drive.google.com/file/d/1fV_rVNXHebrVBUWB4I5TljdoqiR-uKtU/view?usp=drive_link",
  },
  {
    title: "Auditoria SEO Off-Page Site",
    icone: "Link2",
    description: "Avaliação do perfil de backlinks do site, autoridade de domínio, qualidade dos links externos e identificação de links tóxicos ou spam.",
    link: "https://drive.google.com/file/d/1xjmtYMFG7i_pBBh1VZJZ4Bsqmfdc9myR/view?usp=drive_link",
  },
  {
    title: "Análise SERP",
    icone: "BarChart3",
    description: "Estudo das páginas de resultados do Google para as palavras-chave alvo, identificando oportunidades de featured snippets, rich results e padrões de rankeamento.",
    link: "https://drive.google.com/file/d/180RBowwh1pJ4_ZgF092MiL97BFoFoUTc/view?usp=drive_link",
  },
  {
    title: "Análise de Concorrentes",
    icone: "Users",
    description: "Comparativo detalhado com os principais concorrentes no digital, analisando estratégias de conteúdo, palavras-chave, backlinks e posicionamento orgânico.",
    link: "https://drive.google.com/file/d/1OUjHRnGvb_VHQfv2AlyScZZwoi7PoWw5/view?usp=drive_link",
  },
  {
    title: "Auditoria Blog",
    icone: "FileText",
    description: "Análise do blog incluindo qualidade do conteúdo, otimização de artigos, linkagem interna, frequência de publicação e oportunidades de melhoria.",
    link: "https://drive.google.com/file/d/1Y986l0oGrRqjpQ-1Vs9ageBEbd0IzNri/view?usp=drive_link",
  },
  {
    title: "Auditoria SEO Off-Page Blog",
    icone: "Link2",
    description: "Avaliação dos backlinks direcionados ao blog, autoridade das páginas de artigos e estratégias de link building específicas para o conteúdo editorial.",
    link: "https://drive.google.com/file/d/1PECATHt7CBY3TmvUQvDiyXphJ3SBpC9N/view?usp=drive_link",
  },
  {
    title: "Auditoria de Estrutura de URLs e Arquitetura",
    icone: "FolderTree",
    description: "Revisão da hierarquia de URLs, arquitetura da informação, navegação, breadcrumbs e estrutura de categorias para garantir rastreamento e indexação eficientes.",
    link: "https://drive.google.com/file/d/1HdUUMG-MnrZwroHyJHhyogLIJk1DQPJv/view?usp=drive_link",
  },
];

const Audit = () => {
  const [editando, setEditando] = useState(false);
  const { conteudo, salvar, salvando, comecaVazio } = useConteudoSeo<CardAuditoria[]>(
    "auditoria-cards", auditCards, auditoriaVazia
  );

  return (
    <div className="max-w-7xl space-y-6">
      <SecaoEditavel
        titulo="Auditoria"
        descricao="Relatórios de auditoria e análises detalhadas do projeto"
        conteudo={conteudo}
        aoSalvar={salvar}
        aoRestaurar={() => salvar(comecaVazio ? auditoriaVazia : auditCards)}
        editando={editando}
        setEditando={setEditando}
        salvando={salvando}
        editor={(rascunho, setRascunho) => (
          <ListaEditavel
            itens={rascunho}
            aoTrocar={setRascunho}
            novoItem={() => ({ title: "", icone: "FileText", description: "", link: "" })}
            rotuloNovo="Adicionar auditoria"
            linha={(card, aoMudar) => (
              <div className="space-y-2">
                <Input
                  placeholder="Nome da auditoria"
                  value={card.title}
                  onChange={(e) => aoMudar({ ...card, title: e.target.value })}
                />
                <Textarea
                  rows={2}
                  placeholder="O que esta auditoria analisa"
                  value={card.description}
                  onChange={(e) => aoMudar({ ...card, description: e.target.value })}
                />
                <Input
                  placeholder="Link do relatório (Drive, Looker, PDF…)"
                  value={card.link}
                  onChange={(e) => aoMudar({ ...card, link: e.target.value })}
                />
              </div>
            )}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {conteudo.map((card, i) => {
            const Icone = iconeDe(card.icone);
            const temLink = Boolean(card.link.trim());
            const conteudoCard = (
              <>
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-xl p-2.5"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
                    <Icone className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold leading-tight text-foreground">
                    {card.title || "Sem nome"}
                  </h3>
                </div>
                <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                  {card.description || "Sem descrição."}
                </p>
                <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-medium"
                  style={{ color: temLink ? "#7C3AED" : undefined }}>
                  {temLink ? (
                    <>
                      <span className="opacity-60 transition-opacity group-hover:opacity-100">
                        Abrir relatório
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Relatório ainda não anexado</span>
                  )}
                </div>
              </>
            );

            // Sem link, o card não deve fingir que leva a algum lugar.
            return temLink ? (
              <a key={i} href={card.link} target="_blank" rel="noopener noreferrer"
                className="glass-card-hover group flex cursor-pointer flex-col gap-3 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                {conteudoCard}
              </a>
            ) : (
              <div key={i} className="glass-card-hover flex flex-col gap-3 p-5 opacity-70">
                {conteudoCard}
              </div>
            );
          })}
        </div>

        {conteudo.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma auditoria cadastrada. Use “Editar” para montar a lista deste cliente.
          </p>
        )}
      </SecaoEditavel>
    </div>
  );
};

export default Audit;
