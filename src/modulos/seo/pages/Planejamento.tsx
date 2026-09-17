import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Wrench, Code2, FileEdit, Link2, GraduationCap } from "lucide-react";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

type Section = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
};

type MonthPlan = {
  month: string;
  label: string;
  focus: string;
  sections: Section[];
};

const plan: MonthPlan[] = [
  {
    month: "Mês 1",
    label: "Agosto",
    focus:
      "Resolução de erros críticos, fundação técnica, marcação de dados estruturados e auditoria de autoridade.",
    sections: [
      {
        icon: Link2,
        title: "Off-Page, Autoridade e Estratégias Avançadas",
        items: ["Auditoria de Backlinks de SPAM", "Auditoria de SEO Local"],
      },
      {
        icon: Wrench,
        title: "SEO Técnico e Performance",
        items: [
          "Corrigir 72 páginas com <title> duplicado.",
          "Corrigir 18 páginas com meta description duplicada.",
          "Corrigir 21 páginas com <title> muito curto.",
          "Corrigir 55 URLs com estrutura pouco otimizada para SEO.",
          "Realizar limpeza do sitemap e atualização do cache.",
          "Mapeamento e correção de links internos quebrados (Erros 404) e configurações de redirecionamentos (301).",
        ],
      },
      {
        icon: Code2,
        title: "Dados Estruturados (Schema Markup)",
        items: [
          "Implementar Schema CollegeOrUniversity na página inicial.",
          "Implementar o template Course nas páginas de cursos.",
          "Implementar Event + FAQPage na nova página de Vestibular.",
          "Implementar FAQPage nas páginas dos 8 cursos e 1 Geral na de Vestibular.",
        ],
      },
      {
        icon: FileEdit,
        title: "Otimização de Conteúdo e On-Page",
        items: [
          "Reescrever títulos e meta descriptions das 20 páginas com maior volume de impressões.",
          "Executar as 4 primeiras fusões do plano de consolidação de conteúdo.",
          "Auditoria e correção de Headings (apenas um H1 por página e hierarquia H2/H3 lógica).",
        ],
      },
    ],
  },
  {
    month: "Mês 2",
    label: "Setembro",
    focus:
      "Rejeição de SPAM, manutenção técnica, multimídia, navegação e inteligência competitiva.",
    sections: [
      {
        icon: Link2,
        title: "Off-Page, Autoridade e Estratégias Avançadas",
        items: [
          "Remoção/Rejeição de Backlinks: Criar o arquivo .txt com os domínios tóxicos mapeados em agosto e enviar para a ferramenta Disavow Links Tool do Google.",
        ],
      },
      {
        icon: Wrench,
        title: "SEO Técnico e Performance",
        items: [
          "Corrigir 72 páginas com <title> duplicado.",
          "Corrigir 18 páginas com meta description duplicada.",
          "Corrigir 21 páginas com <title> muito curto.",
          "Corrigir 55 URLs com estrutura pouco otimizada para SEO.",
          "Monitorar indexação das páginas consolidadas.",
        ],
      },
      {
        icon: Code2,
        title: "Dados Estruturados (Schema Markup)",
        items: [
          "Validar Schemas e FAQs implementados no mês anterior.",
          "Implementar Breadcrumbs (Trilha de Navegação) estruturados com Schema Markup.",
        ],
      },
      {
        icon: FileEdit,
        title: "Otimização de Conteúdo e On-Page",
        items: [
          "Reescrever títulos e metas das 20 páginas com maior volume de impressões.",
          "Executar mais 4 fusões do plano de consolidação.",
          "Otimização de Imagens: Preencher Alt Text e converter imagens pesadas para WebP.",
          "Topic Clusters: estruturar ancoragem correta com a página de curso, 15 otimizações mês.",
        ],
      },
    ],
  },
  {
    month: "Mês 3",
    label: "Outubro",
    focus:
      "Construção de autoridade ativa (E-E-A-T), Link Building, linkagem interna e revisão geral.",
    sections: [
      {
        icon: Link2,
        title: "Off-Page, Autoridade e Estratégias Avançadas",
        items: [
          "Monitoramento pós-Disavow: Analisar se houve recuperação ou ganho de posições após o Google processar a rejeição dos links tóxicos de setembro.",
        ],
      },
      {
        icon: Wrench,
        title: "SEO Técnico e Performance",
        items: [
          "Corrigir 72 páginas com <title> duplicado.",
          "Corrigir 18 páginas com meta description duplicada.",
          "Corrigir 22 páginas com <title> muito curto.",
          "Corrigir 55 URLs com estrutura pouco otimizada para SEO.",
          "Revisar redirecionamentos, sitemap, cobertura de indexação e evolução dos indicadores gerais de SEO.",
        ],
      },
      {
        icon: FileEdit,
        title: "Otimização de Conteúdo e On-Page",
        items: [
          "Reescrever títulos e metas das 20 páginas com maior volume de impressões.",
          "Executar as 3 últimas fusões do plano de consolidação.",
          "Topic Clusters: estruturar ancoragem correta com a página de curso, 15 otimizações mês.",
          "Reforço de E-E-A-T: Adicionar credenciais ou currículo dos coordenadores nas páginas dos cursos.",
          "Executar Linkagem Interna Estratégica: Conectar artigos do Blog às páginas de Cursos usando textos-âncora exatos.",
        ],
      },
    ],
  },
];

const cursos = [
  "Administração",
  "Direito",
  "Economia",
  "Engenharia de Computação",
  "Engenharia de Produção",
];

const otimizacoesCurso = [
  "Inserção de FAQ específico em cada página de curso, com Schema próprio, como prioridade do mês de agosto.",
  "Ampliação do conteúdo da seção 'Sobre o curso'.",
  "Inclusão de um bloco de definição no início da página.",
  "Ajuste do H1 utilizando a palavra-chave completa.",
  "Inclusão de elementos de autoridade (prêmios, selos, parcerias) — a ESEG deverá fornecer essas informações.",
  "Revisão dos artigos do blog para eliminar canibalização de palavras-chave, utilizando links internos e URLs canônicas.",
  "Definição da palavra-chave principal de cada curso, priorizando termos com foco geográfico, como 'Graduação em Direito em São Paulo'.",
  "Reescrita dos textos das páginas, envio para aprovação e posterior inclusão das informações de autoridade.",
];

const Planejamento = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Planejamento"
        descricao="Plano de otimização por página e por curso"
        oQueEntraAqui="Aqui entram as páginas e os cursos deste cliente, com as otimizações previstas para cada um."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Planejamento SEO</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Roadmap trimestral de execução — Agosto, Setembro e Outubro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plan.map((m) => (
          <Card key={m.month} className="glass-card flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs">
                  {m.month}
                </Badge>
                <CardTitle className="text-xl gradient-text">{m.label}</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">Foco:</span> {m.focus}
              </p>
            </CardHeader>
            <CardContent className="space-y-5 flex-1">
              {m.sections.map((s) => (
                <div key={s.title}>
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-primary shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg gradient-text">Otimização Página de Curso (5 de graduação)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cursos.map((curso, i) => (
              <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0">•</span>
                <span>{curso}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Ações resumidas</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otimizacoesCurso.map((item, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-primary shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Planejamento;


