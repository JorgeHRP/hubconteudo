-- Central Interna — nova estrutura (2026-09-01)
-- Substitui o modelo de papéis da spec original e acrescenta:
-- dados completos do colaborador, relatório de viagens, integrações e painéis externos.
--
-- Ordem de aplicação:
--   1) docs/schema-completo.sql        (base)
--   2) docs/migrations/2026-09-01-correcoes.sql (segurança e índices)
--   3) este arquivo
--
-- ATENÇÃO: o bloco 1 altera o enum app_role. Se já existirem usuários em produção,
-- rode primeiro o SELECT de conferência comentado ao final do bloco.

-- =====================================================================
-- 1. PAPÉIS: master | gerente | funcionario
-- =====================================================================

ALTER TYPE public.app_role RENAME TO app_role_antigo;
CREATE TYPE public.app_role AS ENUM ('master', 'gerente', 'funcionario');

ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING (
    CASE role::text
      WHEN 'master' THEN 'master'
      WHEN 'admin'  THEN 'gerente'
      WHEN 'rh'     THEN 'gerente'
      ELSE 'funcionario'
    END
  )::public.app_role;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'funcionario';

DROP TYPE public.app_role_antigo;

-- Funções que citavam 'admin'/'rh' precisam ser recriadas.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master')
$$;

CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('master', 'gerente')
  )
$$;

-- is_admin_or_master / is_admin_master_or_rh continuam existindo como apelidos,
-- para não quebrar as policies já criadas nos arquivos anteriores.
CREATE OR REPLACE FUNCTION public.is_admin_or_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_gestor(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master_or_rh(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_gestor(_user_id)
$$;

-- handle_new_user passa a criar 'funcionario'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'funcionario');
  RETURN NEW;
END;
$$;

-- Conferência antes de rodar em produção:
-- SELECT role, count(*) FROM public.user_roles GROUP BY 1;

-- =====================================================================
-- 2. MÓDULOS: painéis liberados por usuário
-- =====================================================================

ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'colaboradores';
ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'viagens_aprovacao';
ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'trafego';
ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'seo_geo';
ALTER TYPE public.app_modulo ADD VALUE IF NOT EXISTS 'projetos_rd';
-- 'cs', 'vendas' e 'clickup' já existem.

-- =====================================================================
-- 3. COLABORADOR: dados completos
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS contato_emergencia_nome text,
  ADD COLUMN IF NOT EXISTS contato_emergencia_telefone text,
  ADD COLUMN IF NOT EXISTS convite_enviado_em timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_key
  ON public.profiles (regexp_replace(cpf, '\D', '', 'g'))
  WHERE cpf IS NOT NULL;

-- CPF e contato de emergência são dados sensíveis: só o dono e quem tem o
-- módulo 'colaboradores' devem enxergar. A policy "todos leem profiles" do
-- schema original continua valendo para os campos públicos — para esconder
-- os sensíveis, exponha o diretório por esta view em vez da tabela.
CREATE OR REPLACE VIEW public.colaboradores_publico
WITH (security_invoker = true) AS
SELECT
  id, user_id, nome, email, cargo, departamento, telefone,
  foto_url, data_nascimento, data_admissao, ativo,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN cpf END AS cpf,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN contato_emergencia_nome END AS contato_emergencia_nome,
  CASE WHEN auth.uid() = user_id OR public.has_modulo(auth.uid(), 'colaboradores')
       THEN contato_emergencia_telefone END AS contato_emergencia_telefone
FROM public.profiles;

GRANT SELECT ON public.colaboradores_publico TO authenticated;

-- Competência do contracheque (mês de referência).
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS competencia date;

-- =====================================================================
-- 4. RELATÓRIO DE VIAGENS
-- =====================================================================

CREATE TYPE public.viagem_status AS ENUM
  ('rascunho', 'enviado', 'aprovado', 'reprovado', 'pago');

CREATE TYPE public.despesa_categoria AS ENUM
  ('transporte', 'hospedagem', 'alimentacao', 'combustivel', 'estacionamento', 'outro');

CREATE TABLE public.relatorios_viagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  destino text NOT NULL,
  motivo text,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status public.viagem_status NOT NULL DEFAULT 'rascunho',
  observacao_financeiro text,
  avaliado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  avaliado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT periodo_valido CHECK (data_fim >= data_inicio)
);

