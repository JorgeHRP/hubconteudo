import type {
  AppModulo, AppRole, ChurnFlag, Cliente, ClienteNota, ClienteRecurso, ClickUpTarefa,
  DespesaViagem, Documento, Evento, EventoHistorico, Integracao, IntegracaoChave,
  ProducaoMensal, ReuniaoCliente, PainelExterno, ProjetoSeo,
  ContatoEmpresa, Projeto, Conquista, TipoProjeto, StatusEmpresa, StatusProjeto,
  EmpresaDossie, PersonaCliente, ProdutoEmpresa, ConcorrenteEmpresa, ReuniaoEmpresa,
  CaseEmpresa, EventoTimeline, DocumentoEmpresa, EscopoContrato, Tarefa, StatusTarefa,
  PrioridadeTarefa, AcessoCliente, NotificacaoCliente, AprovacaoCliente,
  AlocacaoEquipe, FuncaoEquipe, ImplantacaoRD, NotaImplantacao, DadosFerramenta,
  TipoTarefa, ComentarioTarefa, RegistroTempo,
  PainelExternoChave, Post, PostTipo, Profile, RelatorioViagem, Solicitacao,
  SolicitacaoStatus, VendaNegocio, AnaliseIA,
  Trilha, Curso, PerguntaCurso, ProgressoCurso, Certificado, ModeloCertificado,
  NotaTipo, RecursoTipo, ViagemStatus, ChurnAvaliacao,
  NotificacaoInterna,
  PreferenciaNotificacao,
  TipoNotificacao,
  Equipe,
  ItemCatalogoInbound, PontosMesInbound, ItemPlanoInbound,
  PautaInbound, FluxoInbound, NoFluxo,
  OportunidadeVenda, RespostaOferta,
  ProjetoSite, PerfilSocial, Publicacao,
} from "@/lib/types";
import {
  seedIntegracoes, seedPaineis, seedPermissoes, seedProfiles, seedRoles,
} from "./seed";
import { equipesPadrao, statusPadrao, tiposPadrao } from "@/lib/labels-clientes";
import { templateOnboarding } from "./template-onboarding";
import { modeloCertificadoPadrao } from "@/lib/treinamentos";
import { catalogoInbound } from "./catalogo-inbound";
import {
  contatosImportados, documentosImportados, empresasImportadas, escoposImportados,
  personasImportadas, produtosImportados, reunioesImportadas, timelineImportada,
} from "./seed-carteira";

/**
 * Camada de dados em memória.
 * Cada função tem equivalente direto em uma query do Supabase — quando as credenciais
 * entrarem, troca-se o corpo destas funções e as telas não mudam.
 */

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);
const agora = () => new Date().toISOString();

const CHAVE_DB = "central-interna:dados";
/** Suba este número ao acrescentar dados de origem novos (ex.: a carteira importada). */
const VERSAO_DADOS = 3;

const inicial = () => ({
  profiles: clone(seedProfiles),
  roles: clone(seedRoles) as Record<string, AppRole>,
  permissoes: clone(seedPermissoes) as Record<string, AppModulo[]>,
  posts: [] as Post[],
  eventos: [] as Evento[],
  solicitacoes: [] as Solicitacao[],
  documentos: [] as Documento[],
  trilhas: [] as Trilha[],
  cursos: [] as Curso[],
  perguntasCurso: [] as PerguntaCurso[],
  progressoCurso: [] as ProgressoCurso[],
  certificados: [] as Certificado[],
  modeloCertificado: { ...modeloCertificadoPadrao } as ModeloCertificado,
  viagens: [] as RelatorioViagem[],
  clientes: [] as Cliente[],
  notas: [] as ClienteNota[],
  recursos: [] as ClienteRecurso[],
  avaliacoes: [] as ChurnAvaliacao[],
  analises: [] as AnaliseIA[],
  tarefas: [] as ClickUpTarefa[],
  reunioes: [] as ReuniaoCliente[],
  projetosSeo: [] as ProjetoSeo[],
  empresas: clone(empresasImportadas) as EmpresaDossie[],
  contatos: clone(contatosImportados) as ContatoEmpresa[],
  personas: clone(personasImportadas) as PersonaCliente[],
  produtos: clone(produtosImportados) as ProdutoEmpresa[],
  concorrentes: [] as ConcorrenteEmpresa[],
  reunioesEmpresa: clone(reunioesImportadas) as ReuniaoEmpresa[],
  cases: [] as CaseEmpresa[],
  timeline: clone(timelineImportada) as EventoTimeline[],
  documentosEmpresa: clone(documentosImportados) as DocumentoEmpresa[],
  escopos: clone(escoposImportados) as EscopoContrato[],
  tarefas_internas: [] as Tarefa[],
  statusTarefa: clone(statusPadrao) as StatusTarefa[],
  tiposTarefa: clone(tiposPadrao) as TipoTarefa[],
  comentariosTarefa: [] as ComentarioTarefa[],
  temposTarefa: [] as RegistroTempo[],
  acessosCliente: [] as AcessoCliente[],
  notificacoesCliente: [] as NotificacaoCliente[],
  notificacoes: [] as NotificacaoInterna[],
  preferenciasNotificacao: [] as PreferenciaNotificacao[],
  equipes: clone(equipesPadrao) as Equipe[],
  catalogoInbound: clone(catalogoInbound) as ItemCatalogoInbound[],
  pontosMesInbound: [] as PontosMesInbound[],
  planoInbound: [] as ItemPlanoInbound[],
  pautasInbound: [] as PautaInbound[],
  fluxosInbound: [] as FluxoInbound[],
  nosFluxo: [] as NoFluxo[],
  oportunidades: [] as OportunidadeVenda[],
  projetosSite: [] as ProjetoSite[],
  perfisSociais: [] as PerfilSocial[],
  publicacoes: [] as Publicacao[],
  projetos: [] as Projeto[],
  conquistas: [] as Conquista[],
  equipe: [] as AlocacaoEquipe[],
  implantacoes: [] as ImplantacaoRD[],
  notasImplantacao: [] as NotaImplantacao[],
  negocios: [] as VendaNegocio[],
  integracoes: clone(seedIntegracoes) as Integracao[],
  paineis: clone(seedPaineis) as PainelExterno[],
});

type Banco = ReturnType<typeof inicial>;

/**
 * Enquanto o Supabase não entra, os dados ficam no localStorage do navegador
 * para sobreviver ao recarregar a página. Ao conectar o backend, esta persistência
 * sai junto com o resto desta camada.
 */
function carregar(): Banco {
  const base = inicial();
  try {
    const salvo = localStorage.getItem(CHAVE_DB);
    if (!salvo) return base;

    const { _versao, ...guardado } = JSON.parse(salvo) as Banco & { _versao?: number };
    const banco = { ...base, ...guardado } as Banco;

    // Dados de origem novos só entram onde o navegador ainda não tem nada,
    // para nunca sobrescrever o que a pessoa cadastrou.
    if ((_versao ?? 1) < VERSAO_DADOS) {
      (Object.keys(base) as (keyof Banco)[]).forEach((chave) => {
        const semente = base[chave];
        const atual = banco[chave];
        if (Array.isArray(semente) && semente.length > 0 && Array.isArray(atual) && atual.length === 0) {
          // @ts-expect-error chaves conhecidas, tipos homogêneos
          banco[chave] = semente;
        }
      });
    }

    // Catálogos da casa crescem com o tempo. Estes são definidos pelo código,
    // não pelo usuário, então uma entrada nova precisa alcançar quem já tem
    // dados salvos — a regra de "só semear o vazio" acima nunca faria isso.
    completarCatalogo(banco.integracoes, base.integracoes, (i) => i.chave);
    completarCatalogo(banco.paineis, base.paineis, (p) => p.chave);
    completarCatalogo(banco.catalogoInbound, base.catalogoInbound, (c) => c.id);
    completarCatalogo(banco.tiposTarefa, base.tiposTarefa, (t) => t.id);
    completarCatalogo(banco.equipes, base.equipes, (e) => e.id);

    return banco;
  } catch {
    return base;
  }
}

/**
 * Acrescenta ao que está salvo os itens de catálogo que só existem no código.
 * Não mexe nos que já estão lá: o usuário pode ter renomeado ou desativado.
 */
function completarCatalogo<T>(atual: T[], semente: T[], chaveDe: (item: T) => string) {
  if (!Array.isArray(atual)) return;
  const existentes = new Set(atual.map(chaveDe));
  semente.filter((item) => !existentes.has(chaveDe(item))).forEach((item) => atual.push(item));
}

const db: Banco = carregar();

/**
 * Migra tarefas do formato antigo (status fixo, um responsável) para o novo
 * (status configurável, vários responsáveis). Roda uma vez, sem perder nada.
 */
(function migrarTarefas() {
  const mapa: Record<string, string> = {
    backlog: "todo", fazendo: "doing", revisao: "review", concluida: "done",
  };
  let mudou = false;

  db.tarefas_internas.forEach((t) => {
    const antiga = t as unknown as Record<string, unknown>;
    if (typeof antiga.status === "string") {
      t.status_id = mapa[antiga.status as string] ?? "todo";
      delete antiga.status;
      mudou = true;
    }
    if ("responsavel_id" in antiga) {
      const um = antiga.responsavel_id as string | null;
      t.responsaveis = um ? [um] : [];
      delete antiga.responsavel_id;
      mudou = true;
    }
    t.responsaveis ??= [];
    t.observadores ??= [];
    t.anexos ??= [];
    t.links ??= [];
    t.subtarefas ??= [];
    t.etiquetas ??= [];
    t.tipo_id ??= null;
    t.parent_id ??= null;
    t.status_id ??= "todo";
  });

  if (mudou) persistir();
})();

function persistir(): boolean {
  try {
    localStorage.setItem(CHAVE_DB, JSON.stringify({ ...db, _versao: VERSAO_DADOS }));
    return true;
  } catch {
    // quota cheia ou storage bloqueado — segue em memória
    return false;
  }
}

/** Apaga tudo e volta ao estado inicial (só o usuário master). */
export function zerarDados() {
  const base = inicial();
  (Object.keys(base) as (keyof Banco)[]).forEach((k) => {
    // @ts-expect-error atribuição dinâmica sobre chaves conhecidas
    db[k] = base[k];
  });
  persistir();
}

const wait = <T,>(valor: T): Promise<T> =>
  new Promise((resolve) => {
    persistir();
    setTimeout(() => resolve(clone(valor)), 80);
  });

/* ---------------- pessoas ---------------- */

export const listarProfiles = () => wait(db.profiles);
export const buscarProfile = (user_id: string) =>
  wait(db.profiles.find((p) => p.user_id === user_id) ?? null);
export const papelDe = (user_id: string): AppRole => db.roles[user_id] ?? "funcionario";
export const modulosDe = (user_id: string): AppModulo[] => db.permissoes[user_id] ?? [];

export async function atualizarProfile(user_id: string, dados: Partial<Profile>) {
  const i = db.profiles.findIndex((p) => p.user_id === user_id);
  if (i >= 0) db.profiles[i] = { ...db.profiles[i], ...dados };
  return wait(db.profiles[i] ?? null);
}

export interface NovoColaborador {
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  departamento: string;
  telefone: string;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;
  data_admissao: string;
  data_nascimento: string;
  role: AppRole;
  modulos: AppModulo[];
  enviar_convite: boolean;
}

export async function criarColaborador(dados: NovoColaborador) {
  const emailEmUso = db.profiles.some(
    (p) => p.email.toLowerCase() === dados.email.trim().toLowerCase()
  );
  if (emailEmUso) throw new Error("Já existe um colaborador com este e-mail.");

  const cpfLimpo = dados.cpf.replace(/\D/g, "");
  if (cpfLimpo && db.profiles.some((p) => (p.cpf ?? "").replace(/\D/g, "") === cpfLimpo)) {
    throw new Error("Já existe um colaborador com este CPF.");
  }

  const user_id = `u-${uid()}`;
  const novo: Profile = {
    id: `p-${uid()}`,
    user_id,
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    cpf: dados.cpf || null,
    cargo: dados.cargo.trim() || null,
    departamento: dados.departamento.trim() || null,
    telefone: dados.telefone || null,
    contato_emergencia_nome: dados.contato_emergencia_nome.trim() || null,
    contato_emergencia_telefone: dados.contato_emergencia_telefone || null,
    foto_url: null,
    data_nascimento: dados.data_nascimento || null,
    data_admissao: dados.data_admissao || null,
    ativo: true,
    convite_enviado_em: dados.enviar_convite ? agora() : null,
  };

  db.profiles.push(novo);
  db.roles[user_id] = dados.role;
  if (dados.modulos.length > 0) db.permissoes[user_id] = dados.modulos;

  return wait(novo);
}

export async function definirPapel(user_id: string, role: AppRole) {
  db.roles[user_id] = role;
  return wait(role);
}

export async function definirModulos(user_id: string, modulos: AppModulo[]) {
  if (modulos.length === 0) delete db.permissoes[user_id];
  else db.permissoes[user_id] = modulos;
  return wait(modulos);
}

export async function alternarAtivo(user_id: string) {
  const p = db.profiles.find((x) => x.user_id === user_id);
  if (p) p.ativo = !p.ativo;
  return wait(p ?? null);
}

export async function registrarConvite(user_id: string) {
  const p = db.profiles.find((x) => x.user_id === user_id);
  if (p) p.convite_enviado_em = agora();
  return wait(p ?? null);
}

/* ---------------- feed ---------------- */

export const listarPosts = () =>
  wait([...db.posts].sort((a, b) =>
    Number(b.fixado) - Number(a.fixado) || b.created_at.localeCompare(a.created_at)
  ));

