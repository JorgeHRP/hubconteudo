// Testa as migrações e as regras de acesso sem precisar de Docker nem de internet.
//
//   npm run db:testar
//
// Sobe um Postgres em memória (PGlite), aplica supabase/migrations/ na ordem e
// entra como cada tipo de pessoa para conferir o que ela vê e o que não vê.
// Mexeu em policy ou em função de papel? Rode antes de subir para o banco real.
//
// O que é imitado do Supabase: os papéis anon/authenticated, auth.uid(), a tabela
// auth.users e o storage. O resto é Postgres de verdade.

import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRACOES = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const db = new PGlite();
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select current_user::text $$;
  grant execute on all functions in schema auth to anon, authenticated;

  create table storage.buckets (id text primary key, name text, public boolean default false);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid
  );
  alter table storage.objects enable row level security;
  grant all on storage.objects, storage.buckets to anon, authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant execute on function storage.foldername(text) to anon, authenticated;
  create publication supabase_realtime;

  -- Faz o papel das tabelas que já existem no projeto e não são da Central.
  create table public.tabela_de_fora (id int primary key, valor text);
  insert into public.tabela_de_fora values (1, 'intacta');
`);

for (const arquivo of readdirSync(MIGRACOES).filter((f) => f.endsWith(".sql")).sort()) {
  try {
    await db.exec(readFileSync(join(MIGRACOES, arquivo), "utf8"));
  } catch (e) {
    console.error(`FALHOU ao aplicar ${arquivo}: ${e.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Pessoas
// ---------------------------------------------------------------------------

const id = (n) => `00000000-0000-0000-0000-00000000000${n}`;
const MASTER = id(1);      // master
const GERENTE = id(2);     // gerente sem nenhum painel liberado
const GERENTE_CS = id(3);  // gerente com o painel de CS
const ANA = id(4);         // funcionária comum
const BRUNO = id(5);       // funcionário comum
const RH = id(6);          // funcionária com o módulo colaboradores
const FINANCEIRO = id(7);  // funcionário que aprova viagens
const VENDEDOR = id(8);    // funcionário com o painel de vendas

await db.exec(`
  insert into auth.users (id, email) values
    ('${MASTER}', 'master@teste'), ('${GERENTE}', 'gerente@teste'),
    ('${GERENTE_CS}', 'gerentecs@teste'), ('${ANA}', 'ana@teste'),
    ('${BRUNO}', 'bruno@teste'), ('${RH}', 'rh@teste'),
    ('${FINANCEIRO}', 'financeiro@teste'), ('${VENDEDOR}', 'vendedor@teste');

  update public.user_roles set role = 'master'  where user_id = '${MASTER}';
  update public.user_roles set role = 'gerente' where user_id in ('${GERENTE}', '${GERENTE_CS}');

  insert into public.user_permissoes (user_id, modulo) values
    ('${GERENTE_CS}', 'cs'), ('${RH}', 'colaboradores'),
    ('${FINANCEIRO}', 'viagens_aprovacao'), ('${VENDEDOR}', 'vendas');

  update public.profiles set cpf = '111.111.111-11', contato_emergencia_nome = 'Mãe da Ana'
    where user_id = '${ANA}';
  update public.profiles set cpf = '222.222.222-22' where user_id = '${BRUNO}';

  insert into public.documentos (user_id, nome, categoria) values
    ('${BRUNO}', 'Contracheque do Bruno', 'contracheque'),
    (null, 'Manual interno', 'manual');

  insert into public.clientes (id, nome, responsavel_id) values
    ('10000000-0000-0000-0000-000000000001', 'Cliente da Ana', '${ANA}'),
    ('10000000-0000-0000-0000-000000000002', 'Cliente sem dono', null);

  insert into public.vendas_negocios (nome) values ('Negócio X');
  insert into public.lancamentos_financeiros (tipo, descricao, valor, competencia, origem)
    values ('receita', 'Mensalidade', 1000, current_date, 'conta_azul');

  insert into public.solicitacoes (solicitante_id, categoria, titulo, descricao)
    values ('${BRUNO}', 'ti', 'Notebook', 'Não liga');

  insert into public.relatorios_viagem (id, colaborador_id, titulo, destino, data_inicio, data_fim)
    values ('20000000-0000-0000-0000-000000000001', '${ANA}', 'Visita', 'Goiânia', current_date, current_date);
`);

// ---------------------------------------------------------------------------
// Ferramentas
// ---------------------------------------------------------------------------

/** Roda o SQL como a pessoa informada (ou como visitante sem login, com null). */
async function como(quem, sql) {
  try {
    return await db.transaction(async (tx) => {
      await tx.exec(`set local role ${quem ? "authenticated" : "anon"}`);
      if (quem) await tx.exec(`set local request.jwt.claim.sub = '${quem}'`);
      const r = await tx.query(sql);
      // Desfaz sempre: um teste não pode deixar dado para o seguinte.
      await tx.rollback();
      return { linhas: r.rows, erro: null };
    });
  } catch (e) {
    return { linhas: [], erro: e.message };
  }
}

let passou = 0;
const falhas = [];

function conferir(nome, ok, detalhe = "") {
  if (ok) passou++;
  else falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

/** A consulta devolve exatamente `n` linhas. */
async function ve(nome, quem, sql, n) {
  const r = await como(quem, sql);
  conferir(nome, !r.erro && r.linhas.length === n, r.erro ?? `esperava ${n}, veio ${r.linhas.length}`);
}

/** A ação não tem efeito: ou dá erro de permissão, ou não alcança nenhuma linha. */
async function barrado(nome, quem, sql) {
  const r = await como(quem, sql);
  conferir(nome, Boolean(r.erro) || r.linhas.length === 0, `passou e afetou ${r.linhas.length} linha(s)`);
}

/** A ação funciona e alcança pelo menos uma linha. */
async function permitido(nome, quem, sql) {
  const r = await como(quem, sql);
  conferir(nome, !r.erro && r.linhas.length > 0, r.erro ?? "não alcançou nenhuma linha");
}

async function funcao(nome, sql, esperado) {
  const r = await como(MASTER, `select ${sql} as v`);
  conferir(nome, !r.erro && r.linhas[0].v === esperado, r.erro ?? `veio ${r.linhas[0]?.v}`);
}

// ---------------------------------------------------------------------------
// 1. Funções de papel (SECURITY DEFINER)
// ---------------------------------------------------------------------------

await funcao("is_master: master", `public.is_master('${MASTER}')`, true);
await funcao("is_master: gerente não é", `public.is_master('${GERENTE}')`, false);
await funcao("is_master: funcionário não é", `public.is_master('${ANA}')`, false);
await funcao("is_gestor: master", `public.is_gestor('${MASTER}')`, true);
await funcao("is_gestor: gerente", `public.is_gestor('${GERENTE}')`, true);
await funcao("is_gestor: funcionário não é", `public.is_gestor('${ANA}')`, false);
await funcao("has_role: gerente", `public.has_role('${GERENTE}', 'gerente')`, true);
await funcao("has_role: gerente não é master", `public.has_role('${GERENTE}', 'master')`, false);
await funcao("has_modulo: master tem tudo", `public.has_modulo('${MASTER}', 'financeiro')`, true);
await funcao("has_modulo: gerente sem liberação não tem", `public.has_modulo('${GERENTE}', 'cs')`, false);
await funcao("has_modulo: gerente com liberação tem", `public.has_modulo('${GERENTE_CS}', 'cs')`, true);
await funcao("has_modulo: liberação de um painel não vale para outro", `public.has_modulo('${GERENTE_CS}', 'financeiro')`, false);
await funcao("has_modulo: funcionário sem liberação não tem", `public.has_modulo('${ANA}', 'cs')`, false);
await funcao("has_modulo: id que não existe", `public.has_modulo('${id(9)}', 'cs')`, false);
await funcao("has_modulo: sem usuário", `public.has_modulo(null, 'cs')`, false);
await funcao("apelido is_admin_or_master segue is_gestor", `public.is_admin_or_master('${GERENTE}')`, true);
await funcao("apelido is_admin_master_or_rh segue o módulo colaboradores", `public.is_admin_master_or_rh('${RH}')`, true);
await funcao("apelido is_admin_master_or_rh: gerente sem o módulo", `public.is_admin_master_or_rh('${GERENTE}')`, false);

await barrado("visitante sem login não chama is_master", null, `select public.is_master('${MASTER}')`);
await barrado("visitante sem login não chama has_modulo", null, `select public.has_modulo('${MASTER}', 'cs')`);

await ve("usuário novo nasce com perfil", MASTER, `select 1 from public.profiles where user_id = '${ANA}'`, 1);
await ve("usuário novo nasce funcionário", MASTER, `select 1 from public.user_roles where user_id = '${ANA}' and role = 'funcionario'`, 1);

// ---------------------------------------------------------------------------
// 2. Ninguém se promove
// ---------------------------------------------------------------------------

await barrado("funcionário não vira master", ANA, `update public.user_roles set role = 'master' where user_id = '${ANA}' returning 1`);
await barrado("funcionário não cria papel para si", ANA, `insert into public.user_roles (user_id, role) values ('${ANA}', 'master') returning 1`);
await barrado("gerente não vira master", GERENTE, `update public.user_roles set role = 'master' where user_id = '${GERENTE}' returning 1`);
await barrado("gerente não promove outra pessoa", GERENTE, `update public.user_roles set role = 'gerente' where user_id = '${ANA}' returning 1`);
await barrado("gerente não libera painel para si", GERENTE, `insert into public.user_permissoes (user_id, modulo) values ('${GERENTE}', 'financeiro') returning 1`);
await barrado("funcionário não libera painel para si", ANA, `insert into public.user_permissoes (user_id, modulo) values ('${ANA}', 'cs') returning 1`);
await barrado("gerente não tira papel de ninguém", GERENTE, `delete from public.user_roles where user_id = '${ANA}' returning 1`);
await permitido("master muda papel", MASTER, `update public.user_roles set role = 'gerente' where user_id = '${ANA}' returning 1`);
await permitido("master libera painel", MASTER, `insert into public.user_permissoes (user_id, modulo) values ('${ANA}', 'cs') returning 1`);

// ---------------------------------------------------------------------------
// 3. Colaboradores: CPF e contato de emergência
// ---------------------------------------------------------------------------

await ve("todo mundo vê o diretório", ANA, `select nome from public.profiles`, 8);
await barrado("CPF não sai direto da tabela", BRUNO, `select cpf from public.profiles`);
await barrado("contato de emergência não sai direto da tabela", BRUNO, `select contato_emergencia_nome from public.profiles`);
await barrado("nem o master lê CPF direto da tabela (só pela view)", MASTER, `select cpf from public.profiles`);
await ve("dono vê o próprio CPF", ANA, `select 1 from public.colaboradores_publico where user_id = '${ANA}' and cpf is not null`, 1);
await ve("colega não vê o CPF", BRUNO, `select 1 from public.colaboradores_publico where user_id = '${ANA}' and cpf is not null`, 0);
await ve("colega não vê o contato de emergência", BRUNO, `select 1 from public.colaboradores_publico where user_id = '${ANA}' and contato_emergencia_nome is not null`, 0);
await ve("gerente sem o módulo não vê o CPF", GERENTE, `select 1 from public.colaboradores_publico where user_id = '${ANA}' and cpf is not null`, 0);
await ve("quem tem colaboradores vê o CPF", RH, `select 1 from public.colaboradores_publico where user_id = '${ANA}' and cpf is not null`, 1);
await ve("master vê o CPF", MASTER, `select 1 from public.colaboradores_publico where cpf is not null`, 2);
await barrado("visitante sem login não lê a view", null, `select nome from public.colaboradores_publico`);
await barrado("visitante sem login não lê a tabela", null, `select nome from public.profiles`);
await permitido("pessoa edita o próprio telefone", ANA, `update public.profiles set telefone = '62 9' where user_id = '${ANA}' returning id`);
await barrado("pessoa não edita o perfil de outra", ANA, `update public.profiles set nome = 'x' where user_id = '${BRUNO}' returning id`);
await barrado("gerente sem o módulo não edita perfil alheio", GERENTE, `update public.profiles set cargo = 'x' where user_id = '${ANA}' returning id`);
await permitido("quem tem colaboradores edita perfil", RH, `update public.profiles set cargo = 'Analista' where user_id = '${ANA}' returning id`);

// ---------------------------------------------------------------------------
// 4. Documentos e contracheques
// ---------------------------------------------------------------------------

const contracheque = `select 1 from public.documentos where user_id = '${BRUNO}'`;
await ve("dono vê o próprio contracheque", BRUNO, contracheque, 1);
await ve("colega não vê", ANA, contracheque, 0);
await ve("gerente sem o módulo não vê", GERENTE, contracheque, 0);
await ve("quem tem colaboradores vê", RH, contracheque, 1);
await ve("master vê", MASTER, contracheque, 1);
await ve("todos leem o institucional", ANA, `select 1 from public.documentos where user_id is null`, 1);
await ve("visitante sem login não lê nada", null, `select 1 from public.documentos`, 0);
await permitido("gerente publica institucional", GERENTE, `insert into public.documentos (user_id, nome) values (null, 'Política') returning id`);
await permitido("gerente apaga institucional", GERENTE, `delete from public.documentos where user_id is null returning id`);
await barrado("funcionário não publica institucional", ANA, `insert into public.documentos (user_id, nome) values (null, 'x') returning id`);
await barrado("gerente sem o módulo não lança contracheque", GERENTE, `insert into public.documentos (user_id, nome) values ('${ANA}', 'x') returning id`);
await barrado("gerente sem o módulo não apaga contracheque", GERENTE, `delete from public.documentos where user_id = '${BRUNO}' returning id`);
await permitido("quem tem colaboradores lança contracheque", RH, `insert into public.documentos (user_id, nome) values ('${ANA}', 'Contracheque') returning id`);

// ---------------------------------------------------------------------------
// 5. Painéis: só com liberação
// ---------------------------------------------------------------------------

await ve("CS: gerente sem liberação não vê clientes", GERENTE, `select 1 from public.clientes`, 0);
await ve("CS: gerente com liberação vê todos", GERENTE_CS, `select 1 from public.clientes`, 2);
await ve("CS: responsável vê só o próprio cliente", ANA, `select 1 from public.clientes`, 1);
await ve("CS: quem não tem nada a ver não vê", BRUNO, `select 1 from public.clientes`, 0);
await barrado("CS: gerente sem liberação não apaga cliente", GERENTE, `delete from public.clientes returning id`);
await permitido("CS: gerente com liberação apaga cliente", GERENTE_CS, `delete from public.clientes where responsavel_id is null returning id`);
await ve("Vendas: gerente sem liberação não vê", GERENTE, `select 1 from public.vendas_negocios`, 0);
await ve("Vendas: quem tem o painel vê", VENDEDOR, `select 1 from public.vendas_negocios`, 1);
await barrado("Vendas: quem tem o painel não altera negócio", VENDEDOR, `update public.vendas_negocios set valor = 1 returning id`);
await ve("Financeiro: gerente sem liberação não vê", GERENTE, `select 1 from public.lancamentos_financeiros`, 0);
await ve("Financeiro: master vê", MASTER, `select 1 from public.lancamentos_financeiros`, 1);
await ve("SEO: sem liberação não lê os dados", ANA, `select 1 from public.shared_table_data`, 0);

// ---------------------------------------------------------------------------
// 6. Hub
// ---------------------------------------------------------------------------

await ve("solicitação: dono vê a própria", BRUNO, `select 1 from public.solicitacoes`, 1);
await ve("solicitação: colega não vê", ANA, `select 1 from public.solicitacoes`, 0);
await ve("solicitação: gerente vê todas", GERENTE, `select 1 from public.solicitacoes`, 1);
await barrado("solicitação: dono não muda o status", BRUNO, `update public.solicitacoes set status = 'concluida' returning id`);
await permitido("solicitação: gerente trata", GERENTE, `update public.solicitacoes set updated_at = now() returning id`);
await permitido("feed: funcionário publica", ANA, `insert into public.posts (autor_id, conteudo) values ('${ANA}', 'oi') returning id`);
await barrado("feed: funcionário não publica já fixado", ANA, `insert into public.posts (autor_id, conteudo, fixado) values ('${ANA}', 'oi', true) returning id`);
await barrado("feed: ninguém publica em nome de outro", ANA, `insert into public.posts (autor_id, conteudo) values ('${BRUNO}', 'oi') returning id`);
await permitido("feed: gerente publica fixado", GERENTE, `insert into public.posts (autor_id, conteudo, fixado) values ('${GERENTE}', 'aviso', true) returning id`);
await barrado("calendário: funcionário não cria evento", ANA, `insert into public.eventos (titulo, data, criado_por) values ('x', current_date, '${ANA}') returning id`);

// ---------------------------------------------------------------------------
// 7. Viagens
// ---------------------------------------------------------------------------

const viagem = `select 1 from public.relatorios_viagem`;
await ve("viagem: dona vê a própria", ANA, viagem, 1);
await ve("viagem: colega não vê", BRUNO, viagem, 0);
await ve("viagem: gerente sem liberação não vê", GERENTE, viagem, 0);
await ve("viagem: quem aprova vê", FINANCEIRO, viagem, 1);
await barrado("viagem: dona não aprova a própria", ANA, `update public.relatorios_viagem set status = 'aprovado' returning id`);
await permitido("viagem: dona envia", ANA, `update public.relatorios_viagem set status = 'enviado' returning id`);
await permitido("viagem: quem aprova, aprova", FINANCEIRO, `update public.relatorios_viagem set status = 'aprovado' returning id`);
await barrado("viagem: colega não aprova", BRUNO, `update public.relatorios_viagem set status = 'aprovado' returning id`);

// ---------------------------------------------------------------------------
// 8. Storage
// ---------------------------------------------------------------------------

await db.exec(`
  insert into storage.objects (bucket_id, name) values
    ('documentos', '${BRUNO}/contracheque.pdf'),
    ('comprovantes', '${ANA}/recibo.jpg');
`);
const arquivo = (bucket) => `select 1 from storage.objects where bucket_id = '${bucket}'`;
await ve("arquivo: dono baixa o próprio contracheque", BRUNO, arquivo("documentos"), 1);
await ve("arquivo: colega não baixa", ANA, arquivo("documentos"), 0);
await ve("arquivo: gerente sem o módulo não baixa", GERENTE, arquivo("documentos"), 0);
await ve("arquivo: quem tem colaboradores baixa", RH, arquivo("documentos"), 1);
await ve("arquivo: visitante sem login não baixa contracheque", null, arquivo("documentos"), 0);
await ve("comprovante: dona vê", ANA, arquivo("comprovantes"), 1);
await ve("comprovante: colega não vê", BRUNO, arquivo("comprovantes"), 0);
await ve("comprovante: quem aprova vê", FINANCEIRO, arquivo("comprovantes"), 1);
await barrado("comprovante: ninguém sobe na pasta de outro", BRUNO, `insert into storage.objects (bucket_id, name) values ('comprovantes', '${ANA}/x.jpg') returning id`);

// ---------------------------------------------------------------------------
// 9. O que já existia no projeto continua lá
// ---------------------------------------------------------------------------

const fora = await db.query(`select valor from public.tabela_de_fora`);
conferir("tabela de fora da Central segue intacta", fora.rows[0]?.valor === "intacta");

const semRls = await db.query(`
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    and c.relname <> 'tabela_de_fora'`);
conferir("toda tabela da Central tem RLS ligado", semRls.rows.length === 0, semRls.rows.map((r) => r.relname).join(", "));

// ---------------------------------------------------------------------------

console.log(`\n${passou} conferências passaram, ${falhas.length} falharam.`);
if (falhas.length) {
  for (const f of falhas) console.log(`  FALHOU: ${f}`);
  process.exit(1);
}
