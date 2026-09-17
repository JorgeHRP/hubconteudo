import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConteudoSeo } from "@/modulos/seo/hooks/useConteudoSeo";
import { SecaoEditavel, ListaEditavel } from "@/modulos/seo/components/SecaoEditavel";

interface GrupoEntrega {
  title: string;
  items: string[];
}

/**
 * Estrutura em branco: os mesmos blocos de escopo que a agência entrega, sem os
 * itens. Cada cliente contrata um volume diferente, então as linhas ficam vazias.
 */
const entregasVazias: GrupoEntrega[] = [
  { title: "Setup Inicial", items: [] },
  { title: "Diagnóstico Estratégico e Auditorias", items: [] },
  { title: "SEO On-page", items: [] },
  { title: "Web Core Vitals", items: [] },
  { title: "Produção de Conteúdo", items: [] },
  { title: "SEO Off-page", items: [] },
  { title: "GEO — Generative Engine Optimization", items: [] },
  { title: "Relatório e Monitoramento", items: [] },
];

const deliverables: GrupoEntrega[] = [
  {
    title: "Setup Inicial",
    items: [
      "Acessos e dados fornecidos pelo cliente (site, cms, blog e acessos google)",
      "Configuração do GA4 e Search Console (eventos e fontes de tráfego)",
    ],
  },
  {
    title: "Diagnóstico Estratégico e Auditorias",
    items: [
      "Auditoria de backlinks",
      "Análise da estratégia dos concorrentes",
      "Análise de lacunas",
      "Pesquisa de palavras-chave",
    ],
  },
  {
    title: "SEO On-page",
    items: [
      "Meta título",
      "Meta descrição",
      "Texto alternativo (alt)",
      "Tags",
      "Estrutura de URLs",
      "Sitemap e XML",
      "Erros de página",
      "Links quebrados",
      "Links internos",
      "Conteúdo duplicado",
      "Canônicas",
      "Erros de rastreamento",
      "Dados estruturados",
    ],
  },
  {
    title: "Web Core Vitals",
    items: [
      "Dimensionamento imagens",
      "Tempo de resposta do servidor",
      "Compatibilidade mobile",
      "Tempo de carregamento",
    ],
  },
  {
    title: "Produção de Conteúdo",
    items: [
      "4 blog posts e 4 artigos por mês",
      "4 otimizações por mês (SEO e GEO)",
    ],
  },
  {
    title: "SEO Off-page",
    items: [
      "Publicação de 2 backlinks por mês",
      "Mapeamento de links quebrados e noindex",
    ],
  },
  {
    title: "GEO — Generative Engine Optimization",
    items: [
      "Integrar mais FAQ em conteúdos",
      "Fazer levantamentos de visibilidade em IA",
      "Todos os conteúdos serão pensados em SEO + GEO",
    ],
  },
  {
    title: "Relatório e Monitoramento",
    items: [
      "Mapeio de ambientes internos e remoção deles de relatórios de performance (portal do aluno e professor)",
      "Relatório em tempo real (dashboard)",
      "Relatórios consolidados: semestral e anual",
    ],
  },
];

export default function Deliverables() {
  const [editando, setEditando] = useState(false);
  const { conteudo, salvar, salvando, comecaVazio } = useConteudoSeo<GrupoEntrega[]>(
    "entregaveis", deliverables, entregasVazias
  );

  return (
    <div className="animate-fade-in-up space-y-8">
      <SecaoEditavel
        titulo="Entregáveis"
        descricao="Escopo completo de entregas do projeto SEO + GEO"
        conteudo={conteudo}
        aoSalvar={salvar}
        aoRestaurar={() => salvar(comecaVazio ? entregasVazias : deliverables)}
        editando={editando}
        setEditando={setEditando}
        salvando={salvando}
        editor={(rascunho, setRascunho) => (
          <ListaEditavel
            itens={rascunho}
            aoTrocar={setRascunho}
            novoItem={() => ({ title: "", items: [] })}
            rotuloNovo="Adicionar bloco de escopo"
            linha={(grupo, aoMudar) => (
              <div className="space-y-2">
                <Input
                  placeholder="Nome do bloco"
                  value={grupo.title}
                  onChange={(e) => aoMudar({ ...grupo, title: e.target.value })}
                />
                <Textarea
                  rows={4}
                  placeholder="Uma entrega por linha"
                  value={grupo.items.join("\n")}
                  onChange={(e) =>
                    aoMudar({
                      ...grupo,
                      // Uma linha por entrega: é como o time escreve escopo.
                      items: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            )}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {conteudo.map((group, i) => (
            <Card key={i} className="glass-card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  {group.title || "Sem nome"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-sm leading-tight text-foreground/80">{item}</span>
                  </div>
                ))}
                {group.items.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nada definido neste bloco ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {conteudo.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum bloco de escopo. Use “Editar” para montar o escopo deste cliente.
          </p>
        )}
      </SecaoEditavel>
    </div>
  );
}
