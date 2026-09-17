-- Central Interna — módulo de SEO/GEO (2026-09-01)
-- Aplicar depois de 2026-09-01-historico-e-ia.sql
--
-- O painel de SEO guarda apenas dois tipos de informação no banco: o estado das
-- tabelas que as pessoas editam, e quem alterou o quê. Todo o conteúdo de
-- referência vive em arquivos estáticos no próprio código.

-- =====================================================================
-- 1. DADOS COMPARTILHADOS (chave → JSON)
-- =====================================================================

-- A chave já vem prefixada pela aplicação com "cliente:<id>:", garantindo que
-- projetos de clientes diferentes nunca se misturem.
CREATE TABLE public.shared_table_data (
  storage_key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.shared_table_data TO authenticated;
GRANT ALL ON public.shared_table_data TO service_role;
ALTER TABLE public.shared_table_data ENABLE ROW LEVEL SECURITY;

-- Quem tem o painel de SEO liberado lê e escreve. Ninguém mais enxerga.
CREATE POLICY "SEO lê dados compartilhados" ON public.shared_table_data
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "SEO grava dados compartilhados" ON public.shared_table_data
  FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "SEO atualiza dados compartilhados" ON public.shared_table_data
  FOR UPDATE TO authenticated
  USING (public.has_modulo(auth.uid(), 'seo_geo'))
  WITH CHECK (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "Master apaga dados compartilhados" ON public.shared_table_data
  FOR DELETE TO authenticated USING (public.is_master(auth.uid()));

CREATE TRIGGER update_shared_table_data_updated_at
  BEFORE UPDATE ON public.shared_table_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tempo real: quando alguém salva, as outras telas abertas se atualizam sozinhas.
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_table_data;

-- =====================================================================
-- 2. HISTÓRICO DE ALTERAÇÕES
-- =====================================================================

CREATE TABLE public.modification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  changes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.modification_history TO authenticated;
GRANT ALL ON public.modification_history TO service_role;
ALTER TABLE public.modification_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_modification_history_chave
  ON public.modification_history (storage_key, created_at DESC);

-- O histórico é colaborativo: quem tem o painel vê tudo, não só o próprio.
-- (No projeto de origem a política era `auth.uid() = user_id`, o que escondia
--  as alterações dos colegas e fazia parecer que o histórico estava vazio.)
CREATE POLICY "SEO vê o histórico completo" ON public.modification_history
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "SEO registra alteração" ON public.modification_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_modulo(auth.uid(), 'seo_geo'));


-- =====================================================================
-- 3. PROJETOS DE SEO POR CLIENTE
-- =====================================================================

CREATE TABLE public.projetos_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'modelo_eseg'
    CHECK (origem IN ('vazio', 'modelo_eseg')),
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE ON public.projetos_seo TO authenticated;
GRANT ALL ON public.projetos_seo TO service_role;
ALTER TABLE public.projetos_seo ENABLE ROW LEVEL SECURITY;

-- Um projeto ativo por cliente.
CREATE UNIQUE INDEX projetos_seo_cliente_ativo_key
  ON public.projetos_seo (cliente_id) WHERE ativo;

CREATE POLICY "SEO vê projetos" ON public.projetos_seo
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "SEO lança projeto" ON public.projetos_seo
  FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'seo_geo'));
CREATE POLICY "SEO encerra projeto" ON public.projetos_seo
  FOR UPDATE TO authenticated
  USING (public.has_modulo(auth.uid(), 'seo_geo'))
  WITH CHECK (public.has_modulo(auth.uid(), 'seo_geo'));
