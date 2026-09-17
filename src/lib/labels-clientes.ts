import type { StatusEmpresa, StatusProjeto, TipoProjeto } from "./types";

export const tipoProjetoLabels: Record<TipoProjeto, string> = {
  cs: "Customer Success",
  trafego: "Gestão de Tráfego",
  seo: "SEO / GEO",
  rd: "Implantação RD",
  inbound: "Inbound",
  sites: "Sites e Hotsites",
  social: "Redes Sociais",
};

export const tipoProjetoCurto: Record<TipoProjeto, string> = {
  cs: "CS",
  trafego: "Tráfego",
  seo: "SEO",
  rd: "RD",
  inbound: "Inbound",
  sites: "Sites",
  social: "Social",
};

/** Cada frente tem sua cor, para a pessoa reconhecer sem ler. */
export const tipoProjetoTom: Record<TipoProjeto, string> = {
  cs: "bg-primary/10 text-primary",
  trafego: "bg-warning/10 text-warning",
  seo: "bg-accent/10 text-accent",
  rd: "bg-info/10 text-info",
  inbound: "bg-success/10 text-success",
  sites: "bg-primary/10 text-primary",
  social: "bg-warning/10 text-warning",
};

export const statusEmpresaLabels: Record<StatusEmpresa, string> = {
  prospect: "Prospect",
  onboarding: "Onboarding",
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};

export const statusEmpresaVariant: Record<StatusEmpresa, "secondary" | "info" | "success" | "warning" | "destructive"> = {
  prospect: "secondary",
  onboarding: "info",
  ativo: "success",
  pausado: "warning",
  encerrado: "destructive",
};

export const statusProjetoLabels: Record<StatusProjeto, string> = {
  planejado: "Planejado",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
  encerrado: "Encerrado",
};

export const statusProjetoVariant: Record<StatusProjeto, "secondary" | "info" | "success" | "warning" | "destructive"> = {
  planejado: "secondary",
  em_andamento: "info",
  pausado: "warning",
  concluido: "success",
  encerrado: "destructive",
};

