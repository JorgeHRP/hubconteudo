import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { chaveDoCliente, useProjetoSeo } from "@/modulos/seo/contexts/ProjetoSeoContext";

/**
 * Lê e grava um valor JSON compartilhado entre os usuários, na tabela
 * `shared_table_data`.
 *
 * Enquanto o Supabase não está configurado, cai no localStorage — assim o painel
 * de SEO funciona desde já, só que sem compartilhar entre pessoas. Quando o banco
 * entrar, passa a compartilhar sozinho, sem mudar nenhuma tela.
 */

const prefixoLocal = "seo:shared:";

function lerLocal<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(prefixoLocal + chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function gravarLocal<T>(chave: string, valor: T) {
  try {
    localStorage.setItem(prefixoLocal + chave, JSON.stringify(valor));
  } catch {
    // storage cheio ou bloqueado — segue em memória
  }
}

export function useSharedData<T>(chaveBase: string, defaultValue: T) {
  const projeto = useProjetoSeo();
  // Cada cliente tem o seu espaço: "cliente:<id>:<chave>"
  const storageKey = chaveDoCliente(projeto?.clienteId, chaveBase);

  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const ultimoSalvo = useRef<string>("");

  // carga inicial
  useEffect(() => {
    let cancelado = false;

    // Failsafe: nunca deixar a tela presa em "carregando".
    const limite = window.setTimeout(() => {
      if (!cancelado) setLoading(false);
    }, 10000);

    async function carregar() {
      if (!supabase) {
        const local = lerLocal<T>(storageKey);
        if (!cancelado && local !== null) {
          setValue(local);
          ultimoSalvo.current = JSON.stringify(local);
        }
        if (!cancelado) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("shared_table_data")
          .select("data")
          .eq("storage_key", storageKey)
          .maybeSingle();

        if (cancelado) return;

        if (error) {
          console.warn(`[useSharedData] ${storageKey}:`, error.message);
        } else if (data?.data != null) {
          setValue(data.data as T);
          ultimoSalvo.current = JSON.stringify(data.data);
        }
      } catch (e) {
        if (!cancelado) console.warn(`[useSharedData] ${storageKey}:`, e);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    setLoading(true);
    carregar();

    return () => {
      cancelado = true;
      window.clearTimeout(limite);
    };
  }, [storageKey]);

  // tempo real: quando outra pessoa salva, atualiza aqui
  useEffect(() => {
    if (!supabase) return;

    const canal = supabase
      .channel(`shared-${storageKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_table_data",
          filter: `storage_key=eq.${storageKey}`,
        },
        (payload) => {
          const novo = (payload.new as { data?: unknown } | null)?.data;
          if (novo == null) return;
          const serial = JSON.stringify(novo);
          // ignora o eco do próprio save
          if (serial === ultimoSalvo.current) return;
          setValue(novo as T);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(canal);
    };
  }, [storageKey]);

  /** Devolve true quando gravou. As telas checam esse booleano. */
  const save = useCallback(
    async (novo: T): Promise<boolean> => {
      setValue(novo);
      ultimoSalvo.current = JSON.stringify(novo);
      gravarLocal(storageKey, novo);

      if (!supabase) return true;

      setSalvando(true);
      try {
        const { error } = await supabase
          .from("shared_table_data")
          .upsert(
            { storage_key: storageKey, data: novo, updated_at: new Date().toISOString() },
            { onConflict: "storage_key" }
          );
        if (error) {
          console.warn(`[useSharedData] falha ao salvar ${storageKey}:`, error.message);
          return false;
        }
        return true;
      } finally {
        setSalvando(false);
      }
    },
    [storageKey]
  );

  return { value, setValue, save, loading, salvando };
}
