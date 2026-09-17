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

Interface completa e navegável, **sem dados fictícios**: existe apenas o usuário master
(Thiago Lustosa). Tudo o mais nasce vazio e é preenchido pelo uso real.

Os dados ficam em `src/data/store.ts` (memória + `localStorage`, então sobrevivem ao
recarregar a página). Não há Supabase conectado ainda. Cada função do store tem
equivalente direto em uma query do Supabase — ao conectar o backend, troca-se o corpo
dessas funções e as telas não mudam.

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

Lista completa em `docs/estrutura.md`, seção 8. Em resumo:

1. Conectar o Supabase (URL + anon key) e trocar `src/data/store.ts` pelas queries reais.
2. Aplicar os dois arquivos de `docs/migrations/` na ordem — o primeiro inclui duas
   correções de segurança.
3. Edge functions: `manage-users` (com envio do e-mail de primeiro acesso) e `analise-cliente-ia`.
4. Integrações: ClickUp, Sólides, Conta Azul, Alfaix, RD Station, Read.ai, Google Drive.
