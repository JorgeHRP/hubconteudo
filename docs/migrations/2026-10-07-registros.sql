-- Central Interna — registros compartilhados (2026-10-07)
--
-- Carteira de clientes, CS, tarefas, inbound, tráfego, sites, redes e projetos RD
-- deixam de morar no navegador de cada pessoa. Cada registro dessas telas vira
-- uma linha aqui, com o conteúdo em JSON, do jeito que a tela já usa.
--
-- É o caminho curto do MVP: uma tabela só, em vez de uma por entidade. Quando um
-- módulo ganhar tabelas próprias, os dados saem daqui para lá.
--
-- Nada é apagado de verdade: remover marca `removido`, para quem está com a tela
-- aberta ficar sabendo na próxima busca.

CREATE TABLE IF NOT EXISTS public.central_registros (
  colecao text NOT NULL,
  id text NOT NULL,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  removido boolean NOT NULL DEFAULT false,
  -- Ordem de criação: é o que mantém as listas na mesma ordem para todo mundo.
  seq bigint GENERATED ALWAYS AS IDENTITY,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (colecao, id)
);

CREATE INDEX IF NOT EXISTS idx_central_registros_atualizado
  ON public.central_registros (atualizado_em);

-- A hora e o autor são sempre os do servidor: quem busca "o que mudou desde X"
-- não pode depender do relógio de quem gravou.
CREATE OR REPLACE FUNCTION public.central_registros_carimbo()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em := now();
  NEW.atualizado_por := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS central_registros_carimbo ON public.central_registros;
CREATE TRIGGER central_registros_carimbo
  BEFORE INSERT OR UPDATE ON public.central_registros
  FOR EACH ROW EXECUTE FUNCTION public.central_registros_carimbo();

-- Quem pode ler ou gravar cada coleção. Coleção que não está nesta lista não
-- entra: incluir uma nova é decisão tomada aqui, não no navegador.
CREATE OR REPLACE FUNCTION public.pode_colecao(_user_id uuid, _colecao text, _gravar boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND ativo) THEN false
    WHEN public.is_master(_user_id) THEN true

    -- Integrações e endereços dos painéis: todos leem, só o master altera.
    WHEN _colecao IN ('integracoes', 'paineis') THEN NOT _gravar

    -- Avisos do sino: qualquer pessoa pode ser responsável por uma tarefa.
    WHEN _colecao IN ('notificacoes', 'preferenciasNotificacao') THEN true

    -- Ficha de CS: notas, avaliações de churn, análises e reuniões.
    WHEN _colecao IN ('clientes', 'notas', 'recursos', 'avaliacoes', 'analises',
                      'tarefas', 'reunioes')
      THEN public.has_modulo(_user_id, 'cs')

    -- Carteira e frentes: quem tem ao menos um painel de trabalho da agência.
    WHEN _colecao IN (
      'empresas', 'contatos', 'personas', 'produtos', 'concorrentes', 'reunioesEmpresa',
      'cases', 'timeline', 'documentosEmpresa', 'escopos', 'projetos', 'conquistas',
      'equipe', 'equipes', 'oportunidades', 'projetosSeo',
      'tarefas_internas', 'statusTarefa', 'tiposTarefa', 'comentariosTarefa', 'temposTarefa',
      'acessosCliente', 'notificacoesCliente',
      'catalogoInbound', 'pontosMesInbound', 'planoInbound', 'pautasInbound',
      'fluxosInbound', 'nosFluxo',
      'projetosSite', 'perfisSociais', 'publicacoes',
      'implantacoes', 'notasImplantacao')
      THEN EXISTS (
        SELECT 1 FROM public.user_permissoes
        WHERE user_id = _user_id
          AND modulo IN ('clientes', 'tarefas', 'cs', 'trafego', 'seo_geo',
                         'inbound', 'sites', 'social', 'projetos_rd'))

    ELSE false
  END
$$;

REVOKE EXECUTE ON FUNCTION public.pode_colecao(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_colecao(uuid, text, boolean) TO authenticated, service_role;

REVOKE ALL ON public.central_registros FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.central_registros TO authenticated;
GRANT ALL ON public.central_registros TO service_role;
ALTER TABLE public.central_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lê a coleção quem pode" ON public.central_registros;
CREATE POLICY "Lê a coleção quem pode" ON public.central_registros
  FOR SELECT TO authenticated
  USING (public.pode_colecao(auth.uid(), colecao, false));

DROP POLICY IF EXISTS "Cria na coleção quem pode" ON public.central_registros;
CREATE POLICY "Cria na coleção quem pode" ON public.central_registros
  FOR INSERT TO authenticated
  WITH CHECK (public.pode_colecao(auth.uid(), colecao, true));

DROP POLICY IF EXISTS "Altera na coleção quem pode" ON public.central_registros;
CREATE POLICY "Altera na coleção quem pode" ON public.central_registros
  FOR UPDATE TO authenticated
  USING (public.pode_colecao(auth.uid(), colecao, true))
  WITH CHECK (public.pode_colecao(auth.uid(), colecao, true));
