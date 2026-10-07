import { clienteAdmin, exigirMaster } from "../_compartilhado/auth.ts";
import { erro, json, preflight } from "../_compartilhado/cors.ts";

/**
 * Criação e manutenção de usuários.
 *
 * Só o master chama. A validação é feita aqui, no servidor — nunca confiando
 * em papel enviado pelo cliente.
 *
 * POST { acao: "criar", email, nome, cpf, telefone, contato_emergencia_nome,
 *        contato_emergencia_telefone, data_admissao, data_nascimento?, cargo?,
 *        departamento?, role, modulos[], enviar_convite }
 * POST { acao: "reenviar_convite", user_id }
 * POST { acao: "desativar" | "reativar", user_id }
 */

interface CorpoCriar {
  acao: "criar";
  email: string;
  nome: string;
  cpf: string;
  telefone: string;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;
  data_admissao: string;
  data_nascimento?: string | null;
  cargo?: string | null;
  departamento?: string | null;
  role: "master" | "gerente" | "funcionario";
  modulos: string[];
  enviar_convite: boolean;
}

type Corpo =
  | CorpoCriar
  | { acao: "reenviar_convite"; user_id: string }
  | { acao: "desativar" | "reativar"; user_id: string };

function cpfValido(valor: string): boolean {
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

/**
 * Para onde o link do convite leva: a tela em que a pessoa cria a senha.
 * SITE_URL é o endereço publicado da Central, definido nos segredos da função.
 * Sem ele, o Supabase usa o endereço padrão configurado no projeto.
 */
function destinoDoConvite(): string | undefined {
  const site = Deno.env.get("SITE_URL");
  return site ? `${site.replace(/\/$/, "")}/definir-senha` : undefined;
}

/** As mensagens do Supabase vêm em inglês; estas são as que o cadastro de fato encontra. */
function traduzir(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("already been registered") || m.includes("already registered") || m.includes("email_exists")) {
    return "Já existe um colaborador com este e-mail.";
  }
  if (m.includes("profiles_cpf_key")) return "Já existe um colaborador com este CPF.";
  if (m.includes("rate limit")) return "Limite de envio de e-mails atingido. Tente de novo em alguns minutos.";
  if (m.includes("invalid input value for enum")) return "Papel ou painel desconhecido.";
  return mensagem;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const autorizado = await exigirMaster(req);
    if (!autorizado.ok) return erro(autorizado.mensagem, autorizado.status);

    const corpo = (await req.json()) as Corpo;
    const admin = clienteAdmin();

    if (corpo.acao === "criar") {
      if (!corpo.email?.includes("@")) return erro("E-mail inválido.");
      if (!corpo.nome || corpo.nome.trim().length < 3) return erro("Nome muito curto.");
      if (!cpfValido(corpo.cpf ?? "")) return erro("CPF inválido.");
      if (!corpo.data_admissao) return erro("Data de admissão é obrigatória.");
      if (!["master", "gerente", "funcionario"].includes(corpo.role)) return erro("Papel desconhecido.");

      const email = corpo.email.trim().toLowerCase();

      // Conferido antes de criar a conta: descobrir o CPF repetido só depois
      // significaria já ter mandado o convite para alguém que não será cadastrado.
      const digitos = (v: string) => v.replace(/\D/g, "");
      const { data: comCpf, error: erroCpf } = await admin
        .from("profiles").select("cpf").not("cpf", "is", null);
      if (erroCpf) return erro(erroCpf.message, 500);
      if ((comCpf ?? []).some((p) => digitos(p.cpf) === digitos(corpo.cpf))) {
        return erro("Já existe um colaborador com este CPF.");
      }

      // inviteUserByEmail cria o usuário e dispara o e-mail de primeiro acesso.
      // Sem convite, cria já confirmado com senha aleatória.
      const criacao = corpo.enviar_convite
        ? await admin.auth.admin.inviteUserByEmail(email, {
            data: { nome: corpo.nome },
            redirectTo: destinoDoConvite(),
          })
        : await admin.auth.admin.createUser({
            email,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: { nome: corpo.nome },
          });

      if (criacao.error) return erro(traduzir(criacao.error.message), 400);
      const userId = criacao.data.user!.id;

      // Se algo falhar daqui em diante, a conta recém-criada é apagada: sem
      // isso o e-mail ficaria preso a um cadastro pela metade.
      const desfazer = async (mensagem: string) => {
        await admin.auth.admin.deleteUser(userId);
        return erro(traduzir(mensagem), 400);
      };

      // O trigger handle_new_user já criou profile + role 'funcionario'.
      const { error: erroPerfil } = await admin
        .from("profiles")
        .update({
          nome: corpo.nome.trim(),
          cpf: corpo.cpf,
          telefone: corpo.telefone,
          contato_emergencia_nome: corpo.contato_emergencia_nome,
          contato_emergencia_telefone: corpo.contato_emergencia_telefone,
          data_admissao: corpo.data_admissao,
          data_nascimento: corpo.data_nascimento ?? null,
          cargo: corpo.cargo ?? null,
          departamento: corpo.departamento ?? null,
          convite_enviado_em: corpo.enviar_convite ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);

      if (erroPerfil) return desfazer(erroPerfil.message);

      if (corpo.role !== "funcionario") {
        const { error: erroPapel } = await admin
          .from("user_roles")
          .update({ role: corpo.role })
          .eq("user_id", userId);
        if (erroPapel) return desfazer(erroPapel.message);
      }

      if (corpo.role !== "master" && corpo.modulos?.length) {
        const { error: erroModulos } = await admin
          .from("user_permissoes")
          .insert(corpo.modulos.map((modulo) => ({ user_id: userId, modulo })));
        if (erroModulos) return desfazer(erroModulos.message);
      }

      return json({ user_id: userId, convite_enviado: corpo.enviar_convite });
    }

    if (corpo.acao === "reenviar_convite") {
      const { data: perfil } = await admin
        .from("profiles").select("email").eq("user_id", corpo.user_id).maybeSingle();
      if (!perfil?.email) return erro("Colaborador não encontrado.", 404);

      // O convite só existe para conta nova. Quem já foi convidado recebe o link
      // de criar senha, que leva para a mesma tela.
      const { error } = await admin.auth.resetPasswordForEmail(perfil.email, {
        redirectTo: destinoDoConvite(),
      });
      if (error) return erro(traduzir(error.message), 400);

      await admin.from("profiles")
        .update({ convite_enviado_em: new Date().toISOString() })
        .eq("user_id", corpo.user_id);

      return json({ ok: true });
    }

    if (corpo.acao === "desativar" || corpo.acao === "reativar") {
      const ativo = corpo.acao === "reativar";
      if (!ativo && corpo.user_id === autorizado.userId) {
        return erro("Você não pode desativar a própria conta.");
      }
      const { error } = await admin
        .from("profiles").update({ ativo }).eq("user_id", corpo.user_id);
      if (error) return erro(error.message, 400);

      // Bloqueia o login de quem foi desativado.
      await admin.auth.admin.updateUserById(corpo.user_id, {
        ban_duration: ativo ? "none" : "876000h",
      });

      return json({ ok: true, ativo });
    }

    return erro("Ação desconhecida.", 400);
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Erro inesperado.", 500);
  }
});
