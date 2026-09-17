# Central Interna — Conteúdo Martech
### Especificação completa do projeto (para continuidade em outra IA / Claude)

Documento único com: visão do produto, stack, design system, banco de dados, regras de acesso,
mapa de telas, funcionalidades por módulo, edge functions, integrações pendentes e backlog.
O schema SQL completo está em `docs/schema-completo.sql`.

---

## 1. Visão geral

Sistema interno web (intranet corporativa) da **Conteúdo Martech**, 100% em **português do Brasil**,
responsivo, visual moderno/limpo/corporativo. Reúne:

1. **Hub corporativo** — feed de comunicação, calendário, diretório de colaboradores, solicitações,
   treinamentos, manual interno, políticas, ativos de marca, contracheques e documentos pessoais.
2. **Painel de CS / CRM** — base centralizada de clientes, termômetro de churn (green/yellow/red),
   repositório por cliente, timeline de notas, análise por IA e visão de tarefas do ClickUp.
3. **Dashboard de Vendas** — funil comercial alimentado pelo RD Station CRM.
4. **Painel Admin** — criação de usuários, atribuição de papéis, upload de documentos vinculados
   a uma pessoa e permissões granulares por painel.

Não há cadastro público: contas são criadas por Master/Admin.
E-mail do usuário master: `thiago@conteudomartech.com.br`.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React 18 + Vite 5 + TypeScript 5 |
| Estilo | Tailwind CSS v3 + shadcn/ui (Radix) |
| Ícones | lucide-react |
| Gráficos | recharts |
| Estado servidor | @tanstack/react-query |
| Rotas | react-router-dom v6 |
| Toasts | sonner + shadcn toaster |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions em Deno) |
| IA | Gateway de IA (`https://ai.gateway.lovable.dev/v1/chat/completions`) com `LOVABLE_API_KEY`; equivalente direto: OpenAI/Gemini com chave própria |

Cliente Supabase: `src/integrations/supabase/client.ts` (`import { supabase } from "@/integrations/supabase/client"`).

---

## 3. Design system

Fonte: **Plus Jakarta Sans** (300–800), carregada via Google Fonts em `src/index.css`.
Todos os valores são **tokens HSL semânticos** em `src/index.css` + `tailwind.config.ts`.
Nunca usar cores hardcoded (`text-white`, `bg-[#...]`) nos componentes.

### Tokens (modo claro)
```css
--background: 220 20% 97%;      --foreground: 220 30% 12%;
--card: 0 0% 100%;              --card-foreground: 220 30% 12%;
--primary: 215 75% 42%;         --primary-foreground: 0 0% 100%;   /* azul corporativo */
--secondary: 220 15% 92%;       --muted: 220 15% 94%;
--muted-foreground: 220 10% 50%;
--accent: 165 60% 40%;          /* teal */
--destructive: 0 72% 51%;
--border / --input: 220 15% 90%;   --ring: 215 75% 42%;
--radius: 0.625rem;

/* sidebar escura */
--sidebar-background: 220 30% 14%;  --sidebar-foreground: 220 15% 85%;
--sidebar-primary: 215 75% 55%;     --sidebar-accent: 220 25% 20%;
--sidebar-border: 220 25% 22%;

/* status */
--success: 150 60% 40%;  --warning: 38 92% 50%;  --info: 200 80% 50%;
```
O bloco `.dark` espelha os mesmos tokens com fundo `220 30% 8%`.

### Utilitários
```css
.gradient-primary  /* linear-gradient(135deg, hsl(215 75% 42%), hsl(215 75% 55%)) */
.gradient-sidebar  /* linear-gradient(180deg, hsl(220 30% 14%), hsl(220 30% 10%)) */
.gradient-accent   /* linear-gradient(135deg, hsl(165 60% 40%), hsl(180 60% 45%)) */
.glass-card        /* bg-card/80 backdrop-blur-sm border shadow-sm */
```

