# Central Interna — estrutura do projeto

Documento de referência da arquitetura, atualizado em 01/09/2026.
Para a visão de produto original, ver `especificacao.md`.

---

## 1. Papéis e permissões

Três papéis, em `user_roles` (nunca em `profiles`):

| Papel | O que pode |
|---|---|
| `master` | Tudo. Único que altera papéis, permissões, integrações e URLs de painel. |
| `gerente` | Publica conteúdo do hub (feed, calendário, documentos) e trata solicitações. Painéis só os que forem liberados. |
| `funcionario` | Hub interno, os próprios documentos e os próprios relatórios de viagem. |

Acesso a painel é **granular por usuário**, na tabela `user_permissoes`:

| Módulo | Libera |
|---|---|
| `colaboradores` | Cadastrar pessoas, enviar contracheques, ver CPF/contato de emergência e ponto |
| `cs` | Painel de CS, ficha do cliente, termômetro de churn |
| `vendas` | Resultados de Vendas |
| `financeiro` | Dashboard Financeiro |
| `viagens_aprovacao` | Aprovar e reprovar relatórios de viagem |
| `trafego` / `seo_geo` / `projetos_rd` | Painéis externos embutidos |

`master` tem todos por definição. Os demais só o que estiver marcado.
O hub (início, feed, calendário, solicitações, repositórios, treinamentos, viagens
próprias, perfil) é visível para todos os autenticados.

---

## 2. Telas

### Hub
| Rota | Tela | Observação |
|---|---|---|
| `/` | Início | KPIs, avisos fixados, próximos eventos, aniversariantes, 6 atalhos |
| `/feed` | Feed / Mural | Posts com tipo, fixar (gestor), curtidas e comentários |
| `/calendario` | Calendário | Mês navegável; criação por gestor |
| `/colaboradores` | Colaboradores | Diretório + cadastro completo |
| `/solicitacoes` | Solicitações | Chamados internos; gestor trata |
| `/viagens` | Relatório de Viagens | Despesas com comprovante e aprovação |
| `/perfil` | Meu perfil | Dados próprios e contato de emergência |

### Repositórios
`/repositorios`, `/ativos`, `/manual`, `/politicas` compartilham `ListaDocumentos`
(`documentos.user_id IS NULL` = institucional, todos leem).
`/contracheques` é pessoal: dono + módulo `colaboradores`. O envio mensal em lote
("Envio do mês") permite ao RH subir a competência inteira de uma vez, marcando quem
ainda não recebeu e sinalizando quem já foi atendido.
`/treinamentos`: trilhas com vídeo, iframe ou HTML, progresso por pessoa.

### Ficha do cliente — abas
| Aba | O que traz |
|---|---|
| **Histórico** | Jornada completa: notas, reuniões, documentos, avaliações de churn, mudanças de flag, análises por IA e entregas do ClickUp, em uma linha do tempo com filtro por tipo, período e "só os marcos". No topo, a produção dos últimos 6 meses. |
| Análise de IA | Resumo, percepções, riscos, recomendações e flag sugerida |
| Reuniões | Gravações e atas do Read.ai, com resumo e participantes |
| Repositório | Relatórios, atas, peças, contratos e links |
| Notas | Registro do time (reunião, alerta, entrega, geral) |
| ClickUp | Tarefas com pendentes, atrasadas e entregues no mês |
| Integrações | Atalhos para Drive, Read, ClickUp e RD |

### Gestão e painéis
| Rota | Módulo |
|---|---|
| `/cs`, `/cs/:id` | `cs` |
| `/vendas` | `vendas` |
| `/financeiro` | `financeiro` |
| `/trafego`, `/projetos-rd` | painéis externos embutidos (iframe) |
| `/seo-geo/*` | **módulo próprio**, código dentro do projeto |
| `/admin` | só `master` |

---

## 3. Cadastro de colaborador

Um passo só: cria a pessoa **e** o acesso ao sistema.

Campos obrigatórios: nome, CPF (com validação de dígito verificador),
telefone, contato de emergência (nome e telefone), data de admissão, e-mail corporativo.
Opcionais: data de nascimento, cargo, departamento.

Na mesma tela escolhe-se o papel e marcam-se os painéis liberados.
O checkbox "enviar e-mail com a senha de primeiro acesso" registra
`profiles.convite_enviado_em`; o disparo real depende da edge function `manage-users`.