export async function criarPost(autor_id: string, conteudo: string, tipo: PostTipo) {
  const novo: Post = {
    id: `post-${uid()}`, autor_id, conteudo, tipo, fixado: false,
    imagem_url: null, created_at: agora(), curtidas: [], comentarios: [],
  };
  db.posts.unshift(novo);
  return wait(novo);
}

export async function alternarCurtida(post_id: string, user_id: string) {
  const p = db.posts.find((x) => x.id === post_id);
  if (!p) return wait(null);
  p.curtidas = p.curtidas.includes(user_id)
    ? p.curtidas.filter((u) => u !== user_id)
    : [...p.curtidas, user_id];
  return wait(p);
}

export async function comentar(post_id: string, autor_id: string, conteudo: string) {
  const p = db.posts.find((x) => x.id === post_id);
  if (!p) return wait(null);
  p.comentarios.push({ id: `c-${uid()}`, post_id, autor_id, conteudo, created_at: agora() });
  return wait(p);
}

export async function alternarFixado(post_id: string) {
  const p = db.posts.find((x) => x.id === post_id);
  if (p) p.fixado = !p.fixado;
  return wait(p ?? null);
}

export async function removerPost(post_id: string) {
  db.posts = db.posts.filter((p) => p.id !== post_id);
  return wait(true);
}

/* ---------------- calendário ---------------- */

export const listarEventos = () =>
  wait([...db.eventos].sort((a, b) => a.data.localeCompare(b.data)));

export async function criarEvento(dados: Omit<Evento, "id">) {
  const novo: Evento = { ...dados, id: `e-${uid()}` };
  db.eventos.push(novo);
  return wait(novo);
}

export async function removerEvento(id: string) {
  db.eventos = db.eventos.filter((e) => e.id !== id);
  return wait(true);
}

/* ---------------- solicitações ---------------- */