### Padrões visuais
- Cards: `border-0 shadow-sm`, padding `p-4`/`p-5`, cantos `rounded-lg`.
- Grades de KPI: `grid grid-cols-2 lg:grid-cols-4 gap-4`, rótulo `text-xs text-muted-foreground` + valor `text-2xl font-bold`.
- Badges informativos: `variant="secondary"`, `text-[9px]`/`text-[10px]`.
- Tabelas: cabeçalho `bg-muted/30`, linhas `border-b hover:bg-muted/20`, colunas secundárias escondidas em mobile (`hidden md:table-cell`).
- Animação de entrada de página: `animate-fade-in`.
- Título de página: `text-2xl font-bold flex items-center gap-2` com ícone lucide `w-6 h-6 text-primary` + subtítulo `text-sm text-muted-foreground`.
- Logos oficiais: `src/assets/logo-full.png` (horizontal, sidebar expandida e login) e `src/assets/logo-icon.png` (emblema, sidebar recolhida).

---

## 4. Layout e navegação

`src/components/AppLayout.tsx` = `SidebarProvider` + `AppSidebar` + header com trigger + `<main>`.
`src/components/AppSidebar.tsx` — sidebar escura, `collapsible="icon"`, três grupos:

| Grupo | Itens (título → rota → ícone) |
|---|---|
| **Principal** | Início `/` Home · Feed / Mural `/feed` Newspaper · Calendário `/calendario` CalendarDays · Colaboradores `/colaboradores` Users · Solicitações `/solicitacoes` ClipboardList |
| **Repositórios** | Repositórios `/repositorios` FolderOpen · Contracheques `/contracheques` Receipt · Ativos da Marca `/ativos` Palette · Manual Interno `/manual` BookOpen · Treinamentos `/treinamentos` GraduationCap · Políticas `/politicas` Shield |
| **Gestão** (condicional) | Painel de CS `/cs` Headphones (módulo `cs`) · Resultados de Vendas `/vendas` TrendingUp (módulo `vendas`) |

Rodapé da sidebar: avatar + nome + papel, link `/perfil`, link `/admin` (apenas master/admin) e logout.
O grupo **Gestão** só aparece se `role ∈ {master, admin}` **ou** o usuário tem o módulo em `user_permissoes`.

### Rotas (`src/App.tsx`)
Todas envolvidas em `<ProtectedRoute>` (redireciona para `/login` sem sessão) que aplica o `AppLayout`.
```
/  /feed  /colaboradores  /repositorios  /contracheques  /ativos  /manual
/calendario  /solicitacoes  /treinamentos  /politicas
/cs  /cs/:id  /vendas  /admin  /perfil  *→NotFound
```

---

## 5. Autenticação e níveis de acesso

`src/contexts/AuthContext.tsx` expõe `{ user, session, profile, role, loading, isAuthenticated, logout }`,
lendo `profiles` e `user_roles` após a sessão do Supabase.

### Papéis (`app_role`)
| Papel | Poderes |
|---|---|
| `master` | Tudo, inclusive gerenciar admins e permissões |
| `admin` | Gestão de usuários, conteúdo, documentos e todos os painéis |
| `rh` | Contracheques/documentos de todos, colaboradores, solicitações de RH |
| `colaborador` | Consumo do hub + apenas seus próprios documentos |

**Regra de segurança inegociável:** papéis vivem na tabela separada `user_roles` (nunca em `profiles`),
verificados por funções `SECURITY DEFINER` para evitar recursão de RLS e escalonamento de privilégio.

### Módulos (`app_modulo`): `cs`, `vendas`, `clickup`
Permissão granular por usuário em `user_permissoes`, editada pelo `PermissoesDialog` (ícone de escudo
em cada linha do Painel Admin). Admin/master têm acesso implícito.

### Funções de banco
```sql
has_role(_user_id uuid, _role app_role) -> boolean
is_admin_or_master(_user_id uuid) -> boolean
is_admin_master_or_rh(_user_id uuid) -> boolean
has_modulo(_user_id uuid, _modulo app_modulo) -> boolean  -- admin/master OU linha em user_permissoes
handle_new_user() -> trigger  -- cria profile + role 'colaborador' em auth.users INSERT
update_updated_at_column() -> trigger
```

