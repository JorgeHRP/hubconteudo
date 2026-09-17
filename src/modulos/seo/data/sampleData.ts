export const keywordsData = [
  // https://eseg.edu.br/
  { targetPage: "https://eseg.edu.br/", cluster: "faculdade particular são paulo", volume: 150, difficulty: 0, parentTopic: "melhores faculdades particulares de sp", position: 0 },
  { targetPage: "https://eseg.edu.br/", cluster: "", volume: 800, difficulty: 84, parentTopic: "faculdades em sp", position: 0 },
  { targetPage: "https://eseg.edu.br/", cluster: "", volume: 50, difficulty: 24, parentTopic: "ensino superior", position: 56 },
  // https://eseg.edu.br/home/graduacao
  { targetPage: "https://eseg.edu.br/home/graduacao", cluster: "cursos de graduação", volume: 1900, difficulty: 25, parentTopic: "lista de faculdades para fazer", position: 0 },
  { targetPage: "https://eseg.edu.br/home/graduacao", cluster: "tipos de graduação", volume: 600, difficulty: 0, parentTopic: "tipos de faculdades", position: 0 },
  // https://eseg.edu.br/home/curso/administracao
  { targetPage: "https://eseg.edu.br/home/curso/administracao", cluster: "curso de administração", volume: 25000, difficulty: 19, parentTopic: "curso de administração", position: 0 },
  { targetPage: "https://eseg.edu.br/home/curso/administracao", cluster: "faculdade de administração", volume: 12000, difficulty: 13, parentTopic: "administração", position: 0 },
  { targetPage: "https://eseg.edu.br/home/curso/administracao", cluster: "bacharel em administração", volume: 1300, difficulty: 4, parentTopic: "bacharel em administração", position: 0 },
  { targetPage: "https://eseg.edu.br/home/curso/administracao", cluster: "faculdade de administração", volume: 1300, difficulty: 0, parentTopic: "grade curricular administração", position: 0 },
  { targetPage: "https://eseg.edu.br/home/curso/administracao", cluster: "graduação em administração", volume: 900, difficulty: 12, parentTopic: "curso de administração", position: 0 },
  // https://eseg.edu.br/home/curso/direito
  { targetPage: "https://eseg.edu.br/home/curso/direito", cluster: "faculdade de advocacia", volume: 1900, difficulty: 14, parentTopic: "direito", position: 0 },
  { targetPage: "https://eseg.edu.br/home/curso/direito", cluster: "quanto tempo dura a faculdade de direito", volume: 1300, difficulty: 0, parentTopic: "quanto tempo dura a faculdade de direito", position: 96 },
  { targetPage: "https://eseg.edu.br/home/curso/direito", cluster: "faculdades de direito são paulo", volume: 450, difficulty: 12, parentTopic: "faculdade de direito", position: 0 },
];

export const articlesData = [
  { keyword: "faculdade de administração sp", volume: 1900, secondaryKw: "administração sp, curso adm", anchorText: "faculdade em sp", internalLinks: "https://eseg.edu.br/home/graduacao", articleLink: "doc1.docx", publishLink: "https://eseg.edu.br/blog/faculdade-administracao-sp", keywordsForPage: 12, title: "Faculdade de Administração em SP: Guia Completo 2026", metaDescription: "Descubra as melhores faculdades de administração em São Paulo. Conheça a ESEG e seus diferenciais.", url: "/blog/faculdade-administracao-sp", publishedUrl: "https://eseg.edu.br/blog/faculdade-administracao-sp", destino: "Blog ESEG" },
  { keyword: "engenharia de produção", volume: 1600, secondaryKw: "eng produção, curso engenharia", anchorText: "engenharia de produção", internalLinks: "https://eseg.edu.br/home/curso/engenharia", articleLink: "doc2.docx", publishLink: "https://eseg.edu.br/blog/engenharia-producao", keywordsForPage: 18, title: "Engenharia de Produção: O que faz e onde estudar", metaDescription: "Tudo sobre o curso de Engenharia de Produção. Mercado, salário e melhores faculdades em SP.", url: "/blog/engenharia-producao", publishedUrl: "https://eseg.edu.br/blog/engenharia-producao", destino: "Blog ESEG" },
  { keyword: "mba gestão empresarial", volume: 720, secondaryKw: "mba sp, gestão empresarial", anchorText: "pós-graduação", internalLinks: "https://eseg.edu.br/home/pos-graduacao", articleLink: "doc3.docx", publishLink: "", keywordsForPage: 8, title: "MBA em Gestão Empresarial: Vale a Pena?", metaDescription: "Saiba tudo sobre MBA em Gestão Empresarial. Comparativo de programas em SP.", url: "/blog/mba-gestao-empresarial", publishedUrl: "", destino: "Backlink" },
  { keyword: "vestibular 2026", volume: 3500, secondaryKw: "inscrição vestibular, provas", anchorText: "vestibular eseg", internalLinks: "https://eseg.edu.br/vestibular", articleLink: "doc4.docx", publishLink: "https://eseg.edu.br/blog/vestibular-2026", keywordsForPage: 25, title: "Vestibular 2026: Datas, Inscrições e Dicas", metaDescription: "Calendário completo do vestibular 2026. Dicas de estudo e inscrições abertas na ESEG.", url: "/blog/vestibular-2026", publishedUrl: "https://eseg.edu.br/blog/vestibular-2026", destino: "Blog ESEG" },
];

