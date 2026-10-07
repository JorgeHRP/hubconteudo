# Backend — do local até o ar

Passo a passo do que fazer quando o Docker estiver instalado, e de como subir
depois. Nada aqui depende de decidir agora entre VPS e Supabase gerenciado.

---

## 1. Pré-requisito

Docker Desktop instalado e aberto. Conferir:

```bash
docker info
```

Se responder sem erro, está pronto.

---

## 2. Subir o Supabase local

```bash
npx supabase init
```

```bash
npx supabase start
```

A primeira vez baixa as imagens e demora alguns minutos. No fim, o terminal
imprime `API URL` e `anon key`. Esses dois valores vão para `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<a chave que apareceu>
```

Modelo pronto em `.env.example`. O arquivo `.env.local` é ignorado pelo git.

---

## 3. Aplicar o banco

As migrações já estão em `supabase/migrations/`, numeradas na ordem correta:

| Arquivo | O que faz |
|---|---|
| `20260901000001_base.sql` | Tabelas do hub e do CS |
| `20260901000002_correcoes.sql` | **Duas correções de segurança**, constraints e índices |
| `20260901000003_nova_estrutura.sql` | Papéis novos, colaborador, viagens, integrações |
| `20260901000004_historico_e_ia.sql` | Reuniões, histórico unificado, produção mensal |
| `20260901000005_modulo_seo.sql` | As duas tabelas do painel de SEO |
| `20260901000006_auditoria_rls.sql` | Correções da auditoria das policies (ver abaixo) |

Antes de aplicar em qualquer banco, dá para conferir tudo sem Docker:

```bash
npm run db:testar
```

Sobe um Postgres em memória, aplica as migrações e entra como master, gerente e
funcionário para conferir o que cada um vê. Mexeu em policy: rode de novo.

### O que a auditoria das policies mudou

- Gerente só vê painel que foi liberado para ele. Antes via todos.
- CPF e contato de emergência não saem mais da tabela `profiles`. Quem precisa
  lê pela view `colaboradores_publico`, que só entrega esses campos ao dono e a
  quem tem o módulo `colaboradores`. **Consulta em `profiles` precisa listar as
  colunas** — `select *` dá erro de permissão.
- Contracheque e documento pessoal: dono e quem tem `colaboradores`.
- Papéis e permissões: só o master altera.
- Fixar post no feed: só gestor.
- Funções de papel não respondem para quem não fez login.

### Cadastro público precisa estar desligado

No painel do Supabase: Authentication → Sign In / Providers → desligar
**Allow new users to sign up**. Ligado, qualquer pessoa cria uma conta pela API
e entra na Central como funcionária. Criar usuário pelo painel e por convite
continua funcionando com isso desligado.

```bash
npx supabase db reset
```

Isso recria o banco local do zero aplicando as quatro na sequência. São 1.178
linhas de SQL, com 43 políticas de segurança.

---

## 4. Criar o usuário master

