export type AppRole = "master" | "gerente" | "funcionario";

/** Painéis liberados por usuário. O hub básico é visível para todo mundo. */
export type AppModulo =
  | "clientes"           // gestão de clientes: empresas, contatos e projetos
  | "tarefas"            // quadro de tarefas da agência
  | "colaboradores"      // cadastrar e gerir pessoas (funções de RH)
  | "cs"                 // painel de Customer Success
  | "vendas"             // resultados comerciais
  | "financeiro"         // dashboard financeiro
  | "viagens_aprovacao"  // aprovar relatórios de viagem
  | "trafego"      // painel externo
  | "seo_geo"            // painel externo
  | "projetos_rd"
  | "inbound"           // inbound: catálogo em pontos, plano do mês, pautas e fluxos
  | "sites"             // desenvolvimento de sites e hotsites
  | "social"            // gestão de redes sociais;       // painel externo

export type ChurnFlag = "green" | "yellow" | "red";

export type ProdutoCliente =
  | "agencia_educacional"
  | "totvs"
  | "rd_conteudo"
  | "rd_tbc"
  | "martech";

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  cpf: string | null;
  cargo: string | null;
  departamento: string | null;
  telefone: string | null;
  contato_emergencia_nome: string | null;
  contato_emergencia_telefone: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  data_admissao: string | null;
  ativo: boolean;
  convite_enviado_em: string | null;
}

export type PostTipo = "comunicado" | "evento" | "novidade" | "geral";

export interface Post {
  id: string;
  autor_id: string;
  conteudo: string;
  tipo: PostTipo;
  fixado: boolean;
  imagem_url: string | null;
  created_at: string;
  curtidas: string[];
  comentarios: Comentario[];
}

export interface Comentario {
  id: string;
  post_id: string;
  autor_id: string;
  conteudo: string;
  created_at: string;
}

export type EventoTipo = "evento" | "aniversario" | "feriado" | "treinamento" | "comunicado";

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  tipo: EventoTipo;
  descricao: string | null;
  criado_por: string | null;
}

export type SolicitacaoStatus = "aberta" | "em_andamento" | "concluida";

export interface Solicitacao {
  id: string;
  solicitante_id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  status: SolicitacaoStatus;
  created_at: string;
  updated_at: string;
}

export type DocumentoCategoria =
  | "contracheque"
  | "documento_pessoal"
  | "repositorio"
  | "ativo_marca"
  | "manual"
  | "politica"
  | "outro";