export const listarSolicitacoes = () =>
  wait([...db.solicitacoes].sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function criarSolicitacao(
  solicitante_id: string, categoria: string, titulo: string, descricao: string
) {
  const nova: Solicitacao = {
    id: `s-${uid()}`, solicitante_id, categoria, titulo, descricao,
    status: "aberta", created_at: agora(), updated_at: agora(),
  };
  db.solicitacoes.unshift(nova);
  return wait(nova);
}

export async function mudarStatusSolicitacao(id: string, status: SolicitacaoStatus) {
  const s = db.solicitacoes.find((x) => x.id === id);
  if (s) { s.status = status; s.updated_at = agora(); }
  return wait(s ?? null);
}

/* ---------------- documentos ---------------- */

export const listarDocumentos = () => wait(db.documentos);

export async function criarDocumento(dados: Omit<Documento, "id" | "created_at">) {
  const novo: Documento = { ...dados, id: `d-${uid()}`, created_at: agora() };
  db.documentos.unshift(novo);
  return wait(novo);
}

export async function removerDocumento(id: string) {
  db.documentos = db.documentos.filter((d) => d.id !== id);
  return wait(true);
}

/* ---------------- treinamentos ---------------- */

/* -- trilhas -- */

export const listarTrilhas = () =>
  wait(db.trilhas.filter((t) => t.ativo).sort((a, b) => a.ordem - b.ordem));

export const buscarTrilha = (id: string) =>
  wait(db.trilhas.find((t) => t.id === id) ?? null);

export async function salvarTrilha(dados: Partial<Trilha> & { titulo: string }) {
  if (dados.id) {
    const i = db.trilhas.findIndex((t) => t.id === dados.id);
    if (i >= 0) db.trilhas[i] = { ...db.trilhas[i], ...dados };
    return wait(db.trilhas[i] ?? null);
  }
  const nova: Trilha = {
    id: `tr-${uid()}`,
    titulo: dados.titulo,
    descricao: dados.descricao ?? null,
    capa: dados.capa ?? null,
    ordem: db.trilhas.length,
    ativo: true,
    created_at: agora(),
  };
  db.trilhas.push(nova);
  return wait(nova);
}

export async function removerTrilha(id: string) {
  const cursos = db.cursos.filter((c) => c.trilha_id === id && c.ativo).length;
  if (cursos > 0) {
    throw new Error(
      `Esta trilha tem ${cursos} curso(s). Mova ou remova os cursos antes de excluí-la.`
    );
  }
  const t = db.trilhas.find((x) => x.id === id);
  if (t) t.ativo = false;
  return wait(true);
}

/* -- cursos -- */

export const listarCursos = () =>
  wait(db.cursos.filter((c) => c.ativo).sort((a, b) => a.ordem - b.ordem));

export const listarCursosDaTrilha = (trilha_id: string) =>
  wait(db.cursos.filter((c) => c.trilha_id === trilha_id && c.ativo)
    .sort((a, b) => a.ordem - b.ordem));

export const listarCursosAvulsos = () =>
  wait(db.cursos.filter((c) => c.trilha_id === null && c.ativo)
    .sort((a, b) => a.ordem - b.ordem));

export const buscarCurso = (id: string) =>
  wait(db.cursos.find((c) => c.id === id) ?? null);

export async function salvarCurso(dados: Partial<Curso> & { titulo: string }) {
  if (dados.id) {
    const i = db.cursos.findIndex((c) => c.id === dados.id);
    if (i >= 0) db.cursos[i] = { ...db.cursos[i], ...dados };
    return wait(db.cursos[i] ?? null);
  }
  const irmaos = db.cursos.filter((c) => c.trilha_id === (dados.trilha_id ?? null));
  const novo: Curso = {
    id: `cs-${uid()}`,
    trilha_id: dados.trilha_id ?? null,
    titulo: dados.titulo,
    professor: dados.professor ?? null,
    resumo: dados.resumo ?? null,
    video_url: dados.video_url ?? null,
    carga_horaria: dados.carga_horaria ?? 1,
    nivel: dados.nivel ?? null,
    capa: dados.capa ?? null,
    ordem: irmaos.length,
    ativo: true,
    exige_questionario: dados.exige_questionario ?? false,
    nota_minima: dados.nota_minima ?? 70,
    emite_certificado: dados.emite_certificado ?? true,
    created_at: agora(),
  };
  db.cursos.push(novo);
  return wait(novo);
}

export async function removerCurso(id: string) {
  const c = db.cursos.find((x) => x.id === id);
  if (c) c.ativo = false;
  return wait(true);
}

export async function moverCurso(id: string, direcao: -1 | 1) {
  const c = db.cursos.find((x) => x.id === id);
  if (!c) return wait(false);
  const irmaos = db.cursos
    .filter((x) => x.trilha_id === c.trilha_id && x.ativo)
    .sort((a, b) => a.ordem - b.ordem);
  const i = irmaos.findIndex((x) => x.id === id);
  const j = i + direcao;
  if (j < 0 || j >= irmaos.length) return wait(false);
  [irmaos[i].ordem, irmaos[j].ordem] = [irmaos[j].ordem, irmaos[i].ordem];
  return wait(true);
}

/* -- questionário -- */

export const listarPerguntas = (curso_id: string) =>
  wait(db.perguntasCurso.filter((p) => p.curso_id === curso_id)
    .sort((a, b) => a.ordem - b.ordem));

export async function salvarPergunta(
  dados: Partial<PerguntaCurso> & { curso_id: string; enunciado: string; opcoes: string[]; correta: number }
) {
  if (dados.id) {
    const i = db.perguntasCurso.findIndex((p) => p.id === dados.id);
    if (i >= 0) db.perguntasCurso[i] = { ...db.perguntasCurso[i], ...dados };
    return wait(db.perguntasCurso[i] ?? null);
  }
  const irmas = db.perguntasCurso.filter((p) => p.curso_id === dados.curso_id);
  const nova: PerguntaCurso = {
    id: `pg-${uid()}`,
    curso_id: dados.curso_id,
    enunciado: dados.enunciado,
    opcoes: dados.opcoes,
    correta: dados.correta,
    ordem: irmas.length,
  };
  db.perguntasCurso.push(nova);
  return wait(nova);
}

export async function removerPergunta(id: string) {
  db.perguntasCurso = db.perguntasCurso.filter((p) => p.id !== id);
  return wait(true);
}

/* -- progresso e conclusão -- */

export const listarProgressoCursos = (user_id: string) =>
  wait(db.progressoCurso.filter((p) => p.user_id === user_id));

export const progressoDoCurso = (curso_id: string, user_id: string) =>
  db.progressoCurso.find((p) => p.curso_id === curso_id && p.user_id === user_id) ?? null;

/**
 * Conclui o curso. Quando há questionário, `respostas` traz o índice escolhido em
 * cada pergunta e a aprovação depende da nota mínima — reprovado não conclui nem
 * gera certificado.
 */
export async function concluirCurso(
  curso_id: string,
  user_id: string,
  respostas?: number[]
) {
  const curso = db.cursos.find((c) => c.id === curso_id);
  if (!curso) throw new Error("Curso não encontrado.");

  let nota: number | null = null;
  let aprovado = true;

  if (curso.exige_questionario) {
    const perguntas = db.perguntasCurso
      .filter((p) => p.curso_id === curso_id)
      .sort((a, b) => a.ordem - b.ordem);
    if (perguntas.length === 0) {
      throw new Error("Este curso exige questionário, mas nenhuma pergunta foi cadastrada.");
    }
    if (!respostas || respostas.length !== perguntas.length) {
      throw new Error("Responda todas as perguntas antes de concluir.");
    }
    const acertos = perguntas.filter((p, i) => respostas[i] === p.correta).length;
    nota = Math.round((acertos / perguntas.length) * 100);
    aprovado = nota >= curso.nota_minima;
  }

  const atual = db.progressoCurso.find((p) => p.curso_id === curso_id && p.user_id === user_id);
  if (atual) {
    atual.tentativas += 1;
    atual.nota = nota;
    atual.concluido = aprovado;
    atual.concluido_em = aprovado ? agora() : null;
  } else {
    db.progressoCurso.push({
      curso_id, user_id,
      concluido: aprovado,
      concluido_em: aprovado ? agora() : null,
      nota,
      tentativas: 1,
    });
  }

  // Certificado sai só com aprovação, e só uma vez por pessoa.
  let certificado: Certificado | null = null;
  if (aprovado && curso.emite_certificado) {
    certificado = db.certificados.find(
      (c) => c.curso_id === curso_id && c.user_id === user_id
    ) ?? null;
    if (!certificado) {
      certificado = {
        id: `ct-${uid()}`,
        codigo: `${uid()}${uid()}`.toUpperCase().slice(0, 12),
        user_id,
        curso_id,
        trilha_id: curso.trilha_id,
        titulo: curso.titulo,
        carga_horaria: curso.carga_horaria,
        emitido_em: agora(),
      };
      db.certificados.push(certificado);
    }
  }

  return wait({ aprovado, nota, certificado });
}

export async function reabrirCurso(curso_id: string, user_id: string) {
  const p = db.progressoCurso.find((x) => x.curso_id === curso_id && x.user_id === user_id);
  if (p) { p.concluido = false; p.concluido_em = null; p.nota = null; }
  return wait(true);
}

/* -- certificados -- */

export const listarCertificados = (user_id: string) =>
  wait(db.certificados.filter((c) => c.user_id === user_id)
    .sort((a, b) => b.emitido_em.localeCompare(a.emitido_em)));

export const buscarCertificado = (id: string) =>
  wait(db.certificados.find((c) => c.id === id) ?? null);

export const lerModeloCertificado = () => wait(db.modeloCertificado);

export async function salvarModeloCertificado(dados: Partial<ModeloCertificado>) {
  db.modeloCertificado = { ...db.modeloCertificado, ...dados };
  return wait(db.modeloCertificado);
}

/** Progresso de uma trilha: quantos cursos dela a pessoa já concluiu. */
export function progressoDaTrilha(trilha_id: string, user_id: string) {
  const cursos = db.cursos.filter((c) => c.trilha_id === trilha_id && c.ativo);
  const feitos = cursos.filter((c) =>
    db.progressoCurso.some((p) => p.curso_id === c.id && p.user_id === user_id && p.concluido)
  ).length;
  return {
    total: cursos.length,
    feitos,
    percentual: cursos.length > 0 ? Math.round((feitos / cursos.length) * 100) : 0,
    horas: cursos.reduce((s, c) => s + c.carga_horaria, 0),
  };
}

/* ---------------- relatórios de viagem ---------------- */

export const listarViagens = () =>
  wait([...db.viagens].sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function criarViagem(dados: {
  colaborador_id: string; titulo: string; destino: string; motivo: string;
  data_inicio: string; data_fim: string;
}) {
  const nova: RelatorioViagem = {
    ...dados, id: `v-${uid()}`, status: "rascunho", observacao_financeiro: null,
    avaliado_por: null, avaliado_em: null, created_at: agora(), despesas: [],
  };
  db.viagens.unshift(nova);
  return wait(nova);
}

export async function adicionarDespesa(
  relatorio_id: string, despesa: Omit<DespesaViagem, "id" | "relatorio_id">
) {
  const v = db.viagens.find((x) => x.id === relatorio_id);
  if (!v) return wait(null);
  v.despesas.push({ ...despesa, id: `dv-${uid()}`, relatorio_id });
  return wait(v);
}

export async function removerDespesa(relatorio_id: string, despesa_id: string) {
  const v = db.viagens.find((x) => x.id === relatorio_id);
  if (v) v.despesas = v.despesas.filter((d) => d.id !== despesa_id);
  return wait(v ?? null);
}

export async function mudarStatusViagem(
  id: string, status: ViagemStatus, avaliador_id: string | null, observacao?: string
) {
  const v = db.viagens.find((x) => x.id === id);
  if (!v) return wait(null);
  v.status = status;
  if (status !== "rascunho" && status !== "enviado") {
    v.avaliado_por = avaliador_id;
    v.avaliado_em = agora();
    v.observacao_financeiro = observacao ?? null;
  }
  return wait(v);
}

export async function removerViagem(id: string) {
  db.viagens = db.viagens.filter((v) => v.id !== id);
  return wait(true);
}

/* ---------------- CS ---------------- */

export const listarClientes = () => wait(db.clientes.filter((c) => c.ativo));
export const buscarCliente = (id: string) => wait(db.clientes.find((c) => c.id === id) ?? null);

export async function salvarCliente(dados: Partial<Cliente> & { nome: string }) {
  if (dados.id) {
    const i = db.clientes.findIndex((c) => c.id === dados.id);
    if (i >= 0) db.clientes[i] = { ...db.clientes[i], ...dados };
    return wait(db.clientes[i]);
  }
  const novo: Cliente = {
    id: `c-${uid()}`, empresa_id: dados.empresa_id ?? null,
    nome: dados.nome, produto: dados.produto ?? "martech",
    status: dados.status ?? "ativo", responsavel_id: dados.responsavel_id ?? null,
    contato_nome: dados.contato_nome ?? null, contato_email: dados.contato_email ?? null,
    contato_telefone: dados.contato_telefone ?? null, mrr: dados.mrr ?? 0,
    inicio_contrato: dados.inicio_contrato ?? null,
    renovacao_contrato: dados.renovacao_contrato ?? null,
    flag: dados.flag ?? "green", clickup_list_id: dados.clickup_list_id ?? null,
    drive_folder_url: dados.drive_folder_url ?? null,
    read_workspace_url: dados.read_workspace_url ?? null,
    rd_deal_id: dados.rd_deal_id ?? null, observacoes: dados.observacoes ?? null, ativo: true,
  };
  db.clientes.push(novo);
  return wait(novo);
}

export async function removerCliente(id: string) {
  const c = db.clientes.find((x) => x.id === id);
  if (c) c.ativo = false;
  return wait(true);
}

export const listarNotas = (cliente_id: string) =>
  wait(db.notas.filter((n) => n.cliente_id === cliente_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function criarNota(cliente_id: string, autor_id: string, tipo: NotaTipo, conteudo: string) {
  const nova: ClienteNota = { id: `n-${uid()}`, cliente_id, autor_id, tipo, conteudo, created_at: agora() };
  db.notas.unshift(nova);
  return wait(nova);
}

export const listarRecursos = (cliente_id: string) =>
  wait(db.recursos.filter((r) => r.cliente_id === cliente_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function criarRecurso(dados: {
  cliente_id: string; tipo: RecursoTipo; titulo: string;
  descricao: string | null; url: string | null; criado_por: string;
}) {
  const novo: ClienteRecurso = {
    ...dados, id: `r-${uid()}`, arquivo_url: null, arquivo_nome: null, created_at: agora(),
  };
  db.recursos.unshift(novo);
  return wait(novo);
}

export const listarAvaliacoes = (cliente_id: string) =>
  wait(db.avaliacoes.filter((a) => a.cliente_id === cliente_id)
    .sort((a, b) => b.referencia_mes.localeCompare(a.referencia_mes)));

export async function salvarAvaliacao(dados: {
  cliente_id: string; analista_id: string; referencia_mes: string;
  respostas: Record<string, number>; pontuacao: number; flag: ChurnFlag; comentario: string | null;
}) {
  const existente = db.avaliacoes.find(
    (a) => a.cliente_id === dados.cliente_id && a.referencia_mes === dados.referencia_mes
  );
  if (existente) Object.assign(existente, dados);
  else db.avaliacoes.unshift({ ...dados, id: `a-${uid()}`, created_at: agora() });

  const cliente = db.clientes.find((c) => c.id === dados.cliente_id);
  if (cliente) cliente.flag = dados.flag;
  return wait(true);
}

export const listarAnalises = (cliente_id: string) =>
  wait(db.analises.filter((a) => a.cliente_id === cliente_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function salvarAnalise(analise: Omit<AnaliseIA, "id" | "created_at">) {
  const nova: AnaliseIA = { ...analise, id: `ia-${uid()}`, created_at: agora() };
  db.analises.unshift(nova);
  return wait(nova);
}

export const listarTarefas = (cliente_id: string) =>
  wait(db.tarefas.filter((t) => t.cliente_id === cliente_id));

/* ---------------- reuniões (Read.ai) ---------------- */

export const listarReunioes = (cliente_id: string) =>
  wait(db.reunioes.filter((r) => r.cliente_id === cliente_id)
    .sort((a, b) => b.data.localeCompare(a.data)));

export async function criarReuniao(dados: {
  cliente_id: string; titulo: string; data: string;
  duracao_minutos: number | null; participantes: string[];
  resumo: string | null; gravacao_url: string | null;
}) {
  const nova: ReuniaoCliente = {
    ...dados, id: `re-${uid()}`, read_meeting_id: null,
    topicos: [], proximos_passos: [], transcricao_url: null, sincronizado_em: null,
  };
  db.reunioes.unshift(nova);
  return wait(nova);
}

export async function removerReuniao(id: string) {
  db.reunioes = db.reunioes.filter((r) => r.id !== id);
  return wait(true);
}

/* ---------------- histórico unificado ---------------- */

/**
 * Monta a jornada do cliente juntando todas as origens em uma linha do tempo.
 * Quando o Supabase entrar, isto vira uma view SQL (ou várias queries em paralelo).
 */
export async function listarHistorico(cliente_id: string): Promise<EventoHistorico[]> {
  const nomeDe = (uid: string | null) =>
    db.profiles.find((p) => p.user_id === uid)?.nome ?? null;

  const eventos: EventoHistorico[] = [];

  for (const n of db.notas.filter((x) => x.cliente_id === cliente_id)) {
    eventos.push({
      id: n.id, cliente_id, tipo: "nota", data: n.created_at,
      titulo: n.tipo === "alerta" ? "Alerta registrado"
        : n.tipo === "reuniao" ? "Anotação de reunião"
        : n.tipo === "entrega" ? "Entrega registrada" : "Nota do time",
      descricao: n.conteudo, autor: nomeDe(n.autor_id), url: null,
      origem: "Time", relevante: n.tipo === "alerta" || n.tipo === "entrega",
    });
  }

  for (const r of db.reunioes.filter((x) => x.cliente_id === cliente_id)) {
    eventos.push({
      id: r.id, cliente_id, tipo: "reuniao", data: r.data,
      titulo: r.titulo,
      descricao: r.resumo ?? (r.participantes.length > 0
        ? `Participantes: ${r.participantes.join(", ")}`
        : null),
      autor: null, url: r.gravacao_url ?? r.transcricao_url,
      origem: r.read_meeting_id ? "Read.ai" : "Manual", relevante: true,
    });
  }

  for (const rec of db.recursos.filter((x) => x.cliente_id === cliente_id)) {
    eventos.push({
      id: rec.id, cliente_id, tipo: "documento", data: rec.created_at,
      titulo: rec.titulo, descricao: rec.descricao,
      autor: nomeDe(rec.criado_por), url: rec.url,
      origem: rec.tipo === "ata" ? "Read.ai" : rec.tipo === "peca" ? "Drive" : "Repositório",
      relevante: rec.tipo === "relatorio" || rec.tipo === "contrato",
    });
  }

  for (const a of db.avaliacoes.filter((x) => x.cliente_id === cliente_id)) {
    eventos.push({
      id: a.id, cliente_id, tipo: "avaliacao", data: a.created_at,
      titulo: `Termômetro de churn — ${a.pontuacao}/20`,
      descricao: a.comentario, autor: nomeDe(a.analista_id), url: null,
      origem: "CS", relevante: true,
    });
    eventos.push({
      id: `${a.id}-flag`, cliente_id, tipo: "flag", data: a.created_at,
      titulo: `Flag definida como ${a.flag === "green" ? "Saudável" : a.flag === "yellow" ? "Atenção" : "Risco"}`,
      descricao: null, autor: nomeDe(a.analista_id), url: null,
      origem: "CS", relevante: a.flag !== "green",
    });
  }

  for (const an of db.analises.filter((x) => x.cliente_id === cliente_id)) {
    eventos.push({
      id: an.id, cliente_id, tipo: "analise_ia", data: an.created_at,
      titulo: "Análise por IA", descricao: an.resumo,
      autor: nomeDe(an.gerado_por), url: null, origem: "IA", relevante: true,
    });
  }

  for (const t of db.tarefas.filter((x) => x.cliente_id === cliente_id && x.concluida_em)) {
    eventos.push({
      id: t.id, cliente_id, tipo: "tarefa", data: t.concluida_em!,
      titulo: t.nome,
      descricao: t.responsavel ? `Entregue por ${t.responsavel}` : null,
      autor: t.responsavel, url: t.url, origem: "ClickUp", relevante: false,
    });
  }

  return wait(eventos.sort((a, b) => b.data.localeCompare(a.data)));
}

/** Produção mensal do cliente: entregas do ClickUp e reuniões, por competência. */
export async function producaoMensal(cliente_id: string, meses = 6): Promise<ProducaoMensal[]> {
  const tarefas = db.tarefas.filter((t) => t.cliente_id === cliente_id);
  const reunioes = db.reunioes.filter((r) => r.cliente_id === cliente_id);

  const hoje = new Date();
  const linhas: ProducaoMensal[] = [];

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const competencia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    linhas.push({
      competencia,
      entregues: tarefas.filter((t) => t.concluida_em?.startsWith(competencia)).length,
      abertas: tarefas.filter(
        (t) => !t.concluida_em && t.due_date?.startsWith(competencia)
      ).length,
      reunioes: reunioes.filter((r) => r.data.startsWith(competencia)).length,
    });
  }

  return wait(linhas);
}

/* ---------------- gestão de clientes ---------------- */

export const listarEmpresas = () =>
  wait(db.empresas.filter((e) => e.ativo)
    .sort((a, b) => a.nome_fantasia.localeCompare(b.nome_fantasia)));

export const buscarEmpresa = (id: string) =>
  wait(db.empresas.find((e) => e.id === id) ?? null);

export interface NovaEmpresa {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  segmento: string;
  site: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: StatusEmpresa;
  responsavel_id: string | null;
  observacoes: string;
}

export async function salvarEmpresa(dados: NovaEmpresa & { id?: string }) {
  const cnpjLimpo = dados.cnpj.replace(/\D/g, "");
  const duplicada = db.empresas.find(
    (e) => e.ativo && e.id !== dados.id && (e.cnpj ?? "").replace(/\D/g, "") === cnpjLimpo
  );
  if (cnpjLimpo && duplicada) {
    throw new Error(`Já existe uma empresa com este CNPJ: ${duplicada.nome_fantasia}.`);
  }

  const campos = {
    razao_social: dados.razao_social.trim(),
    nome_fantasia: (dados.nome_fantasia || dados.razao_social).trim(),
    cnpj: dados.cnpj,
    segmento: dados.segmento.trim() || null,
    site: dados.site.trim() || null,
    cep: dados.cep || null,
    logradouro: dados.logradouro.trim() || null,
    numero: dados.numero.trim() || null,
    complemento: dados.complemento.trim() || null,
    bairro: dados.bairro.trim() || null,
    cidade: dados.cidade.trim() || null,
    estado: dados.estado || null,
    status: dados.status,
    responsavel_id: dados.responsavel_id,
    observacoes: dados.observacoes.trim() || null,
  };

  if (dados.id) {
    const i = db.empresas.findIndex((e) => e.id === dados.id);
    if (i >= 0) db.empresas[i] = { ...db.empresas[i], ...campos };
    return wait(db.empresas[i] ?? null);
  }

  const nova: EmpresaDossie = {
    ...campos, id: `emp-${uid()}`, created_at: agora(), ativo: true,
    instagram: null, linkedin: null, regiao: null, elevator_pitch: null,
    contrato_tipo: null, contrato_vigencia: null, servicos_contratados: null, entrada: null,
  };
  db.empresas.push(nova);

  // Todo cliente nasce com uma tarefa de estruturação, para nunca ficar sem quadro.
  const prazo = new Date();
  prazo.setDate(prazo.getDate() + 7);
  db.tarefas_internas.unshift({
    id: `tf-${uid()}`,
    titulo: `Estruturar o atendimento de ${nova.nome_fantasia}`,
    descricao: "Definir a equipe alocada, abrir os projetos das frentes contratadas e "
      + "cadastrar os contatos do cliente.",
    empresa_id: nova.id,
    projeto_id: null,
    responsaveis: nova.responsavel_id ? [nova.responsavel_id] : [],
    observadores: [],
    status_id: "todo",
    tipo_id: null,
    parent_id: null,
    prioridade: "alta",
    prazo: prazo.toISOString().slice(0, 10),
    estimativa_horas: null,
    etiquetas: ["estruturação"],
    anexos: [],
    links: [],
    subtarefas: [
      { titulo: "Alocar a equipe", feita: false },
      { titulo: "Abrir os projetos das frentes", feita: false },
      { titulo: "Cadastrar os contatos", feita: false },
    ],
    origem: "manual",
    fase: null,
    lado: "nos",
    compartilhada: false,
    aprovacao: null,
    comentario_cliente: null,
    respondida_em: null,
    criado_por: null,
    created_at: agora(),
    concluida_em: null,
  });

  return wait(nova);
}

/** Flag da conta: aplica em todos os projetos ativos, ou guarda na empresa se não houver. */
export async function definirFlagEmpresa(empresa_id: string, flag: ChurnFlag) {
  const projetos = db.projetos.filter((p) => p.empresa_id === empresa_id && p.ativo);
  projetos.forEach((p) => { p.flag = flag; });

  const e = db.empresas.find((x) => x.id === empresa_id);
  if (e) e.flag_conta = flag;

  return wait(flag);
}

export async function removerEmpresa(id: string) {
  const e = db.empresas.find((x) => x.id === id);
  if (e) e.ativo = false;
  db.projetos.filter((p) => p.empresa_id === id).forEach((p) => { p.ativo = false; });
  return wait(true);
}

/* contatos da empresa */

export const listarContatos = (empresa_id: string) =>
  wait(db.contatos.filter((c) => c.empresa_id === empresa_id)
    .sort((a, b) => Number(b.principal) - Number(a.principal)));

export const listarContatosTodos = () => wait(db.contatos);

export async function salvarContato(dados: Omit<ContatoEmpresa, "id"> & { id?: string }) {
  if (dados.principal) {
    db.contatos
      .filter((c) => c.empresa_id === dados.empresa_id && c.id !== dados.id)
      .forEach((c) => { c.principal = false; });
  }
  if (dados.id) {
    const i = db.contatos.findIndex((c) => c.id === dados.id);
    if (i >= 0) db.contatos[i] = { ...db.contatos[i], ...dados, id: dados.id };
    return wait(db.contatos[i] ?? null);
  }
  const novo: ContatoEmpresa = { ...dados, id: `ct-${uid()}` };
  db.contatos.push(novo);
  return wait(novo);
}

export async function removerContato(id: string) {
  db.contatos = db.contatos.filter((c) => c.id !== id);
  return wait(true);
}

/* projetos da empresa */

export const listarProjetos = () => wait(db.projetos.filter((p) => p.ativo));

export const listarProjetosDaEmpresa = (empresa_id: string) =>
  wait(db.projetos.filter((p) => p.empresa_id === empresa_id && p.ativo));

export async function criarProjeto(dados: {
  empresa_id: string;
  tipo: TipoProjeto;
  nome: string;
  status: StatusProjeto;
  responsavel_id: string | null;
  mrr: number;
  inicio: string | null;
  renovacao: string | null;
  observacoes: string | null;
  criado_por: string | null;
}) {
  const empresa = db.empresas.find((e) => e.id === dados.empresa_id);
  if (!empresa) throw new Error("Empresa não encontrada.");

  const jaExiste = db.projetos.find(
    (p) => p.empresa_id === dados.empresa_id && p.tipo === dados.tipo && p.ativo
  );
  if (jaExiste) throw new Error("Esta empresa já tem um projeto ativo desta frente.");

  const projeto: Projeto = {
    id: `prj-${uid()}`,
    empresa_id: dados.empresa_id,
    tipo: dados.tipo,
    nome: dados.nome.trim(),
    status: dados.status,
    responsavel_id: dados.responsavel_id,
    mrr: dados.mrr,
    inicio: dados.inicio,
    renovacao: dados.renovacao,
    flag: "green",
    observacoes: dados.observacoes,
    cliente_id: null,
    projeto_seo_id: null,
    created_at: agora(),
    ativo: true,
  };

  // A empresa é o cliente: o painel de CS opera direto sobre ela.
  if (dados.tipo === "cs") projeto.cliente_id = dados.empresa_id;

  if (dados.tipo === "seo") {
    const projetoSeo: ProjetoSeo = {
      id: `seo-${uid()}`, cliente_id: dados.empresa_id, origem: "vazio",
      criado_por: dados.criado_por, criado_em: agora(), ativo: true,
    };
    db.projetosSeo.push(projetoSeo);
    projeto.projeto_seo_id = projetoSeo.id;
  }

  db.projetos.push(projeto);
  return wait(projeto);
}

export async function atualizarProjeto(id: string, dados: Partial<Projeto>) {
  const i = db.projetos.findIndex((p) => p.id === id);
  if (i >= 0) db.projetos[i] = { ...db.projetos[i], ...dados };
  return wait(db.projetos[i] ?? null);
}

export async function encerrarProjeto(id: string) {
  const p = db.projetos.find((x) => x.id === id);
  if (!p) return wait(false);
  p.ativo = false;
  if (p.projeto_seo_id) {
    const s = db.projetosSeo.find((x) => x.id === p.projeto_seo_id);
    if (s) s.ativo = false;
  }
  return wait(true);
}

/* conquistas */

export const listarConquistas = () =>
  wait([...db.conquistas].sort((a, b) => b.data.localeCompare(a.data)));

export const listarConquistasDaEmpresa = (empresa_id: string) =>
  wait(db.conquistas.filter((c) => c.empresa_id === empresa_id)
    .sort((a, b) => b.data.localeCompare(a.data)));

export async function salvarConquista(dados: Omit<Conquista, "id">) {
  const nova: Conquista = { ...dados, id: `cq-${uid()}` };
  db.conquistas.unshift(nova);
  return wait(nova);
}

export async function removerConquista(id: string) {
  db.conquistas = db.conquistas.filter((c) => c.id !== id);
  return wait(true);
}

/* ---------------- dossiê da empresa ---------------- */

const doDossie = <T extends { empresa_id: string }>(lista: T[], empresa_id: string) =>
  lista.filter((x) => x.empresa_id === empresa_id);

export const listarPersonas = (empresa_id: string) => wait(doDossie(db.personas, empresa_id));
export const listarProdutos = (empresa_id: string) => wait(doDossie(db.produtos, empresa_id));
export const listarConcorrentes = (empresa_id: string) => wait(doDossie(db.concorrentes, empresa_id));
export const listarCases = (empresa_id: string) => wait(doDossie(db.cases, empresa_id));
export const listarEscopos = (empresa_id: string) => wait(doDossie(db.escopos, empresa_id));

export const listarReunioesEmpresa = (empresa_id: string) =>
  wait(doDossie(db.reunioesEmpresa, empresa_id)
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")));

export const listarTimeline = (empresa_id: string) =>
  wait(doDossie(db.timeline, empresa_id)
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")));

export const listarDocumentosEmpresa = (empresa_id: string) =>
  wait(doDossie(db.documentosEmpresa, empresa_id));

/** Salva qualquer item do dossiê: sem id cria, com id atualiza. */
function salvarNoDossie<T extends { id: string }>(lista: T[], dados: Partial<T>, prefixo: string): T {
  if (dados.id) {
    const i = lista.findIndex((x) => x.id === dados.id);
    if (i >= 0) {
      lista[i] = { ...lista[i], ...dados };
      return lista[i];
    }
  }
  const novo = { ...dados, id: `${prefixo}-${uid()}` } as T;
  lista.unshift(novo);
  return novo;
}

export const salvarPersona = (d: Partial<PersonaCliente>) =>
  wait(salvarNoDossie(db.personas, d, "pers"));
export const salvarProduto = (d: Partial<ProdutoEmpresa>) =>
  wait(salvarNoDossie(db.produtos, d, "prod"));
export const salvarConcorrente = (d: Partial<ConcorrenteEmpresa>) =>
  wait(salvarNoDossie(db.concorrentes, d, "conc"));
export const salvarReuniaoEmpresa = (d: Partial<ReuniaoEmpresa>) =>
  wait(salvarNoDossie(db.reunioesEmpresa, d, "reu"));
export const salvarCase = (d: Partial<CaseEmpresa>) =>
  wait(salvarNoDossie(db.cases, d, "case"));
export const salvarEventoTimeline = (d: Partial<EventoTimeline>) =>
  wait(salvarNoDossie(db.timeline, d, "tl"));
export const salvarDocumentoEmpresa = (d: Partial<DocumentoEmpresa>) =>
  wait(salvarNoDossie(db.documentosEmpresa, d, "doc"));
export const salvarEscopo = (d: Partial<EscopoContrato>) =>
  wait(salvarNoDossie(db.escopos, d, "esc"));

export async function removerDoDossie(
  colecao: "personas" | "produtos" | "concorrentes" | "reunioesEmpresa" | "cases"
    | "timeline" | "documentosEmpresa" | "escopos",
  id: string
) {
  // @ts-expect-error coleções homogêneas o bastante para o filtro
  db[colecao] = db[colecao].filter((x: { id: string }) => x.id !== id);
  return wait(true);
}

/* ---------------- tarefas (gestão interna) ---------------- */

export const listarTarefas2 = () =>
  wait([...db.tarefas_internas].sort((a, b) => {
    const pa = a.prazo ?? "9999";
    const pb = b.prazo ?? "9999";
    return pa.localeCompare(pb);
  }));

export interface NovaTarefa {
  titulo: string;
  descricao: string | null;
  empresa_id: string | null;
  projeto_id: string | null;
  responsaveis: string[];
  status_id: string;
  tipo_id: string | null;
  parent_id: string | null;
  prioridade: PrioridadeTarefa;
  prazo: string | null;
  estimativa_horas: number | null;
  etiquetas: string[];
}

export async function salvarTarefa(dados: NovaTarefa & { id?: string; criado_por?: string | null }) {
  if (dados.id) {
    const i = db.tarefas_internas.findIndex((t) => t.id === dados.id);
    if (i >= 0) {
      const antes = db.tarefas_internas[i];
      const virouConcluida = ehConcluido(dados.status_id) && !ehConcluido(antes.status_id);
      const saiuDeConcluida = !ehConcluido(dados.status_id) && ehConcluido(antes.status_id);
      db.tarefas_internas[i] = {
        ...antes, ...dados, id: dados.id,
        concluida_em: virouConcluida ? agora() : saiuDeConcluida ? null : antes.concluida_em,
      };
      const atual = db.tarefas_internas[i];
      const autor = dados.criado_por ?? null;

      // Quem entrou como responsável agora precisa saber disso.
      notificar({
        destinatarios: dados.responsaveis.filter((r) => !antes.responsaveis.includes(r)),
        tipo: "mudanca_responsavel",
        tarefa_id: atual.id,
        autor_id: autor,
        autor_nome: nomeDe(autor),
        texto: `Você ficou responsável por "${atual.titulo}".`,
      });
      if (virouConcluida) {
        notificar({
          destinatarios: envolvidos(atual),
          tipo: "concluida",
          tarefa_id: atual.id,
          autor_id: autor,
          autor_nome: nomeDe(autor),
          texto: `"${atual.titulo}" foi concluída.`,
        });
        db.notificacoes = db.notificacoes.filter(
          (n) => n.chave !== `atraso:${atual.id}` && n.chave !== `prazo:${atual.id}`
        );
      }
      return wait(atual);
    }
  }
  const nova: Tarefa = {
    ...dados,
    id: `tf-${uid()}`,
    observadores: [],
    tipo_id: dados.tipo_id ?? null,
    parent_id: dados.parent_id ?? null,
    anexos: [],
    links: [],
    subtarefas: [],
    origem: "manual",
    fase: null,
    lado: "nos",
    compartilhada: false,
    aprovacao: null,
    comentario_cliente: null,
    respondida_em: null,
    criado_por: dados.criado_por ?? null,
    created_at: agora(),
    concluida_em: ehConcluido(dados.status_id) ? agora() : null,
  };
  db.tarefas_internas.unshift(nova);

  notificar({
    destinatarios: nova.responsaveis,
    tipo: "nova_tarefa",
    tarefa_id: nova.id,
    autor_id: nova.criado_por,
    autor_nome: nomeDe(nova.criado_por),
    texto: `${nomeDe(nova.criado_por)} atribuiu "${nova.titulo}" a você.`,
  });
  return wait(nova);
}

export async function moverTarefa(id: string, status_id: string, autor_id: string | null = null) {
  const t = db.tarefas_internas.find((x) => x.id === id);
  if (!t) return wait(null);
  const virouConcluida = ehConcluido(status_id) && !ehConcluido(t.status_id);
  t.status_id = status_id;
  if (virouConcluida) t.concluida_em = agora();
  if (!ehConcluido(status_id)) t.concluida_em = null;

  const coluna = db.statusTarefa.find((c) => c.id === status_id)?.label ?? "outra coluna";
  notificar({
    destinatarios: envolvidos(t),
    tipo: virouConcluida ? "concluida" : "mudanca_status",
    tarefa_id: t.id,
    autor_id,
    autor_nome: nomeDe(autor_id),
    texto: virouConcluida
      ? `"${t.titulo}" foi concluída.`
      : `"${t.titulo}" foi para ${coluna}.`,
  });

  // O aviso de atraso perde o sentido quando a tarefa sai do vermelho.
  if (virouConcluida) {
    db.notificacoes = db.notificacoes.filter(
      (n) => n.chave !== `atraso:${t.id}` && n.chave !== `prazo:${t.id}`
    );
  }
  return wait(t);
}

/* ---- configuração do quadro ---- */

export const listarStatus = () =>
  wait([...db.statusTarefa].sort((a, b) => a.ordem - b.ordem));

export const listarTiposTarefa = () => wait(db.tiposTarefa);

export async function salvarStatus(dados: Partial<StatusTarefa> & { label: string; cor: string }) {
  if (dados.id) {
    const i = db.statusTarefa.findIndex((s) => s.id === dados.id);
    if (i >= 0) db.statusTarefa[i] = { ...db.statusTarefa[i], ...dados };
    return wait(db.statusTarefa[i] ?? null);
  }
  const novo: StatusTarefa = {
    id: `st-${uid()}`, label: dados.label, cor: dados.cor,
    ordem: db.statusTarefa.length,
    concluido: dados.concluido, em_andamento: dados.em_andamento,
  };
  db.statusTarefa.push(novo);
  return wait(novo);
}

export async function removerStatus(id: string) {
  if (db.statusTarefa.length <= 1) throw new Error("O quadro precisa de pelo menos uma coluna.");
  const usadas = db.tarefas_internas.filter((t) => t.status_id === id).length;
  if (usadas > 0) {
    throw new Error(`${usadas} tarefa(s) estão nesta coluna. Mova-as antes de excluir.`);
  }
  db.statusTarefa = db.statusTarefa.filter((s) => s.id !== id);
  db.statusTarefa.forEach((s, i) => { s.ordem = i; });
  return wait(true);
}

export async function reordenarStatus(ids: string[]) {
  ids.forEach((id, i) => {
    const s = db.statusTarefa.find((x) => x.id === id);
    if (s) s.ordem = i;
  });
  return wait(true);
}

export async function salvarTipoTarefa(dados: Partial<TipoTarefa> & { label: string; cor: string }) {
  if (dados.id) {
    const i = db.tiposTarefa.findIndex((t) => t.id === dados.id);
    if (i >= 0) db.tiposTarefa[i] = { ...db.tiposTarefa[i], ...dados };
    return wait(db.tiposTarefa[i] ?? null);
  }
  const novo: TipoTarefa = { id: `tt-${uid()}`, label: dados.label, cor: dados.cor };
  db.tiposTarefa.push(novo);
  return wait(novo);
}

export async function removerTipoTarefa(id: string) {
  db.tiposTarefa = db.tiposTarefa.filter((t) => t.id !== id);
  db.tarefas_internas.filter((t) => t.tipo_id === id).forEach((t) => { t.tipo_id = null; });
  return wait(true);
}

/* ---- comentários ---- */

export const listarComentarios = (tarefa_id: string) =>
  wait(db.comentariosTarefa.filter((c) => c.tarefa_id === tarefa_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at)));

export async function comentarTarefa(dados: {
  tarefa_id: string;
  autor_id: string | null;
  autor_nome: string;
  texto: string;
}) {
  // Quem foi citado com @ entra como observador e passa a acompanhar a tarefa.
  const mencoes = db.profiles
    .filter((p) => dados.texto.toLowerCase().includes(`@${p.nome.split(" ")[0].toLowerCase()}`))
    .map((p) => p.user_id);

  const novo: ComentarioTarefa = {
    ...dados, mencoes, id: `cm-${uid()}`, created_at: agora(),
  };
  db.comentariosTarefa.push(novo);

  const t = db.tarefas_internas.find((x) => x.id === dados.tarefa_id);
  if (t) {
    mencoes.forEach((m) => {
      if (!t.observadores.includes(m)) t.observadores.push(m);
    });

    // Quem foi citado recebe "menção"; o resto do time recebe "comentário".
    notificar({
      destinatarios: mencoes,
      tipo: "mencao",
      tarefa_id: t.id,
      autor_id: dados.autor_id,
      autor_nome: dados.autor_nome,
      texto: `${dados.autor_nome} citou você em "${t.titulo}".`,
    });
    notificar({
      destinatarios: envolvidos(t).filter((u) => !mencoes.includes(u)),
      tipo: "comentario",
      tarefa_id: t.id,
      autor_id: dados.autor_id,
      autor_nome: dados.autor_nome,
      texto: `${dados.autor_nome} comentou em "${t.titulo}".`,
    });
  }

  return wait(novo);
}

export async function removerComentario(id: string) {
  db.comentariosTarefa = db.comentariosTarefa.filter((c) => c.id !== id);
  return wait(true);
}

/* ---- cronômetro ---- */

export const cronometroAtivo = (user_id: string) =>
  wait(db.temposTarefa.find((r) => r.user_id === user_id && r.fim === null) ?? null);

export const listarTempos = (tarefa_id: string) =>
  wait(db.temposTarefa.filter((r) => r.tarefa_id === tarefa_id)
    .sort((a, b) => b.inicio.localeCompare(a.inicio)));

/** Segundos somados de uma tarefa, incluindo o período em curso. */
export function tempoTotal(tarefa_id: string): number {
  return db.temposTarefa
    .filter((r) => r.tarefa_id === tarefa_id)
    .reduce((soma, r) => {
      if (r.segundos !== null) return soma + r.segundos;
      return soma + Math.floor((Date.now() - new Date(r.inicio).getTime()) / 1000);
    }, 0);
}

export async function iniciarCronometro(tarefa_id: string, user_id: string) {
  // Uma pessoa só cronometra uma coisa por vez: fecha o anterior.
  db.temposTarefa
    .filter((r) => r.user_id === user_id && r.fim === null)
    .forEach((r) => {
      r.fim = agora();
      r.segundos = Math.floor((Date.now() - new Date(r.inicio).getTime()) / 1000);
    });

  const novo: RegistroTempo = {
    id: `rt-${uid()}`, tarefa_id, user_id,
    inicio: agora(), fim: null, segundos: null, origem: "cronometro",
  };
  db.temposTarefa.push(novo);
  return wait(novo);
}

export async function pararCronometro(user_id: string) {
  const aberto = db.temposTarefa.find((r) => r.user_id === user_id && r.fim === null);
  if (!aberto) return wait(null);
  aberto.fim = agora();
  aberto.segundos = Math.floor((Date.now() - new Date(aberto.inicio).getTime()) / 1000);
  return wait(aberto);
}

export async function lancarTempoManual(tarefa_id: string, user_id: string, minutos: number) {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - minutos * 60000);
  const novo: RegistroTempo = {
    id: `rt-${uid()}`, tarefa_id, user_id,
    inicio: inicio.toISOString(), fim: fim.toISOString(),
    segundos: minutos * 60, origem: "manual",
  };
  db.temposTarefa.push(novo);
  return wait(novo);
}

/** O status marcado como "concluído" no quadro define o que conta como entregue. */
export function ehConcluido(status_id: string): boolean {
  return db.statusTarefa.find((s) => s.id === status_id)?.concluido === true;
}

/* ---- onboarding: gera o roteiro completo a partir do template ---- */

export async function gerarOnboarding(
  empresa_id: string,
  inicio: string,
  responsavel_id: string | null,
  criado_por: string | null
) {
  const jaTem = db.tarefas_internas.some(
    (t) => t.empresa_id === empresa_id && t.origem === "onboarding"
  );
  if (jaTem) throw new Error("Esta empresa já tem o roteiro de onboarding gerado.");

  const base = new Date(`${inicio}T12:00:00`);
  if (Number.isNaN(base.getTime())) {
    throw new Error("Informe uma data de início válida para montar o roteiro.");
  }
  const criadas: Tarefa[] = templateOnboarding.map((etapa) => {
    const prazo = new Date(base);
    prazo.setDate(prazo.getDate() + etapa.dias);

    return {
      id: `tf-${uid()}`,
      titulo: etapa.titulo,
      descricao: etapa.depende.length
        ? `Depende da etapa ${etapa.depende.join(", ")} do roteiro.`
        : null,
      empresa_id,
      projeto_id: null,
      // Etapas do cliente e do comercial não entram na fila de quem é do CS.
      responsaveis: etapa.lado === "nos" && responsavel_id ? [responsavel_id] : [],
      observadores: [],
      status_id: "todo",
      tipo_id: null,
      parent_id: null,
      prioridade: etapa.titulo.includes("north star") ? "alta" : "normal",
      prazo: prazo.toISOString().slice(0, 10),
      estimativa_horas: null,
      etiquetas: ["onboarding", etapa.fase],
      anexos: [],
      links: [],
      subtarefas: etapa.subtarefas.map((titulo) => ({ titulo, feita: false })),
      origem: "onboarding",
      fase: etapa.fase,
      lado: etapa.lado,
      compartilhada: etapa.visivelCliente,
      // Nasceu visível para o cliente: já entra esperando resposta dele.
      aprovacao: etapa.visivelCliente ? "aguardando" : null,
      comentario_cliente: null,
      respondida_em: null,
      criado_por,
      created_at: agora(),
      concluida_em: null,
    };
  });

  db.tarefas_internas.unshift(...criadas);

  criadas
    .filter((t) => t.compartilhada)
    .forEach((t) => {
      db.notificacoesCliente.unshift({
        id: `nt-${uid()}`, empresa_id, tarefa_id: t.id, titulo: t.titulo,
        created_at: agora(), lida: false,
      });
    });

  return wait(criadas.length);
}

export const temOnboarding = (empresa_id: string) =>
  db.tarefas_internas.some((t) => t.empresa_id === empresa_id && t.origem === "onboarding");

export const listarTarefasDaEmpresa = (empresa_id: string) =>
  wait(db.tarefas_internas
    .filter((t) => t.empresa_id === empresa_id)
    .sort((a, b) => (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999")));

/* ---- compartilhamento com o cliente ---- */

export async function alternarCompartilhamento(id: string) {
  const t = db.tarefas_internas.find((x) => x.id === id);
  if (!t) return wait(null);

  t.compartilhada = !t.compartilhada;

  if (t.compartilhada) {
    t.aprovacao = "aguardando";
    if (t.empresa_id) {
      db.notificacoesCliente.unshift({
        id: `nt-${uid()}`,
        empresa_id: t.empresa_id,
        tarefa_id: t.id,
        titulo: t.titulo,
        created_at: agora(),
        lida: false,
      });
    }
  } else {
    t.aprovacao = null;
    t.comentario_cliente = null;
    t.respondida_em = null;
    db.notificacoesCliente = db.notificacoesCliente.filter((n) => n.tarefa_id !== t.id);
  }

  return wait(t);
}

export async function responderTarefa(
  id: string,
  resposta: AprovacaoCliente,
  comentario: string | null
) {
  const t = db.tarefas_internas.find((x) => x.id === id);
  if (!t) return wait(null);
  t.aprovacao = resposta;
  t.comentario_cliente = comentario;
  t.respondida_em = agora();
  return wait(t);
}

export async function alternarSubtarefa(tarefa_id: string, indice: number) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (t?.subtarefas[indice]) t.subtarefas[indice].feita = !t.subtarefas[indice].feita;
  return wait(t ?? null);
}

export async function adicionarSubtarefa(
  tarefa_id: string,
  titulo: string,
  autor_id: string | null = null
) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.subtarefas.push({ titulo, feita: false });
  notificar({
    destinatarios: envolvidos(t),
    tipo: "subtarefa",
    tarefa_id: t.id,
    autor_id,
    autor_nome: nomeDe(autor_id),
    texto: `Novo item em "${t.titulo}": ${titulo}.`,
  });
  return wait(t);
}

export async function removerSubtarefa(tarefa_id: string, indice: number) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.subtarefas.splice(indice, 1);
  return wait(t);
}

/**
 * Cria uma tarefa de demonstração com tudo preenchido — checklist, links,
 * conversa com menção, tempo lançado e avisos. Serve para conhecer os recursos
 * do quadro sem ter que montar tudo à mão. Some com um clique na lixeira.
 */
export async function criarTarefaExemplo(user_id: string) {
  const jaTem = db.tarefas_internas.some((t) => t.titulo.startsWith("[Exemplo]"));
  if (jaTem) throw new Error("A tarefa de exemplo já está no quadro.");

  const empresa = db.empresas.find((e) => e.ativo) ?? null;
  const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const eu = db.profiles.find((p) => p.user_id === user_id);

  const t: Tarefa = {
    id: `tf-${uid()}`,
    titulo: "[Exemplo] Planejamento de mídia — outubro",
    descricao:
      "Tarefa de demonstração, para você conhecer os recursos do quadro.\n\n" +
      "Abra o cronômetro, marque itens do checklist, anexe um arquivo e responda " +
      "o comentário. Quando terminar, apague no ícone de lixeira do card.",
    empresa_id: empresa?.id ?? null,
    projeto_id: null,
    responsaveis: [user_id],
    observadores: [],
    status_id: db.statusTarefa.find((c) => c.em_andamento)?.id ?? db.statusTarefa[0].id,
    tipo_id: db.tiposTarefa[1]?.id ?? null,
    parent_id: null,
    prioridade: "alta",
    prazo: amanha,
    estimativa_horas: 6,
    etiquetas: ["exemplo", "mídia"],
    anexos: [],
    links: [
      { id: `lk-${uid()}`, rotulo: "Planilha de verba", url: "https://docs.google.com/spreadsheets" },
      { id: `lk-${uid()}`, rotulo: "Brief do cliente", url: "https://example.com/brief" },
    ],
    subtarefas: [
      { titulo: "Levantar resultados de setembro", feita: true },
      { titulo: "Definir verba por canal", feita: true },
      { titulo: "Escrever as copies dos criativos", feita: false },
      { titulo: "Revisar com o cliente", feita: false },
    ],
    origem: "manual",
    fase: null,
    lado: "nos",
    compartilhada: false,
    aprovacao: null,
    comentario_cliente: null,
    respondida_em: null,
    criado_por: user_id,
    created_at: agora(),
    concluida_em: null,
  };
  db.tarefas_internas.unshift(t);

  // Conversa de exemplo: a menção coloca você como quem acompanha.
  const nomeUsuario = eu?.nome ?? "você";
  const primeiro = nomeUsuario.split(" ")[0];
  db.comentariosTarefa.push({
    id: `cm-${uid()}`,
    tarefa_id: t.id,
    autor_id: null,
    autor_nome: "Ana Ribeiro",
    texto: `Subi a planilha com o resultado de setembro. @${primeiro} confere a verba do Meta antes de eu montar as campanhas?`,
    mencoes: [user_id],
    created_at: agora(),
  });
  t.observadores.push(user_id);

  // Tempo já registrado, para o card mostrar o acumulado.
  const fim = new Date();
  db.temposTarefa.push({
    id: `rt-${uid()}`,
    tarefa_id: t.id,
    user_id,
    inicio: new Date(fim.getTime() - 95 * 60000).toISOString(),
    fim: fim.toISOString(),
    segundos: 95 * 60,
    origem: "manual",
  });

  notificar({
    destinatarios: [user_id],
    tipo: "mencao",
    tarefa_id: t.id,
    autor_id: null,
    autor_nome: "Ana Ribeiro",
    texto: `Ana Ribeiro citou você em "${t.titulo}".`,
  });

  return wait(t);
}

/** Tira do quadro tudo que a demonstração criou. */
export async function removerExemplos() {
  const ids = db.tarefas_internas
    .filter((t) => t.titulo.startsWith("[Exemplo]"))
    .map((t) => t.id);
  db.tarefas_internas = db.tarefas_internas.filter((t) => !ids.includes(t.id));
  db.comentariosTarefa = db.comentariosTarefa.filter((c) => !ids.includes(c.tarefa_id));
  db.temposTarefa = db.temposTarefa.filter((r) => !ids.includes(r.tarefa_id));
  db.notificacoes = db.notificacoes.filter((n) => !n.tarefa_id || !ids.includes(n.tarefa_id));
  return wait(ids.length);
}

/* ---------------- inbound ---------------- */

/* -- catálogo (tabela de preços da agência, vale para todos os clientes) -- */

export const listarCatalogoInbound = () =>
  wait([...db.catalogoInbound].sort((a, b) => a.ordem - b.ordem));

export async function salvarItemCatalogo(
  dados: Partial<ItemCatalogoInbound> & { nome: string; pontos: number }
) {
  if (dados.id) {
    const i = db.catalogoInbound.findIndex((c) => c.id === dados.id);
    if (i >= 0) db.catalogoInbound[i] = { ...db.catalogoInbound[i], ...dados };
    return wait(db.catalogoInbound[i] ?? null);
  }
  const novo: ItemCatalogoInbound = {
    id: `ic-${uid()}`,
    nome: dados.nome,
    categoria: dados.categoria ?? "Conteúdo",
    pontos: dados.pontos,
    descricao: dados.descricao ?? null,
    ordem: Math.max(0, ...db.catalogoInbound.map((c) => c.ordem)) + 1,
    ativo: true,
  };
  db.catalogoInbound.push(novo);
  return wait(novo);
}

export async function removerItemCatalogo(id: string) {
  // Nunca some de verdade: itens já lançados em planos antigos precisam do nome.
  const item = db.catalogoInbound.find((c) => c.id === id);
  if (item) item.ativo = false;
  return wait(true);
}

/* -- pontos contratados por mês -- */

export const listarPontosMes = (empresa_id: string) =>
  wait(db.pontosMesInbound.filter((p) => p.empresa_id === empresa_id)
    .sort((a, b) => b.mes.localeCompare(a.mes)));

export const pontosDoMes = (empresa_id: string, mes: string) =>
  db.pontosMesInbound.find((p) => p.empresa_id === empresa_id && p.mes === mes) ?? null;

export async function salvarPontosMes(dados: {
  empresa_id: string; mes: string; pontos_contratados: number; observacao?: string | null;
}) {
  const atual = db.pontosMesInbound.find(
    (p) => p.empresa_id === dados.empresa_id && p.mes === dados.mes
  );
  if (atual) {
    atual.pontos_contratados = dados.pontos_contratados;
    atual.observacao = dados.observacao ?? atual.observacao;
    return wait(atual);
  }
  const novo: PontosMesInbound = {
    id: `pm-${uid()}`,
    empresa_id: dados.empresa_id,
    mes: dados.mes,
    pontos_contratados: dados.pontos_contratados,
    observacao: dados.observacao ?? null,
  };
  db.pontosMesInbound.push(novo);
  return wait(novo);
}

/* -- plano do mês -- */

export const listarPlanoInbound = (empresa_id: string, mes: string) =>
  wait(db.planoInbound.filter((i) => i.empresa_id === empresa_id && i.mes === mes)
    .sort((a, b) => a.created_at.localeCompare(b.created_at)));

/**
 * Lança um serviço no plano. Os pontos unitários são copiados do catálogo
 * na hora do lançamento: reajustar a tabela depois não reescreve meses fechados.
 */
export async function lancarItemPlano(dados: {
  empresa_id: string; mes: string; catalogo_id: string; quantidade: number;
  observacao?: string | null;
}) {
  const item = db.catalogoInbound.find((c) => c.id === dados.catalogo_id);
  if (!item) throw new Error("Serviço não encontrado no catálogo.");

  const novo: ItemPlanoInbound = {
    id: `ip-${uid()}`,
    empresa_id: dados.empresa_id,
    mes: dados.mes,
    catalogo_id: item.id,
    titulo: item.nome,
    pontos_unitarios: item.pontos,
    quantidade: Math.max(1, dados.quantidade),
    status: "nao_iniciado",
    observacao: dados.observacao ?? null,
    created_at: agora(),
  };
  db.planoInbound.push(novo);
  return wait(novo);
}

export async function atualizarItemPlano(
  id: string,
  mudancas: Partial<Pick<ItemPlanoInbound, "quantidade" | "status" | "observacao" | "pontos_unitarios">>
) {
  const i = db.planoInbound.findIndex((x) => x.id === id);
  if (i < 0) return wait(null);
  db.planoInbound[i] = { ...db.planoInbound[i], ...mudancas };
  return wait(db.planoInbound[i]);
}

export async function removerItemPlano(id: string) {
  db.planoInbound = db.planoInbound.filter((i) => i.id !== id);
  return wait(true);
}

/** Copia o plano de um mês para outro — a rotina mensal costuma repetir. */
export async function duplicarPlano(empresa_id: string, de: string, para: string) {
  const origem = db.planoInbound.filter((i) => i.empresa_id === empresa_id && i.mes === de);
  if (origem.length === 0) throw new Error("Não há itens no mês de origem para copiar.");

  const jaTem = db.planoInbound.some((i) => i.empresa_id === empresa_id && i.mes === para);
  if (jaTem) throw new Error("O mês de destino já tem itens. Limpe antes de copiar.");

  origem.forEach((i) => {
    db.planoInbound.push({
      ...i, id: `ip-${uid()}`, mes: para, status: "nao_iniciado", created_at: agora(),
    });
  });
  return wait(origem.length);
}

/** Consumo do mês: o que foi planejado contra o que foi contratado. */
export function saldoDoMes(empresa_id: string, mes: string) {
  const contratados = pontosDoMes(empresa_id, mes)?.pontos_contratados ?? 0;
  const itens = db.planoInbound.filter((i) => i.empresa_id === empresa_id && i.mes === mes);
  const planejados = itens.reduce((s, i) => s + i.pontos_unitarios * i.quantidade, 0);
  const entregues = itens
    .filter((i) => i.status === "finalizado")
    .reduce((s, i) => s + i.pontos_unitarios * i.quantidade, 0);

  return {
    contratados,
    planejados,
    entregues,
    saldo: contratados - planejados,
    // Sem contrato lançado não há percentual que faça sentido.
    percentual: contratados > 0 ? Math.round((planejados / contratados) * 100) : null,
    estourou: contratados > 0 && planejados > contratados,
  };
}

/* -- pautas -- */

export const listarPautas = (empresa_id: string) =>
  wait(db.pautasInbound.filter((p) => p.empresa_id === empresa_id)
    .sort((a, b) => (b.data_prevista ?? "").localeCompare(a.data_prevista ?? "")));

export async function salvarPauta(
  dados: Partial<PautaInbound> & { empresa_id: string; titulo: string }
) {
  if (dados.id) {
    const i = db.pautasInbound.findIndex((p) => p.id === dados.id);
    if (i >= 0) db.pautasInbound[i] = { ...db.pautasInbound[i], ...dados };
    return wait(db.pautasInbound[i] ?? null);
  }
  const nova: PautaInbound = {
    id: `pt-${uid()}`,
    empresa_id: dados.empresa_id,
    titulo: dados.titulo,
    tipo_material: dados.tipo_material ?? "Blogpost",
    produto: dados.produto ?? null,
    etapa_funil: dados.etapa_funil ?? null,
    status: dados.status ?? "ideia",
    prioridade: dados.prioridade ?? "normal",
    origem: dados.origem ?? "time",
    responsavel_id: dados.responsavel_id ?? null,
    data_prevista: dados.data_prevista ?? null,
    publicada_em: dados.publicada_em ?? null,
    link: dados.link ?? null,
    descricao: dados.descricao ?? null,
    created_at: agora(),
  };
  db.pautasInbound.push(nova);
  return wait(nova);
}

export async function removerPauta(id: string) {
  db.pautasInbound = db.pautasInbound.filter((p) => p.id !== id);
  return wait(true);
}

/* -- fluxos de nutrição -- */

export const listarFluxos = (empresa_id: string) =>
  wait(db.fluxosInbound.filter((f) => f.empresa_id === empresa_id));

export const listarNosFluxo = (fluxo_id: string) =>
  wait(db.nosFluxo.filter((n) => n.fluxo_id === fluxo_id).sort((a, b) => a.ordem - b.ordem));

export async function salvarFluxo(
  dados: Partial<FluxoInbound> & { empresa_id: string; nome: string }
) {
  if (dados.id) {
    const i = db.fluxosInbound.findIndex((f) => f.id === dados.id);
    if (i >= 0) db.fluxosInbound[i] = { ...db.fluxosInbound[i], ...dados };
    return wait(db.fluxosInbound[i] ?? null);
  }
  const novo: FluxoInbound = {
    id: `fx-${uid()}`,
    empresa_id: dados.empresa_id,
    nome: dados.nome,
    descricao: dados.descricao ?? null,
    status: dados.status ?? "rascunho",
    created_at: agora(),
  };
  db.fluxosInbound.push(novo);
  return wait(novo);
}

export async function removerFluxo(id: string) {
  db.fluxosInbound = db.fluxosInbound.filter((f) => f.id !== id);
  db.nosFluxo = db.nosFluxo.filter((n) => n.fluxo_id !== id);
  return wait(true);
}

export async function adicionarNoFluxo(dados: Omit<NoFluxo, "id" | "ordem">) {
  const irmaos = db.nosFluxo.filter((n) => n.fluxo_id === dados.fluxo_id);
  const novo: NoFluxo = { ...dados, id: `nf-${uid()}`, ordem: irmaos.length };
  db.nosFluxo.push(novo);
  return wait(novo);
}

export async function atualizarNoFluxo(id: string, mudancas: Partial<NoFluxo>) {
  const i = db.nosFluxo.findIndex((n) => n.id === id);
  if (i < 0) return wait(null);
  db.nosFluxo[i] = { ...db.nosFluxo[i], ...mudancas };
  return wait(db.nosFluxo[i]);
}

export async function removerNoFluxo(id: string) {
  const no = db.nosFluxo.find((n) => n.id === id);
  if (!no) return wait(true);
  db.nosFluxo = db.nosFluxo.filter((n) => n.id !== id);
  db.nosFluxo
    .filter((n) => n.fluxo_id === no.fluxo_id)
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((n, i) => { n.ordem = i; });
  return wait(true);
}

export async function moverNoFluxo(id: string, direcao: -1 | 1) {
  const no = db.nosFluxo.find((n) => n.id === id);
  if (!no) return wait(false);
  const irmaos = db.nosFluxo
    .filter((n) => n.fluxo_id === no.fluxo_id)
    .sort((a, b) => a.ordem - b.ordem);
  const i = irmaos.findIndex((n) => n.id === id);
  const j = i + direcao;
  if (j < 0 || j >= irmaos.length) return wait(false);
  [irmaos[i].ordem, irmaos[j].ordem] = [irmaos[j].ordem, irmaos[i].ordem];
  return wait(true);
}

/** Clientes que já têm inbound, com o consumo do mês pedido. */
export const listarClientesInbound = (mes: string) =>
  wait(
    db.empresas
      .filter((e) => e.ativo)
      .filter((e) =>
        db.projetos.some((p) => p.empresa_id === e.id && p.tipo === "inbound" && p.ativo)
      )
      .map((e) => ({ empresa: e, ...saldoDoMes(e.id, mes) }))
  );

/**
 * Abre uma frente para o cliente. Toda frente vira um `Projeto`, que é o que o
 * painel de CS lê para montar "Projetos por frente" — é assim que SEO, tráfego,
 * inbound e RD conversam com a ficha do cliente.
 */
export async function lancarFrente(
  empresa_id: string,
  tipo: TipoProjeto,
  responsavel_id: string | null
) {
  const jaTem = db.projetos.some(
    (p) => p.empresa_id === empresa_id && p.tipo === tipo && p.ativo
  );
  if (jaTem) throw new Error(`Este cliente já tem a frente de ${nomeDaFrente[tipo]} ativa.`);

  const novo: Projeto = {
    id: `pj-${uid()}`,
    empresa_id,
    tipo,
    nome: nomeDaFrente[tipo],
    status: "em_andamento",
    responsavel_id,
    mrr: 0,
    inicio: new Date().toISOString().slice(0, 10),
    renovacao: null,
    flag: "green",
    observacoes: null,
    cliente_id: null,
    projeto_seo_id: null,
    created_at: agora(),
    ativo: true,
  };
  db.projetos.push(novo);

  // Oferta aceita: a oportunidade daquele serviço deixa de fazer sentido.
  db.oportunidades = db.oportunidades.filter(
    (o) => !(o.empresa_id === empresa_id && o.tipo === tipo)
  );
  return wait(novo);
}

/** Nome que a frente recebe na ficha do cliente. */
const nomeDaFrente: Record<TipoProjeto, string> = {
  cs: "Customer Success",
  trafego: "Gestão de Tráfego",
  seo: "SEO / GEO",
  rd: "Implantação RD",
  inbound: "Inbound",
  sites: "Sites e Hotsites",
  social: "Gestão de Redes Sociais",
};

/** Mantida pelo nome antigo porque a tela de inbound já a chama assim. */
export const ativarInbound = (empresa_id: string, responsavel_id: string | null) =>
  lancarFrente(empresa_id, "inbound", responsavel_id);

export async function encerrarFrente(empresa_id: string, tipo: TipoProjeto) {
  db.projetos
    .filter((p) => p.empresa_id === empresa_id && p.tipo === tipo && p.ativo)
    .forEach((p) => { p.ativo = false; p.status = "encerrado"; });
  return wait(true);
}

/* ---------------- sites e hotsites ---------------- */

/** Etapas que todo site passa na agência; servem de ponto de partida. */
const checklistSitePadrao = [
  "Briefing e referências aprovadas",
  "Arquitetura de informação",
  "Layout aprovado pelo cliente",
  "Desenvolvimento das páginas",
  "Conteúdo e imagens no ar",
  "SEO básico (títulos, metas, sitemap)",
  "Testes em celular e navegadores",
  "Analytics e tags configurados",
  "Homologação com o cliente",
  "Publicação e DNS",
];

export const listarProjetosSite = () =>
  wait(db.projetosSite.filter((p) => p.ativo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export const listarSitesDaEmpresa = (empresa_id: string) =>
  wait(db.projetosSite.filter((p) => p.empresa_id === empresa_id && p.ativo));

export async function salvarProjetoSite(
  dados: Partial<ProjetoSite> & { empresa_id: string; nome: string }
) {
  if (dados.id) {
    const i = db.projetosSite.findIndex((p) => p.id === dados.id);
    if (i >= 0) db.projetosSite[i] = { ...db.projetosSite[i], ...dados };
    return wait(db.projetosSite[i] ?? null);
  }
  const novo: ProjetoSite = {
    id: `st-${uid()}`,
    empresa_id: dados.empresa_id,
    nome: dados.nome,
    tipo: dados.tipo ?? "site",
    plataforma: dados.plataforma ?? null,
    url_producao: dados.url_producao ?? null,
    url_homologacao: dados.url_homologacao ?? null,
    fase: dados.fase ?? "briefing",
    responsavel_id: dados.responsavel_id ?? null,
    inicio: dados.inicio ?? new Date().toISOString().slice(0, 10),
    previsao_entrega: dados.previsao_entrega ?? null,
    publicado_em: null,
    observacoes: dados.observacoes ?? null,
    checklist: dados.checklist ?? checklistSitePadrao.map((t) => ({ titulo: t, feito: false })),
    ativo: true,
    created_at: agora(),
  };
  db.projetosSite.push(novo);

  // A frente entra no CS junto com o primeiro site do cliente.
  const jaTem = db.projetos.some(
    (p) => p.empresa_id === dados.empresa_id && p.tipo === "sites" && p.ativo
  );
  if (!jaTem) await lancarFrente(dados.empresa_id, "sites", dados.responsavel_id ?? null);

  return wait(novo);
}

export async function alternarEtapaSite(site_id: string, indice: number) {
  const p = db.projetosSite.find((x) => x.id === site_id);
  if (!p?.checklist[indice]) return wait(null);
  p.checklist[indice].feito = !p.checklist[indice].feito;
  return wait(p);
}

export async function removerProjetoSite(id: string) {
  const p = db.projetosSite.find((x) => x.id === id);
  if (p) p.ativo = false;
  return wait(true);
}

/** Percentual de etapas concluídas — é o que a barra do card mostra. */
export function progressoSite(site: ProjetoSite): number {
  if (site.checklist.length === 0) return 0;
  const feitas = site.checklist.filter((e) => e.feito).length;
  return Math.round((feitas / site.checklist.length) * 100);
}

/* ---------------- redes sociais ---------------- */

export const listarPerfisSociais = (empresa_id: string) =>
  wait(db.perfisSociais.filter((p) => p.empresa_id === empresa_id && p.ativo));

export const listarTodosPerfis = () => wait(db.perfisSociais.filter((p) => p.ativo));

export async function salvarPerfilSocial(
  dados: Partial<PerfilSocial> & { empresa_id: string; rede: PerfilSocial["rede"]; usuario: string }
) {
  if (dados.id) {
    const i = db.perfisSociais.findIndex((p) => p.id === dados.id);
    if (i >= 0) {
      // Mexeu no número de seguidores: a data da medição acompanha.
      const mudouSeguidores =
        dados.seguidores !== undefined && dados.seguidores !== db.perfisSociais[i].seguidores;
      db.perfisSociais[i] = {
        ...db.perfisSociais[i],
        ...dados,
        medido_em: mudouSeguidores ? agora().slice(0, 10) : db.perfisSociais[i].medido_em,
      };
    }
    return wait(db.perfisSociais[i] ?? null);
  }
  const novo: PerfilSocial = {
    id: `ps-${uid()}`,
    empresa_id: dados.empresa_id,
    rede: dados.rede,
    usuario: dados.usuario,
    url: dados.url ?? null,
    seguidores: dados.seguidores ?? null,
    medido_em: dados.seguidores != null ? agora().slice(0, 10) : null,
    ativo: true,
  };
  db.perfisSociais.push(novo);

  const jaTem = db.projetos.some(
    (p) => p.empresa_id === dados.empresa_id && p.tipo === "social" && p.ativo
  );
  if (!jaTem) await lancarFrente(dados.empresa_id, "social", null);

  return wait(novo);
}

export async function removerPerfilSocial(id: string) {
  const p = db.perfisSociais.find((x) => x.id === id);
  if (p) p.ativo = false;
  return wait(true);
}

export const listarPublicacoes = (empresa_id: string) =>
  wait(db.publicacoes.filter((p) => p.empresa_id === empresa_id)
    .sort((a, b) => (b.data_prevista ?? "").localeCompare(a.data_prevista ?? "")));

export async function salvarPublicacao(
  dados: Partial<Publicacao> & { empresa_id: string; titulo: string }
) {
  if (dados.id) {
    const i = db.publicacoes.findIndex((p) => p.id === dados.id);
    if (i >= 0) {
      const virouPublicado = dados.status === "publicado" && db.publicacoes[i].status !== "publicado";
      db.publicacoes[i] = {
        ...db.publicacoes[i],
        ...dados,
        publicado_em: virouPublicado ? agora().slice(0, 10) : db.publicacoes[i].publicado_em,
      };
    }
    return wait(db.publicacoes[i] ?? null);
  }
  const nova: Publicacao = {
    id: `pb-${uid()}`,
    empresa_id: dados.empresa_id,
    titulo: dados.titulo,
    redes: dados.redes ?? [],
    formato: dados.formato ?? "feed",
    status: dados.status ?? "ideia",
    data_prevista: dados.data_prevista ?? null,
    publicado_em: dados.status === "publicado" ? agora().slice(0, 10) : null,
    legenda: dados.legenda ?? null,
    link: dados.link ?? null,
    responsavel_id: dados.responsavel_id ?? null,
    created_at: agora(),
  };
  db.publicacoes.push(nova);
  return wait(nova);
}

export async function removerPublicacao(id: string) {
  db.publicacoes = db.publicacoes.filter((p) => p.id !== id);
  return wait(true);
}

/* ---------------- oportunidades de venda ---------------- */

/** Tudo que a agência vende. `cs` fica de fora: não é serviço, é o atendimento. */
export const frentesVendaveis: TipoProjeto[] = [
  "trafego", "seo", "inbound", "rd", "sites", "social",
];

/**
 * O que dá para oferecer a este cliente: as frentes que a agência vende menos as
 * que ele já tem ativas. O registro guardado é só o que já foi ofertado.
 */
export const listarOportunidades = (empresa_id: string) => {
  const ativas = new Set(
    db.projetos.filter((p) => p.empresa_id === empresa_id && p.ativo).map((p) => p.tipo)
  );
  return wait(
    frentesVendaveis
      .filter((tipo) => !ativas.has(tipo))
      .map((tipo) => {
        const registro = db.oportunidades.find(
          (o) => o.empresa_id === empresa_id && o.tipo === tipo
        );
        return registro ?? {
          id: `op-novo-${tipo}`,
          empresa_id,
          tipo,
          ofertado: false,
          ofertado_em: null,
          ofertado_por: null,
          resposta: "sem_resposta" as RespostaOferta,
          observacao: null,
        };
      })
  );
};

export async function marcarOferta(dados: {
  empresa_id: string;
  tipo: TipoProjeto;
  ofertado: boolean;
  ofertado_por: string | null;
}) {
  const atual = db.oportunidades.find(
    (o) => o.empresa_id === dados.empresa_id && o.tipo === dados.tipo
  );
  if (atual) {
    atual.ofertado = dados.ofertado;
    atual.ofertado_em = dados.ofertado ? agora() : null;
    atual.ofertado_por = dados.ofertado ? dados.ofertado_por : null;
    // Desmarcar a oferta zera a resposta: não há resposta sem pergunta.
    if (!dados.ofertado) atual.resposta = "sem_resposta";
    return wait(atual);
  }
  const nova: OportunidadeVenda = {
    id: `op-${uid()}`,
    empresa_id: dados.empresa_id,
    tipo: dados.tipo,
    ofertado: dados.ofertado,
    ofertado_em: dados.ofertado ? agora() : null,
    ofertado_por: dados.ofertado ? dados.ofertado_por : null,
    resposta: "sem_resposta",
    observacao: null,
  };
  db.oportunidades.push(nova);
  return wait(nova);
}

export async function responderOferta(
  empresa_id: string,
  tipo: TipoProjeto,
  resposta: RespostaOferta,
  observacao?: string | null
) {
  const atual = db.oportunidades.find((o) => o.empresa_id === empresa_id && o.tipo === tipo);
  if (!atual) return wait(null);
  atual.resposta = resposta;
  if (observacao !== undefined) atual.observacao = observacao;
  return wait(atual);
}

/* ---------------- notificações internas ---------------- */

/** Silenciado só quando existe preferência gravada dizendo que sim. */
function querReceber(user_id: string, tipo: TipoNotificacao): boolean {
  const pref = db.preferenciasNotificacao.find(
    (p) => p.user_id === user_id && p.tipo === tipo
  );
  return pref ? pref.ativo : true;
}

/**
 * Cria o aviso para cada destinatário. Ninguém é notificado do que fez —
 * o autor da ação sai da lista.
 */
function notificar(dados: {
  destinatarios: string[];
  tipo: TipoNotificacao;
  tarefa_id: string | null;
  autor_id: string | null;
  autor_nome: string;
  texto: string;
  chave?: string;
}) {
  const alvos = [...new Set(dados.destinatarios)]
    .filter((uid) => uid && uid !== dados.autor_id)
    .filter((uid) => querReceber(uid, dados.tipo));

  alvos.forEach((user_id) => {
    // `chave` impede repetir o mesmo aviso (usada nos avisos de prazo).
    if (dados.chave && db.notificacoes.some((n) => n.user_id === user_id && n.chave === dados.chave)) {
      return;
    }
    db.notificacoes.push({
      id: `nt-${uid()}`,
      user_id,
      tipo: dados.tipo,
      tarefa_id: dados.tarefa_id,
      autor_id: dados.autor_id,
      autor_nome: dados.autor_nome,
      texto: dados.texto,
      lida: false,
      created_at: agora(),
      chave: dados.chave ?? null,
    });
  });
}

/** Quem tem interesse na tarefa: responsáveis e observadores. */
function envolvidos(t: Tarefa): string[] {
  return [...t.responsaveis, ...t.observadores];
}

const nomeDe = (user_id: string | null) =>
  db.profiles.find((p) => p.user_id === user_id)?.nome ?? "Alguém";

/**
 * Avisos de prazo não têm quem os dispare: nascem da passagem do tempo.
 * São gerados na hora de listar, e a `chave` garante que cada tarefa
 * gere o aviso uma vez só.
 */
function sincronizarPrazos(user_id: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  db.tarefas_internas
    .filter((t) => t.responsaveis.includes(user_id) && t.prazo && !ehConcluido(t.status_id))
    .forEach((t) => {
      const vencido = t.prazo! < hoje;
      notificar({
        destinatarios: [user_id],
        tipo: vencido ? "atrasada" : "prazo_proximo",
        tarefa_id: t.id,
        autor_id: null,
        autor_nome: "Central Interna",
        texto: vencido
          ? `"${t.titulo}" passou do prazo.`
          : `"${t.titulo}" vence amanhã.`,
        chave: vencido ? `atraso:${t.id}` : `prazo:${t.id}`,
      });
      // Só o aviso de véspera; nos outros dias não há o que dizer.
      if (!vencido && t.prazo !== amanha) {
        db.notificacoes = db.notificacoes.filter(
          (n) => !(n.user_id === user_id && n.chave === `prazo:${t.id}` && !n.lida)
        );
      }
    });
}

export const listarNotificacoes = (user_id: string) => {
  sincronizarPrazos(user_id);
  return wait(
    db.notificacoes
      .filter((n) => n.user_id === user_id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
  );
};

export async function marcarNotificacaoLida(id: string) {
  const n = db.notificacoes.find((x) => x.id === id);
  if (n) n.lida = true;
  return wait(true);
}

export async function marcarTodasLidas(user_id: string) {
  db.notificacoes.filter((n) => n.user_id === user_id).forEach((n) => { n.lida = true; });
  return wait(true);
}

export async function limparNotificacoes(user_id: string) {
  db.notificacoes = db.notificacoes.filter((n) => n.user_id !== user_id);
  return wait(true);
}

export const listarPreferencias = (user_id: string) =>
  wait(db.preferenciasNotificacao.filter((p) => p.user_id === user_id));

export async function salvarPreferencia(user_id: string, tipo: TipoNotificacao, ativo: boolean) {
  const atual = db.preferenciasNotificacao.find((p) => p.user_id === user_id && p.tipo === tipo);
  if (atual) atual.ativo = ativo;
  else db.preferenciasNotificacao.push({ user_id, tipo, ativo });
  return wait(true);
}

/* ---------------- equipes da agência ---------------- */

export const listarEquipes = () => wait(db.equipes);

export async function salvarEquipe(dados: Partial<Equipe> & { nome: string; cor: string }) {
  if (dados.id) {
    const i = db.equipes.findIndex((e) => e.id === dados.id);
    if (i >= 0) db.equipes[i] = { ...db.equipes[i], ...dados };
    return wait(db.equipes[i] ?? null);
  }
  const nova: Equipe = {
    id: `eq-${uid()}`, nome: dados.nome, cor: dados.cor, membros: dados.membros ?? [],
  };
  db.equipes.push(nova);
  return wait(nova);
}

export async function removerEquipe(id: string) {
  db.equipes = db.equipes.filter((e) => e.id !== id);
  return wait(true);
}

export async function alternarMembroEquipe(equipe_id: string, user_id: string) {
  const e = db.equipes.find((x) => x.id === equipe_id);
  if (!e) return wait(null);
  e.membros = e.membros.includes(user_id)
    ? e.membros.filter((m) => m !== user_id)
    : [...e.membros, user_id];
  return wait(e);
}

/** Times a que a pessoa pertence — usado para etiquetar quem é quem no quadro. */
export const equipesDaPessoa = (user_id: string): Equipe[] =>
  db.equipes.filter((e) => e.membros.includes(user_id));

/* ---- observadores ---- */

/** Observador acompanha a tarefa sem ser responsável por ela. */
export async function alternarObservador(tarefa_id: string, user_id: string) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  const entrou = !t.observadores.includes(user_id);
  t.observadores = entrou
    ? [...t.observadores, user_id]
    : t.observadores.filter((o) => o !== user_id);

  if (entrou) {
    notificar({
      destinatarios: [user_id],
      tipo: "observando",
      tarefa_id: t.id,
      autor_id: null,
      autor_nome: "Central Interna",
      texto: `Você passou a acompanhar "${t.titulo}".`,
    });
  }
  return wait(t);
}

/* ---- anexos e links ---- */

export async function adicionarLink(tarefa_id: string, rotulo: string, url: string) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.links.push({ id: `lk-${uid()}`, rotulo, url });
  return wait(t);
}

export async function removerLink(tarefa_id: string, link_id: string) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.links = t.links.filter((l) => l.id !== link_id);
  return wait(t);
}

export async function adicionarAnexo(
  tarefa_id: string,
  dados: { nome: string; tamanho: number; tipo: string; caminho: string },
  autor_id: string | null = null
) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.anexos.push({ id: `ax-${uid()}`, ...dados });
  // Enquanto o Storage do Supabase não está ligado, o arquivo mora no navegador.
  // Se a cota estourar, desfaz em vez de fingir que salvou.
  if (!persistir()) {
    t.anexos.pop();
    throw new Error(
      "Não há espaço no navegador para este arquivo. Remova anexos antigos ou use um arquivo menor."
    );
  }

  notificar({
    destinatarios: envolvidos(t),
    tipo: "anexo",
    tarefa_id: t.id,
    autor_id,
    autor_nome: nomeDe(autor_id),
    texto: `Novo anexo em "${t.titulo}": ${dados.nome}.`,
  });
  return wait(t);
}

export async function removerAnexo(tarefa_id: string, anexo_id: string) {
  const t = db.tarefas_internas.find((x) => x.id === tarefa_id);
  if (!t) return wait(null);
  t.anexos = t.anexos.filter((a) => a.id !== anexo_id);
  return wait(t);
}

/** Tarefas filhas — subtarefa promovida a card próprio, com responsável e prazo. */
export const listarFilhas = (parent_id: string) =>
  wait(db.tarefas_internas.filter((t) => t.parent_id === parent_id));

export const buscarTarefa = (id: string) =>
  wait(db.tarefas_internas.find((t) => t.id === id) ?? null);

/* ---- link exclusivo do cliente ---- */

export const listarAcessos = () => wait(db.acessosCliente.filter((a) => a.ativo));

export const buscarAcessoPorEmpresa = (empresa_id: string) =>
  wait(db.acessosCliente.find((a) => a.empresa_id === empresa_id && a.ativo) ?? null);

export const buscarEmpresaPorToken = (token: string) => {
  const acesso = db.acessosCliente.find((a) => a.token === token && a.ativo);
  if (!acesso) return wait(null);
  acesso.ultimo_acesso = agora();
  return wait(db.empresas.find((e) => e.id === acesso.empresa_id) ?? null);
};

export async function gerarAcessoCliente(empresa_id: string, criado_por: string | null) {
  db.acessosCliente
    .filter((a) => a.empresa_id === empresa_id)
    .forEach((a) => { a.ativo = false; });

  const novo: AcessoCliente = {
    id: `ac-${uid()}`,
    empresa_id,
    token: `${uid()}${uid()}${uid()}`,
    criado_por,
    created_at: agora(),
    ultimo_acesso: null,
    ativo: true,
  };
  db.acessosCliente.push(novo);
  return wait(novo);
}

export async function revogarAcessoCliente(empresa_id: string) {
  db.acessosCliente
    .filter((a) => a.empresa_id === empresa_id)
    .forEach((a) => { a.ativo = false; });
  return wait(true);
}

export const listarNotificacoesCliente = (empresa_id: string) =>
  wait(db.notificacoesCliente.filter((n) => n.empresa_id === empresa_id));

export async function marcarNotificacoesLidas(empresa_id: string) {
  db.notificacoesCliente
    .filter((n) => n.empresa_id === empresa_id)
    .forEach((n) => { n.lida = true; });
  return wait(true);
}

export async function removerTarefa(id: string) {
  db.tarefas_internas = db.tarefas_internas.filter((t) => t.id !== id);
  return wait(true);
}

/* ---------------- implantações RD ---------------- */

export const listarImplantacoes = () =>
  wait(db.implantacoes.filter((i) => i.ativo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export const buscarImplantacao = (id: string) =>
  wait(db.implantacoes.find((i) => i.id === id) ?? null);

export const buscarImplantacaoPorEmpresa = (empresa_id: string) =>
  wait(db.implantacoes.find((i) => i.empresa_id === empresa_id && i.ativo) ?? null);

export async function criarImplantacao(dados: {
  empresa_id: string;
  ferramentas: string[];
  roteiros: Record<string, unknown[]>;
  criado_por: string | null;
}) {
  const existente = db.implantacoes.find((i) => i.empresa_id === dados.empresa_id && i.ativo);
  if (existente) throw new Error("Este cliente já tem uma implantação em andamento.");
  if (dados.ferramentas.length === 0) throw new Error("Escolha ao menos uma ferramenta.");

  const empresa = db.empresas.find((e) => e.id === dados.empresa_id);

  const porFerramenta: Record<string, DadosFerramenta> = {};
  dados.ferramentas.forEach((f) => {
    porFerramenta[f] = {
      fases: dados.roteiros[f] ?? [],
      responsavel_id: empresa?.responsavel_id ?? null,
      escopo: "",
      briefing: {},
    };
  });

  const nova: ImplantacaoRD = {
    id: `imp-${uid()}`,
    empresa_id: dados.empresa_id,
    ferramentas: dados.ferramentas,
    dados: porFerramenta,
    criado_por: dados.criado_por,
    created_at: agora(),
    ativo: true,
  };
  db.implantacoes.push(nova);

  // Registra a frente no painel de CS, como as outras.
  const jaTemFrente = db.projetos.some(
    (p) => p.empresa_id === dados.empresa_id && p.tipo === "rd" && p.ativo
  );
  if (!jaTemFrente) {
    db.projetos.push({
      id: `prj-${uid()}`, empresa_id: dados.empresa_id, tipo: "rd",
      nome: "Implantação RD", status: "em_andamento",
      responsavel_id: empresa?.responsavel_id ?? null, mrr: 0,
      inicio: agora().slice(0, 10), renovacao: null, flag: "green",
      observacoes: null, cliente_id: null, projeto_seo_id: null,
      created_at: agora(), ativo: true,
    });
  }

  return wait(nova);
}

export async function atualizarFerramenta(
  implantacao_id: string,
  ferramenta: string,
  mudanca: Partial<DadosFerramenta>
) {
  const i = db.implantacoes.find((x) => x.id === implantacao_id);
  if (!i) return wait(null);
  i.dados[ferramenta] = { ...i.dados[ferramenta], ...mudanca };
  return wait(i);
}

export async function encerrarImplantacao(id: string) {
  const i = db.implantacoes.find((x) => x.id === id);
  if (!i) return wait(true);
  i.ativo = false;
  db.projetos
    .filter((p) => p.empresa_id === i.empresa_id && p.tipo === "rd" && p.ativo)
    .forEach((p) => { p.ativo = false; });
  return wait(true);
}

export const listarNotasImplantacao = (implantacao_id: string) =>
  wait(db.notasImplantacao.filter((n) => n.implantacao_id === implantacao_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)));

export async function criarNotaImplantacao(dados: {
  implantacao_id: string;
  autor_id: string | null;
  autor_nome: string;
  conteudo: string;
  link_reuniao: string | null;
  anexo_nome: string | null;
}) {
  const nova: NotaImplantacao = { ...dados, id: `ni-${uid()}`, created_at: agora() };
  db.notasImplantacao.unshift(nova);
  return wait(nova);
}

export async function removerNotaImplantacao(id: string) {
  db.notasImplantacao = db.notasImplantacao.filter((n) => n.id !== id);
  return wait(true);
}

/* ---------------- equipe alocada no cliente ---------------- */

export const listarEquipe = (empresa_id: string) =>
  wait(db.equipe.filter((a) => a.empresa_id === empresa_id));

export const listarTodasAlocacoes = () => wait(db.equipe);

export async function alocarNaEquipe(dados: {
  empresa_id: string;
  user_id: string;
  funcao: FuncaoEquipe;
  principal: boolean;
}) {
  const repetida = db.equipe.find(
    (a) => a.empresa_id === dados.empresa_id && a.user_id === dados.user_id && a.funcao === dados.funcao
  );
  if (repetida) throw new Error("Esta pessoa já está alocada nesta função.");

  if (dados.principal) {
    db.equipe
      .filter((a) => a.empresa_id === dados.empresa_id && a.funcao === dados.funcao)
      .forEach((a) => { a.principal = false; });
  }

  const nova: AlocacaoEquipe = { ...dados, id: `al-${uid()}` };
  db.equipe.push(nova);

  // O responsável da conta acompanha quem é o principal de CS.
  if (dados.funcao === "cs" && dados.principal) {
    const e = db.empresas.find((x) => x.id === dados.empresa_id);
    if (e) e.responsavel_id = dados.user_id;
  }

  return wait(nova);
}

export async function removerAlocacao(id: string) {
  db.equipe = db.equipe.filter((a) => a.id !== id);
  return wait(true);
}

/* ---------------- projetos de SEO ---------------- */

export const listarProjetosSeo = () =>
  wait(db.projetosSeo.filter((p) => p.ativo)
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em)));

export const buscarProjetoSeoPorCliente = (cliente_id: string) =>
  wait(db.projetosSeo.find((p) => p.cliente_id === cliente_id && p.ativo) ?? null);

export async function lancarProjetoSeo(
  cliente_id: string,
  origem: ProjetoSeo["origem"],
  criado_por: string | null
) {
  const existente = db.projetosSeo.find((p) => p.cliente_id === cliente_id && p.ativo);
  if (existente) throw new Error("Este cliente já tem um projeto de SEO em andamento.");

  const novo: ProjetoSeo = {
    id: `seo-${uid()}`, cliente_id, origem, criado_por,
    criado_em: agora(), ativo: true,
  };
  db.projetosSeo.push(novo);

  // Registra a frente no painel de CS, para o projeto aparecer na ficha do cliente
  // independentemente de por onde ele foi aberto.
  const jaTemFrente = db.projetos.some(
    (p) => p.empresa_id === cliente_id && p.tipo === "seo" && p.ativo
  );
  if (!jaTemFrente) {
    const empresa = db.empresas.find((e) => e.id === cliente_id);
    db.projetos.push({
      id: `prj-${uid()}`,
      empresa_id: cliente_id,
      tipo: "seo",
      nome: "SEO / GEO",
      status: "em_andamento",
      responsavel_id: empresa?.responsavel_id ?? null,
      mrr: 0,
      inicio: agora().slice(0, 10),
      renovacao: null,
      flag: "green",
      observacoes: null,
      cliente_id: null,
      projeto_seo_id: novo.id,
      created_at: agora(),
      ativo: true,
    });
  }

  return wait(novo);
}

export async function encerrarProjetoSeo(id: string) {
  const p = db.projetosSeo.find((x) => x.id === id);
  if (!p) return wait(true);
  p.ativo = false;

  db.projetos
    .filter((x) => x.empresa_id === p.cliente_id && x.tipo === "seo" && x.ativo)
    .forEach((x) => { x.ativo = false; });

  return wait(true);
}

/* ---------------- vendas ---------------- */

export const listarNegocios = () => wait(db.negocios);

/* ---------------- integrações e painéis ---------------- */

export const listarIntegracoes = () => wait(db.integracoes);

export async function salvarIntegracao(chave: IntegracaoChave, conectada: boolean) {
  const i = db.integracoes.find((x) => x.chave === chave);
  if (i) {
    i.conectada = conectada;
    i.ultima_sincronizacao = conectada ? agora() : null;
  }
  return wait(i ?? null);
}

export const listarPaineis = () => wait(db.paineis);
export const buscarPainel = (chave: PainelExternoChave) =>
  wait(db.paineis.find((p) => p.chave === chave) ?? null);

export async function salvarUrlPainel(chave: PainelExternoChave, url: string | null) {
  const p = db.paineis.find((x) => x.chave === chave);
  if (p) p.url = url;
  return wait(p ?? null);
}