O repositório de contracheques da pessoa nasce junto e é visível apenas para ela
e para quem tem o módulo `colaboradores`.

---

## 4. Relatório de viagens

```
rascunho → enviado → aprovado → pago
              ↓
          reprovado → (volta a ser editável)
```

- O colaborador cria o relatório, lança cada despesa com categoria, data, valor e
  comprovante, e envia. Sem despesa, o botão de enviar fica bloqueado.
- Quem tem `viagens_aprovacao` vê a fila, aprova ou reprova com motivo obrigatório,
  e depois marca como reembolsado.
- Reprovado volta a ser editável pelo dono.
- Comprovantes vão para o bucket **privado** `comprovantes`, em pasta por usuário.
- O Dashboard Financeiro consome esta fila (aguardando aprovação / aprovados a pagar).

---

## 4b. Assistente de IA

Disponível em **toda a ferramenta** pelo botão flutuante no canto inferior direito.
Sabe em que tela a pessoa está e sugere perguntas conforme o contexto.

A camada fica em `src/lib/ia.ts`. Hoje responde localmente, a partir de uma base de
conhecimento sobre o próprio sistema — churn, cadastro, papéis, viagens, contracheques,
histórico, integrações, vendas e financeiro. A resposta sempre indica o motor usado.

**Ponto de troca:** a função `consultarIA(pergunta, contexto)` é a única coisa a mudar.
Quando a edge function `assistente-ia` existir, o corpo dela vira um `fetch` enviando
`{ pergunta, contexto }` e devolvendo `{ resposta, sugestoes, motor }` — telas, histórico
de conversa e sugestões continuam iguais. As consultas podem ser gravadas em
`consultas_ia` para auditoria e controle de custo.

Na ficha do cliente, além do assistente, existe o botão **Gerar análise**, que produz
resumo, percepções, riscos, recomendações e flag sugerida a partir dos dados do cliente.

---

## 4c. Painel de SEO / GEO (ESEG)

Diferente do painel de tráfego, este **não é um iframe**: o projeto foi trazido para
dentro da Central, em `src/modulos/seo/`. São 45 telas — ciclo do projeto, entregáveis,
GEO, planejamento, palavras-chave, pautas, artigos, calendário editorial, on-page,
backlinks, auditoria, concorrentes, atualizações semanais, relatório e lançamento.

### Um projeto por cliente

O painel é **multicliente**, ligado à carteira do CS. Em `/seo-geo` aparece a lista de
clientes: os que já têm projeto de SEO e os que não têm, com o botão **Lançar projeto
de SEO**. Ao entrar em um projeto, a rota vira `/seo-geo/<id-do-cliente>/...` e o
cabeçalho mostra de quem é, com atalho para a ficha no CS.

**Como o isolamento funciona:** todo dado editável do painel passa por um único hook
(`useSharedData`) e todo registro de alteração por outro (`useModificationTracker`).
Ambos leem o cliente do contexto e prefixam a chave com `cliente:<id>:`. Com isso,
as 45 telas ficaram isoladas sem precisar ser alteradas uma a uma.

### Ponto de partida do projeto

Ao lançar, escolhe-se entre:

- **Em branco** — todas as seções editáveis começam vazias, para preencher com os dados
  do cliente. É o normal para um cliente novo.
- **Copiar o modelo da ESEG** — traz o conteúdo da Faculdade ESEG como base para adaptar.

A escolha fica em `projetos_seo.origem` e chega às telas pelo hook `useComecaVazio()`.

### O que é editável e o que é apresentação

| | Seções |
|---|---|
| **Editável e salvo por cliente** | Palavras-chave (todas as listas), Artigos, Pautas, Calendário Editorial, On-Page, Concorrentes, Backlinks Martech |
| **Apresentação, não editável** | Ciclo do Projeto, GEO, Auditoria, Relatório, Entregáveis, Planejamento, Atualizações Semanais, Lançamento |

As seções de apresentação mostram o material da ESEG como referência visual. Num projeto
em branco, um aviso no topo deixa isso explícito. Torná-las editáveis por cliente é um
trabalho à parte, ainda não feito.

Cada projeto pode ser **encerrado** pelo ícone de lixeira no card — sai da lista, mas os
dados ficam guardados caso ele seja relançado.

