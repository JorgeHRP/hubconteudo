-- Central Interna — treinamentos no banco (2026-11-04)
--
-- Trilhas, cursos, perguntas, progresso e certificados deixam de morar no
-- navegador de cada pessoa e passam para `central_registros`, como a carteira.
--
-- Duas regras diferentes:
--   * Catálogo (trilhas, cursos, perguntas, modelo do certificado): todos leem,
--     só o master altera.
--   * Progresso e certificado são de cada pessoa: ela lê e grava só os dela,
--     conferido pelo `user_id` gravado no próprio registro. O master vê todos.

CREATE OR REPLACE FUNCTION public.pode_colecao(_user_id uuid, _colecao text, _gravar boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND ativo) THEN false
    WHEN public.is_master(_user_id) THEN true

    -- Integrações e endereços dos painéis: todos leem, só o master altera.
    WHEN _colecao IN ('integracoes', 'paineis') THEN NOT _gravar

    -- Catálogo de treinamentos: todos leem, só o master altera.
    WHEN _colecao IN ('trilhas', 'cursos', 'perguntasCurso', 'modelosCertificado') THEN NOT _gravar

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

    -- progressoCurso e certificados não entram aqui: a regra deles depende de
    -- quem é o dono de cada registro (ver pode_registro_proprio).
    ELSE false
  END
$$;

REVOKE EXECUTE ON FUNCTION public.pode_colecao(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_colecao(uuid, text, boolean) TO authenticated, service_role;

-- Registro que pertence a uma pessoa: só ela, com a conta ativa.
CREATE OR REPLACE FUNCTION public.pode_registro_proprio(_user_id uuid, _colecao text, _dados jsonb)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL
    AND _colecao IN ('progressoCurso', 'certificados')
    AND _dados ->> 'user_id' = _user_id::text
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND ativo)
$$;

REVOKE EXECUTE ON FUNCTION public.pode_registro_proprio(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_registro_proprio(uuid, text, jsonb) TO authenticated, service_role;

-- As policies abaixo somam com as da migração 000007 (policies permissivas se
-- juntam por OU): quem já podia pela coleção continua podendo.
DROP POLICY IF EXISTS "Lê o próprio registro" ON public.central_registros;
CREATE POLICY "Lê o próprio registro" ON public.central_registros
  FOR SELECT TO authenticated
  USING (public.pode_registro_proprio(auth.uid(), colecao, dados));

DROP POLICY IF EXISTS "Cria o próprio registro" ON public.central_registros;
CREATE POLICY "Cria o próprio registro" ON public.central_registros
  FOR INSERT TO authenticated
  WITH CHECK (public.pode_registro_proprio(auth.uid(), colecao, dados));

-- Antes e depois da alteração o dono precisa ser o mesmo: ninguém pega o
-- registro de outra pessoa nem passa o seu para outra.
DROP POLICY IF EXISTS "Altera o próprio registro" ON public.central_registros;
CREATE POLICY "Altera o próprio registro" ON public.central_registros
  FOR UPDATE TO authenticated
  USING (public.pode_registro_proprio(auth.uid(), colecao, dados))
  WITH CHECK (public.pode_registro_proprio(auth.uid(), colecao, dados));