CREATE TABLE public.despesas_viagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id uuid NOT NULL REFERENCES public.relatorios_viagem(id) ON DELETE CASCADE,
  categoria public.despesa_categoria NOT NULL DEFAULT 'outro',
  descricao text NOT NULL,
  data date NOT NULL,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  comprovante_url text,
  comprovante_nome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_viagem TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_viagem TO authenticated;
GRANT ALL ON public.relatorios_viagem TO service_role;
GRANT ALL ON public.despesas_viagem TO service_role;

ALTER TABLE public.relatorios_viagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_viagem ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_viagem_colaborador ON public.relatorios_viagem (colaborador_id, created_at DESC);
CREATE INDEX idx_viagem_status ON public.relatorios_viagem (status);
CREATE INDEX idx_despesa_relatorio ON public.despesas_viagem (relatorio_id);

CREATE TRIGGER update_relatorios_viagem_updated_at
  BEFORE UPDATE ON public.relatorios_viagem
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- O dono vê e edita o próprio relatório enquanto ele não foi enviado.
CREATE POLICY "Dono vê o próprio relatório" ON public.relatorios_viagem
  FOR SELECT TO authenticated USING (auth.uid() = colaborador_id);
CREATE POLICY "Financeiro vê todos os relatórios" ON public.relatorios_viagem
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'viagens_aprovacao'));
CREATE POLICY "Dono cria relatório" ON public.relatorios_viagem
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = colaborador_id);
CREATE POLICY "Dono edita rascunho" ON public.relatorios_viagem
  FOR UPDATE TO authenticated
  USING (auth.uid() = colaborador_id AND status IN ('rascunho', 'reprovado', 'enviado'))
  WITH CHECK (auth.uid() = colaborador_id AND status IN ('rascunho', 'reprovado', 'enviado'));
CREATE POLICY "Financeiro avalia relatório" ON public.relatorios_viagem
  FOR UPDATE TO authenticated
  USING (public.has_modulo(auth.uid(), 'viagens_aprovacao'))
  WITH CHECK (public.has_modulo(auth.uid(), 'viagens_aprovacao'));
CREATE POLICY "Dono apaga rascunho" ON public.relatorios_viagem
  FOR DELETE TO authenticated
  USING (auth.uid() = colaborador_id AND status IN ('rascunho', 'reprovado'));

CREATE POLICY "Vê despesas do relatório visível" ON public.despesas_viagem
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.relatorios_viagem r
      WHERE r.id = relatorio_id
        AND (r.colaborador_id = auth.uid() OR public.has_modulo(auth.uid(), 'viagens_aprovacao'))
    )
  );
CREATE POLICY "Dono lança despesa" ON public.despesas_viagem
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.relatorios_viagem r
      WHERE r.id = relatorio_id AND r.colaborador_id = auth.uid()
        AND r.status IN ('rascunho', 'reprovado')
    )
  );
CREATE POLICY "Dono apaga despesa" ON public.despesas_viagem
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.relatorios_viagem r
      WHERE r.id = relatorio_id AND r.colaborador_id = auth.uid()
        AND r.status IN ('rascunho', 'reprovado')
    )
  );

-- Bucket privado dos comprovantes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Comprovante: dono e financeiro leem" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'comprovantes'
    AND (auth.uid()::text = (storage.foldername(name))[1]
         OR public.has_modulo(auth.uid(), 'viagens_aprovacao'))
  );
CREATE POLICY "Comprovante: dono envia" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Comprovante: dono apaga" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================================
-- 5. INTEGRAÇÕES E PAINÉIS EXTERNOS
-- =====================================================================