Como foi integrado:

| Item | Decisão |
|---|---|
| Login | Removido. Usa a sessão da Central — sem segundo login. `useAuthSeo` faz a ponte. |
| Sidebar e layout próprios | Removidos. Usa o shell da Central, com navegação por abas internas. |
| Notificações | O `use-toast` do shadcn virou um adaptador sobre o sonner, que a Central já usa. |
| Dados | `useSharedData` (chave → JSON) e o histórico de alterações. Funciona com Supabase **ou** localStorage. |
| Carregamento | O módulo é carregado sob demanda (`lazy`): quem não abre SEO não baixa os 380 kB. |

**Banco:** o módulo usa apenas duas tabelas — `shared_table_data` (valores editados
pelas pessoas) e `modification_history` (quem mudou o quê). Todo o resto do conteúdo
vive em arquivos estáticos em `src/modulos/seo/data/`.

Enquanto o Supabase não entra, as edições ficam no navegador de cada pessoa. Com o banco
ligado, passam a ser compartilhadas em tempo real — inclusive com atualização automática
quando outra pessoa salva.

---

## 4d. Quadro de tarefas

Estrutura trazida do CEDU HUB. As colunas e os tipos de trabalho **não são fixos no
código** — a agência configura em *Tarefas → Configurar quadro*.

| Conceito | Onde vive | Observação |
|---|---|---|
| Coluna (`StatusTarefa`) | `db.statusTarefa` | Nome, cor, ordem e o marcador `concluido` |
| Tipo de trabalho (`TipoTarefa`) | `db.tiposTarefa` | Design, Tráfego pago, Planejamento, Landing page, E-mail, Automação RD, RD CRM |
| Comentário (`ComentarioTarefa`) | `db.comentariosTarefa` | `@primeironome` promove a pessoa a observadora |
| Registro de tempo (`RegistroTempo`) | `db.temposTarefa` | Cronômetro ou lançamento manual |

Pontos que valem atenção de quem for mexer:

1. **`concluido` é o que define "entregue".** Nenhum indicador olha para o nome da
   coluna; todos passam por `ehConcluido(status_id)`. Renomear "Concluída" não quebra nada,
   desmarcar a caixa sim.
2. **Uma coluna só é excluída depois de vazia.** `removerStatus` recusa e diz quantas
   tarefas precisam sair antes.
3. **Vários responsáveis por tarefa.** `responsaveis: string[]`; no diálogo, quem está
   alocado naquele cliente aparece primeiro, com a função ao lado.
4. **Observador ≠ responsável.** Observador acompanha sem entrar na carga de trabalho
   dos indicadores.
5. **Anexos moram no navegador** (data URL, até 400 KB) enquanto o Storage do Supabase
   não estiver ligado. Se a cota estourar, `adicionarAnexo` desfaz e avisa — não finge
   que salvou.
6. **Migração do formato antigo** roda uma vez em `migrarTarefas()`: `status` vira
   `status_id`, `responsavel_id` vira `responsaveis[]`.

## 4e. Avisos e equipes

### Avisos internos (sino no topo)

As 12 situações do CEDU HUB, em `TipoNotificacao`. Quem dispara é o próprio store,
dentro das ações que já existiam — nenhum aviso é decorativo.

| Sai de | Gera |
|---|---|
| `salvarTarefa` (nova) | `nova_tarefa` para os responsáveis |
| `salvarTarefa` (edição) | `mudanca_responsavel` para quem entrou |
| `comentarTarefa` | `mencao` para quem foi citado, `comentario` para o resto |
| `moverTarefa` | `mudanca_status` ou `concluida` |
| `alternarObservador` | `observando` |
| `adicionarAnexo` | `anexo` |
| `adicionarSubtarefa` | `subtarefa` |
| `listarNotificacoes` | `prazo_proximo` e `atrasada` |

Três regras que valem a leitura antes de mexer:

1. **Ninguém é avisado do que fez.** `notificar()` tira o autor da lista de destinatários.
2. **Prazo e atraso não têm quem dispare** — nascem da passagem do tempo. São gerados
   em `sincronizarPrazos()`, na hora de listar, e o campo `chave`
   (`atraso:<id>` / `prazo:<id>`) garante que cada tarefa gere o aviso uma vez só.
   Concluir a tarefa apaga esses avisos.