export interface Documento {
  id: string;
  /** null = documento institucional, visível para todos. Preenchido = pessoal. */
  user_id: string | null;
  nome: string;
  descricao: string | null;
  categoria: DocumentoCategoria;
  competencia: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type NivelCurso = "Iniciante" | "Intermediário" | "Avançado";

/**
 * Trilha de conhecimento: um conjunto ordenado de cursos. Curso sem trilha é
 * avulso e aparece sozinho na lista.
 */
export interface Trilha {
  id: string;
  titulo: string;
  descricao: string | null;
  /** Capa do card: URL externa ou data URL de um arquivo enviado. */
  capa: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Curso {
  id: string;
  /** Nulo = treinamento avulso. */
  trilha_id: string | null;
  titulo: string;
  professor: string | null;
  resumo: string | null;
  /** Link do YouTube, Vimeo ou outra plataforma; é convertido para incorporação. */
  video_url: string | null;
  carga_horaria: number;
  nivel: NivelCurso | null;
  capa: string | null;
  ordem: number;
  ativo: boolean;
  /** Concluir exige passar no questionário. */
  exige_questionario: boolean;
  /** Percentual de acerto necessário para aprovar. */
  nota_minima: number;
  emite_certificado: boolean;
  created_at: string;
}

export interface PerguntaCurso {
  id: string;
  curso_id: string;
  enunciado: string;
  opcoes: string[];
  /** Índice da alternativa correta dentro de `opcoes`. */
  correta: number;
  ordem: number;
}

export interface ProgressoCurso {
  curso_id: string;
  user_id: string;
  concluido: boolean;
  concluido_em: string | null;
  /** Percentual de acerto na última tentativa; nulo quando não há questionário. */
  nota: number | null;
  tentativas: number;
}

export interface Certificado {
  id: string;
  /** Código de verificação impresso no documento. */
  codigo: string;
  user_id: string;
  curso_id: string | null;
  trilha_id: string | null;
  /** Congelados na emissão: renomear o curso depois não reescreve o certificado. */
  titulo: string;
  carga_horaria: number;
  emitido_em: string;
}

/**
 * Modelo único de certificado. Só os dados da pessoa, do curso e da carga horária
 * mudam de um documento para outro.
 */
export interface ModeloCertificado {
  titulo: string;
  /** Aceita {nome}, {curso} e {horas}. */
  texto: string;
  assinante: string;
  cargo_assinante: string;
  cidade: string;
}

/* ---------------- Relatório de viagens ---------------- */

export type ViagemStatus = "rascunho" | "enviado" | "aprovado" | "reprovado" | "pago";

export type DespesaCategoria =
  | "transporte"
  | "hospedagem"
  | "alimentacao"
  | "combustivel"
  | "estacionamento"
  | "outro";

export interface DespesaViagem {
  id: string;
  relatorio_id: string;
  categoria: DespesaCategoria;
  descricao: string;
  data: string;
  valor: number;
  comprovante_nome: string | null;
  comprovante_url: string | null;
}

export interface RelatorioViagem {
  id: string;
  colaborador_id: string;
  titulo: string;
  destino: string;
  motivo: string;
  data_inicio: string;
  data_fim: string;
  status: ViagemStatus;
  observacao_financeiro: string | null;
  avaliado_por: string | null;
  avaliado_em: string | null;
  created_at: string;
  despesas: DespesaViagem[];
}

/* ---------------- Gestão de Clientes ---------------- */

export type TipoProjeto =
  | "cs" | "trafego" | "seo" | "rd" | "inbound" | "sites" | "social";

export type StatusEmpresa = "prospect" | "onboarding" | "ativo" | "pausado" | "encerrado";

export interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  segmento: string | null;
  site: string | null;
  /** Endereço */
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  status: StatusEmpresa;
  responsavel_id: string | null;
  observacoes: string | null;
  created_at: string;
  ativo: boolean;
}

/** Empresa com os campos de dossiê que vieram do Portal MarTech. */
export interface EmpresaDossie extends Empresa {
  /** Flag definida direto na visão geral, quando a conta ainda não tem projeto. */
  flag_conta?: ChurnFlag;
  /** Integrações desta conta. */
  clickup_list_id?: string | null;
  drive_folder_url?: string | null;
  read_workspace_url?: string | null;
  rd_deal_id?: string | null;
  instagram: string | null;
  linkedin: string | null;
  regiao: string | null;
  elevator_pitch: string | null;
  contrato_tipo: string | null;
  contrato_vigencia: string | null;
  servicos_contratados: string | null;
  entrada: string | null;
}

export interface PersonaCliente {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string | null;
  faixa_etaria: string | null;
  segmento: string | null;
  objetivos: string | null;
  dores: string | null;
  objecoes: string | null;
  gatilhos: string | null;
  canais: string | null;
  tipo_conteudo: string | null;
  /** Estágio de consciência: topo, meio ou fundo de funil. */
  consciencia: string | null;
  conteudo_ideal: string | null;
}

export interface ProdutoEmpresa {
  id: string;
  empresa_id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  publico: string | null;
  ticket_medio: string | null;
  meta_comercial: string | null;
  diferenciais: string | null;
  dores_resolvidas: string | null;
  regiao: string | null;
  status: string | null;
}

export interface ConcorrenteEmpresa {
  id: string;
  empresa_id: string;
  nome: string;
  site: string | null;
  instagram: string | null;
  segmento: string | null;
  regiao: string | null;
  forcas: string | null;
  fraquezas: string | null;
  diferenciais: string | null;
  posicionamento: string | null;
}

export interface ReuniaoEmpresa {
  id: string;
  empresa_id: string;
  data: string | null;
  tema: string | null;
  participantes: string | null;
  responsavel: string | null;
  status: string | null;
  proximos_passos: string | null;
  ata: string | null;
}

export interface CaseEmpresa {
  id: string;
  empresa_id: string;
  titulo: string;
  contexto: string | null;
  resultado: string | null;
  indicadores: string | null;
  link: string | null;
  data: string | null;
}

export interface EventoTimeline {
  id: string;
  empresa_id: string;
  data: string | null;
  titulo: string | null;
  conteudo: string | null;
}

export interface DocumentoEmpresa {
  id: string;
  empresa_id: string;
  nome: string | null;
  tipo: string | null;
  data: string | null;
  link: string | null;
}

export interface EscopoContrato {
  id: string;
  empresa_id: string;
  escopo: string | null;
  modelo_cobranca: string | null;
  observacoes: string | null;
  inicio: string | null;
}

/* ---------------- Implantações RD ---------------- */

export interface DadosFerramenta {
  /** Roteiro de fases e itens desta ferramenta neste cliente. */
  fases: unknown[];
  responsavel_id: string | null;
  escopo: string;
  briefing: Record<string, string>;
}

export interface ImplantacaoRD {
  id: string;
  empresa_id: string;
  /** Ferramentas contratadas: rd_crm, rd_marketing, rd_conversas, shopify. */
  ferramentas: string[];
  /** Dados por ferramenta, com o roteiro próprio de cada uma. */
  dados: Record<string, DadosFerramenta>;
  criado_por: string | null;
  created_at: string;
  ativo: boolean;
}

export interface NotaImplantacao {
  id: string;
  implantacao_id: string;
  autor_id: string | null;
  autor_nome: string;
  conteudo: string;
  link_reuniao: string | null;
  anexo_nome: string | null;
  created_at: string;
}

/* ---------------- Tarefas (ClickUp interno) ---------------- */

/** Status configurável do quadro — o time define os seus. */
export interface StatusTarefa {
  id: string;
  label: string;
  cor: string;
  ordem: number;
  /** Marca a coluna de conclusão: alimenta progresso e indicadores. */
  concluido?: boolean;
  /** Marca a coluna de trabalho em curso: usada pelo cronômetro. */
  em_andamento?: boolean;
}

/** Natureza do trabalho: design, tráfego, automação… */
export interface TipoTarefa {
  id: string;
  label: string;
  cor: string;
}

export interface AnexoTarefa {
  id: string;
  nome: string;
  tamanho: number;
  tipo: string;
  caminho: string;
}

export interface LinkTarefa {
  id: string;
  rotulo: string;
  url: string;
}

export interface ComentarioTarefa {
  id: string;
  tarefa_id: string;
  autor_id: string | null;
  autor_nome: string;
  texto: string;
  /** user_ids citados com @ no texto. */
  mencoes: string[];
  created_at: string;
}

/** Cada período cronometrado numa tarefa. */
export interface RegistroTempo {
  id: string;
  tarefa_id: string;
  user_id: string;
  inicio: string;
  fim: string | null;
  segundos: number | null;
  origem: "cronometro" | "manual" | "ajuste";
}
export type PrioridadeTarefa = "baixa" | "normal" | "alta" | "urgente";

export type AprovacaoCliente = "aguardando" | "aprovada" | "ajuste_pedido";

export interface SubtarefaItem {
  titulo: string;
  feita: boolean;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  empresa_id: string | null;
  projeto_id: string | null;
  /** Uma tarefa pode ter mais de um dono. */
  responsaveis: string[];
  /** Quem acompanha sem executar — recebe as notificações. */
  observadores: string[];
  /** Referencia um status configurável. */
  status_id: string;
  tipo_id: string | null;
  /** Tarefa mãe, quando esta é uma subtarefa. */
  parent_id: string | null;
  prioridade: PrioridadeTarefa;
  prazo: string | null;
  estimativa_horas: number | null;
  etiquetas: string[];
  anexos: AnexoTarefa[];
  links: LinkTarefa[];
  subtarefas: SubtarefaItem[];
  /** De onde a tarefa veio: criada à mão ou gerada pelo onboarding. */
  origem: "manual" | "onboarding";
  fase: string | null;
  /** Quem executa: a agência, o cliente ou o comercial. */
  lado: "nos" | "cliente" | "comercial";
  /** Liberada no painel do cliente. */
  compartilhada: boolean;
  /** Só existe quando a tarefa foi compartilhada e espera resposta do cliente. */
  aprovacao: AprovacaoCliente | null;
  comentario_cliente: string | null;
  respondida_em: string | null;
  criado_por: string | null;
  created_at: string;
  concluida_em: string | null;
}

/** Acesso do cliente ao painel dele, por link exclusivo. */
export interface AcessoCliente {
  id: string;
  empresa_id: string;
  token: string;
  criado_por: string | null;
  created_at: string;
  ultimo_acesso: string | null;
  ativo: boolean;
}

export interface NotificacaoCliente {
  id: string;
  empresa_id: string;
  tarefa_id: string;
  titulo: string;
  created_at: string;
  lida: boolean;
}

/* ---------------- sites e hotsites ---------------- */

export type TipoSite = "site" | "hotsite" | "landing" | "blog" | "loja";

export type FaseSite =
  | "briefing" | "arquitetura" | "design" | "desenvolvimento"
  | "revisao" | "homologacao" | "publicado" | "manutencao";

export interface ProjetoSite {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: TipoSite;
  plataforma: string | null;
  url_producao: string | null;
  url_homologacao: string | null;
  fase: FaseSite;
  responsavel_id: string | null;
  inicio: string | null;
  previsao_entrega: string | null;
  publicado_em: string | null;
  observacoes: string | null;
  /** Etapas da entrega; a barra de progresso sai daqui. */
  checklist: { titulo: string; feito: boolean }[];
  ativo: boolean;
  created_at: string;
}

/* ---------------- redes sociais ---------------- */

export type RedeSocial =
  | "instagram" | "facebook" | "linkedin" | "tiktok" | "youtube" | "x" | "pinterest";

export interface PerfilSocial {
  id: string;
  empresa_id: string;
  rede: RedeSocial;
  usuario: string;
  url: string | null;
  seguidores: number | null;
  /** Data da última medição de seguidores, para o número não mentir sobre estar atual. */
  medido_em: string | null;
  ativo: boolean;
}

export type StatusPublicacao =
  | "ideia" | "producao" | "aprovacao" | "agendado" | "publicado" | "cancelado";

export type FormatoPublicacao =
  | "feed" | "carrossel" | "reels" | "stories" | "video" | "artigo" | "anuncio";

export interface Publicacao {
  id: string;
  empresa_id: string;
  titulo: string;
  redes: RedeSocial[];
  formato: FormatoPublicacao;
  status: StatusPublicacao;
  data_prevista: string | null;
  publicado_em: string | null;
  legenda: string | null;
  link: string | null;
  responsavel_id: string | null;
  created_at: string;
}

/* ---------------- oportunidades de venda ---------------- */

export type RespostaOferta = "sem_resposta" | "interessado" | "recusado";

/**
 * Serviço que a agência oferece e o cliente ainda não contratou. A sugestão em si
 * é calculada (frentes que existem menos as ativas); o que fica guardado é só o
 * que o time já ofertou e no que deu.
 */
export interface OportunidadeVenda {
  id: string;
  empresa_id: string;
  tipo: TipoProjeto;
  ofertado: boolean;
  ofertado_em: string | null;
  ofertado_por: string | null;
  resposta: RespostaOferta;
  observacao: string | null;
}

/* ---------------- inbound ---------------- */

export type CategoriaInbound =
  | "Estratégia" | "Conteúdo" | "Material Rico" | "Nutrição" | "Conversão"
  | "Automação" | "Mídia" | "Criação" | "Análise" | "Operação";

/** Serviço vendável de inbound, precificado em pontos. */
export interface ItemCatalogoInbound {
  id: string;
  nome: string;
  categoria: CategoriaInbound;
  pontos: number;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

/** Quantos pontos o cliente contratou num mês. É o teto do plano daquele mês. */
export interface PontosMesInbound {
  id: string;
  empresa_id: string;
  /** Sempre o dia 1, no formato AAAA-MM-01. */
  mes: string;
  pontos_contratados: number;
  observacao: string | null;
}

export type StatusItemPlano = "nao_iniciado" | "em_andamento" | "finalizado";

/** Item do catálogo colocado no plano de um mês, com a quantidade acordada. */
export interface ItemPlanoInbound {
  id: string;
  empresa_id: string;
  mes: string;
  catalogo_id: string | null;
  titulo: string;
  /** Congelado na hora do lançamento: mudar o catálogo não reescreve o passado. */
  pontos_unitarios: number;
  quantidade: number;
  status: StatusItemPlano;
  observacao: string | null;
  created_at: string;
}

export type StatusPauta =
  | "ideia" | "em_producao" | "em_validacao" | "aprovada" | "publicada" | "arquivada";

/** Etapa do funil de conteúdo — não confundir com o funil de vendas (`EtapaFunil`). */
export type EtapaFunilConteudo = "topo" | "meio" | "fundo";

/** Pauta de conteúdo: o calendário editorial do cliente. */
export interface PautaInbound {
  id: string;
  empresa_id: string;
  titulo: string;
  tipo_material: string;
  produto: string | null;
  etapa_funil: EtapaFunilConteudo | null;
  status: StatusPauta;
  prioridade: PrioridadeTarefa;
  origem: "time" | "cliente" | "benchmark";
  responsavel_id: string | null;
  data_prevista: string | null;
  publicada_em: string | null;
  link: string | null;
  descricao: string | null;
  created_at: string;
}

export type TipoNoFluxo = "entrada" | "automacao" | "condicao" | "conversao";

/** Etapa de uma régua de nutrição. */
export interface NoFluxo {
  id: string;
  fluxo_id: string;
  tipo: TipoNoFluxo;
  bloco: string;
  rotulo: string;
  descricao: string | null;
  /** Dias de espera, só nos blocos de espera. */
  espera_dias: number | null;
  ordem: number;
}

export interface FluxoInbound {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  status: "rascunho" | "ativo" | "pausado";
  created_at: string;
}

/* ---------------- notificações internas ---------------- */

/** As 12 situações que geram aviso para o time, trazidas do CEDU HUB. */
export type TipoNotificacao =
  | "nova_tarefa"
  | "comentario"
  | "mencao"
  | "mudanca_status"
  | "mudanca_responsavel"
  | "prazo_proximo"
  | "atrasada"
  | "concluida"
  | "subtarefa"
  | "anexo"
  | "resumo_diario"
  | "observando";

export interface NotificacaoInterna {
  id: string;
  /** Quem recebe o aviso. */
  user_id: string;
  tipo: TipoNotificacao;
  tarefa_id: string | null;
  /** Quem provocou o evento — nulo quando foi o próprio sistema. */
  autor_id: string | null;
  autor_nome: string;
  texto: string;
  lida: boolean;
  created_at: string;
  /**
   * Identidade do evento. Evita que o mesmo aviso de prazo seja recriado
   * a cada vez que a lista é aberta.
   */
  chave: string | null;
}

/** Silenciar é por pessoa e por tipo: o que não está aqui vem ligado. */
export interface PreferenciaNotificacao {
  user_id: string;
  tipo: TipoNotificacao;
  ativo: boolean;
}

/* ---------------- equipes ---------------- */

/**
 * Equipe fixa da agência (Tráfego, Conteúdo, SEO…). Diferente da alocação,
 * que diz quem atende um cliente específico.
 */
export interface Equipe {
  id: string;
  nome: string;
  cor: string;
  membros: string[];
}

export interface ContatoEmpresa {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  linkedin: string | null;
  area: string | null;
  /** Contato principal da conta — é quem aparece nos cards. */
  principal: boolean;
}

/** Função de quem foi alocado na conta. */
export type FuncaoEquipe =
  | "cs" | "midia" | "seo" | "conteudo" | "design" | "copy" | "gestao";

export interface AlocacaoEquipe {
  id: string;
  empresa_id: string;
  user_id: string;
  funcao: FuncaoEquipe;
  principal: boolean;
}

export type StatusProjeto = "planejado" | "em_andamento" | "pausado" | "concluido" | "encerrado";

export interface Projeto {
  id: string;
  empresa_id: string;
  tipo: TipoProjeto;
  nome: string;
  status: StatusProjeto;
  responsavel_id: string | null;
  mrr: number;
  inicio: string | null;
  renovacao: string | null;
  flag: ChurnFlag;
  observacoes: string | null;
  /** Ids nos painéis correspondentes, criados junto com o projeto. */
  cliente_id: string | null;
  projeto_seo_id: string | null;
  created_at: string;
  ativo: boolean;
}

export interface Conquista {
  id: string;
  empresa_id: string;
  projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  /** O número que prova o resultado: "+38% de leads", "CPL de R$ 42 para R$ 18". */
  indicador: string | null;
  data: string;
  destaque: boolean;
  criado_por: string | null;
}

/* ---------------- CS ---------------- */

export interface Cliente {
  id: string;
  /** Empresa dona deste projeto de CS. */
  empresa_id: string | null;
  nome: string;
  produto: ProdutoCliente;
  status: string;
  responsavel_id: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  mrr: number;
  inicio_contrato: string | null;
  renovacao_contrato: string | null;
  flag: ChurnFlag;
  clickup_list_id: string | null;
  drive_folder_url: string | null;
  read_workspace_url: string | null;
  rd_deal_id: string | null;
  observacoes: string | null;
  ativo: boolean;
}

export type RecursoTipo = "relatorio" | "ata" | "peca" | "contrato" | "link";

export interface ClienteRecurso {
  id: string;
  cliente_id: string;
  tipo: RecursoTipo;
  titulo: string;
  descricao: string | null;
  url: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  criado_por: string | null;
  created_at: string;
}

export type NotaTipo = "reuniao" | "alerta" | "entrega" | "geral";

export interface ClienteNota {
  id: string;
  cliente_id: string;
  autor_id: string | null;
  tipo: NotaTipo;
  conteudo: string;
  created_at: string;
}

export interface ChurnAvaliacao {
  id: string;
  cliente_id: string;
  analista_id: string | null;
  referencia_mes: string;
  respostas: Record<string, number>;
  pontuacao: number;
  flag: ChurnFlag;
  comentario: string | null;
  created_at: string;
}

export interface AnaliseIA {
  id: string;
  cliente_id: string;
  resumo: string;
  percepcoes: string;
  riscos: string;
  recomendacoes: string;
  flag_sugerida: ChurnFlag;
  modelo: string;
  gerado_por: string | null;
  created_at: string;
}

/* ---------------- Reuniões (Read.ai) ---------------- */

export interface ReuniaoCliente {
  id: string;
  cliente_id: string;
  read_meeting_id: string | null;
  titulo: string;
  data: string;
  duracao_minutos: number | null;
  participantes: string[];
  resumo: string | null;
  topicos: string[];
  proximos_passos: string[];
  gravacao_url: string | null;
  transcricao_url: string | null;
  sincronizado_em: string | null;
}

/* ---------------- Histórico unificado do cliente ---------------- */

export type EventoHistoricoTipo =
  | "nota"
  | "reuniao"
  | "documento"
  | "avaliacao"
  | "analise_ia"
  | "tarefa"
  | "flag";

/** Linha da jornada do cliente. Montada a partir de várias origens. */
export interface EventoHistorico {
  id: string;
  cliente_id: string;
  tipo: EventoHistoricoTipo;
  data: string;
  titulo: string;
  descricao: string | null;
  autor: string | null;
  url: string | null;
  /** Rótulo curto da origem: "Read.ai", "ClickUp", "Time", "IA"… */
  origem: string;
  relevante: boolean;
}

export interface ProducaoMensal {
  competencia: string;
  entregues: number;
  abertas: number;
  reunioes: number;
}

export interface ClickUpTarefa {
  id: string;
  cliente_id: string;
  task_id: string;
  nome: string;
  status: string;
  responsavel: string | null;
  prioridade: string | null;
  lista: string | null;
  due_date: string | null;
  url: string | null;
  concluida_em: string | null;
}

export type EtapaFunil =
  | "prospeccao"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export interface VendaNegocio {
  id: string;
  rd_deal_id: string | null;
  nome: string;
  empresa: string | null;
  etapa: EtapaFunil;
  valor: number;
  responsavel: string | null;
  origem: string | null;
  produto: ProdutoCliente | null;
  status: "aberto" | "ganho" | "perdido";
  data_criacao: string;
  data_fechamento: string | null;
}

/* ---------------- Integrações e painéis externos ---------------- */

export type IntegracaoChave =
  | "clickup"
  | "solides"
  | "conta_azul"
  | "alfaix"
  | "rd_station"
  | "read_ai"
  | "google_drive"
  | "reportei";

export interface Integracao {
  chave: IntegracaoChave;
  nome: string;
  descricao: string;
  destino: string;
  segredo: string;
  conectada: boolean;
  ultima_sincronizacao: string | null;
}

export type PainelExternoChave = "trafego" | "seo_geo" | "projetos_rd";

/* ---------------- Projeto de SEO por cliente ---------------- */

export interface ProjetoSeo {
  id: string;
  cliente_id: string;
  /** Ponto de partida do conteúdo: em branco ou copiando o modelo da ESEG. */
  origem: "vazio" | "modelo_eseg";
  criado_por: string | null;
  criado_em: string;
  ativo: boolean;
}

export interface PainelExterno {
  chave: PainelExternoChave;
  nome: string;
  descricao: string;
  url: string | null;
}
