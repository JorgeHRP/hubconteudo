-- Central Interna — contracheques e documentos com arquivo de verdade (2026-11-08)
--
-- A tabela `documentos` e os dois buckets já existem (migrações 000001 a 000006):
--   - `documentos` (privado): contracheque e documento pessoal, em `<pessoa>/<arquivo>`.
--     A pessoa lê só a própria pasta; quem tem o módulo colaboradores lê e envia tudo.
--   - `institucional` (público): manual, políticas, ativos e repositório, em
--     `<categoria>/<arquivo>`. Gestor publica e apaga.
--
-- Faltava amarrar o registro ao arquivo. `arquivo_url` é gravado pelo navegador:
-- sem a conferência abaixo, o contracheque da Ana poderia apontar para o arquivo
-- do Bruno, e a Ana não conseguiria abrir (a policy do bucket só libera a pasta
-- dela) — ou pior, o RH veria o arquivo errado na ficha dela.
--
-- `uploaded_by` também passa a ser carimbado pelo servidor.

CREATE OR REPLACE FUNCTION public.documento_arquivo_confere()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  pasta text;
BEGIN
  -- Chave de serviço (rotinas internas) não passa por aqui.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.uploaded_by := auth.uid();
  ELSE
    NEW.uploaded_by := OLD.uploaded_by;
  END IF;

  IF NEW.arquivo_url IS NULL THEN RETURN NEW; END IF;

  pasta := CASE WHEN NEW.user_id IS NULL THEN NEW.categoria ELSE NEW.user_id::text END;

  IF split_part(NEW.arquivo_url, '/', 1) <> pasta
     OR split_part(NEW.arquivo_url, '/', 2) = ''
     OR split_part(NEW.arquivo_url, '/', 3) <> ''
     OR NEW.arquivo_url LIKE '%..%' THEN
    RAISE EXCEPTION 'O arquivo precisa estar na pasta de quem recebe o documento.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documento_arquivo_confere ON public.documentos;
CREATE TRIGGER documento_arquivo_confere
  BEFORE INSERT OR UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.documento_arquivo_confere();
