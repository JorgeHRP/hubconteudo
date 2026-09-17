
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'rh', 'colaborador');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  departamento TEXT,
  telefone TEXT,
  foto_url TEXT,
  data_nascimento DATE,
  data_admissao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'colaborador',
  UNIQUE(user_id, role)
);

-- Posts (feed/mural)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'aviso')),
  fixado BOOLEAN NOT NULL DEFAULT false,
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post likes
CREATE TABLE public.post_curtidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events/Calendar
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'evento' CHECK (tipo IN ('evento', 'aniversario', 'feriado', 'comunicado')),
  descricao TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solicitações (requests)
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents (contracheques + personal docs, linked per user)
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'contracheque' CHECK (categoria IN ('contracheque', 'documento_pessoal', 'outro')),
  arquivo_url TEXT,
  arquivo_nome TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trainings (created by admin, with external video links)
CREATE TABLE public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  duracao TEXT,
  nivel TEXT CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
  video_url TEXT,
  conteudo_html TEXT,
  ordem INT DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training progress per user
CREATE TABLE public.treinamento_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treinamento_id UUID REFERENCES public.treinamentos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  progresso INT NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  concluido BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(treinamento_id, user_id)
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- ========================
-- SECURITY DEFINER FUNCTIONS
-- ========================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_master(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master_or_rh(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master', 'admin', 'rh')
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'colaborador');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treinamentos_updated_at BEFORE UPDATE ON public.treinamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treinamento_progresso_updated_at BEFORE UPDATE ON public.treinamento_progresso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- RLS POLICIES
-- ========================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_master(auth.uid()));

-- User roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only master can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'master'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = autor_id);
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()));
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = autor_id);
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Post likes
ALTER TABLE public.post_curtidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.post_curtidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like" ON public.post_curtidas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_curtidas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "Users can delete own comments" ON public.comentarios FOR DELETE TO authenticated USING (auth.uid() = autor_id);

-- Events
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view events" ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage events" ON public.eventos FOR ALL TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Solicitações
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON public.solicitacoes FOR SELECT TO authenticated USING (auth.uid() = solicitante_id);
CREATE POLICY "Admins can view all requests" ON public.solicitacoes FOR SELECT TO authenticated USING (public.is_admin_or_master(auth.uid()));
CREATE POLICY "RH can view all requests" ON public.solicitacoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'rh'));
CREATE POLICY "Users can create requests" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = solicitante_id);
CREATE POLICY "Admins can update requests" ON public.solicitacoes FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Documentos (private per user + admins/RH)
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.documentos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/RH can view all documents" ON public.documentos FOR SELECT TO authenticated USING (public.is_admin_master_or_rh(auth.uid()));
CREATE POLICY "Admins/RH can upload documents" ON public.documentos FOR INSERT TO authenticated WITH CHECK (public.is_admin_master_or_rh(auth.uid()));
CREATE POLICY "Admins/RH can delete documents" ON public.documentos FOR DELETE TO authenticated USING (public.is_admin_master_or_rh(auth.uid()));

-- Treinamentos
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view trainings" ON public.treinamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage trainings" ON public.treinamentos FOR ALL TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Training progress
ALTER TABLE public.treinamento_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.treinamento_progresso FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.treinamento_progresso FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify own progress" ON public.treinamento_progresso FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.treinamento_progresso FOR SELECT TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- Storage policies
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin_master_or_rh(auth.uid())));
CREATE POLICY "Admins/RH can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos' AND public.is_admin_master_or_rh(auth.uid()));
CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Post images are public" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');
UPDATE storage.buckets SET public = true WHERE id = 'documentos';
CREATE TYPE public.produto_cliente AS ENUM ('agencia_educacional','totvs','rd_conteudo','rd_tbc','martech');
CREATE TYPE public.churn_flag AS ENUM ('green','yellow','red');
CREATE TYPE public.app_modulo AS ENUM ('cs','vendas','clickup');

CREATE TABLE public.user_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo public.app_modulo NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, modulo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissoes TO authenticated;
GRANT ALL ON public.user_permissoes TO service_role;
ALTER TABLE public.user_permissoes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_modulo(_user_id uuid, _modulo public.app_modulo)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_or_master(_user_id)
    OR EXISTS (SELECT 1 FROM public.user_permissoes WHERE user_id = _user_id AND modulo = _modulo);
$$;

CREATE POLICY "Users can view own permissions" ON public.user_permissoes FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins manage permissions" ON public.user_permissoes FOR ALL TO authenticated USING (public.is_admin_or_master(auth.uid())) WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  produto public.produto_cliente NOT NULL DEFAULT 'martech',
  status text NOT NULL DEFAULT 'ativo',
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  mrr numeric(12,2) DEFAULT 0,
  inicio_contrato date,
  renovacao_contrato date,
  flag public.churn_flag NOT NULL DEFAULT 'green',
  clickup_list_id text,
  drive_folder_url text,
  read_workspace_url text,
  rd_deal_id text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS can view clients" ON public.clientes FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR auth.uid() = responsavel_id);
