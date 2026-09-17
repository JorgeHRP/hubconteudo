/**
 * Roteiros de implantação da Conteúdo Martech, importados do projeto de Gestão de
 * Implantações. Cada ferramenta tem suas fases e itens de checklist.
 *
 * RD CRM: 10 fases · RD Conversas: 7 fases · demais: roteiro genérico até ter conteúdo.
 */

export type StatusItem =
  | "nao_iniciado" | "em_andamento" | "concluido" | "nao_se_aplica" | "aguardando_cliente";

export type Ferramenta = "rd_crm" | "rd_marketing" | "rd_conversas" | "shopify";

export interface ItemChecklist {
  id: string;
  task: string;
  status: StatusItem;
  responsible: string;
  date: string;
  notes: string;
}

export interface FaseImplantacao {
  id: string;
  name: string;
  items: ItemChecklist[];
}

export const ferramentaLabels: Record<Ferramenta, string> = {
  rd_crm: "RD Station CRM",
  rd_marketing: "RD Station Marketing",
  rd_conversas: "RD Conversas",
  shopify: "Shopify",
};

export const ferramentaTom: Record<Ferramenta, string> = {
  rd_crm: "bg-primary/10 text-primary",
  rd_marketing: "bg-accent/10 text-accent",
  rd_conversas: "bg-info/10 text-info",
  shopify: "bg-success/10 text-success",
};

export const statusItemLabels: Record<StatusItem, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  nao_se_aplica: "Não se aplica",
  aguardando_cliente: "Aguardando cliente",
};

export const statusItemVariant: Record<StatusItem, "secondary" | "info" | "success" | "warning"> = {
  nao_iniciado: "secondary",
  em_andamento: "info",
  concluido: "success",
  nao_se_aplica: "secondary",
  aguardando_cliente: "warning",
};