3. **Silenciar é por pessoa e por tipo.** O que não está em `preferenciasNotificacao`
   vem ligado; a tela de preferências só grava o que foi desligado.

Sem servidor empurrando eventos, o sino refaz a consulta a cada 30 s. Quando o Supabase
entrar, isso vira realtime e o `refetchInterval` sai.

### Equipes da agência

`Equipe { id, nome, cor, membros[] }`, em Painel Admin → Equipes. **Não confundir com
`AlocacaoEquipe`**: equipe é o time fixo da casa (Tráfego, Conteúdo, SEO…); alocação é
quem atende um cliente específico, e continua na ficha da conta.

O ganho prático está no diálogo de tarefa: os times com gente aparecem como atalho e
um clique põe o time inteiro como responsável. Times vazios não aparecem.

## 4f. Inbound

Fica em **Gestão de Clientes → Inbound**. O módulo gira em torno de **pontos**: cada
serviço tem um preço em pontos, o cliente contrata um total por mês e o plano consome
esse saldo.

Como as demais frentes, **a raiz é a carteira**: em cima, os clientes que já têm inbound
com o consumo do mês; embaixo, os que não têm, com "Lançar projeto de Inbound". Não há
diálogo separado de ativação — lançar da carteira faz o mesmo que o antigo botão
"Ativar inbound". Por isso `CarteiraDaFrente` aceita `esconderComProjeto`: aqui os
clientes com a frente já aparecem acima, com o consumo, e repeti-los seria ruído.

| Entidade | Papel |
|---|---|
| `ItemCatalogoInbound` | Tabela de preços da agência — 37 serviços reais, em 10 categorias |
| `PontosMesInbound` | Quanto o cliente contratou naquele mês (o teto) |
| `ItemPlanoInbound` | Serviço lançado no plano do mês, com quantidade e situação |
| `PautaInbound` | Calendário editorial: material, produto, etapa de funil, situação |
| `FluxoInbound` + `NoFluxo` | Régua de nutrição montada em blocos sequenciais |

Decisões que valem a leitura antes de mexer:

1. **Os pontos do plano são congelados no lançamento.** `lancarItemPlano` copia
   `pontos` do catálogo para `pontos_unitarios`. Reajustar a tabela de preços não
   reescreve meses já fechados.
2. **Serviço do catálogo nunca é apagado**, só desativado (`ativo: false`) — planos
   antigos precisam do nome e do preço da época.
3. **Ativar inbound cria um `Projeto` de tipo `inbound`**, do mesmo jeito que o SEO,
   para a frente aparecer na ficha do cliente no Painel de CS. `destinoDoProjeto`
   em `ContaDoCliente.tsx` liga o botão "Abrir painel" à rota `/inbound/:id`.
4. **`EtapaFunilConteudo` não é `EtapaFunil`.** A primeira é topo/meio/fundo, do funil
   de conteúdo; a segunda é o funil de vendas (prospecção → ganho). Nomes parecidos,
   domínios diferentes.
5. **A régua acumula os dias de espera** para mostrar em que dia o lead chega a cada
   bloco. O total aparece no rodapé do fluxo.

Sem contrato lançado no mês, o percentual de consumo é `null` em vez de zero — a tela
diz "sem contrato lançado" em vez de fingir 0%.

## 4g. Como as frentes conversam entre si

`Projeto` é a peça que liga tudo. **Toda frente aberta em qualquer painel vira um
`Projeto`**, e é isso que o Painel de CS lê para montar "Projetos por frente" na ficha
do cliente e os chips no card da carteira.

| Painel | Função que abre a frente | O que mais ela cria |
|---|---|---|
| SEO / GEO | `lancarProjetoSeo` | `ProjetoSeo` com o dashboard do cliente |
| Gestão de Tráfego | `lancarFrente(id, "trafego")` | — |
| Inbound | `lancarFrente(id, "inbound")` | — |
| Projetos RD | `criarImplantacao` | `ImplantacaoRD` com o roteiro |

`lancarFrente` é a forma genérica; `ativarInbound` continua existindo como apelido para
não quebrar a tela de inbound. `destinoDoProjeto`, em `ContaDoCliente.tsx`, é o mapa que
liga o botão "Abrir painel" de cada frente à rota certa — **ao criar uma frente nova,
esse mapa também precisa de uma linha**, ou o botão não sabe para onde ir.