CREATE POLICY "CS can insert clients" ON public.clientes FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "CS can update clients" ON public.clientes FOR UPDATE TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR auth.uid() = responsavel_id);
CREATE POLICY "Admins can delete clients" ON public.clientes FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()));
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cliente_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'relatorio',
  titulo text NOT NULL,
  descricao text,
  url text,
  arquivo_url text,
  arquivo_nome text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_recursos TO authenticated;
GRANT ALL ON public.cliente_recursos TO service_role;
ALTER TABLE public.cliente_recursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS can view resources" ON public.cliente_recursos FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid()));
CREATE POLICY "CS can add resources" ON public.cliente_recursos FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "CS can update resources" ON public.cliente_recursos FOR UPDATE TO authenticated USING (public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "CS can delete resources" ON public.cliente_recursos FOR DELETE TO authenticated USING (public.has_modulo(auth.uid(), 'cs'));

CREATE TABLE public.cliente_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'nota',
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_notas TO authenticated;
GRANT ALL ON public.cliente_notas TO service_role;
ALTER TABLE public.cliente_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS can view notes" ON public.cliente_notas FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid()));
CREATE POLICY "CS can add notes" ON public.cliente_notas FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_id AND (public.has_modulo(auth.uid(), 'cs') OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid())));
CREATE POLICY "Authors can delete notes" ON public.cliente_notas FOR DELETE TO authenticated USING (auth.uid() = autor_id OR public.is_admin_or_master(auth.uid()));

CREATE TABLE public.churn_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  analista_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referencia_mes date NOT NULL,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  pontuacao integer NOT NULL DEFAULT 0,
  flag public.churn_flag NOT NULL DEFAULT 'green',
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.churn_avaliacoes TO authenticated;
GRANT ALL ON public.churn_avaliacoes TO service_role;
ALTER TABLE public.churn_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS can view assessments" ON public.churn_avaliacoes FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR auth.uid() = analista_id);
CREATE POLICY "CS can create assessments" ON public.churn_avaliacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = analista_id);
CREATE POLICY "CS can update own assessments" ON public.churn_avaliacoes FOR UPDATE TO authenticated USING (auth.uid() = analista_id OR public.is_admin_or_master(auth.uid()));
CREATE POLICY "Admins can delete assessments" ON public.churn_avaliacoes FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()));
CREATE TRIGGER update_churn_avaliacoes_updated_at BEFORE UPDATE ON public.churn_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cliente_analises_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  resumo text,
  percepcoes text,
  riscos text,
  recomendacoes text,
  flag_sugerida public.churn_flag,
  modelo text,
  gerado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_analises_ia TO authenticated;
GRANT ALL ON public.cliente_analises_ia TO service_role;
ALTER TABLE public.cliente_analises_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS can view AI analyses" ON public.cliente_analises_ia FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'cs') OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid()));
CREATE POLICY "CS can create AI analyses" ON public.cliente_analises_ia FOR INSERT TO authenticated WITH CHECK (public.has_modulo(auth.uid(), 'cs') OR EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.responsavel_id = auth.uid()));
CREATE POLICY "Admins can delete AI analyses" ON public.cliente_analises_ia FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()));

CREATE TABLE public.clickup_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  task_id text,
  nome text NOT NULL,
  status text,
  responsavel text,
  prioridade text,
  lista text,
  due_date date,
  url text,
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clickup_tarefas TO authenticated;
GRANT ALL ON public.clickup_tarefas TO service_role;
ALTER TABLE public.clickup_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Module users can view tasks" ON public.clickup_tarefas FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'clickup') OR public.has_modulo(auth.uid(), 'cs'));
CREATE POLICY "Admins manage tasks" ON public.clickup_tarefas FOR ALL TO authenticated USING (public.is_admin_or_master(auth.uid())) WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE TABLE public.vendas_negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rd_deal_id text,
  nome text NOT NULL,
  empresa text,
  etapa text NOT NULL DEFAULT 'prospeccao',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  responsavel text,
  origem text,
  produto public.produto_cliente,
  status text NOT NULL DEFAULT 'aberto',
  data_criacao date NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento date,
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas_negocios TO authenticated;
GRANT ALL ON public.vendas_negocios TO service_role;
ALTER TABLE public.vendas_negocios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sales module users can view deals" ON public.vendas_negocios FOR SELECT TO authenticated USING (public.has_modulo(auth.uid(), 'vendas'));
CREATE POLICY "Admins manage deals" ON public.vendas_negocios FOR ALL TO authenticated USING (public.is_admin_or_master(auth.uid())) WITH CHECK (public.is_admin_or_master(auth.uid()));
