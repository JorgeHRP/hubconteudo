import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Copy, RefreshCw, Ban, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { buscarAcessoPorEmpresa, gerarAcessoCliente, revogarAcessoCliente } from "@/data/store";
import { formatDate } from "@/lib/cs-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Link exclusivo pelo qual o cliente acompanha o que foi compartilhado. */
export function AcessoClienteCard({ empresaId }: { empresaId: string }) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [copiado, setCopiado] = useState(false);

  const { data: acesso } = useQuery({
    queryKey: ["acesso", empresaId],
    queryFn: () => buscarAcessoPorEmpresa(empresaId),
  });

  const recarregar = () => qc.invalidateQueries({ queryKey: ["acesso", empresaId] });

  const gerar = useMutation({
    mutationFn: () => gerarAcessoCliente(empresaId, userId),
    onSuccess: () => { recarregar(); toast.success("Link gerado"); },
  });

  const revogar = useMutation({
    mutationFn: () => revogarAcessoCliente(empresaId),
    onSuccess: () => { recarregar(); toast.success("Link revogado. Quem tinha não entra mais."); },
  });

  const url = acesso ? `${window.location.origin}/painel/${acesso.token}` : null;

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      toast.success("Link copiado");
    } catch {
      toast.error("Não consegui copiar. Selecione o endereço e copie à mão.");
    }
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-accent" aria-hidden /> Painel do cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {url ? (
          <>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              O cliente vê aqui só o que foi marcado como compartilhado, e responde aprovando
              ou pedindo ajuste. Não precisa de senha.
            </p>
            <div className="flex items-center gap-1 rounded-md border bg-muted/50 py-1 pl-3 pr-1">
              <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                title="Copiar link" aria-label="Copiar link do painel do cliente" onClick={copiar}>
                {copiado ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Criado em {formatDate(acesso!.created_at.slice(0, 10))}
              {acesso!.ultimo_acesso
                ? ` · último acesso em ${formatDate(acesso!.ultimo_acesso.slice(0, 10))}`
                : " · ainda não acessado"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => gerar.mutate()}>
                <RefreshCw /> Gerar novo
              </Button>
              <Button variant="ghost" size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => revogar.mutate()}>
                <Ban /> Revogar
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Gere um endereço exclusivo para este cliente acompanhar as entregas
              compartilhadas e responder a elas.
            </p>
            <Button size="sm" className="w-full" onClick={() => gerar.mutate()}>
              <Link2 /> Gerar link de acesso
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
