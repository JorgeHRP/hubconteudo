import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Settings2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { buscarPainel, salvarUrlPainel } from "@/data/store";
import type { PainelExternoChave } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Painel de tráfego: antes de montar o iframe, entrega a sessão do Hub ao painel
 * (POST /entrar/ponte com o token no cabeçalho, nunca na URL). O painel confere o
 * token e abre a própria sessão, então a pessoa não digita e-mail e senha de novo.
 * Se der errado, o iframe abre do mesmo jeito e mostra a tela de entrar do painel.
 */
async function entregarSessaoAoPainel(urlPainel: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 8000);
  try {
    await fetch(`${new URL(urlPainel).origin}/entrar/ponte`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
      signal: controle.signal,
    });
  } finally {
    clearTimeout(limite);
  }
}

/**
 * Casca para os painéis construídos fora da Central Interna.
 * Enquanto a URL não é configurada, mostra o estado vazio com o botão de configurar.
 */
export function PainelIncorporado({
  chave,
  icone,
  titulo,
  subtitulo,
  semCabecalho,
}: {
  chave: PainelExternoChave;
  icone: LucideIcon;
  titulo: string;
  subtitulo: string;
  /** Quando o painel vive dentro de uma aba, quem já tem cabeçalho é a página. */
  semCabecalho?: boolean;
}) {
  const { isMaster } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [url, setUrl] = useState("");

  const { data: painel } = useQuery({
    queryKey: ["painel", chave],
    queryFn: () => buscarPainel(chave),
  });

  // Só o painel de tráfego tem a ponte de login; os outros montam direto.
  const usaPonte = chave === "trafego";
  const [ponteFeita, setPonteFeita] = useState<string | null>(null);
  useEffect(() => {
    if (!usaPonte || !painel?.url) return;
    let ativo = true;
    const alvo = painel.url;
    entregarSessaoAoPainel(alvo)
      .catch(() => undefined)
      .finally(() => { if (ativo) setPonteFeita(alvo); });
    return () => { ativo = false; };
  }, [usaPonte, painel?.url]);
  const iframePronto = !usaPonte || ponteFeita === painel?.url;

  const salvar = useMutation({
    mutationFn: () => salvarUrlPainel(chave, url.trim() || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["painel", chave] });
      qc.invalidateQueries({ queryKey: ["paineis"] });
      setAberto(false);
      toast.success("Painel configurado");
    },
  });

  const configurar = (
    <Dialog
      open={aberto}
      onOpenChange={(v) => { setAberto(v); if (v) setUrl(painel?.url ?? ""); }}
    >
      <DialogTrigger asChild>
        <Button variant={painel?.url ? "outline" : "default"}>
          <Settings2 /> {painel?.url ? "Trocar URL" : "Configurar painel"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar {titulo}</DialogTitle>
          <DialogDescription>
            Cole o endereço do painel. Ele roda embutido aqui dentro, sem sair da Central.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="painel-url">URL do painel</Label>
            <Input id="painel-url" className="mt-1.5" value={url} placeholder="https://…"
              onChange={(e) => setUrl(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">
              O painel precisa permitir ser embutido (sem <code>X-Frame-Options: DENY</code>).
              Se ele bloquear, o botão de abrir em nova aba continua funcionando.
            </p>
          </div>
          <Button className="w-full" onClick={() => salvar.mutate()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="animate-fade-in flex h-full flex-col">
      {semCabecalho ? (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {painel?.url && (
            <Button variant="outline" asChild>
              <a href={painel.url} target="_blank" rel="noreferrer">
                Abrir em nova aba <ExternalLink />
              </a>
            </Button>
          )}
          {isMaster && configurar}
        </div>
      ) : (
      <PageHeader
        icone={icone}
        titulo={titulo}
        subtitulo={subtitulo}
        acao={
          <div className="flex gap-2">
            {painel?.url && (
              <Button variant="outline" asChild>
                <a href={painel.url} target="_blank" rel="noreferrer">
                  Abrir em nova aba <ExternalLink />
                </a>
              </Button>
            )}
            {isMaster && configurar}
          </div>
        }
      />
      )}

      {painel?.url ? (
        <div className="min-h-[70vh] flex-1 overflow-hidden rounded-lg border bg-card">
          {iframePronto ? (
            <iframe
              src={painel.url}
              title={titulo}
              className="h-full min-h-[70vh] w-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex h-full min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
              Abrindo o painel…
            </div>
          )}
        </div>
      ) : (
        <EstadoVazio
          icone={Link2}
          titulo="Painel ainda não conectado"
          descricao={
            isMaster
              ? "Cole a URL do painel para ele rodar embutido aqui dentro."
              : "Assim que a diretoria configurar o endereço, o painel aparece nesta tela."
          }
          acao={isMaster ? configurar : undefined}
        />
      )}
    </div>
  );
}
