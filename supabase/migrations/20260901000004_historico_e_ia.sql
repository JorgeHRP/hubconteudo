-- Central Interna — histórico do cliente, reuniões e IA (2026-09-01)
-- Aplicar depois de 2026-09-01-nova-estrutura.sql

-- =====================================================================
-- 1. REUNIÕES (Read.ai)
-- =====================================================================

CREATE TABLE public.reunioes_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  read_meeting_id text,
  titulo text NOT NULL,
  data date NOT NULL,
  duracao_minutos integer CHECK (duracao_minutos > 0),
  participantes text[] NOT NULL DEFAULT '{}',
  resumo text,
  topicos text[] NOT NULL DEFAULT '{}',
  proximos_passos text[] NOT NULL DEFAULT '{}',
  gravacao_url text,
  transcricao_url text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sincronizado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reunioes_cliente TO authenticated;
GRANT ALL ON public.reunioes_cliente TO service_role;
ALTER TABLE public.reunioes_cliente ENABLE ROW LEVEL SECURITY;

-- Chave para o upsert idempotente do sync-read.
CREATE UNIQUE INDEX reunioes_read_meeting_key
  ON public.reunioes_cliente (read_meeting_id) WHERE read_meeting_id IS NOT NULL;
CREATE INDEX idx_reunioes_cliente ON public.reunioes_cliente (cliente_id, data DESC);

CREATE POLICY "CS vê reuniões" ON public.reunioes_cliente
  FOR SELECT TO authenticated USING (
    public.has_modulo(auth.uid(), 'cs')
    OR EXISTS (SELECT 1 FROM public.clientes c
               WHERE c.id = cliente_id AND c.responsavel_id = auth.uid())
  );
CREATE POLICY "CS registra reunião" ON public.reunioes_cliente
  FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "CS edita reunião" ON public.reunioes_cliente
  FOR UPDATE TO authenticated USING (public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "CS apaga reunião" ON public.reunioes_cliente
  FOR DELETE TO authenticated USING (public.has_modulo(auth.uid(), 'cs'));

-- =====================================================================
-- 2. HISTÓRICO UNIFICADO DO CLIENTE
-- A jornada não é uma tabela: é a união das origens que já existem.
-- A view herda a RLS de cada tabela de origem (security_invoker).
-- =====================================================================

CREATE OR REPLACE VIEW public.historico_cliente
WITH (security_invoker = true) AS
  SELECT
    n.id::text AS id, n.cliente_id, 'nota'::text AS tipo, n.created_at AS data,
    CASE n.tipo
      WHEN 'alerta'  THEN 'Alerta registrado'
      WHEN 'reuniao' THEN 'Anotação de reunião'
      WHEN 'entrega' THEN 'Entrega registrada'
      ELSE 'Nota do time'
    END AS titulo,
    n.conteudo AS descricao, n.autor_id AS autor_id, NULL::text AS url,
    'Time'::text AS origem,
    (n.tipo IN ('alerta', 'entrega')) AS relevante
  FROM public.cliente_notas n

  UNION ALL
  SELECT
    r.id::text, r.cliente_id, 'reuniao', r.data::timestamptz, r.titulo,
    COALESCE(r.resumo, array_to_string(r.participantes, ', ')),
    r.criado_por, COALESCE(r.gravacao_url, r.transcricao_url),
    CASE WHEN r.read_meeting_id IS NOT NULL THEN 'Read.ai' ELSE 'Manual' END,
    true
  FROM public.reunioes_cliente r

  UNION ALL
  SELECT
    rec.id::text, rec.cliente_id, 'documento', rec.created_at, rec.titulo,
    rec.descricao, rec.criado_por, rec.url,
    CASE rec.tipo
      WHEN 'ata'  THEN 'Read.ai'
      WHEN 'peca' THEN 'Drive'
      ELSE 'Repositório'
    END,
    (rec.tipo IN ('relatorio', 'contrato'))
  FROM public.cliente_recursos rec

  UNION ALL
  SELECT
    a.id::text, a.cliente_id, 'avaliacao', a.created_at,
    'Termômetro de churn — ' || a.pontuacao || '/20',
    a.comentario, a.analista_id, NULL, 'CS', true
  FROM public.churn_avaliacoes a

  UNION ALL
  SELECT
    a.id::text || '-flag', a.cliente_id, 'flag', a.created_at,
    'Flag definida como ' || CASE a.flag
      WHEN 'green'  THEN 'Saudável'
      WHEN 'yellow' THEN 'Atenção'
      ELSE 'Risco'
    END,
    NULL, a.analista_id, NULL, 'CS', (a.flag <> 'green')
  FROM public.churn_avaliacoes a

  UNION ALL
  SELECT
    ia.id::text, ia.cliente_id, 'analise_ia', ia.created_at, 'Análise por IA',
    ia.resumo, ia.gerado_por, NULL, 'IA', true
  FROM public.cliente_analises_ia ia

  UNION ALL
  SELECT
    t.id::text, t.cliente_id, 'tarefa', t.concluida_em, t.nome,
    CASE WHEN t.responsavel IS NOT NULL
         THEN 'Entregue por ' || t.responsavel END,
    NULL, t.url, 'ClickUp', false
  FROM public.clickup_tarefas t
  WHERE t.concluida_em IS NOT NULL;

GRANT SELECT ON public.historico_cliente TO authenticated;

-- O id da view é texto, não uuid: a linha de mudança de flag é derivada da avaliação
-- (sufixo "-flag") e não tem id próprio. A interface usa o id apenas como chave de lista.

-- =====================================================================
-- 3. PRODUÇÃO MENSAL POR CLIENTE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.producao_mensal_cliente(
  _cliente_id uuid,
  _meses integer DEFAULT 6
)
RETURNS TABLE (competencia text, entregues bigint, abertas bigint, reunioes bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH meses AS (
    SELECT to_char(
      date_trunc('month', now()) - (n || ' month')::interval, 'YYYY-MM'
    ) AS competencia
    FROM generate_series(_meses - 1, 0, -1) AS n
  )
  SELECT
    m.competencia,
    (SELECT count(*) FROM public.clickup_tarefas t
      WHERE t.cliente_id = _cliente_id
        AND to_char(t.concluida_em, 'YYYY-MM') = m.competencia),
    (SELECT count(*) FROM public.clickup_tarefas t
      WHERE t.cliente_id = _cliente_id AND t.concluida_em IS NULL
        AND to_char(t.due_date, 'YYYY-MM') = m.competencia),
    (SELECT count(*) FROM public.reunioes_cliente r
      WHERE r.cliente_id = _cliente_id
        AND to_char(r.data, 'YYYY-MM') = m.competencia)
  FROM meses m
  ORDER BY m.competencia;
$$;

-- =====================================================================
-- 4. ASSISTENTE DE IA: histórico de consultas
-- =====================================================================

CREATE TABLE public.consultas_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rota text,
  pergunta text NOT NULL,
  resposta text,
  motor text,
  tokens_entrada integer,
  tokens_saida integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.consultas_ia TO authenticated;
GRANT ALL ON public.consultas_ia TO service_role;
ALTER TABLE public.consultas_ia ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_consultas_ia_user ON public.consultas_ia (user_id, created_at DESC);

CREATE POLICY "Dono vê as próprias consultas" ON public.consultas_ia
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Master vê todas as consultas" ON public.consultas_ia
  FOR SELECT TO authenticated USING (public.is_master(auth.uid()));
CREATE POLICY "Dono registra consulta" ON public.consultas_ia
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