O componente `CarteiraDaFrente` desenha a mesma tela para qualquer frente: quem já tem o
projeto e quem não tem, com o botão de lançar. Tráfego e inbound o usam; SEO tem a sua
própria porque também precisa criar o `ProjetoSeo`.

### Venda adicional

A sugestão **não é cadastrada, é calculada**: `frentesVendaveis` menos as frentes ativas
do cliente. O que fica guardado em `oportunidades` é só o registro da oferta — se foi
feita, quando, por quem e no que deu.

Duas consequências disso:

1. **Lançar a frente apaga a oportunidade** — `lancarFrente` remove o registro. O serviço
   sai da lista de sugestões e aparece em Projetos por frente, sem ninguém precisar
   sincronizar nada à mão.
2. **`cs` fica fora de `frentesVendaveis`.** Não é um serviço vendável; é o atendimento
   que toda conta tem.

## 4h. Treinamentos

Duas formas de organizar: **trilha** (cursos encadeados numa ordem) e **treinamento
avulso** (curso sem trilha). O que muda é só o `trilha_id` do curso — nulo é avulso.

| Entidade | Papel |
|---|---|
| `Trilha` | Card com capa, descrição e progresso de quem está fazendo |
| `Curso` | Nome, professor, resumo, vídeo, carga horária, capa, nível |
| `PerguntaCurso` | Múltipla escolha; `correta` é o índice dentro de `opcoes` |
| `ProgressoCurso` | Conclusão, nota e número de tentativas, por pessoa |
| `Certificado` | Emitido na aprovação, com código de verificação |
| `ModeloCertificado` | Modelo único; só nome, curso e horas mudam entre documentos |

Decisões que valem a leitura antes de mexer:

1. **O vídeo roda dentro da plataforma.** `urlDeIncorporacao()` converte o link colado
   para o endereço de incorporação — YouTube (nas três formas), Vimeo e Drive. O que não
   é reconhecido vira link de nova aba, e o cadastro avisa isso na hora.
2. **Durante o questionário o vídeo sai da tela.** Iframe se sobrepõe ao conteúdo da
   página, e as perguntas ficavam ilegíveis por baixo dele.
3. **Reprovado não conclui e não gera certificado.** `concluirCurso` calcula o percentual
   de acerto e compara com `nota_minima`; abaixo disso, o progresso continua aberto.
4. **Certificado sai uma vez por pessoa e por curso**, e guarda título e carga horária
   congelados — renomear o curso depois não reescreve documentos já emitidos.
5. **Capas e imagens moram no navegador** (data URL, até 300 KB), como os anexos de
   tarefa. Também é possível colar o endereço de uma imagem hospedada fora.

### O PDF é desenhado, não fotografado

`gerarPdfCertificado` (`src/lib/pdf-certificado.ts`) desenha o documento direto no
jsPDF, em vetor. A primeira versão fotografava o HTML com html2canvas e **saía borrada**:
a foto capturava o elemento já com a escala de exibição de 0,62 aplicada, e essa imagem
pequena era esticada para preencher a página. Desenhando, o texto fica nítido em
qualquer zoom, é selecionável e o arquivo cai de centenas de KB para ~6 KB.

O nome de quem concluiu ganha uma linha própria, em destaque. O modelo continua sendo
**um texto só e editável**: a quebra sai do próprio `{nome}`, com `split("{nome}")`.
Um modelo sem `{nome}` cai no parágrafo corrido, sem quebrar.

A prévia em HTML (`Certificado.tsx`) reproduz o mesmo desenho de propósito — ela precisa
mostrar o que vai sair. Usa cores literais porque o certificado é branco em qualquer
tema, inclusive no modo escuro.

## 4i. O projeto da ESEG como modelo do painel de SEO

Ao abrir um projeto de SEO, escolhe-se o ponto de partida (`ProjetoSeo.origem`):

- **`modelo_eseg`** — vem com o conteúdo da ESEG preenchido, para adaptar;
- **`vazio`** — vem com **a mesma estrutura de seções, porém em branco**.

O que decide isso é `useComecaVazio()`, e a forma de usar é o hook
`useConteudoSeo(chave, modeloEseg, vazio)`: ele devolve o conteúdo da ESEG ou o
esqueleto vazio conforme a origem e, depois que alguém salva, sempre o que foi salvo.
O isolamento por cliente vem de graça, porque `useSharedData` prefixa a chave com o id.

