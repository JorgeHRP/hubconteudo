-- Central Interna — foto de perfil, imagem do mural, anexos de tarefa e capas (2026-11-08)
--
-- Os buckets `avatars` e `posts` (públicos) já existem desde a migração 000001,
-- com envio só na própria pasta. Aqui:
--   1. a foto do perfil e a imagem do post só apontam para a pasta do dono;
--   2. faltava apagar a própria foto antiga, e o gestor apagar imagem de post alheio
--      (ele já apaga o post);
--   3. bucket privado novo, `anexos`, para os anexos do quadro de tarefas, com a
--      mesma regra de quem lê e grava as tarefas (`pode_colecao`, migração 000007).
-- As capas de trilha e curso vão para `institucional/capas/`, que o gestor já
-- pode publicar (migração 000002); nada muda para elas.

-- ---------------------------------------------------------------------------
-- 1. Endereço do arquivo conferido
-- ---------------------------------------------------------------------------
-- O navegador grava o endereço público completo. O que importa é o trecho
-- `/object/public/<bucket>/<dono>/`: sem ele, alguém poria no próprio perfil a
-- foto de outra pessoa, ou um endereço de fora no mural.

CREATE OR REPLACE FUNCTION public.arquivo_publico_do_dono(_url text, _bucket text, _dono uuid)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _url IS NULL OR (
    position('/storage/v1/object/public/' || _bucket || '/' || _dono::text || '/' IN _url) > 0
    AND _url NOT LIKE '%..%'
  )
$$;

CREATE OR REPLACE FUNCTION public.perfil_foto_confere()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.foto_url IS DISTINCT FROM OLD.foto_url
     AND NOT public.arquivo_publico_do_dono(NEW.foto_url, 'avatars', NEW.user_id) THEN
    RAISE EXCEPTION 'A foto precisa estar na pasta da própria pessoa.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfil_foto_confere ON public.profiles;
CREATE TRIGGER perfil_foto_confere
  BEFORE UPDATE OF foto_url ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.perfil_foto_confere();

CREATE OR REPLACE FUNCTION public.post_imagem_confere()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF (TG_OP = 'INSERT' OR NEW.imagem_url IS DISTINCT FROM OLD.imagem_url)
     AND NOT public.arquivo_publico_do_dono(NEW.imagem_url, 'posts', NEW.autor_id) THEN
    RAISE EXCEPTION 'A imagem precisa estar na pasta de quem publicou.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_imagem_confere ON public.posts;
CREATE TRIGGER post_imagem_confere
  BEFORE INSERT OR UPDATE OF imagem_url ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.post_imagem_confere();

-- ---------------------------------------------------------------------------
-- 2. Apagar arquivo
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Usuário apaga a própria foto" ON storage.objects;
CREATE POLICY "Usuário apaga a própria foto" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Gestor apaga imagem do mural" ON storage.objects;
CREATE POLICY "Gestor apaga imagem do mural" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND public.is_gestor(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Anexos do quadro de tarefas
-- ---------------------------------------------------------------------------
-- Caminho: `tarefas/<id da tarefa>/<arquivo>`.

INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos', 'anexos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anexo: quem vê as tarefas abre" ON storage.objects;
CREATE POLICY "Anexo: quem vê as tarefas abre" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'anexos' AND (storage.foldername(name))[1] = 'tarefas'
         AND public.pode_colecao(auth.uid(), 'tarefas_internas', false));

DROP POLICY IF EXISTS "Anexo: quem edita as tarefas envia" ON storage.objects;
CREATE POLICY "Anexo: quem edita as tarefas envia" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anexos' AND (storage.foldername(name))[1] = 'tarefas'
              AND name NOT LIKE '%..%'
              AND public.pode_colecao(auth.uid(), 'tarefas_internas', true));

DROP POLICY IF EXISTS "Anexo: quem edita as tarefas apaga" ON storage.objects;
CREATE POLICY "Anexo: quem edita as tarefas apaga" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'anexos' AND (storage.foldername(name))[1] = 'tarefas'
         AND public.pode_colecao(auth.uid(), 'tarefas_internas', true));
