import type { ChurnFlag, EtapaFunil, ProdutoCliente, NotaTipo, RecursoTipo } from "./types";

export const produtoLabels: Record<ProdutoCliente, string> = {
  agencia_educacional: "Agência Educacional",
  totvs: "TOTVS",
  rd_conteudo: "RD Conteúdo",
  rd_tbc: "RD TBC",
  martech: "Martech",
};

export const flagLabels: Record<ChurnFlag, string> = {
  green: "Saudável",
  yellow: "Atenção",
  red: "Risco",
};

export const flagBadgeVariant: Record<ChurnFlag, "success" | "warning" | "destructive"> = {
  green: "success",
  yellow: "warning",
  red: "destructive",
};

export const etapasFunil: { valor: EtapaFunil; label: string }[] = [
  { valor: "prospeccao", label: "Prospecção" },
  { valor: "qualificacao", label: "Qualificação" },
  { valor: "proposta", label: "Proposta" },
  { valor: "negociacao", label: "Negociação" },
  { valor: "ganho", label: "Ganho" },
  { valor: "perdido", label: "Perdido" },
];

export const notaTipoLabels: Record<NotaTipo, string> = {
  reuniao: "Reunião",
  alerta: "Alerta",
  entrega: "Entrega",
  geral: "Geral",
};

export const recursoTipoLabels: Record<RecursoTipo, string> = {
  relatorio: "Relatório",
  ata: "Ata de reunião",
  peca: "Peça",
  contrato: "Contrato",
  link: "Link",
};

/** Termômetro de churn — 5 perguntas, 0 a 4 pontos cada, máximo 20. */
export const perguntasChurn = [
  {
    id: "engajamento",
    pergunta: "Como está o engajamento do cliente nas reuniões e trocas?",
    opcoes: [
      "Sumiu / não responde",
      "Responde com muito atraso",
      "Participa quando cobrado",
      "Participa com regularidade",
      "Muito engajado, procura a gente",
    ],
  },
  {
    id: "resultados",
    pergunta: "Os resultados entregues estão atingindo a meta combinada?",
    opcoes: [
      "Muito abaixo da meta",
      "Abaixo da meta",
      "Perto da meta",
      "Dentro da meta",
      "Acima da meta",
    ],
  },
  {
    id: "decisor",
    pergunta: "Como está o relacionamento com o decisor?",
    opcoes: [
      "Sem acesso ao decisor",
      "Acesso raro e formal",
      "Acesso ocasional",
      "Bom relacionamento",
      "Relacionamento de parceria",
    ],
  },
  {
    id: "reclamacoes",
    pergunta: "Houve reclamações ou atritos no período?",
    opcoes: [
      "Reclamação grave em aberto",
      "Reclamações recorrentes",
      "Uma reclamação pontual",
      "Nenhuma reclamação relevante",
      "Elogios registrados",
    ],
  },
  {
    id: "renovacao",
    pergunta: "Qual a percepção sobre a renovação do contrato?",
    opcoes: [
      "Já sinalizou saída",
      "Demonstra dúvida forte",
      "Neutro",
      "Deve renovar",
      "Já confirmou renovação / quer expandir",
    ],
  },
];

export const PONTUACAO_MAXIMA_CHURN = perguntasChurn.length * 4;

export function calcularFlag(pontuacao: number): ChurnFlag {
  const pct = (pontuacao / PONTUACAO_MAXIMA_CHURN) * 100;
  if (pct >= 70) return "green";
  if (pct >= 45) return "yellow";
  return "red";
}

export function formatCurrency(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR");
}

/* ---------------- Relatório de viagens ---------------- */

export const viagemStatusLabels = {
  rascunho: "Rascunho",
  enviado: "Aguardando aprovação",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  pago: "Reembolsado",
} as const;

export const viagemStatusVariant = {
  rascunho: "secondary",
  enviado: "warning",
  aprovado: "success",
  reprovado: "destructive",
  pago: "info",
} as const;

export const despesaCategoriaLabels = {
  transporte: "Transporte",
  hospedagem: "Hospedagem",
  alimentacao: "Alimentação",
  combustivel: "Combustível",
  estacionamento: "Estacionamento",
  outro: "Outro",
} as const;
