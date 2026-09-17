import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronDown, ChevronUp, History } from "lucide-react";
import { useAuth } from "@/modulos/seo/hooks/useAuthSeo";
import { supabase } from "@/integrations/supabase/client";
import { chaveDoCliente, useProjetoSeo } from "@/modulos/seo/contexts/ProjetoSeoContext";

export interface ModificationEntry {
  user: string;
  date: string;
  changes: string;
}

const HISTORY_LIMIT = 50;
const prefixoLocal = "seo:historico:";

/** Sem Supabase, o histórico fica no navegador — some ao trocar de máquina. */
function lerLocal(storageKey: string): ModificationEntry[] {
  try {
    return JSON.parse(localStorage.getItem(prefixoLocal + storageKey) ?? "[]");
  } catch {
    return [];
  }
}

function gravarLocal(storageKey: string, entradas: ModificationEntry[]) {
  try {
    localStorage.setItem(prefixoLocal + storageKey, JSON.stringify(entradas.slice(0, HISTORY_LIMIT)));
  } catch {
    // storage cheio ou bloqueado
  }
}

async function fetchHistory(storageKey: string): Promise<ModificationEntry[]> {
  if (!supabase) return lerLocal(storageKey);

  try {
    const { data, error } = await supabase
      .from("modification_history")
      .select("user_email, created_at, changes")
      .eq("storage_key", storageKey)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data) return [];
    return data.map((row) => ({
      user: row.user_email as string,
      date: row.created_at as string,
      changes: row.changes as string,
    }));
  } catch {
    return [];
  }
}

export function useModificationTracker(chaveBase: string) {
  const { user } = useAuth();
  const projeto = useProjetoSeo();
  // O histórico é por cliente, igual aos dados — senão a alteração de um
  // cliente apareceria na tela de outro.
  const storageKey = chaveDoCliente(projeto?.clienteId, chaveBase);
  const [history, setHistory] = useState<ModificationEntry[]>([]);

  const reload = useCallback(async () => {
    const data = await fetchHistory(storageKey);
    setHistory(data);
  }, [storageKey]);

  useEffect(() => {
    let cancelado = false;
    // Failsafe: o histórico nunca deve prender a tela.
    const limite = window.setTimeout(() => {
      if (!cancelado) setHistory((h) => h);
    }, 10000);

    reload().catch((e) => console.warn("[historico]", e));

    return () => {
      cancelado = true;
      window.clearTimeout(limite);
    };
  }, [reload]);

  const trackSave = async (changes: string) => {
    if (!user) return;

    const entrada: ModificationEntry = {
      user: user.nome || user.email || "Usuário desconhecido",
      date: new Date().toISOString(),
      changes: changes || "Salvamento manual",
    };

    if (!supabase) {
      const atualizado = [entrada, ...lerLocal(storageKey)];
      gravarLocal(storageKey, atualizado);
      setHistory(atualizado.slice(0, HISTORY_LIMIT));
      return;
    }

    const { error } = await supabase.from("modification_history").insert({
      storage_key: storageKey,
      user_email: user.email || "Usuário desconhecido",
      user_id: user.id,
      changes: entrada.changes,
    });
    if (!error) await reload();
  };

  return { history, trackSave, lastMod: history[0] || null, reload };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface ModificationFooterProps {
  storageKey: string;
  history?: ModificationEntry[];
}

export default function ModificationFooter({ storageKey, history: externalHistory }: ModificationFooterProps) {
  const [expanded, setExpanded] = useState(false);
  const [internalHistory, setInternalHistory] = useState<ModificationEntry[]>([]);
  const [loading, setLoading] = useState(externalHistory === undefined);

  // Garante que o acordeon sempre inicia recolhido ao trocar de página/tabela
  useEffect(() => {
    setExpanded(false);
  }, [storageKey]);

  useEffect(() => {
    if (externalHistory !== undefined) return;
    let cancelled = false;
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 10000);

    fetchHistory(storageKey)
      .then((data) => {
        if (cancelled) return;
        setInternalHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn(`[ModificationFooter] erro ao carregar histórico ${storageKey}:`, err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [storageKey, externalHistory]);

  const history = externalHistory ?? internalHistory;
  const lastMod = history[0];

  if (loading) {
    return (
      <div className="glass-card p-4 border-t border-border mt-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0 animate-pulse" />
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }

  if (!lastMod) {
    return (
      <div className="glass-card p-4 border-t border-border mt-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>Nenhuma modificação registrada nesta página ainda.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-2 border-t border-border mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>
            Última modificação por{" "}
            <span className="font-medium text-foreground">{lastMod.user}</span> em{" "}
            <span className="font-medium text-foreground">{formatDate(lastMod.date)}</span> às{" "}
            <span className="font-medium text-foreground">{formatTime(lastMod.date)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <History className="h-3.5 w-3.5" />
          <span>{history.length} alterações</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      <div className="text-xs text-muted-foreground pl-7">
        <span className="font-medium">Alterações:</span> {lastMod.changes}
      </div>

      {expanded && history.length > 0 && (
        <div className="mt-3 border-t border-border pt-3 max-h-64 overflow-y-auto space-y-2 pl-7">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Histórico de Modificações</h4>
          {history.map((entry, i) => (
            <div
              key={`${entry.date}-${i}`}
              className={`text-xs p-2 rounded-md ${i === 0 ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">{entry.user}</span>
                <span>•</span>
                <span>{formatDate(entry.date)} às {formatTime(entry.date)}</span>
              </div>
              <p className="mt-1 text-foreground/70">{entry.changes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