export const onPageData = [
  { url: "https://eseg.edu.br/", pageType: "Home", keywordCount: 5, title: "ESEG - Faculdade do Grupo Etapa", metaDescription: "Faculdade ESEG - Grupo Etapa. Cursos de graduação e pós-graduação em SP.", optimizations: "H1, Meta Tags, Schema", optimizedUrl: "https://eseg.edu.br/" },
  { url: "https://eseg.edu.br/home/graduacao", pageType: "Categoria", keywordCount: 8, title: "Cursos de Graduação - ESEG", metaDescription: "Conheça os cursos de graduação da ESEG. Administração e Engenharia de Produção.", optimizations: "H1, Imagens, Links", optimizedUrl: "https://eseg.edu.br/graduacao" },
  { url: "https://eseg.edu.br/home/curso/administracao", pageType: "Curso", keywordCount: 12, title: "Administração - ESEG", metaDescription: "Curso de Administração da ESEG. Grade curricular, corpo docente e diferenciais.", optimizations: "Schema, FAQ, Breadcrumb", optimizedUrl: "https://eseg.edu.br/curso/administracao" },
  { url: "https://eseg.edu.br/home/curso/engenharia", pageType: "Curso", keywordCount: 10, title: "Engenharia de Produção - ESEG", metaDescription: "Graduação em Engenharia de Produção na ESEG. Aprenda com os melhores professores.", optimizations: "H1, Meta, Schema", optimizedUrl: "https://eseg.edu.br/curso/engenharia-de-producao" },
  { url: "https://eseg.edu.br/home/pos-graduacao", pageType: "Categoria", keywordCount: 6, title: "Pós-Graduação e MBA - ESEG", metaDescription: "Programas de pós-graduação e MBA da ESEG. Especializações em gestão.", optimizations: "Links, Imagens", optimizedUrl: "" },
  { url: "https://eseg.edu.br/vestibular", pageType: "Landing", keywordCount: 4, title: "Vestibular ESEG 2026", metaDescription: "Inscreva-se no vestibular da ESEG 2026. Vagas limitadas.", optimizations: "CTA, Schema, Speed", optimizedUrl: "https://eseg.edu.br/vestibular-2026" },
];

export const backlinksData = [
  { anchorText: "faculdade eseg", domain: "guiadoestudante.com.br", status: "Ativo", publishLink: "https://guiadoestudante.com.br/ranking-faculdades", domainAuthority: 72 },
  { anchorText: "engenharia de produção sp", domain: "educamaisbrasil.com.br", status: "Ativo", publishLink: "https://educamaisbrasil.com.br/cursos", domainAuthority: 65 },
  { anchorText: "grupo etapa faculdade", domain: "vestibular.com.br", status: "Pendente", publishLink: "", domainAuthority: 58 },
  { anchorText: "mba são paulo", domain: "infomoney.com.br", status: "Ativo", publishLink: "https://infomoney.com.br/educacao/mba", domainAuthority: 82 },
  { anchorText: "curso administração", domain: "querobolsa.com.br", status: "Ativo", publishLink: "https://querobolsa.com.br/faculdades", domainAuthority: 70 },
  { anchorText: "eseg graduação", domain: "blogdoenem.com.br", status: "Removido", publishLink: "", domainAuthority: 45 },
  { anchorText: "ENEM na ESEG: como usar sua nota para entrar na faculdade em São Paulo", domain: "rcwtv.com.br", status: "Ativo", publishLink: "https://www.rcwtv.com.br/noticia/enem-na-eseg-como-usar-sua-nota-para-entrar-na-faculdade-em-sao-paulo", domainAuthority: 0 },
  { anchorText: "Faculdade de engenharia em São Paulo: como escolher o curso e a instituição", domain: "gazetadasemana.com.br", status: "Ativo", publishLink: "https://gazetadasemana.com.br/coluna/15261/faculdade-de-engenharia-em-sao-paulo-como-escolher-o-curso-e-a-instituicao-certos", domainAuthority: 0 },
];

