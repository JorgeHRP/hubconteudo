-- Central Interna — Relatório de Viagens e Vendas no banco (2026-10-23)
--
-- As duas telas saem do navegador e passam a usar as tabelas que já existiam
-- (000001 e 000003). Aqui entram as regras que as policies sozinhas não
-- conseguem expressar: quem pode levar um relatório de um status a outro, e o
-- cadastro manual de negócios por quem tem o painel de Vendas.

-- =====================================================================
-- 1. RELATÓRIO DE VIAGENS: caminho do status
-- =====================================================================
--
--   rascunho ─┐
--             ├─(dono envia, com ao menos uma despesa)─> enviado
--   reprovado ┘                                          │
--        ^                         (dono recolhe) <──────┤
--        └──────(financeiro reprova, com motivo)─────────┤
--                                                        └─(financeiro aprova)─> aprovado ─(financeiro paga)─> pago
--
-- Quem avalia nunca é o dono do relatório (exceto o master). Quem avaliou e
-- quando são carimbados pelo servidor, não pelo navegador.

CREATE OR REPLACE FUNCTION public.viagem_transicao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  quem uuid := auth.uid();
  dono boolean;
  avaliador boolean;
BEGIN
  -- Chave de serviço (rotinas internas) não passa por aqui.
  IF quem IS NULL THEN RETURN NEW; END IF;

  dono := OLD.colaborador_id = quem;
  avaliador := public.has_modulo(quem, 'viagens_aprovacao')
               AND (NOT dono OR public.is_master(quem));

  IF NEW.colaborador_id <> OLD.colaborador_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'O dono e a data de criação do relatório não mudam.';
  END IF;

  -- Mesmo status: só o dono, só enquanto o relatório está com ele.
  IF NEW.status = OLD.status THEN
    IF NOT (dono AND OLD.status IN ('rascunho', 'reprovado')) THEN
      RAISE EXCEPTION 'Este relatório não pode mais ser alterado.';
    END IF;
    NEW.observacao_financeiro := OLD.observacao_financeiro;
    NEW.avaliado_por := OLD.avaliado_por;
    NEW.avaliado_em := OLD.avaliado_em;
    RETURN NEW;
  END IF;

  IF OLD.status IN ('rascunho', 'reprovado') AND NEW.status = 'enviado' AND dono THEN
    IF NOT EXISTS (SELECT 1 FROM public.despesas_viagem WHERE relatorio_id = OLD.id) THEN
      RAISE EXCEPTION 'Lance ao menos uma despesa antes de enviar.';
    END IF;
    -- O motivo da última reprovação fica visível até a próxima avaliação.
    NEW.observacao_financeiro := OLD.observacao_financeiro;
    NEW.avaliado_por := OLD.avaliado_por;
    NEW.avaliado_em := OLD.avaliado_em;
    RETURN NEW;
  END IF;

  IF OLD.status = 'enviado' AND NEW.status = 'rascunho' AND dono THEN
    NEW.observacao_financeiro := OLD.observacao_financeiro;
    NEW.avaliado_por := OLD.avaliado_por;
    NEW.avaliado_em := OLD.avaliado_em;
    RETURN NEW;
  END IF;

  IF avaliador AND (
       (OLD.status = 'enviado' AND NEW.status IN ('aprovado', 'reprovado'))
    OR (OLD.status = 'aprovado' AND NEW.status = 'pago')
  ) THEN
    IF NEW.status = 'reprovado' AND coalesce(btrim(NEW.observacao_financeiro), '') = '' THEN
      RAISE EXCEPTION 'Informe o motivo da reprovação.';
    END IF;
    IF NEW.status = 'aprovado' THEN NEW.observacao_financeiro := NULL; END IF;
    IF NEW.status = 'pago' THEN NEW.observacao_financeiro := OLD.observacao_financeiro; END IF;
    NEW.avaliado_por := quem;
    NEW.avaliado_em := now();
    RETURN NEW;
  END IF;

  IF dono AND public.has_modulo(quem, 'viagens_aprovacao') AND NOT public.is_master(quem) THEN
    RAISE EXCEPTION 'Você não pode avaliar o próprio relatório.';
  END IF;
  RAISE EXCEPTION 'Mudança de status não permitida: % para %.', OLD.status, NEW.status;
