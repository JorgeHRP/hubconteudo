-- Correções sobre docs/schema-completo.sql — 2026-09-01
-- Cada bloco é independente. Rode em staging antes de produção.
-- Blocos A e B são os que eu rodaria primeiro.

-- =====================================================================
-- BLOCO A — SEGURANÇA (crítico)
-- =====================================================================

-- A1. Contracheques em bucket público.
-- O schema cria 'documentos' privado e depois faz `SET public = true` (linha 268),
-- o que torna TODO arquivo legível por URL, sem autenticação. As policies de
-- storage.objects deixam de proteger a leitura. Separar os dois usos:
--   'documentos'   -> privado, pessoal (contracheque, documento_pessoal)
--   'institucional'-> público, corporativo (manual, política, ativo de marca, repositório)

UPDATE storage.buckets SET public = false WHERE id = 'documentos';

INSERT INTO storage.buckets (id, name, public)
VALUES ('institucional', 'institucional', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Institucional é público" ON storage.objects
  FOR SELECT USING (bucket_id = 'institucional');
CREATE POLICY "Admins publicam institucional" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'institucional' AND public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins apagam institucional" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'institucional' AND public.is_admin_or_master(auth.uid()));

-- Faltavam UPDATE/DELETE no bucket privado (hoje o registro some da tabela mas o arquivo fica).
CREATE POLICY "Admins/RH atualizam documentos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND public.is_admin_master_or_rh(auth.uid()));
CREATE POLICY "Admins/RH apagam documentos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND public.is_admin_master_or_rh(auth.uid()));

-- A2. Documento institucional não tem dono e todos precisam ler.
-- Hoje documentos.user_id é NOT NULL e a RLS só libera dono + RH/admin,
-- então manual/políticas/ativos só aparecem porque o bucket estava público.
ALTER TABLE public.documentos ALTER COLUMN user_id DROP NOT NULL;

CREATE POLICY "Todos veem documentos institucionais" ON public.documentos
  FOR SELECT TO authenticated USING (user_id IS NULL);
CREATE POLICY "Admins publicam institucionais" ON public.documentos
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL AND public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins editam institucionais" ON public.documentos
  FOR UPDATE TO authenticated
  USING (user_id IS NULL AND public.is_admin_or_master(auth.uid()));

-- A3. Escalonamento de privilégio: admin consegue virar master.
-- As policies "Admins can insert/update roles" usam is_admin_or_master() sem
-- restringir o valor de `role`, então um admin insere role='master' para si.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Admins gerenciam papéis não-master" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_master(auth.uid()) AND role <> 'master');
CREATE POLICY "Admins atualizam papéis não-master" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_master(auth.uid()) AND role <> 'master')
  WITH CHECK (public.is_admin_or_master(auth.uid()) AND role <> 'master');
CREATE POLICY "Admins removem papéis não-master" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin_or_master(auth.uid()) AND role <> 'master');
-- A policy "Only master can manage roles" (FOR ALL) continua cobrindo o papel master.

-- A4. Qualquer autenticado pode inserir avaliação de churn.
-- O WITH CHECK atual só exige auth.uid() = analista_id.
DROP POLICY IF EXISTS "CS can create assessments" ON public.churn_avaliacoes;
CREATE POLICY "CS cria avaliações" ON public.churn_avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = analista_id AND (
      public.has_modulo(auth.uid(), 'cs')
      OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid())
    )
  );

-- Mesma folga no bucket 'posts': hoje qualquer autenticado escreve em qualquer pasta.
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
CREATE POLICY "Usuário sobe imagem na própria pasta" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Usuário apaga a própria imagem" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- BLOCO B — DESBLOQUEIA AS INTEGRAÇÕES DA SEÇÃO 9
-- Sem estas chaves não existe upsert idempotente: cada sync duplica tudo.
-- Rode os SELECTs de duplicata antes; se voltar linha, limpe primeiro.
-- =====================================================================