---

## 6. Banco de dados

SQL completo em **`docs/schema-completo.sql`**. Resumo das tabelas (todas em `public`, com RLS
habilitada, `GRANT` para `authenticated`/`service_role` e trigger de `updated_at` quando aplicável):

### Hub corporativo
| Tabela | Campos de domínio | Acesso |
|---|---|---|
| `profiles` | user_id, nome, email, cargo, departamento, telefone, foto_url, data_nascimento, data_admissao, ativo | Todos leem; dono e admin editam; sem delete |
| `user_roles` | user_id, role (`app_role`) | Leitura autenticada; escrita master/admin |
| `user_permissoes` | user_id, modulo (`app_modulo`) | Gerenciada por master/admin |
| `posts` | autor_id, conteudo, tipo, fixado, imagem_url | Todos leem; autor/admin editam |
| `comentarios` | post_id, autor_id, conteudo | Todos leem; autor cria/apaga |
| `post_curtidas` | post_id, user_id | Cada um gerencia a própria curtida |
| `documentos` | user_id (dono), nome, descricao, categoria, arquivo_url, arquivo_nome, uploaded_by | **Dono + RH/admin apenas** (contracheques e documentos pessoais) |
| `eventos` | titulo, data, tipo, descricao, criado_por | Todos leem; admin/RH escrevem |
| `solicitacoes` | solicitante_id, categoria, titulo, descricao, status | Solicitante vê as suas; RH/admin veem todas e alteram status |
| `treinamentos` | titulo, descricao, categoria, duracao, nivel, video_url, conteudo_html, ordem, ativo, criado_por | Todos leem os ativos; admin gerencia |
| `treinamento_progresso` | treinamento_id, user_id, progresso, concluido | Cada um vê/atualiza o seu |

### CS / CRM
| Tabela | Campos de domínio |
|---|---|
| `clientes` | nome, produto (`produto_cliente`), status, responsavel_id, contato_nome/email/telefone, mrr, inicio_contrato, renovacao_contrato, flag (`churn_flag`), clickup_list_id, drive_folder_url, read_workspace_url, rd_deal_id, observacoes, ativo |
| `cliente_recursos` | cliente_id, tipo, titulo, descricao, url, arquivo_url, arquivo_nome, criado_por |
| `cliente_notas` | cliente_id, autor_id, tipo, conteudo (timeline) |
| `churn_avaliacoes` | cliente_id, analista_id, referencia_mes, respostas (jsonb), pontuacao, flag, comentario |
| `cliente_analises_ia` | cliente_id, resumo, percepcoes, riscos, recomendacoes, flag_sugerida, modelo, gerado_por |
| `clickup_tarefas` | cliente_id, task_id, nome, status, responsavel, prioridade, lista, due_date, url, sincronizado_em |
| `vendas_negocios` | rd_deal_id, nome, empresa, etapa, valor, responsavel, origem, produto, status, data_criacao, data_fechamento, sincronizado_em |

Acesso das tabelas de CS: leitura/escrita para quem tem `has_modulo(auth.uid(),'cs')`
(vendas usa o módulo `vendas`; tarefas do ClickUp, o módulo `clickup`).

### Enums
```sql
app_role      = master | admin | rh | colaborador
app_modulo    = cs | vendas | clickup
churn_flag    = green | yellow | red
produto_cliente = agencia_educacional | totvs | rd_conteudo | rd_tbc | martech
```

### Storage (buckets públicos, protegidos por RLS na tabela correspondente)
`avatars` · `documentos` · `posts`

---

## 7. Módulos e funcionalidades

### 7.1 Dashboard `/` (`src/pages/Dashboard.tsx`)
Saudação personalizada, cards de KPI (colaboradores ativos, avisos, solicitações abertas, treinamentos),
avisos fixados do feed, próximos eventos e aniversariantes do mês, atalhos rápidos.

### 7.2 Feed / Mural `/feed`
Publicação de posts (tipos: comunicado, evento, novidade, geral), fixar aviso (admin),
upload de imagem para o bucket `posts`, curtidas e comentários em tempo de query.

