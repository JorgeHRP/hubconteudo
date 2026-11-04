# Central Interna — Conteúdo Martech

Intranet corporativa da Conteúdo Martech: hub interno, painel de CS com termômetro de
churn, dashboard de vendas e painel administrativo. Tudo em português do Brasil.

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173.

## Estado atual

No ar em https://hub.conteudomar.tech/, com login real no Supabase e a maior parte
das telas gravando no banco. O retrato atualizado, em linguagem simples, está em
`docs/andamento.md`; o passo a passo do banco e da publicação, em `docs/backend.md`.

A camada de dados continua sendo `src/data/store.ts`. Com o Supabase ligado
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`), pessoas, hub, viagens e vendas vão
direto às tabelas; o resto (carteira, CS, tarefas, inbound, treinamentos…) é
sincronizado pela tabela `central_registros` (`src/data/sincronia.ts`). Sem as duas
variáveis, o site roda em modo de demonstração, com os dados no navegador.

Papéis: **master**, **gerente**, **funcionário**. O acesso a cada painel é liberado
por usuário. Ver `docs/estrutura.md`.

## Estrutura

```
src/
  App.tsx                    rotas + ProtectedRoute (papel e módulo)
  index.css                  tokens HSL do design system
  contexts/AuthContext.tsx   sessão, perfil, papel, módulos
  components/
    AppLayout.tsx  AppSidebar.tsx  PageHeader.tsx
    ListaDocumentos.tsx      base de Repositórios/Ativos/Manual/Políticas
    ColaboradorDialog.tsx    cadastro de pessoa + acesso, em um passo
    PermissoesDialog.tsx     permissões por painel
    PainelIncorporado.tsx    casca dos painéis externos (iframe)
    EstadoVazio.tsx          estado vazio padrão
    FunilBarras.tsx          gráfico de funil em CSS
    ui/                      primitivos shadcn escritos à mão
  data/{seed.ts,store.ts}    base de demonstração e camada de acesso
  lib/{types.ts,cs-data.ts,mock-data.ts,utils.ts}
  pages/                     23 telas
docs/
  especificacao.md                          visão de produto original
  estrutura.md                              arquitetura atual (papéis, telas, integrações)
  schema-completo.sql                       schema base do Supabase
  migrations/2026-09-01-correcoes.sql       correções de segurança e índices
  migrations/2026-09-01-nova-estrutura.sql  papéis novos, viagens, integrações
```

## Regras que não podem ser quebradas

- Papéis vivem em `user_roles`, nunca em `profiles`, verificados por funções
  `SECURITY DEFINER` — evita recursão de RLS e escalonamento de privilégio.
- Cores só por token semântico (`bg-primary`, `text-muted-foreground`). Nada de
  `text-white` ou `bg-[#...]` nos componentes.
- Contracheques, documentos pessoais e comprovantes de viagem: dono + quem tem o
  módulo correspondente, sempre em bucket privado.
- CPF e contato de emergência só aparecem para o dono e para quem tem `colaboradores`.

## Próximos passos

O quadro do projeto fica no ClickUp. Em resumo, falta:

1. Financeiro, Repositórios e Contracheques no banco.
2. Arquivos de verdade em `documentos`, `avatars` e `posts` (os comprovantes de viagem já usam o Storage).
3. Edge functions `assistente-ia` e `analise-cliente-ia`.
4. Integrações: Sólides, Conta Azul, Alfaix, RD Station, Read.ai, Google Drive (ClickUp já sincroniza).
5. Backup do Postgres, ambiente de homologação e revisão de segurança final.
