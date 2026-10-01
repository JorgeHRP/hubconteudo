-- Central Interna — auditoria das policies (2026-10-01)
--
-- Revisão de cada policy contra as regras de docs/estrutura.md. O que estava
-- diferente do combinado é corrigido aqui. Os casos estão cobertos em
-- supabase/testes/rls.test.mjs (npm run db:testar).

-- =====================================================================
-- 1. GERENTE NÃO TEM TODOS OS PAINÉIS
-- =====================================================================
-- has_modulo devolvia true para master E gerente. A regra é: master tem tudo;
-- os demais, só o que estiver marcado em user_permissoes. Do jeito que estava,
-- todo gerente via CS, vendas, financeiro e contracheques sem ninguém liberar.
CREATE OR REPLACE FUNCTION public.has_modulo(_user_id uuid, _modulo public.app_modulo)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_master(_user_id)
      OR EXISTS (SELECT 1 FROM public.user_permissoes
                 WHERE user_id = _user_id AND modulo = _modulo)
$$;

-- "RH" do schema antigo é, no modelo atual, quem tem o módulo `colaboradores`.
-- Esta função protege documentos pessoais e contracheques (tabela e bucket).
CREATE OR REPLACE FUNCTION public.is_admin_master_or_rh(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_modulo(_user_id, 'colaboradores')
$$;

-- =====================================================================
-- 2. DOCUMENTOS
-- =====================================================================
-- Com a troca acima, gerente sem `colaboradores` deixa de ver contracheque
-- alheio. Institucional (user_id nulo) continua com o gerente — faltava só
-- a policy de apagar.
CREATE POLICY "Admins apagam institucionais" ON public.documentos
  FOR DELETE TO authenticated
  USING (user_id IS NULL AND public.is_gestor(auth.uid()));

-- =====================================================================
-- 3. COLABORADORES: CPF E CONTATO DE EMERGÊNCIA
-- =====================================================================
-- Cadastrar e editar pessoa é do módulo `colaboradores`, não de todo gerente.
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Gestão de pessoas cadastra" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_modulo(auth.uid(), 'colaboradores'));
CREATE POLICY "Gestão de pessoas edita" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_modulo(auth.uid(), 'colaboradores'))
  WITH CHECK (public.has_modulo(auth.uid(), 'colaboradores'));

-- A policy de leitura de profiles é `true` (o diretório é de todos), e policy
-- não esconde coluna. Então qualquer pessoa logada lia o CPF de todo mundo
-- direto na tabela. A leitura das três colunas sensíveis sai da tabela e passa
-- a existir só pela view abaixo.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, nome, email, cargo, departamento, telefone, foto_url,
  data_nascimento, data_admissao, ativo, convite_enviado_em, created_at, updated_at
) ON public.profiles TO authenticated;

-- A view roda com o privilégio do dono (security_invoker = false) justamente
-- para alcançar as colunas que a tabela não entrega mais. Quem filtra é o CASE.
-- Por rodar como dono, ela não passa pelo RLS: por isso o WHERE e o REVOKE.
DROP VIEW IF EXISTS public.colaboradores_publico;
CREATE VIEW public.colaboradores_publico
WITH (security_invoker = false) AS
SELECT
  id, user_id, nome, email, cargo, departamento, telefone,
  foto_url, data_nascimento, data_admissao, ativo, convite_enviado_em,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN cpf END AS cpf,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN contato_emergencia_nome END AS contato_emergencia_nome,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN contato_emergencia_telefone END AS contato_emergencia_telefone
FROM public.profiles
WHERE auth.uid() IS NOT NULL;

REVOKE ALL ON public.colaboradores_publico FROM PUBLIC, anon;
GRANT SELECT ON public.colaboradores_publico TO authenticated;

-- =====================================================================
-- 4. VENDAS E CLICKUP
-- =====================================================================
-- "FOR ALL" inclui leitura: gerente sem o painel liberado lia todos os
-- negócios e tarefas. Quem grava aqui é a sincronização (chave de serviço).
DROP POLICY IF EXISTS "Admins manage deals" ON public.vendas_negocios;
CREATE POLICY "Master gerencia negócios" ON public.vendas_negocios
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));

DROP POLICY IF EXISTS "Admins manage tasks" ON public.clickup_tarefas;
CREATE POLICY "Master gerencia tarefas" ON public.clickup_tarefas
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));

-- =====================================================================
-- 5. CS: GERENTE SÓ MEXE SE TIVER O PAINEL
-- =====================================================================
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clientes;
CREATE POLICY "Gestor de CS apaga cliente" ON public.clientes
  FOR DELETE TO authenticated
  USING (public.is_gestor(auth.uid()) AND public.has_modulo(auth.uid(), 'cs'));

DROP POLICY IF EXISTS "Authors can delete notes" ON public.cliente_notas;
CREATE POLICY "Autor ou gestor de CS apaga nota" ON public.cliente_notas
  FOR DELETE TO authenticated
  USING (auth.uid() = autor_id
         OR (public.is_gestor(auth.uid()) AND public.has_modulo(auth.uid(), 'cs')));

DROP POLICY IF EXISTS "CS can update own assessments" ON public.churn_avaliacoes;
CREATE POLICY "Analista ou gestor de CS edita avaliação" ON public.churn_avaliacoes
  FOR UPDATE TO authenticated
  USING (auth.uid() = analista_id
         OR (public.is_gestor(auth.uid()) AND public.has_modulo(auth.uid(), 'cs')));

DROP POLICY IF EXISTS "Admins can delete assessments" ON public.churn_avaliacoes;
CREATE POLICY "Gestor de CS apaga avaliação" ON public.churn_avaliacoes
  FOR DELETE TO authenticated
  USING (public.is_gestor(auth.uid()) AND public.has_modulo(auth.uid(), 'cs'));

DROP POLICY IF EXISTS "Admins can delete AI analyses" ON public.cliente_analises_ia;
CREATE POLICY "Gestor de CS apaga análise" ON public.cliente_analises_ia
  FOR DELETE TO authenticated
  USING (public.is_gestor(auth.uid()) AND public.has_modulo(auth.uid(), 'cs'));

-- =====================================================================
-- 6. FEED: FIXAR É DO GESTOR
-- =====================================================================
-- Qualquer pessoa criava ou editava o próprio post já com fixado = true.
-- O tipo padrão continuava 'texto', que a lista de tipos válidos não aceita
-- mais: publicar sem informar o tipo dava erro.
ALTER TABLE public.posts ALTER COLUMN tipo SET DEFAULT 'geral';

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = autor_id AND (NOT fixado OR public.is_gestor(auth.uid())));

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = autor_id)
  WITH CHECK (auth.uid() = autor_id AND (NOT fixado OR public.is_gestor(auth.uid())));

-- =====================================================================
-- 7. FUNÇÕES DE PAPEL: SÓ PARA QUEM ESTÁ LOGADO
-- =====================================================================
-- Função nasce executável por todo mundo, inclusive por quem não fez login,
-- que conseguia perguntar pela API se um id qualquer é master.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_modulo(uuid, public.app_modulo) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_gestor(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_master_or_rh(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.producao_mensal_cliente(uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_modulo(uuid, public.app_modulo) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_gestor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_master_or_rh(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.producao_mensal_cliente(uuid, integer) TO authenticated, service_role;
