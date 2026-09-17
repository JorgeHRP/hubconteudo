import type { AppRole } from "./types";

/**
 * Camada de IA da Central Interna.
 *
 * Hoje responde localmente, a partir da base de conhecimento abaixo e do contexto
 * que a tela envia. O ponto de troca é `consultarIA`: quando a edge function
 * `assistente-ia` existir, o corpo dessa função vira um fetch e todo o resto —
 * telas, histórico de conversa, sugestões — continua igual.
 */

export interface ContextoIA {
  /** Rota atual, para a IA saber onde a pessoa está. */
  rota: string;
  /** Nome da tela, em português. */
  tela: string;
  papel: AppRole | null;
  /** Dados que a tela quer que a IA considere (cliente, carteira, período…). */
  dados?: Record<string, unknown>;
}

export interface RespostaIA {
  resposta: string;
  sugestoes: string[];
  /** Identifica o motor usado — aparece na interface para não confundir o usuário. */
  motor: string;
}

interface Verbete {
  chaves: string[];
  resposta: string;
  sugestoes?: string[];
}

const base: Verbete[] = [
  {
    chaves: ["churn", "termômetro", "termometro", "flag", "risco"],
    resposta:
      "O termômetro de churn tem 5 perguntas, cada uma valendo de 0 a 4 pontos — no máximo 20. " +
      "A nota vira flag assim: 70% ou mais (14+ pontos) fica verde, entre 45% e 69% (9 a 13) fica " +
      "amarelo, abaixo disso fica vermelho. A avaliação é mensal e, ao salvar, atualiza a flag do " +
      "cliente automaticamente. Você abre por Painel de CS → cliente → Avaliar risco.",
    sugestoes: ["Quais clientes estão em risco?", "Como registro um alerta na timeline?"],
  },
  {
    chaves: ["colaborador", "cadastrar pessoa", "novo funcionário", "funcionario", "contratar"],
    resposta:
      "O cadastro de colaborador fica em Colaboradores → Novo colaborador, e cria a pessoa e o " +
      "acesso ao sistema de uma vez. São obrigatórios: nome, CPF, telefone, contato de emergência, " +
      "data de admissão e e-mail corporativo. Na mesma tela você escolhe o papel (master, gerente " +
      "ou funcionário) e marca quais painéis a pessoa acessa.",
    sugestoes: ["Qual a diferença entre gerente e funcionário?", "Como libero o painel de CS para alguém?"],
  },
  {
    chaves: ["papel", "permiss", "acesso", "gerente", "master", "libera"],
    resposta:
      "São três papéis. Master faz tudo, inclusive alterar papéis, permissões e integrações. " +
      "Gerente publica conteúdo do hub e trata solicitações. Funcionário usa o hub e vê os próprios " +
      "documentos. Além do papel, cada painel é liberado individualmente — Colaboradores, CS, Vendas, " +
      "Financeiro, Aprovar Viagens e os painéis externos. Isso se ajusta no Painel Admin, no ícone de escudo.",
    sugestoes: ["Como cadastro um colaborador?", "Quem pode aprovar relatório de viagem?"],
  },
  {
    chaves: ["viagem", "viagens", "reembolso", "despesa", "comprovante"],
    resposta:
      "O fluxo é: você cria o relatório em Relatório de Viagens, lança cada despesa com categoria, " +
      "data, valor e comprovante, e envia. Sem nenhuma despesa lançada, o botão de enviar fica " +
      "bloqueado. Quem tem a permissão de aprovar analisa, aprova ou reprova com motivo. " +
      "Reprovado volta a ser editável. Depois de aprovado, o financeiro marca como reembolsado.",
    sugestoes: ["Onde vejo os reembolsos a pagar?", "Posso editar um relatório já enviado?"],
  },
  {
    chaves: ["contracheque", "holerite", "pagamento", "salário", "salario"],
    resposta:
      "Contracheques ficam em uma área restrita: cada pessoa vê só os próprios. Quem tem o painel " +
      "de Colaboradores envia os documentos vinculados a cada colaborador, informando a competência " +
      "(mês de referência). Há também o envio em lote, para subir o mês inteiro de uma vez.",
    sugestoes: ["Como subo os contracheques do mês?", "Quem consegue ver meus documentos?"],
  },
  {
    chaves: ["histórico", "historico", "jornada", "linha do tempo", "timeline"],
    resposta:
      "A aba Histórico da ficha do cliente junta tudo em uma linha do tempo: notas do time, reuniões " +
      "do Read.ai, relatórios e documentos, avaliações de churn, mudanças de flag, análises por IA e " +
      "as entregas concluídas no ClickUp. Dá para filtrar por tipo e por período, e esconder o que é " +
      "menos relevante para ver só os marcos.",
    sugestoes: ["Como vejo a produção do mês para um cliente?", "De onde vêm as atas de reunião?"],
  },
  {
    chaves: ["clickup", "tarefa", "produção", "producao", "entrega"],
    resposta:
      "O ClickUp alimenta duas coisas: a lista de tarefas do cliente (pendentes, atrasadas e " +
      "entregues) e o gráfico de produção mensal na aba Histórico. A ligação é feita pelo campo " +
      "ClickUp list id no cadastro do cliente. A sincronização precisa da integração ligada no Painel Admin.",
    sugestoes: ["Como conecto o ClickUp?", "O que aparece no histórico do cliente?"],
  },
  {
    chaves: ["read", "read.ai", "reunião", "reuniao", "ata", "gravação", "gravacao"],
    resposta:
      "As reuniões ficam na aba Reuniões da ficha do cliente, com data, duração, participantes, " +
      "resumo e o link da gravação. Com a integração do Read.ai ligada, elas entram sozinhas por " +
      "workspace do cliente; sem ela, dá para registrar manualmente. Toda reunião também aparece " +
      "na linha do tempo do histórico.",
    sugestoes: ["Como conecto o Read.ai?", "Onde vejo o histórico completo do cliente?"],
  },
  {
    chaves: ["vendas", "funil", "rd station", "rd", "crm", "negócio", "negocio"],
    resposta:
      "O painel de Resultados de Vendas mostra pipeline aberto, receita ganha, negócios em aberto e " +
      "taxa de conversão, com o funil por etapa e a receita por unidade de negócio. Os dados vêm do " +
      "RD Station CRM pela integração. Para os sócios e o time comercial verem, basta liberar o " +
      "painel Vendas para cada um no Painel Admin.",
    sugestoes: ["Como conecto o RD Station?", "Quem consegue ver o painel de vendas?"],
  },
  {
    chaves: ["integra", "conectar", "sincroniz", "conta azul", "sólides", "solides", "alfaix"],
    resposta:
      "As integrações ficam em Painel Admin → Integrações. Hoje estão mapeadas: ClickUp (tarefas e " +
      "produção), Sólides (ponto), Conta Azul e planilha Alfaix (financeiro), RD Station (vendas), " +
      "Read.ai (reuniões) e Google Drive (peças). Cada uma mostra qual painel alimenta e o nome do " +
      "segredo que precisa ser cadastrado no Supabase.",
    sugestoes: ["O que falta para o financeiro funcionar?", "Como ligo o ClickUp?"],
  },
  {
    chaves: ["financeiro", "receita", "despesa", "conta azul", "fluxo de caixa"],
    resposta:
      "O Dashboard Financeiro reúne receita, despesa e resultado do mês, mais a fila de reembolsos " +
      "de viagem (aguardando aprovação e aprovados a pagar). Receita e despesa dependem da integração " +
      "com o Conta Azul; a planilha Alfaix entra como fonte complementar de controle.",
    sugestoes: ["Como aprovo um reembolso?", "Como conecto o Conta Azul?"],
  },
  {
    chaves: ["solicita", "chamado", "ti", "rh", "facilities"],
    resposta:
      "Solicitações são os chamados internos: você escolhe a categoria (RH, TI, Financeiro, " +
      "Facilities ou Outro), descreve o pedido e acompanha o status — aberta, em andamento, " +
      "concluída. Quem é gerente ou master vê todas e muda o status.",
    sugestoes: ["Quem trata as solicitações?", "Como abro um chamado?"],
  },
  {
    chaves: ["feed", "mural", "comunicado", "aviso", "publicar"],
    resposta:
      "O Feed é o mural interno. Qualquer pessoa publica, escolhendo o tipo: comunicado, evento, " +
      "novidade ou geral. Gerentes e o master podem fixar um aviso — o que é fixado aparece também " +
      "na tela de início, para todo mundo ver.",
    sugestoes: ["Como fixo um aviso?", "Onde vejo os avisos importantes?"],
  },
];

