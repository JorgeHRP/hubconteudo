import type { AppModulo, AppRole, Integracao, PainelExterno, Profile } from "@/lib/types";

/**
 * Base inicial do sistema — sem dados fictícios.
 * Só existe o usuário master. Tudo o mais nasce vazio e é preenchido pelo uso real.
 */

export const USUARIO_MASTER_ID = "u-master";

export const seedProfiles: Profile[] = [
  {
    id: "p-master",
    user_id: USUARIO_MASTER_ID,
    nome: "Thiago Lustosa",
    email: "thiago@conteudomartech.com.br",
    cpf: null,
    cargo: "CEO",
    departamento: "Diretoria",
    telefone: null,
    contato_emergencia_nome: null,
    contato_emergencia_telefone: null,
    foto_url: null,
    data_nascimento: null,
    data_admissao: null,
    ativo: true,
    convite_enviado_em: null,
  },
];

export const seedRoles: Record<string, AppRole> = {
  [USUARIO_MASTER_ID]: "master",
};

export const seedPermissoes: Record<string, AppModulo[]> = {};

export const seedIntegracoes: Integracao[] = [
  {
    chave: "reportei",
    nome: "Reportei",
    descricao: "Métricas das redes sociais e relatórios automáticos por cliente",
    destino: "Gestão de Redes Sociais",
    segredo: "REPORTEI_API_TOKEN",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "clickup",
    nome: "ClickUp",
    descricao: "Tarefas pendentes e produção mensal por cliente",
    destino: "Painel de CS",
    segredo: "CLICKUP_API_TOKEN",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "solides",
    nome: "Sólides",
    descricao: "Ponto registrado e jornada dos colaboradores",
    destino: "Colaboradores",
    segredo: "SOLIDES_API_TOKEN",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "conta_azul",
    nome: "Conta Azul",
    descricao: "Relatório financeiro completo — receitas, despesas e fluxo de caixa",
    destino: "Dashboard Financeiro",
    segredo: "CONTA_AZUL_TOKEN",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "alfaix",
    nome: "Planilha Alfaix",
    descricao: "Planilha de controle financeiro complementar",
    destino: "Dashboard Financeiro",
    segredo: "ALFAIX_SHEET_ID",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "rd_station",
    nome: "RD Station CRM",
    descricao: "Negócios e etapas do funil comercial",
    destino: "Resultados de Vendas",
    segredo: "RD_CRM_TOKEN",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "read_ai",
    nome: "Read.ai",
    descricao: "Atas de reunião importadas para o repositório do cliente",
    destino: "Painel de CS",
    segredo: "READ_API_KEY",
    conectada: false,
    ultima_sincronizacao: null,
  },
  {
    chave: "google_drive",
    nome: "Google Drive",
    descricao: "Peças e arquivos da pasta do cliente",
    destino: "Painel de CS",
    segredo: "GOOGLE_SERVICE_ACCOUNT",
    conectada: false,
    ultima_sincronizacao: null,
  },
];

export const seedPaineis: PainelExterno[] = [
  {
    chave: "trafego",
    nome: "Gestão de Tráfego",
    descricao: "Painel de gestão de tráfego desenvolvido separadamente",
    url: null,
  },
  {
    chave: "seo_geo",
    nome: "Gestão de SEO/GEO",
    descricao: "Painel de SEO e otimização para buscadores generativos",
    url: null,
  },
  {
    chave: "projetos_rd",
    nome: "Projetos de Implantação RD",
    descricao: "Acompanhamento das implantações de RD Station",
    url: null,
  },
];