### 7.3 Colaboradores `/colaboradores`
Diretório com busca por nome/cargo/departamento, filtro por departamento, cards com avatar,
cargo, e-mail, telefone e data de admissão.

### 7.4 Repositórios `/repositorios`, Ativos `/ativos`, Manual `/manual`, Políticas `/politicas`
Listagem por categoria com busca; **upload e exclusão de documentos** para admin/master
(bucket `documentos` + registro em `documentos`). Manual interno é navegável e pesquisável por categoria.

### 7.5 Contracheques `/contracheques`
Área restrita: colaborador vê **apenas os próprios** documentos; RH/admin veem todos, fazem upload
vinculado a um usuário específico e podem remover.

### 7.6 Calendário `/calendario`
Eventos corporativos (feriado, evento, treinamento, aniversário) por mês; criação por admin/RH.

### 7.7 Solicitações `/solicitacoes`
Central de chamados internos (RH, TI, Financeiro, Facilities…) com status
`aberta → em_andamento → concluida`; solicitante acompanha o seu, RH/admin tratam todos.

### 7.8 Treinamentos `/treinamentos`
Trilhas criadas pelo admin com embed de **YouTube** ou **iFrame de ferramenta externa**,
conteúdo HTML complementar, nível/duração/categoria e progresso individual por usuário.

### 7.9 Painel de CS `/cs` (`src/pages/CS.tsx`)
- Base de clientes com busca, filtro por produto e por flag.
- KPIs: total de clientes, MRR somado, quantidade de yellow e red flags.
- Cartões/linhas com nome, unidade de negócio, responsável, MRR, flag colorida.
- Modal de cadastro/edição de cliente com todos os campos, inclusive URLs de integração
  (ClickUp list id, pasta do Drive, workspace do Read, deal do RD).

### 7.10 Ficha do cliente `/cs/:id` (`src/pages/ClienteDetalhe.tsx`)
Abas:
1. **Análise de IA** — botão "Gerar análise" e campo de pergunta livre; mostra resumo, percepções,
   riscos, recomendações e flag sugerida; histórico das análises.
2. **Repositório** — relatórios, atas (Read), peças (Drive), contratos e links; upload de arquivo ou URL.
3. **Timeline** — notas do time (reunião, alerta, entrega, geral) em ordem cronológica.
4. **ClickUp** — tarefas do cliente com status, responsável, prioridade e vencimento.
5. **Integrações** — atalhos para Drive, Read, ClickUp e RD do cliente.

**Termômetro de churn:** modal de avaliação mensal com 5 perguntas (`perguntasChurn` em
`src/lib/cs-data.ts`): engajamento, resultados, relacionamento com o decisor, reclamações e
percepção de renovação. Cada resposta vale 0–4 → máximo 20 pontos.
```ts
pct = pontuacao / 20 * 100
pct >= 70 → green | pct >= 45 → yellow | senão red
```
A avaliação grava em `churn_avaliacoes` (uma por `referencia_mes`) e atualiza `clientes.flag`.

### 7.11 Resultados de Vendas `/vendas`
KPIs (pipeline aberto, receita ganha, negócios abertos, taxa de conversão), gráfico de funil por etapa
(`prospeccao, qualificacao, proposta, negociacao, ganho, perdido`), receita por unidade de negócio e
tabela de negócios. Refetch automático a cada 60s (`refetchInterval: 60000`).

### 7.12 Painel Admin `/admin`
Criação de usuários (nome, e-mail, senha, cargo, departamento, papel) via edge function `manage-users`,
edição/desativação, upload de documentos vinculados a uma pessoa e botão de **Permissões**
(`PermissoesDialog`) para liberar CS / Vendas / ClickUp por usuário.

### 7.13 Perfil `/perfil`
Dados pessoais editáveis, upload de foto (bucket `avatars`), visão dos próprios documentos.

---

## 8. Edge Functions (`supabase/functions/`)