-- SELECT task_id, count(*) FROM public.clickup_tarefas GROUP BY 1 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS clickup_tarefas_task_id_key
  ON public.clickup_tarefas (task_id) WHERE task_id IS NOT NULL;

-- SELECT rd_deal_id, count(*) FROM public.vendas_negocios GROUP BY 1 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS vendas_negocios_rd_deal_id_key
  ON public.vendas_negocios (rd_deal_id) WHERE rd_deal_id IS NOT NULL;

-- Spec §7.10: "uma avaliação por referencia_mes" — não havia constraint.
-- SELECT cliente_id, referencia_mes, count(*) FROM public.churn_avaliacoes GROUP BY 1,2 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS churn_avaliacoes_cliente_mes_key
  ON public.churn_avaliacoes (cliente_id, referencia_mes);

-- Read.ai/Drive gravam em cliente_recursos por URL de origem.
CREATE UNIQUE INDEX IF NOT EXISTS cliente_recursos_cliente_url_key
  ON public.cliente_recursos (cliente_id, url) WHERE url IS NOT NULL;

-- =====================================================================
-- BLOCO C — CHECKs que não batem com a spec (a UI grava valor recusado)
-- =====================================================================

-- Spec §7.2: comunicado | evento | novidade | geral. Schema: texto | imagem | aviso.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_tipo_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_tipo_check
  CHECK (tipo IN ('comunicado', 'evento', 'novidade', 'geral'));
-- Migre os dados antes: UPDATE public.posts SET tipo = 'geral' WHERE tipo IN ('texto','imagem');
--                       UPDATE public.posts SET tipo = 'comunicado' WHERE tipo = 'aviso';

-- Spec §7.6 inclui 'treinamento', que hoje seria recusado.
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;
ALTER TABLE public.eventos ADD CONSTRAINT eventos_tipo_check
  CHECK (tipo IN ('evento', 'aniversario', 'feriado', 'treinamento', 'comunicado'));

-- Spec §7.4 usa a mesma tabela para manual, políticas, ativos e repositório.
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_categoria_check;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_categoria_check
  CHECK (categoria IN ('contracheque', 'documento_pessoal', 'repositorio',
                       'ativo_marca', 'manual', 'politica', 'outro'));

-- =====================================================================
-- BLOCO D — PERMISSÕES DE RH QUE A SPEC PROMETE E O SCHEMA NÃO DÁ
-- =====================================================================

-- Spec §7.7: "RH/admin tratam todos" — RH lê mas não consegue mudar o status.
CREATE POLICY "RH atualiza solicitações" ON public.solicitacoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'rh'))
  WITH CHECK (public.has_role(auth.uid(), 'rh'));

-- Spec §7.6: "criação por admin/RH" — só admin/master tem policy.
CREATE POLICY "RH gerencia eventos" ON public.eventos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'rh'))
  WITH CHECK (public.has_role(auth.uid(), 'rh'));

-- =====================================================================
-- BLOCO E — ÍNDICES DE CHAVE ESTRANGEIRA (Postgres não cria sozinho)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_posts_autor            ON public.posts (autor_id);
CREATE INDEX IF NOT EXISTS idx_posts_created          ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_post       ON public.comentarios (post_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_post          ON public.post_curtidas (post_id);
CREATE INDEX IF NOT EXISTS idx_documentos_user        ON public.documentos (user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria   ON public.documentos (categoria);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_solic     ON public.solicitacoes (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data           ON public.eventos (data);
CREATE INDEX IF NOT EXISTS idx_progresso_user         ON public.treinamento_progresso (user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel   ON public.clientes (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_recursos_cliente       ON public.cliente_recursos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_notas_cliente          ON public.cliente_notas (cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_cliente          ON public.churn_avaliacoes (cliente_id, referencia_mes DESC);
CREATE INDEX IF NOT EXISTS idx_analises_cliente       ON public.cliente_analises_ia (cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente        ON public.clickup_tarefas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_negocios_etapa         ON public.vendas_negocios (etapa);
CREATE INDEX IF NOT EXISTS idx_user_permissoes_user   ON public.user_permissoes (user_id);