END;
$$;

DROP TRIGGER IF EXISTS viagem_transicao ON public.relatorios_viagem;
CREATE TRIGGER viagem_transicao
  BEFORE UPDATE ON public.relatorios_viagem
  FOR EACH ROW EXECUTE FUNCTION public.viagem_transicao();

-- Relatório novo sempre nasce rascunho e sem avaliação.
CREATE OR REPLACE FUNCTION public.viagem_nova()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  NEW.status := 'rascunho';
  NEW.observacao_financeiro := NULL;
  NEW.avaliado_por := NULL;
  NEW.avaliado_em := NULL;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS viagem_nova ON public.relatorios_viagem;
CREATE TRIGGER viagem_nova
  BEFORE INSERT ON public.relatorios_viagem
  FOR EACH ROW EXECUTE FUNCTION public.viagem_nova();

-- =====================================================================
-- 2. VENDAS: cadastro manual
-- =====================================================================
--
-- Enquanto a sincronização com o RD Station não existe, quem tem o painel de
-- Vendas cadastra e move os próprios negócios. O que vier do RD (rd_deal_id
-- preenchido) continua só leitura: quem grava é a sincronização.

ALTER TABLE public.vendas_negocios
  ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.vendas_negocios
    ADD CONSTRAINT vendas_negocios_etapa_valida
    CHECK (etapa IN ('prospeccao', 'qualificacao', 'proposta', 'negociacao', 'ganho', 'perdido'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.vendas_negocios
    ADD CONSTRAINT vendas_negocios_valor_positivo CHECK (valor >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status e data de fechamento seguem a etapa, para o funil e os indicadores
-- nunca discordarem da tabela.
CREATE OR REPLACE FUNCTION public.negocio_coerente()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.etapa IN ('ganho', 'perdido') THEN
    NEW.status := NEW.etapa;
    NEW.data_fechamento := coalesce(NEW.data_fechamento, current_date);
  ELSE
    NEW.status := 'aberto';
    NEW.data_fechamento := NULL;
  END IF;
  NEW.atualizado_em := now();
  IF TG_OP = 'INSERT' AND auth.uid() IS NOT NULL THEN
    NEW.criado_por := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.criado_por := OLD.criado_por;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS negocio_coerente ON public.vendas_negocios;
CREATE TRIGGER negocio_coerente
  BEFORE INSERT OR UPDATE ON public.vendas_negocios
  FOR EACH ROW EXECUTE FUNCTION public.negocio_coerente();

DROP POLICY IF EXISTS "Vendas cadastra negócio manual" ON public.vendas_negocios;
CREATE POLICY "Vendas cadastra negócio manual" ON public.vendas_negocios
  FOR INSERT TO authenticated
  WITH CHECK (public.has_modulo(auth.uid(), 'vendas') AND rd_deal_id IS NULL);

DROP POLICY IF EXISTS "Vendas altera negócio manual" ON public.vendas_negocios;
CREATE POLICY "Vendas altera negócio manual" ON public.vendas_negocios
  FOR UPDATE TO authenticated
  USING (public.has_modulo(auth.uid(), 'vendas') AND rd_deal_id IS NULL)
  WITH CHECK (public.has_modulo(auth.uid(), 'vendas') AND rd_deal_id IS NULL);

DROP POLICY IF EXISTS "Vendas remove negócio manual" ON public.vendas_negocios;
CREATE POLICY "Vendas remove negócio manual" ON public.vendas_negocios
  FOR DELETE TO authenticated
  USING (public.has_modulo(auth.uid(), 'vendas') AND rd_deal_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_negocios_criacao ON public.vendas_negocios (data_criacao DESC);