export const competitorData = [
  { keyword: "faculdade administração sp", volume: 1900, difficulty: 45, cpc: 2.80, eseg: { position: 8, url: "eseg.edu.br/administracao" }, fgv: { position: 1, url: "fgv.br/administracao" }, insper: { position: 3, url: "insper.edu.br/graduacao" }, mackenzie: { position: 5, url: "mackenzie.br/administracao" }, saoJudas: { position: 12, url: "saojudas.br/adm" }, maua: { position: 20, url: "maua.br/cursos" } },
  { keyword: "engenharia de produção sp", volume: 1600, difficulty: 38, cpc: 1.95, eseg: { position: 5, url: "eseg.edu.br/engenharia" }, fgv: { position: 15, url: "" }, insper: { position: 8, url: "insper.edu.br/engenharia" }, mackenzie: { position: 3, url: "mackenzie.br/engenharia" }, saoJudas: { position: 10, url: "saojudas.br/eng" }, maua: { position: 1, url: "maua.br/engenharia" } },
  { keyword: "mba gestão empresarial", volume: 720, difficulty: 52, cpc: 3.50, eseg: { position: 15, url: "eseg.edu.br/mba" }, fgv: { position: 1, url: "fgv.br/mba" }, insper: { position: 2, url: "insper.edu.br/mba" }, mackenzie: { position: 7, url: "mackenzie.br/mba" }, saoJudas: { position: 25, url: "" }, maua: { position: 30, url: "" } },
  { keyword: "melhor faculdade sp", volume: 5400, difficulty: 68, cpc: 2.10, eseg: { position: 25, url: "eseg.edu.br" }, fgv: { position: 2, url: "fgv.br" }, insper: { position: 1, url: "insper.edu.br" }, mackenzie: { position: 4, url: "mackenzie.br" }, saoJudas: { position: 8, url: "saojudas.br" }, maua: { position: 12, url: "maua.br" } },
  { keyword: "vestibular 2026 sp", volume: 3500, difficulty: 42, cpc: 1.60, eseg: { position: 10, url: "eseg.edu.br/vestibular" }, fgv: { position: 3, url: "fgv.br/vestibular" }, insper: { position: 5, url: "insper.edu.br/vestibular" }, mackenzie: { position: 2, url: "mackenzie.br/vestibular" }, saoJudas: { position: 6, url: "saojudas.br/vestibular" }, maua: { position: 9, url: "maua.br/vestibular" } },
];

export const auditData = [
  { date: "2026-03-15", type: "Auditoria de Backlinks", description: "Verificação de 45 backlinks ativos. 3 removidos, 2 novos adquiridos.", status: "Concluído" },
  { date: "2026-03-01", type: "Análise de Concorrentes", description: "Análise comparativa FGV, Insper e Mackenzie. Identificadas 15 oportunidades de keywords.", status: "Concluído" },
  { date: "2026-02-20", type: "Análise de Lacunas", description: "Gap analysis revelou 28 keywords onde concorrentes rankam e ESEG não aparece.", status: "Concluído" },
  { date: "2026-02-10", type: "Auditoria de Backlinks", description: "Revisão trimestral de backlinks. DA médio: 62. 5 links tóxicos identificados.", status: "Concluído" },
  { date: "2026-01-25", type: "Análise de Concorrentes", description: "Monitoramento de novas páginas dos concorrentes. Mackenzie lançou 8 novos artigos.", status: "Concluído" },
  { date: "2026-01-10", type: "Análise de Lacunas", description: "Levantamento inicial de oportunidades para Q1 2026.", status: "Em andamento" },
];

export const projectProgress = [
  { task: "Pesquisa de Palavras-chave", progress: 85, status: "Em andamento" },
  { task: "Otimização On-Page", progress: 60, status: "Em andamento" },
  { task: "Criação de Conteúdo", progress: 45, status: "Em andamento" },
  { task: "Link Building", progress: 30, status: "Iniciado" },
  { task: "Auditoria Técnica", progress: 100, status: "Concluído" },
  { task: "Schema Markup", progress: 70, status: "Em andamento" },
];

export const recentUpdates = [
  { date: "2026-04-05", title: "3 novos artigos publicados", description: "Artigos sobre graduação, engenharia e vestibular publicados no blog." },
  { date: "2026-04-02", title: "Otimização de meta tags", description: "15 páginas atualizadas com novos títulos e meta descrições otimizados." },
  { date: "2026-03-28", title: "2 backlinks conquistados", description: "Novos backlinks do Guia do Estudante (DA 72) e EducaMais (DA 65)." },
  { date: "2026-03-20", title: "Auditoria técnica finalizada", description: "Correção de 12 erros de indexação e melhoria de Core Web Vitals." },
];


