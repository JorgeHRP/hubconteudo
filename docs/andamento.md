# Central Interna: onde estamos

Atualizado em 04/11/2026.

O sistema está no ar, com login de verdade e com as principais telas gravando
no banco de dados. Abaixo, o que já dá para usar, o que está no ar só para
navegar e o que vem a seguir.

Endereço: https://hub.conteudomar.tech/

## O que já funciona

Tudo nesta lista grava no banco. O que uma pessoa cadastra, as outras veem.

**Acesso**

- Login com e-mail e senha.
- "Esqueci minha senha".
- Cada pessoa só enxerga no menu os painéis que foram liberados para ela.
- A tela de senha provisória que aparecia antes do login foi retirada. Agora o
  site abre direto no login oficial.

**Pessoas**

- Cadastro de colaborador, já criando o acesso ao sistema.
- Diretório do time.
- Papéis (master, gerente, funcionário) e liberação de painel por pessoa.
- Desativar um colaborador, o que bloqueia o login dele.
- Cada um edita o próprio perfil.

**Hub**

- Mural: publicar, curtir, comentar e fixar avisos.
- Calendário de eventos.
- Solicitações internas, com acompanhamento de status.

**Clientes e operação**

- Carteira de clientes, com contatos, escopo de contrato e histórico. Os dez
  clientes importados do Portal MarTech já estão lá.
- Painel de CS: ficha do cliente, notas, avaliação de churn e projetos por
  frente.
- Inbound: plano do mês por pontos, pautas e fluxos de nutrição.
- Gestão de Tráfego.
- Quadro de tarefas, com responsáveis, comentários e registro de tempo.
- Sites, Redes Sociais e Projetos RD.
- Painel de SEO: as edições feitas em cada projeto.

**Vendas e viagens**

- Resultados de Vendas: quem tem o painel cadastra os negócios, move de etapa
  e marca como ganho ou perdido. Os indicadores e o funil saem desses dados.
  Quando o RD Station for conectado, os negócios de lá entram sozinhos e ficam
  só para leitura.
- Relatório de Viagens: cada pessoa cria o relatório, lança as despesas e
  envia. Quem tem o painel de aprovação aprova, reprova com motivo ou marca
  como reembolsado. Ninguém aprova o próprio relatório, e um relatório sem
  despesa não pode ser enviado.
- Comprovantes de viagem: o arquivo (PDF ou foto, até 10 MB) é enviado junto
  com a despesa e fica guardado em área privada. Só a própria pessoa e quem
  aprova viagens conseguem abrir.

**Treinamentos**

- Trilhas, cursos e questionários, cadastrados pelo master, valem para todo
  mundo.
- O progresso, as notas e os certificados de cada pessoa ficam no banco. Cada
  um vê só os seus; o master vê os de todos.
- O que o master já tinha cadastrado no navegador sobe sozinho no primeiro
  login depois da atualização.

**Gestão de Tráfego**

- Quem tem o painel de tráfego, mas não o de CS, não é mais levado para a
  tela inicial ao clicar num cliente.

Quando alguém altera alguma coisa, a mudança aparece para os outros em até
20 segundos, sem precisar recarregar a página.

## Infraestrutura

- O site está publicado no domínio oficial, com conexão segura (HTTPS).
- O banco de dados está criado, com todas as tabelas do sistema.
- O que já existia no banco de outro sistema continua intacto.

## Segurança

- Ninguém entra sem e-mail e senha, e não é possível criar conta por fora: só
  o master cadastra pessoas.
- As regras de quem vê o quê são conferidas no banco, e não só escondidas na
  tela. Mesmo alguém que tente acessar os dados por fora do site só recebe o
  que o perfil dele permite.
- CPF e contato de emergência aparecem apenas para a própria pessoa e para
  quem cuida de colaboradores.
- A ficha de CS (notas, churn, análises) só abre para quem tem o painel de CS.
- Só o master altera papéis, permissões e integrações.
- Os dados de clientes não ficam mais dentro do código do site. Ficam no
  banco e só chegam a quem fez login.
- Essas regras têm 194 testes automáticos, que rodam antes de qualquer
  mudança no banco.

## O que está no ar só para navegar

Estas telas abrem e funcionam, mas ainda guardam os dados no navegador de
cada pessoa. Servem para conhecer e validar, não para uso real ainda:

- Financeiro
- Repositórios e Contracheques

Contracheques ainda não devem receber arquivo real.