export const estadosBR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function formatCNPJ(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Validação real de CNPJ (dígitos verificadores), não só formato. */
export function cnpjValido(valor: string): boolean {
  const cnpj = valor.replace(/\D/g, "");
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digito = (ate: number) => {
    const pesos = ate === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(cnpj[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(12) === Number(cnpj[12]) && digito(13) === Number(cnpj[13]);
}

export function formatCEP(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

/* ---------------- Tarefas ---------------- */

import type { PrioridadeTarefa, StatusTarefa, TipoTarefa } from "./types";

/** Quadro inicial. O time pode renomear, recolorir, reordenar e criar colunas. */
export const statusPadrao: StatusTarefa[] = [
  { id: "todo", label: "A fazer", cor: "#64748b", ordem: 0 },
  { id: "doing", label: "Fazendo", cor: "#3b82f6", ordem: 1, em_andamento: true },
  { id: "review", label: "Revisão", cor: "#f59e0b", ordem: 2 },
  { id: "done", label: "Concluída", cor: "#10b981", ordem: 3, concluido: true },
];

/** Natureza do trabalho da agência. Também editável. */
export const tiposPadrao: TipoTarefa[] = [
  { id: "tt-design", label: "Design", cor: "#8b5cf6" },
  { id: "tt-trafego", label: "Tráfego pago", cor: "#ef4444" },
  { id: "tt-planejamento", label: "Planejamento", cor: "#3b82f6" },
  { id: "tt-landing", label: "Landing page", cor: "#10b981" },
  { id: "tt-email", label: "E-mail", cor: "#f59e0b" },
  { id: "tt-automacao", label: "Automação RD", cor: "#06b6d4" },
  { id: "tt-crm", label: "RD CRM", cor: "#ec4899" },
];

export const prioridadeLabels: Record<PrioridadeTarefa, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export const prioridadeVariant: Record<PrioridadeTarefa, "secondary" | "info" | "warning" | "destructive"> = {
  baixa: "secondary",
  normal: "info",
  alta: "warning",
  urgente: "destructive",
};

/* ---------------- Equipe alocada ---------------- */

import type { FuncaoEquipe } from "./types";

export const funcaoEquipeLabels: Record<FuncaoEquipe, string> = {
  cs: "Customer Success",
  midia: "Mídia paga",
  seo: "SEO / GEO",
  conteudo: "Conteúdo",
  design: "Design",
  copy: "Copy",
  gestao: "Gestão",
};

export const funcaoEquipeTom: Record<FuncaoEquipe, string> = {
  cs: "bg-primary/10 text-primary",
  midia: "bg-warning/10 text-warning",
  seo: "bg-accent/10 text-accent",
  conteudo: "bg-info/10 text-info",
  design: "bg-secondary text-secondary-foreground",
  copy: "bg-muted text-muted-foreground",
  gestao: "bg-success/10 text-success",
};

import type { Equipe, TipoNotificacao } from "./types";

/* ---------------- equipes ---------------- */

/**
 * Times fixos da agência. Começam sem gente: quem monta é o próprio usuário,
 * em Painel Admin → Equipes.
 */
export const equipesPadrao: Equipe[] = [
  { id: "eq-trafego", nome: "Tráfego", cor: "#ef4444", membros: [] },
  { id: "eq-conteudo", nome: "Conteúdo", cor: "#3b82f6", membros: [] },
  { id: "eq-seo", nome: "SEO / GEO", cor: "#10b981", membros: [] },
  { id: "eq-design", nome: "Design", cor: "#8b5cf6", membros: [] },
  { id: "eq-cs", nome: "CS", cor: "#f59e0b", membros: [] },
];

/* ---------------- notificações ---------------- */

export const notificacaoLabels: Record<TipoNotificacao, string> = {
  nova_tarefa: "Nova tarefa",
  comentario: "Novo comentário",
  mencao: "Menção a você",
  mudanca_status: "Mudança de situação",
  mudanca_responsavel: "Mudança de responsável",
  prazo_proximo: "Prazo chegando",
  atrasada: "Tarefa atrasada",
  concluida: "Tarefa concluída",
  subtarefa: "Item de checklist",
  anexo: "Novo anexo",
  resumo_diario: "Resumo do dia",
  observando: "Passou a acompanhar",
};

/** Explica o que dispara cada aviso — usado na tela de preferências. */
export const notificacaoAjuda: Record<TipoNotificacao, string> = {
  nova_tarefa: "Alguém criou uma tarefa com você como responsável.",
  comentario: "Comentário numa tarefa que você acompanha.",
  mencao: "Alguém escreveu @seu nome num comentário.",
  mudanca_status: "Uma tarefa sua mudou de coluna.",
  mudanca_responsavel: "Você entrou ou saiu como responsável.",
  prazo_proximo: "Falta um dia para o prazo de uma tarefa sua.",
  atrasada: "Uma tarefa sua passou do prazo.",
  concluida: "Uma tarefa que você acompanha foi entregue.",
  subtarefa: "Item do checklist marcado ou adicionado.",
  anexo: "Arquivo novo numa tarefa que você acompanha.",
  resumo_diario: "Um apanhado do dia com o que está aberto e atrasado.",
  observando: "Você foi adicionado como quem acompanha uma tarefa.",
};

import type {
  CategoriaInbound, EtapaFunilConteudo, StatusItemPlano, StatusPauta, TipoNoFluxo,
} from "./types";

/* ---------------- inbound ---------------- */

export const statusItemPlanoLabels: Record<StatusItemPlano, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

export const statusItemPlanoVariant: Record<StatusItemPlano, "outline" | "warning" | "success"> = {
  nao_iniciado: "outline",
  em_andamento: "warning",
  finalizado: "success",
};

export const statusPautaLabels: Record<StatusPauta, string> = {
  ideia: "Ideia",
  em_producao: "Em produção",
  em_validacao: "Em validação",
  aprovada: "Aprovada",
  publicada: "Publicada",
  arquivada: "Arquivada",
};

export const statusPautaVariant: Record<StatusPauta, "outline" | "warning" | "info" | "success" | "secondary"> = {
  ideia: "outline",
  em_producao: "warning",
  em_validacao: "info",
  aprovada: "info",
  publicada: "success",
  arquivada: "secondary",
};

export const etapaFunilLabels: Record<EtapaFunilConteudo, string> = {
  topo: "Topo",
  meio: "Meio",
  fundo: "Fundo",
};

/** Tipos de material já usados pela agência; o campo aceita outros. */
export const tiposMaterial = [
  "E-book", "Blogpost", "Landing page", "Quiz", "Webinar", "Infográfico",
  "Checklist", "Estudo de caso", "Newsletter", "Roteiro de vídeo",
  "Relatório", "Workshop", "Ferramenta", "Outro",
];

export const categoriasInbound: CategoriaInbound[] = [
  "Estratégia", "Conteúdo", "Material Rico", "Nutrição", "Conversão",
  "Automação", "Mídia", "Criação", "Análise", "Operação",
];

/** Cor por categoria do catálogo, para o time bater o olho e reconhecer. */
export const categoriaInboundTom: Record<CategoriaInbound, string> = {
  "Estratégia": "bg-primary/10 text-primary",
  "Conteúdo": "bg-info/10 text-info",
  "Material Rico": "bg-accent/10 text-accent",
  "Nutrição": "bg-success/10 text-success",
  "Conversão": "bg-warning/10 text-warning",
  "Automação": "bg-info/10 text-info",
  "Mídia": "bg-destructive/10 text-destructive",
  "Criação": "bg-accent/10 text-accent",
  "Análise": "bg-primary/10 text-primary",
  "Operação": "bg-muted text-muted-foreground",
};

export const tipoNoFluxoLabels: Record<TipoNoFluxo, string> = {
  entrada: "Entrada",
  automacao: "Automação",
  condicao: "Condição",
  conversao: "Conversão",
};

/** Blocos que montam uma régua de nutrição. */
export const blocosFluxo: { chave: string; rotulo: string; tipo: TipoNoFluxo }[] = [
  { chave: "campanha", rotulo: "Campanha", tipo: "entrada" },
  { chave: "entrada_fluxo", rotulo: "Entrada do fluxo", tipo: "entrada" },
  { chave: "landing_page", rotulo: "Landing page", tipo: "conversao" },
  { chave: "formulario", rotulo: "Formulário", tipo: "conversao" },
  { chave: "lead", rotulo: "Lead", tipo: "conversao" },
  { chave: "enviar_email", rotulo: "Enviar e-mail", tipo: "automacao" },
  { chave: "espera", rotulo: "Espera", tipo: "automacao" },
  { chave: "whatsapp", rotulo: "WhatsApp / SMS", tipo: "automacao" },
  { chave: "condicao_resposta_form", rotulo: "Respondeu o formulário?", tipo: "condicao" },
  { chave: "lead_scoring", rotulo: "Lead scoring", tipo: "condicao" },
];

/** Pontos viram dinheiro só quando alguém soma — formata o número do jeito certo. */
export const formatPontos = (n: number) => n.toLocaleString("pt-BR");

/** Mês AAAA-MM-01 no formato que a pessoa lê. */
export function mesLegivel(mes: string): string {
  const d = new Date(`${mes.slice(0, 7)}-01T12:00:00`);
  const texto = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Mês corrente no formato usado pelo módulo. */
export const mesAtual = () => `${new Date().toISOString().slice(0, 7)}-01`;

import type {
  FaseSite, TipoSite, RedeSocial, StatusPublicacao, FormatoPublicacao,
} from "./types";

/* ---------------- sites e hotsites ---------------- */

export const tipoSiteLabels: Record<TipoSite, string> = {
  site: "Site institucional",
  hotsite: "Hotsite",
  landing: "Landing page",
  blog: "Blog",
  loja: "Loja virtual",
};

export const faseSiteLabels: Record<FaseSite, string> = {
  briefing: "Briefing",
  arquitetura: "Arquitetura",
  design: "Design",
  desenvolvimento: "Desenvolvimento",
  revisao: "Revisão",
  homologacao: "Homologação",
  publicado: "Publicado",
  manutencao: "Manutenção",
};

export const faseSiteVariant: Record<FaseSite, "outline" | "info" | "warning" | "success"> = {
  briefing: "outline",
  arquitetura: "outline",
  design: "info",
  desenvolvimento: "info",
  revisao: "warning",
  homologacao: "warning",
  publicado: "success",
  manutencao: "success",
};

/** A ordem em que as fases acontecem — usada para desenhar o andamento. */
export const ordemFasesSite: FaseSite[] = [
  "briefing", "arquitetura", "design", "desenvolvimento",
  "revisao", "homologacao", "publicado", "manutencao",
];

/* ---------------- redes sociais ---------------- */

export const redeLabels: Record<RedeSocial, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  pinterest: "Pinterest",
};

/** Cor de cada rede, para o time reconhecer sem ler. */
export const redeTom: Record<RedeSocial, string> = {
  instagram: "bg-destructive/10 text-destructive",
  facebook: "bg-primary/10 text-primary",
  linkedin: "bg-info/10 text-info",
  tiktok: "bg-foreground/10 text-foreground",
  youtube: "bg-destructive/10 text-destructive",
  x: "bg-foreground/10 text-foreground",
  pinterest: "bg-destructive/10 text-destructive",
};

export const redes = Object.keys(redeLabels) as RedeSocial[];

export const formatoLabels: Record<FormatoPublicacao, string> = {
  feed: "Feed",
  carrossel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
  video: "Vídeo",
  artigo: "Artigo",
  anuncio: "Anúncio",
};

export const statusPublicacaoLabels: Record<StatusPublicacao, string> = {
  ideia: "Ideia",
  producao: "Em produção",
  aprovacao: "Em aprovação",
  agendado: "Agendado",
  publicado: "Publicado",
  cancelado: "Cancelado",
};

export const statusPublicacaoVariant: Record<
  StatusPublicacao, "outline" | "warning" | "info" | "success" | "secondary"
> = {
  ideia: "outline",
  producao: "warning",
  aprovacao: "info",
  agendado: "info",
  publicado: "success",
  cancelado: "secondary",
};

/** Seguidores em formato curto: 12.4 mil em vez de 12400. */
export function seguidoresLegivel(n: number | null): string {
  if (n == null) return "—";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".", ",")} mil`;
  return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mi`;
}
