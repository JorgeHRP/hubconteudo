import type { AppModulo, AppRole } from "./types";

export const roleLabels: Record<AppRole, string> = {
  master: "Master",
  gerente: "Gerente",
  funcionario: "Funcionário",
};

export const roleDescricoes: Record<AppRole, string> = {
  master: "Acesso total, inclusive a papéis e permissões",
  gerente: "Gestão de pessoas e painéis liberados",
  funcionario: "Hub interno e os próprios documentos",
};

export const moduloLabels: Record<AppModulo, string> = {
  clientes: "Gestão de Clientes",
  tarefas: "Tarefas",
  colaboradores: "Gestão de Colaboradores",
  cs: "Painel de CS",
  vendas: "Resultados de Vendas",
  financeiro: "Dashboard Financeiro",
  viagens_aprovacao: "Aprovar Relatórios de Viagem",
  trafego: "Gestão de Tráfego",
  seo_geo: "Gestão de SEO/GEO",
  projetos_rd: "Projetos de Implantação RD",
  inbound: "Inbound",
  sites: "Sites e Hotsites",
  social: "Gestão de Redes Sociais",
};

export const moduloDescricoes: Record<AppModulo, string> = {
  inbound: "Catálogo em pontos, plano do mês, pautas e réguas de nutrição",
  sites: "Sites e hotsites: escopo, ambiente, prazos e publicação",
  social: "Perfis, calendário de publicação e desempenho por rede",
  clientes: "Empresas, contatos, projetos por frente e conquistas",
  tarefas: "Quadro de tarefas, prazos, responsáveis e indicadores",
  colaboradores: "Cadastrar pessoas, enviar contracheques e ver o ponto",
  cs: "Carteira de clientes, termômetro de churn e análise por IA",
  vendas: "Funil comercial vindo do RD Station",
  financeiro: "Receitas, despesas e integrações contábeis",
  viagens_aprovacao: "Analisar comprovantes e aprovar reembolsos",
  trafego: "Painel externo de gestão de tráfego",
  seo_geo: "Painel externo de SEO e GEO",
  projetos_rd: "Painel externo de implantação RD Station",
};

export function getInitials(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function formatCPF(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

/** Validação real de CPF (dígitos verificadores), não só formato. */
export function cpfValido(valor: string): boolean {
  const cpf = valor.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(cpf[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}