Três categorias de seção, e a diferença importa:

1. **Dado do cliente** (palavras-chave, artigos, pautas, calendário, on-page,
   concorrentes, auditoria, entregáveis). Em branco começa vazio. `EditableDataTable`
   já trata isso sozinho; as seções fora de tabela usam `SecaoEditavel`.
2. **Método da agência** (Ciclo do Projeto). Vem preenchido nos dois casos, de
   propósito — é como a agência trabalha, igual para todo cliente. Esvaziar obrigaria
   o time a redigitar o próprio processo a cada conta nova.
3. **Ainda não editável** (GEO, Relatório, Planejamento, Lançamento, Auditoria On-Page,
   Backlinks, Atualizações Semanais). Num projeto em branco mostram `SecaoSemDados`
   em vez do conteúdo da ESEG — **exibir os números de um cliente sob o nome de outro
   é pior do que não mostrar nada**. Ao converter uma delas, troque o guard por
   `useConteudoSeo` + `SecaoEditavel` e tire o nome dela do aviso em `SeoGeo.tsx`.

O aviso amarelo no topo do projeto em branco lista exatamente quais seções estão em
cada categoria. **Ele precisa ser atualizado junto** — um aviso desatualizado promete
o que a tela não faz.

## 4j. Sites e Hotsites · Redes Sociais

Duas frentes novas, montadas no mesmo padrão das anteriores: **abrir a frente cria o
`Projeto`**, e é por isso que elas aparecem sozinhas em "Projetos por frente" na ficha
do cliente. Aqui a criação é implícita — o primeiro site ou o primeiro perfil já chama
`lancarFrente`, sem uma tela extra de "ativar".

| Entidade | Papel |
|---|---|
| `ProjetoSite` | Site, hotsite, landing, blog ou loja; fase, plataforma, URLs e prazo |
| `PerfilSocial` | Perfil por rede, com seguidores e a data da medição |
| `Publicacao` | Calendário editorial das redes: formato, status e data |

As duas telas seguem o desenho do painel de SEO: **a raiz é a carteira de clientes**
(`CarteiraDaFrente`), com quem já tem a frente e quem não tem, e `/{frente}/:id` abre o
cliente. Lançar da carteira cria o `Projeto` e a frente aparece no Painel de CS.

Pontos que valem atenção:

1. **Todo site nasce com as dez etapas de entrega da agência** (`checklistSitePadrao`),
   da aprovação do briefing à publicação e DNS. A barra de progresso do card sai daí,
   não da fase — fase e progresso são coisas diferentes.
2. **Seguidores guardam a data da medição.** Mexer no número atualiza `medido_em`
   sozinho; sem isso, um número de seis meses atrás pareceria de hoje.
3. **Adicionar `TipoProjeto` quebra o build de propósito.** `tipoProjetoLabels`,
   `tipoProjetoCurto`, `tipoProjetoTom`, `nomeDaFrente`, `destinoDoProjeto` e o
   `argumento` da venda adicional são `Record<TipoProjeto, …>`: o TypeScript aponta
   todos os lugares que faltam preencher. Não troque por `Partial`.
4. **`frentesVendaveis` também precisa da frente nova**, ou ela nunca vira sugestão de
   venda para quem ainda não contratou.

### Colaborador é usuário do sistema

Não há cadastro separado de usuário: `criarColaborador` grava o `Profile`, o papel em
`db.roles` e os painéis liberados em `db.permissoes`, tudo de uma vez. A lista de
painéis é derivada de `moduloLabels`, então **um módulo novo aparece na tela de
permissões sozinho** — foi o que aconteceu com Sites e Redes Sociais.

O convite por e-mail depende do Supabase Auth: hoje o campo `convite_enviado_em` é
gravado, mas nenhum e-mail sai.

### Catálogos do código alcançam quem já tem dados

`carregar()` só semeia coleções **vazias**, para nunca sobrescrever o que a pessoa
cadastrou. Isso deixava de fora um caso: catálogos definidos pelo código, que crescem
com o tempo. Ao acrescentar o **Reportei** às integrações, ele não aparecia para quem já
tinha dados salvos, porque a coleção não estava vazia.

