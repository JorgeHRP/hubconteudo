-- Central Interna — comprovantes de viagem com arquivo de verdade (2026-11-04)
--
-- O bucket privado `comprovantes` e as policies dele já existem (migração
-- 000003): cada pessoa envia e apaga só na própria pasta; o dono e quem aprova
-- viagens leem. O arquivo fica em `<dono>/<relatório>/<id>-<nome>`.
--
-- Faltava amarrar a despesa ao arquivo: `comprovante_url` guarda esse caminho e
-- é gravado pelo navegador. Sem a conferência abaixo, uma despesa poderia
-- apontar para o arquivo de outra pessoa, e quem aprova abriria esse arquivo
-- achando que é o comprovante daquela viagem.

CREATE OR REPLACE FUNCTION public.despesa_comprovante_confere()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  dono uuid;
BEGIN
  IF NEW.comprovante_url IS NULL THEN RETURN NEW; END IF;
  -- Chave de serviço (rotinas internas) não passa por aqui.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  SELECT colaborador_id INTO dono FROM public.relatorios_viagem WHERE id = NEW.relatorio_id;

  IF split_part(NEW.comprovante_url, '/', 1) <> dono::text
     OR split_part(NEW.comprovante_url, '/', 2) <> NEW.relatorio_id::text
     OR split_part(NEW.comprovante_url, '/', 3) = ''
     OR NEW.comprovante_url LIKE '%..%' THEN
    RAISE EXCEPTION 'O comprovante precisa estar na pasta deste relatório.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS despesa_comprovante_confere ON public.despesas_viagem;
CREATE TRIGGER despesa_comprovante_confere
  BEFORE INSERT OR UPDATE OF comprovante_url, relatorio_id ON public.despesas_viagem
  FOR EACH ROW EXECUTE FUNCTION public.despesa_comprovante_confere();