| Função | Papel |
|---|---|
| `manage-users` | Criação/edição/exclusão de usuários com `SUPABASE_SERVICE_ROLE_KEY`; valida que o chamador é master/admin |
| `setup-master` | Provisiona o usuário master inicial |
| `temporary-master-access` | Concede papel master a sessão temporária (usado durante o desenvolvimento — **remover em produção**) |
| `analise-cliente-ia` | Análise de CS por IA |

Padrão obrigatório de toda função: tratar `OPTIONS` com `corsHeaders`, incluir CORS em **todas** as
respostas (inclusive erros), validar entrada e nunca expor chaves ao cliente.

### `analise-cliente-ia` — contrato
Entrada: `{ cliente_id: string, pergunta?: string }`.
Carrega cliente + últimas 30 notas + 12 avaliações de churn + 30 recursos + 50 tarefas, monta contexto
JSON e chama o modelo com system prompt de "analista sênior de CS", exigindo resposta **em JSON**:
```json
{"resumo":"","percepcoes":"","riscos":"","recomendacoes":"","flag_sugerida":"green|yellow|red"}
```
Grava o resultado em `cliente_analises_ia` e retorna `{ analise }`.
Erros do gateway são propagados com o status original (402 = créditos, 429 = rate limit).

---

## 9. Integrações pendentes (próximo passo)

Cada uma vira uma edge function de sincronização + cron, gravando nas tabelas já existentes:

| Integração | Segredo | Destino | Observação |
|---|---|---|---|
| **RD Station CRM** | `RD_CRM_TOKEN` | `vendas_negocios` | Sincronizar deals (nome, empresa, etapa, valor, responsável, origem, datas); mapear etapa RD → `etapasFunil`; `rd_deal_id` liga ao cliente |
| **ClickUp** | `CLICKUP_API_TOKEN` | `clickup_tarefas` | Buscar por `clientes.clickup_list_id`; salvar status, responsável, prioridade, due date e URL |
| **Read.ai** | `READ_API_KEY` | `cliente_recursos` (tipo `ata`) | Importar atas de reunião por workspace do cliente |
| **Google Drive** | OAuth / service account | `cliente_recursos` (tipo `peca`) | Listar arquivos da `drive_folder_url` |

Sugestão: uma função `sync-<serviço>` com upsert idempotente por id externo + `sincronizado_em`,
agendada por pg_cron a cada 15–60 min, e um botão "Sincronizar agora" na UI.

---

## 10. Arquivos-chave

```
src/
  App.tsx                        rotas + providers
  index.css                      design tokens
  contexts/AuthContext.tsx       sessão, profile, role
  components/
    AppLayout.tsx  AppSidebar.tsx  NavLink.tsx
    PermissoesDialog.tsx         permissões por módulo
    ui/                          shadcn
  lib/
    cs-data.ts                   tipos, labels, perguntas de churn, calcularFlag, formatCurrency
    mock-data.ts                 labels de papéis, links rápidos, getInitials
  pages/
    Dashboard Feed Colaboradores Repositorios Contracheques AtivosMarca
    ManualInterno Calendario Solicitacoes Treinamentos Politicas
    CS ClienteDetalhe Vendas Admin Perfil Login NotFound
  integrations/supabase/{client.ts,types.ts}   gerados — não editar
supabase/
  functions/{manage-users,setup-master,temporary-master-access,analise-cliente-ia}/index.ts
  migrations/*.sql
docs/schema-completo.sql         schema consolidado
```

---

## 11. Backlog / o que falta

- [ ] Reativar login real (e-mail + senha) e remover `temporary-master-access`.
- [ ] Sincronização RD Station CRM, ClickUp, Read.ai e Google Drive.
- [ ] Lembrete automático da avaliação mensal de churn (notificação para o analista responsável).
- [ ] Histórico gráfico da evolução da flag por cliente.
- [ ] Exportação CSV/PDF dos painéis de CS e Vendas.
- [ ] Notificações internas (novo comunicado, solicitação respondida, documento novo).
- [ ] Modo escuro exposto na UI (tokens já prontos).