const semResposta =
  "Ainda não sei responder isso. Posso ajudar com churn e carteira de clientes, cadastro de " +
  "colaboradores, papéis e permissões, relatórios de viagem, contracheques, histórico do cliente, " +
  "integrações, vendas e financeiro.";

const sugestoesPadrao = [
  "Como funciona o termômetro de churn?",
  "Como cadastro um colaborador?",
  "Como envio um relatório de viagem?",
];

function pontuar(pergunta: string, verbete: Verbete): number {
  const texto = pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return verbete.chaves.reduce((soma, chave) => {
    const c = chave.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return texto.includes(c) ? soma + c.length : soma;
  }, 0);
}

const MOTOR_LOCAL = "assistente local";

export async function consultarIA(
  pergunta: string,
  contexto: ContextoIA
): Promise<RespostaIA> {
  await new Promise((r) => setTimeout(r, 650));

  // ⬇️ Ponto de troca: substituir por fetch na edge function `assistente-ia`,
  // enviando { pergunta, contexto } e devolvendo { resposta, sugestoes, motor }.

  const ranking = base
    .map((v) => ({ v, nota: pontuar(pergunta, v) }))
    .filter((x) => x.nota > 0)
    .sort((a, b) => b.nota - a.nota);

  if (ranking.length === 0) {
    return {
      resposta: `${semResposta}\n\nVocê está em ${contexto.tela}.`,
      sugestoes: sugestoesPadrao,
      motor: MOTOR_LOCAL,
    };
  }

  const melhor = ranking[0].v;
  return {
    resposta: melhor.resposta,
    sugestoes: melhor.sugestoes ?? sugestoesPadrao,
    motor: MOTOR_LOCAL,
  };
}

/** Perguntas sugeridas ao abrir o assistente, conforme a tela. */
export function sugestoesDaTela(rota: string): string[] {
  if (rota.startsWith("/cs")) {
    return [
      "Como funciona o termômetro de churn?",
      "O que aparece no histórico do cliente?",
      "De onde vêm as atas de reunião?",
    ];
  }
  if (rota.startsWith("/viagens") || rota.startsWith("/financeiro")) {
    return [
      "Como envio um relatório de viagem?",
      "Quem aprova os reembolsos?",
      "Como conecto o Conta Azul?",
    ];
  }
  if (rota.startsWith("/colaboradores") || rota.startsWith("/admin")) {
    return [
      "Como cadastro um colaborador?",
      "Qual a diferença entre os papéis?",
      "Como libero um painel para alguém?",
    ];
  }
  if (rota.startsWith("/vendas")) {
    return [
      "De onde vêm os dados de vendas?",
      "Quem consegue ver o painel de vendas?",
      "Como conecto o RD Station?",
    ];
  }
  return sugestoesPadrao;
}