`completarCatalogo()` resolve: acrescenta só o que falta, comparando por chave, sem
tocar no que já está lá — o usuário pode ter renomeado ou desativado um item. Vale para
integrações, painéis externos, catálogo de inbound, tipos de tarefa e equipes.
**Ao criar uma entrada nova em qualquer um desses, confira se ela está nessa lista.**

## 5. Integrações

Todas configuradas em Painel Admin → Integrações. Cada uma vira uma edge function
`sync-<serviço>` com upsert idempotente por id externo + `sincronizado_em`.

| Integração | Segredo | Destino | Traz |
|---|---|---|---|
| ClickUp | `CLICKUP_API_TOKEN` | `clickup_tarefas` | Tarefas pendentes, atrasadas e produção do mês por cliente. O campo `concluida_em` alimenta o gráfico de produção e a linha do tempo |
| Sólides | `SOLIDES_API_TOKEN` | `pontos_registrados` | Ponto registrado, horas e banco de horas |
| Conta Azul | `CONTA_AZUL_TOKEN` | `lancamentos_financeiros` | Receitas, despesas e fluxo de caixa |
| Planilha Alfaix | `ALFAIX_SHEET_ID` | `lancamentos_financeiros` | Controle financeiro complementar |
| RD Station CRM | `RD_CRM_TOKEN` | `vendas_negocios` | Negócios e etapas do funil. Sócios e time comercial veem liberando o painel Vendas por usuário |
| Read.ai | `READ_API_KEY` | `reunioes_cliente` | Gravações, atas, resumo e participantes de cada reunião, por workspace do cliente |
| Google Drive | `GOOGLE_SERVICE_ACCOUNT` | `cliente_recursos` (tipo `peca`) | Peças da pasta do cliente |

Painéis externos (Gestão de Tráfego e Projetos RD) não são integrações: são
aplicações próprias embutidas por `<iframe>`. A URL é colada na tela do painel pelo
master e guardada em `paineis_externos`. O painel precisa permitir embed; se bloquear,
o botão "abrir em nova aba" continua funcionando.

---

## 6. Camada de dados

Hoje: `src/data/store.ts`, em memória, **persistida no `localStorage`** do navegador
(chave `central-interna:dados`) para sobreviver ao recarregar a página.
`src/data/seed.ts` traz só o usuário master — nenhum dado fictício.

Cada função do store tem equivalente direto em uma query do Supabase. Ao conectar o
backend, troca-se o corpo dessas funções; as telas não mudam. A persistência local
sai junto.

Para limpar tudo: Painel Admin → Painéis externos → **Zerar dados locais**.

---

## 7. Ordem de aplicação do SQL

1. `docs/schema-completo.sql` — base
2. `docs/migrations/2026-09-01-correcoes.sql` — **duas correções de segurança**
   (contracheques em bucket público; admin conseguindo virar master), constraints
   únicas que as integrações exigem, e índices
3. `docs/migrations/2026-09-01-nova-estrutura.sql` — papéis novos, módulos novos,
   campos do colaborador, viagens, integrações, ponto e lançamentos financeiros
4. `docs/migrations/2026-09-01-historico-e-ia.sql` — reuniões, view do histórico
   unificado, função de produção mensal e registro de consultas à IA
5. `docs/migrations/2026-09-01-modulo-seo.sql` — as duas tabelas do painel de SEO

O passo 3 altera o enum `app_role`. Havendo usuários em produção, rodar antes:
`SELECT role, count(*) FROM public.user_roles GROUP BY 1;`

---

## 8. O que falta para subir online

- [ ] Conectar o Supabase e substituir `src/data/store.ts` pelas queries reais
- [ ] Login por e-mail e senha (hoje o botão entra direto como master)
- [ ] Edge function `manage-users` (criar usuário + disparar e-mail de primeiro acesso)
- [ ] Edge function `analise-cliente-ia` (hoje a análise é simulada no cliente)
- [ ] Edge function `assistente-ia` (hoje o assistente responde de uma base local)
- [ ] Upload real de arquivos nos buckets `documentos`, `comprovantes`, `avatars`, `posts`
- [ ] Sincronizações `sync-clickup`, `sync-solides`, `sync-conta-azul`, `sync-rd`, `sync-read`
- [ ] URLs dos três painéis externos
- [ ] Build de produção e hospedagem