Sem cadastro público, o primeiro usuário nasce pelo painel local
(http://127.0.0.1:54323 → Authentication → Add user), com o e-mail
`thiago@conteudomartech.com.br`. Depois, no SQL Editor:

```sql
update public.user_roles set role = 'master'
where user_id = (select id from auth.users
                 where email = 'thiago@conteudomartech.com.br');
```

---

## 5. Ligar a aplicação no banco

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` preenchidos,
`src/integrations/supabase/client.ts` passa a devolver um cliente de verdade e
**o login passa a ser real**: e-mail e senha conferidos no Supabase, com
"esqueci minha senha" e a tela `/definir-senha` para quem chega pelo convite.
Sem as duas variáveis a aplicação fica no modo de demonstração (entra direto
como master). Só ligue depois de as tabelas existirem e o master estar criado.

Quem a pessoa é, o papel e os painéis liberados vêm do banco a cada login
(`src/integrations/supabase/sessao.ts`).

**Pessoas também já vêm do banco** (`src/integrations/supabase/pessoas.ts`): o
diretório de colaboradores, papéis, painéis liberados e a edição do próprio
perfil. Cadastrar colaborador, reenviar o link de criar senha e desativar passam
pela função `manage-users`, que precisa estar publicada (seção 6) — e só o
master consegue. Para o convite chegar a endereços de fora da equipe do projeto,
configure um SMTP próprio em Authentication → Emails.

Os demais dados ainda vêm da camada local. A troca da camada de dados é feita em
`src/data/store.ts`: cada função vira a query equivalente. As telas não mudam.

---

## 6. Edge functions

Rodam localmente junto com o `supabase start`:

```bash
npx supabase functions serve
```

Já escritas:

| Função | Papel |
|---|---|
| `manage-users` | Cria colaborador, envia convite por e-mail, ativa e desativa. Só master. |

A escrever: `assistente-ia`, `analise-cliente-ia`, `sync-clickup`, `sync-rd`,
`sync-read`, `sync-solides`, `sync-conta-azul`.

Segredos de integração ficam em `supabase/.env` no local e nos secrets do
projeto em produção — nunca no frontend.

---

## 7. Subir, quando estiver pronto

### Banco e funções

**Supabase gerenciado:** coloque `SUPABASE_DB_URL` no `.env` (painel do Supabase →
Connect → Session pooler) e rode:

```bash
npm run db:conferir
```
```bash
npm run db:subir
```

O primeiro só mostra o que seria aplicado. O segundo aplica os arquivos de
`supabase/migrations/` em ordem e anota no banco quais já rodaram, então dá para
rodar de novo sem duplicar nada. Trocou de projeto: troque a `SUPABASE_DB_URL`
e rode outra vez. Tabelas que já existem no projeto e não são da Central não
são tocadas.
```bash
npx supabase functions deploy
```

**VPS da Hostinger (auto-hospedado):** o mesmo SQL roda; a diferença é que o
Supabase sobe via Docker Compose no servidor, e as URLs mudam. Precisa também
de backup automático do Postgres configurado — sem isso, um disco perdido leva
junto os contracheques.

### Site

```bash
npm run build
```

Sobe o conteúdo de `dist/` para o `public_html`. O `.htaccess` já vai dentro,
e é ele que faz a navegação funcionar ao dar F5 em qualquer rota.

As variáveis `VITE_*` são embutidas no momento do build — buildar apontando
para produção, não para o `127.0.0.1`.

### Senha na frente do site (temporário)

Enquanto o login real não existe, o botão "Entrar" coloca qualquer pessoa como
master. Por isso a imagem Docker pede usuário e senha antes de entregar qualquer
coisa. Ao subir o container, defina as duas variáveis:

```
ACESSO_USUARIO=<usuário>
ACESSO_SENHA=<senha forte>
```

Sem elas o container não sobe — é de propósito. `/healthz` responde sem senha,
para a checagem de saúde da hospedagem.

Isso vale só para o caminho Docker/nginx. Subindo o `dist/` na hospedagem
compartilhada (Apache), a senha precisa ser ligada pelo painel da Hostinger
(Diretórios protegidos por senha), porque o `.htaccess` exige o caminho
absoluto do arquivo de senha no servidor.

Quando o login do Supabase entrar: tirar as duas linhas `auth_basic` do
`nginx.conf`, o `docker/10-acesso.sh` e as linhas dele no `Dockerfile`.

A função `temporary-master-access` (atalho de desenvolvimento que dava papel
master) não existe mais no repositório e não pode voltar. Se ela chegou a ser
publicada em algum projeto Supabase, apagar lá também:

```bash
npx supabase functions list
```
```bash
npx supabase functions delete temporary-master-access
```

---

## Regras que não mudam

- A chave `anon` é pública e pode ir no build. Quem protege os dados é o RLS.
- A chave `service_role` **nunca** sai das edge functions.
- Contracheques, comprovantes e documentos pessoais ficam em bucket privado.
- Papel de usuário vive em `user_roles` e é verificado no servidor. Nada de
  confiar em papel enviado pelo navegador.
