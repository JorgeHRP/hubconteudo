/**
 * Template de onboarding da Conteúdo Martech — 26 etapas, do contrato ao go-live.
 * Importado do Portal MarTech. `dias` é a distância em dias corridos a partir da
 * data de início; `depende` aponta para o `tid` das etapas anteriores.
 */

export interface EtapaOnboarding {
  tid: number;
  fase: string;
  titulo: string;
  /** Quem executa: nós, o cliente ou o comercial. */
  lado: "nos" | "cliente" | "comercial";
  tipo: string;
  dias: number;
  depende: number[];
  subtarefas: string[];
  opcional: boolean;
  visivelCliente: boolean;
}

export const fasesOnboarding = [
  "Handoff", "Kick-off", "Briefing e Acessos", "Implementação",
  "Estratégia", "Criação", "Montagem", "Go-live",
] as const;

export const ladoOnboardingLabels: Record<EtapaOnboarding["lado"], string> = {
  nos: "Agência",
  cliente: "Cliente",
  comercial: "Comercial",
};

export const templateOnboarding: EtapaOnboarding[] = [
  { tid: 1, fase: "Handoff", titulo: "Assinatura de contrato", lado: "comercial", tipo: "doc", dias: 0, depende: [], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 2, fase: "Handoff", titulo: "Briefing de handoff (Comercial → CS)", lado: "comercial", tipo: "doc", dias: 1, depende: [1], subtarefas: ["Preencher formulário", "Anexar proposta aprovada"], opcional: false, visivelCliente: false },
  { tid: 3, fase: "Handoff", titulo: "Passagem de bastão ao vivo", lado: "comercial", tipo: "call", dias: 2, depende: [2], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 4, fase: "Handoff", titulo: "Cadastrar cliente nas ferramentas (ClickUp/Notion)", lado: "nos", tipo: "act", dias: 2, depende: [2], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 5, fase: "Handoff", titulo: "Criar grupo de WhatsApp do projeto", lado: "nos", tipo: "wa", dias: 2, depende: [3], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 6, fase: "Kick-off", titulo: "Reunião de Kick-off", lado: "nos", tipo: "call", dias: 2, depende: [3], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 7, fase: "Kick-off", titulo: "Registrar matriz de escopo aceita", lado: "nos", tipo: "doc", dias: 3, depende: [6], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 8, fase: "Briefing e Acessos", titulo: "Enviar documento de acessos", lado: "nos", tipo: "mail", dias: 3, depende: [6], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 9, fase: "Briefing e Acessos", titulo: "Liberar acessos", lado: "cliente", tipo: "act", dias: 5, depende: [8], subtarefas: ["Meta / Facebook", "Google Ads + faturamento", "Analytics / Tag Manager", "RD Station"], opcional: false, visivelCliente: true },
  { tid: 10, fase: "Briefing e Acessos", titulo: "Enviar materiais de marca", lado: "cliente", tipo: "doc", dias: 5, depende: [8], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 11, fase: "Briefing e Acessos", titulo: "Sessão de briefing (estratégia)", lado: "nos", tipo: "call", dias: 6, depende: [6], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 12, fase: "Briefing e Acessos", titulo: "Análise de site e redes sociais", lado: "nos", tipo: "doc", dias: 6, depende: [8], subtarefas: [], opcional: true, visivelCliente: false },
  { tid: 13, fase: "Briefing e Acessos", titulo: "Consolidar briefing", lado: "nos", tipo: "doc", dias: 7, depende: [11, 10], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 14, fase: "Implementação", titulo: "Análise de RD Station e ferramentas de tráfego", lado: "nos", tipo: "doc", dias: 7, depende: [9], subtarefas: [], opcional: true, visivelCliente: false },
  { tid: 15, fase: "Implementação", titulo: "Configurar contas de tráfego (Meta/Google)", lado: "nos", tipo: "act", dias: 8, depende: [9], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 16, fase: "Implementação", titulo: "Configurar trackeamento (GA4/GTM/pixels)", lado: "nos", tipo: "act", dias: 9, depende: [9], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 17, fase: "Implementação", titulo: "Validar integrações", lado: "nos", tipo: "act", dias: 10, depende: [15, 16], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 18, fase: "Estratégia", titulo: "Planejamento estratégico do cliente", lado: "nos", tipo: "doc", dias: 9, depende: [13], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 19, fase: "Estratégia", titulo: "Aprovar planejamento", lado: "cliente", tipo: "act", dias: 10, depende: [18], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 20, fase: "Criação", titulo: "Criação de linha editorial (Social)", lado: "nos", tipo: "act", dias: 12, depende: [19], subtarefas: [], opcional: true, visivelCliente: false },
  { tid: 21, fase: "Criação", titulo: "Criação de criativos e copy", lado: "nos", tipo: "act", dias: 13, depende: [19], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 22, fase: "Criação", titulo: "Aprovar criativos e copy", lado: "cliente", tipo: "act", dias: 15, depende: [21], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 23, fase: "Montagem", titulo: "Montar campanhas nas plataformas", lado: "nos", tipo: "act", dias: 18, depende: [15, 22], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 24, fase: "Montagem", titulo: "QA de trackeamento e conversões", lado: "nos", tipo: "act", dias: 20, depende: [16, 23], subtarefas: [], opcional: false, visivelCliente: false },
  { tid: 25, fase: "Montagem", titulo: "Aprovar mídia e verba", lado: "cliente", tipo: "act", dias: 22, depende: [24], subtarefas: [], opcional: false, visivelCliente: true },
  { tid: 26, fase: "Go-live", titulo: "🎯 Campanhas no ar (north star)", lado: "nos", tipo: "ns", dias: 30, depende: [25], subtarefas: [], opcional: false, visivelCliente: true },
];