CREATE TABLE public.integracoes (
  chave text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  destino text,
  segredo text NOT NULL,
  conectada boolean NOT NULL DEFAULT false,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultima_sincronizacao timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.paineis_externos (
  chave text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integracoes TO authenticated;
GRANT SELECT ON public.paineis_externos TO authenticated;
GRANT ALL ON public.integracoes TO service_role;
GRANT ALL ON public.paineis_externos TO service_role;

ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paineis_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticado vê integrações" ON public.integracoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master gerencia integrações" ON public.integracoes
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE POLICY "Autenticado vê painéis" ON public.paineis_externos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master gerencia painéis" ON public.paineis_externos
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

CREATE TRIGGER update_integracoes_updated_at BEFORE UPDATE ON public.integracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_paineis_updated_at BEFORE UPDATE ON public.paineis_externos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integracoes (chave, nome, descricao, destino, segredo) VALUES
  ('clickup',      'ClickUp',         'Tarefas pendentes e produção mensal por cliente',        'Painel de CS',          'CLICKUP_API_TOKEN'),
  ('solides',      'Sólides',         'Ponto registrado e jornada dos colaboradores',           'Colaboradores',         'SOLIDES_API_TOKEN'),
  ('conta_azul',   'Conta Azul',      'Receitas, despesas e fluxo de caixa',                    'Dashboard Financeiro',  'CONTA_AZUL_TOKEN'),
  ('alfaix',       'Planilha Alfaix', 'Planilha de controle financeiro complementar',           'Dashboard Financeiro',  'ALFAIX_SHEET_ID'),
  ('rd_station',   'RD Station CRM',  'Negócios e etapas do funil comercial',                   'Resultados de Vendas',  'RD_CRM_TOKEN'),
  ('read_ai',      'Read.ai',         'Atas de reunião no repositório do cliente',              'Painel de CS',          'READ_API_KEY'),
  ('google_drive', 'Google Drive',    'Peças e arquivos da pasta do cliente',                   'Painel de CS',          'GOOGLE_SERVICE_ACCOUNT')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO public.paineis_externos (chave, nome, descricao) VALUES
  ('trafego', 'Gestão de Tráfego',        'Painel de gestão de tráfego desenvolvido separadamente'),
  ('seo_geo',       'Gestão de SEO/GEO',              'Painel de SEO e otimização para buscadores generativos'),
  ('projetos_rd',   'Projetos de Implantação RD',     'Acompanhamento das implantações de RD Station')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================================
-- 6. CLICKUP: produção mensal
-- =====================================================================

ALTER TABLE public.clickup_tarefas ADD COLUMN IF NOT EXISTS concluida_em timestamptz;
CREATE INDEX IF NOT EXISTS idx_tarefas_concluida ON public.clickup_tarefas (cliente_id, concluida_em);

-- =====================================================================
-- 7. SÓLIDES: registro de ponto
-- =====================================================================

CREATE TABLE public.pontos_registrados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solides_id text,
  data date NOT NULL,
  entrada time,
  saida time,
  horas_trabalhadas numeric(5,2),
  saldo_banco_horas numeric(6,2),
  observacao text,
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pontos_registrados TO authenticated;
GRANT ALL ON public.pontos_registrados TO service_role;
ALTER TABLE public.pontos_registrados ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX pontos_colaborador_data_key
  ON public.pontos_registrados (colaborador_id, data);

CREATE POLICY "Dono vê o próprio ponto" ON public.pontos_registrados
  FOR SELECT TO authenticated USING (auth.uid() = colaborador_id);
CREATE POLICY "Gestão de pessoas vê todos os pontos" ON public.pontos_registrados
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'colaboradores'));

-- =====================================================================
-- 8. CONTA AZUL / ALFAIX: lançamentos financeiros
-- =====================================================================

CREATE TABLE public.lancamentos_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL CHECK (origem IN ('conta_azul', 'alfaix', 'manual')),
  origem_id text,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria text,
  descricao text NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  competencia date NOT NULL,
  data_vencimento date,
  data_pagamento date,
  valor numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'previsto'
    CHECK (status IN ('previsto', 'pago', 'atrasado', 'cancelado')),
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX lancamentos_origem_key
  ON public.lancamentos_financeiros (origem, origem_id)
  WHERE origem_id IS NOT NULL;
CREATE INDEX idx_lancamentos_competencia
  ON public.lancamentos_financeiros (competencia DESC, tipo);

CREATE POLICY "Financeiro vê lançamentos" ON public.lancamentos_financeiros
  FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'financeiro'));
CREATE POLICY "Master gerencia lançamentos" ON public.lancamentos_financeiros
  FOR ALL TO authenticated
  USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));