export const fasesCRM: FaseImplantacao[] = [
  {
    id: 'phase-1',
    name: 'Fase 1 — Acesso e Preparação',
    items: [
      { id: '1-1', task: 'Confirmar acesso à conta', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '1-2', task: 'Validar briefing com cliente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '1-3', task: 'Receber planilha de usuários', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '1-4', task: 'Receber base de contatos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-2',
    name: 'Fase 2 — Usuários e Equipes',
    items: [
      { id: '2-1', task: 'Convidar usuários', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '2-2', task: 'Criar permissões', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '2-3', task: 'Configurar acessos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '2-4', task: 'Criar equipes', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '2-5', task: 'Configurar visibilidade de equipes', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-3',
    name: 'Fase 3 — Funil de Vendas',
    items: [
      { id: '3-1', task: 'Criar funil', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '3-2', task: 'Configurar etapas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '3-3', task: 'Configurar critérios de avanço', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '3-4', task: 'Configurar CRM2CRM', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-4',
    name: 'Fase 4 — Campos Personalizados',
    items: [
      { id: '4-1', task: 'Criar campos em negociações', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '4-2', task: 'Criar campos em empresas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '4-3', task: 'Criar campos em contatos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '4-4', task: 'Criar campos em produtos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '4-5', task: 'Definir campos obrigatórios', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-5',
    name: 'Fase 5 — Automações',
    items: [
      { id: '5-1', task: 'Automação negociação criada', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '5-2', task: 'Automação mudança de etapa', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '5-3', task: 'Automação negociação parada', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '5-4', task: 'Automação venda ganha', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-6',
    name: 'Fase 6 — Importação de Dados',
    items: [
      { id: '6-1', task: 'Importar contatos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '6-2', task: 'Importar empresas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '6-3', task: 'Importar negociações', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '6-4', task: 'Importar produtos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-7',
    name: 'Fase 7 — Integrações',
    items: [
      { id: '7-1', task: 'RD Marketing', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '7-2', task: 'RD Conversas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '7-3', task: 'Exact Sales', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '7-4', task: 'WhatsApp', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '7-5', task: 'Google Calendar', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-8',
    name: 'Fase 8 — Produtos e Segmentos',
    items: [
      { id: '8-1', task: 'Criar produtos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '8-2', task: 'Configurar valores', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '8-3', task: 'Criar segmentos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-9',
    name: 'Fase 9 — Comunicação',
    items: [
      { id: '9-1', task: 'Criar modelos de email', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '9-2', task: 'Criar modelo de proposta', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'phase-10',
    name: 'Fase 10 — Treinamento',
    items: [
      { id: '10-1', task: 'Realizar treinamento', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: '10-2', task: 'Validar uso do CRM', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
];

export const fasesConversas: FaseImplantacao[] = [
  {
    id: 'rdc-phase-1',
    name: 'Fase 1 — Discovery',
    items: [
      { id: 'rdc-1-1', task: 'Realizar briefing completo com cliente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-2', task: 'Mapear canais atuais e volume de atendimento', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-3', task: 'Identificar caso de uso principal (distribuição/nutrição)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-4', task: 'Definir escopo da V1 do projeto', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-5', task: 'Mapear jornada do lead atual', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-6', task: 'Definir KPIs de sucesso (30/60/90 dias)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-1-7', task: 'Identificar integrações mandatórias', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-2',
    name: 'Fase 2 — Desenho Operacional',
    items: [
      { id: 'rdc-2-1', task: 'Definir setores de atendimento', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-2', task: 'Definir carteiras e regras de distribuição', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-3', task: 'Criar lista de usuários e perfis de acesso', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-4', task: 'Definir horários de atendimento por setor', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-5', task: 'Definir SLAs e tempo máximo de resposta', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-6', task: 'Criar tabulações (motivo de atendimento/encerramento)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-2-7', task: 'Definir nomenclatura padrão (setores, carteiras, tags)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-3',
    name: 'Fase 3 — Configuração Base',
    items: [
      { id: 'rdc-3-1', task: 'Configurar dados da empresa na plataforma', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-2', task: 'Cadastrar usuários e definir permissões', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-3', task: 'Criar setores na plataforma', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-4', task: 'Criar carteiras', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-5', task: 'Configurar mensagens rápidas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-6', task: 'Configurar mensagens automáticas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-7', task: 'Configurar tabulações', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-8', task: 'Criar etiquetas/tags', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-9', task: 'Configurar encerramento automático de chats', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-3-10', task: 'Configurar mensagem fora do expediente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-4',
    name: 'Fase 4 — Automações e Chatbots',
    items: [
      { id: 'rdc-4-1', task: 'Desenhar fluxograma dos chatbots principais', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-2', task: 'Construir fluxo de recepção/triagem', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-3', task: 'Construir fluxo de qualificação/pré-venda', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-4', task: 'Configurar comandos', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-5', task: 'Criar templates de WhatsApp', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-6', task: 'Submeter templates para aprovação Meta', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-4-7', task: 'Configurar campanhas iniciais', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-5',
    name: 'Fase 5 — Canais e Integrações',
    items: [
      { id: 'rdc-5-1', task: 'Verificar requisitos Meta/WhatsApp API', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-2', task: 'Ativar/migrar WhatsApp API', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-3', task: 'Configurar perfil do número WhatsApp', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-4', task: 'Integrar Instagram', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-5', task: 'Integrar Facebook Messenger', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-6', task: 'Configurar chat do site (widget)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-7', task: 'Integrar RD Station Marketing', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-8', task: 'Integrar RD Station CRM', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-5-9', task: 'Configurar webhooks (se aplicável)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-6',
    name: 'Fase 6 — Testes e Treinamento',
    items: [
      { id: 'rdc-6-1', task: 'Testar fluxos de chatbot em cenários reais', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-2', task: 'Testar atendimento em horário comercial', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-3', task: 'Testar atendimento fora do expediente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-4', task: 'Testar transferências entre setores', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-5', task: 'Testar integração com CRM/Marketing', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-6', task: 'Testar templates e campanhas', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-7', task: 'Realizar treinamento da equipe', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-6-8', task: 'Documentar ajustes identificados nos testes', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'rdc-phase-7',
    name: 'Fase 7 — Go-live e Sustentação',
    items: [
      { id: 'rdc-7-1', task: 'Definir plano de contingência de go-live', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-7-2', task: 'Virar operação (go-live)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-7-3', task: 'Monitoramento intensivo na primeira semana', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-7-4', task: 'Configurar dashboards e relatórios', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-7-5', task: 'Definir rotina de sustentação (auditoria periódica)', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'rdc-7-6', task: 'Entregar relatório de implantação ao cliente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
];

export const fasesPadrao: FaseImplantacao[] = [
  {
    id: 'placeholder-1',
    name: 'Fase 1 — Configuração Inicial',
    items: [
      { id: 'p1-1', task: 'Confirmar acesso à plataforma', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'p1-2', task: 'Validar briefing com cliente', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'p1-3', task: 'Configurar conta', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'placeholder-2',
    name: 'Fase 2 — Implementação',
    items: [
      { id: 'p2-1', task: 'Configurar funcionalidades principais', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'p2-2', task: 'Configurar integrações', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'p2-3', task: 'Testes e validação', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
  {
    id: 'placeholder-3',
    name: 'Fase 3 — Treinamento e Go-live',
    items: [
      { id: 'p3-1', task: 'Realizar treinamento', status: "nao_iniciado", responsible: '', date: '', notes: '' },
      { id: 'p3-2', task: 'Go-live', status: "nao_iniciado", responsible: '', date: '', notes: '' },
    ],
  },
];

/** Roteiro inicial de cada ferramenta. */
export function roteiroDaFerramenta(f: Ferramenta): FaseImplantacao[] {
  const base = f === "rd_crm" ? fasesCRM : f === "rd_conversas" ? fasesConversas : fasesPadrao;
  // Cópia profunda: cada projeto edita o próprio roteiro sem mexer no template.
  return JSON.parse(JSON.stringify(base));
}
