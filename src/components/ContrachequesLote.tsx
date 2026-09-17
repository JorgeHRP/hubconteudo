import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Check, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarDocumento, listarDocumentos, listarProfiles } from "@/data/store";
import { getInitials } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function competenciaLegivel(c: string) {
  if (!c) return "";
  const [ano, mes] = c.split("-");
  return new Date(Number(ano), Number(mes) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Envio mensal: o RH sobe os contracheques de todo mundo de uma vez. */
export function ContrachequesLote() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [competencia, setCompetencia] = useState(competenciaAtual());
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: documentos } = useQuery({ queryKey: ["documentos"], queryFn: listarDocumentos });

  const ativos = (profiles ?? []).filter((p) => p.ativo);

  const jaTem = (user_id: string) =>
    (documentos ?? []).some(
      (d) =>
        d.user_id === user_id &&
        d.categoria === "contracheque" &&
        d.competencia?.startsWith(competencia)
    );

  const pendentes = ativos.filter((p) => !jaTem(p.user_id));

  const enviar = useMutation({
    mutationFn: async () => {
      const mes = competenciaLegivel(competencia);
      for (const user_id of selecionados) {
        const pessoa = ativos.find((p) => p.user_id === user_id);
        await criarDocumento({
          user_id,
          nome: `Contracheque — ${mes}`,
          descricao: null,
          categoria: "contracheque",
          competencia: `${competencia}-01`,
          arquivo_url: null,
          arquivo_nome: `holerite-${competencia}-${(pessoa?.nome ?? "")
            .toLowerCase()
            .split(" ")[0]}.pdf`,
          uploaded_by: userId,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success(
        `${selecionados.length} contracheque(s) de ${competenciaLegivel(competencia)} enviados`
      );
      setAberto(false);
      setSelecionados([]);
    },
  });

  function abrir(v: boolean) {
    setAberto(v);
    if (v) setSelecionados([]);
  }

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline"><CalendarRange /> Envio do mês</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envio mensal de contracheques</DialogTitle>
          <DialogDescription>
            Escolha a competência e marque quem recebe. Cada documento fica visível
            apenas para a própria pessoa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="lote-comp">Competência</Label>
            <Input
              id="lote-comp" type="month" className="mt-1.5 w-48" value={competencia}
              onChange={(e) => { setCompetencia(e.target.value); setSelecionados([]); }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {pendentes.length} de {ativos.length} ainda sem contracheque
            </span>
            <Button
              variant="outline" size="sm" className="ml-auto h-8"
              onClick={() => setSelecionados(pendentes.map((p) => p.user_id))}
              disabled={pendentes.length === 0}
            >
              Marcar todos os pendentes
            </Button>
            {selecionados.length > 0 && (
              <Button variant="ghost" size="sm" className="h-8"
                onClick={() => setSelecionados([])}>
                Limpar
              </Button>
            )}
          </div>

          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {ativos.map((p) => {
              const enviado = jaTem(p.user_id);
              const marcado = selecionados.includes(p.user_id);
              return (
                <button
                  key={p.user_id}
                  disabled={enviado}
                  onClick={() =>
                    setSelecionados((s) =>
                      s.includes(p.user_id)
                        ? s.filter((x) => x !== p.user_id)
                        : [...s, p.user_id]
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors",
                    enviado && "opacity-60",
                    marcado ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    marcado ? "border-primary bg-primary" : "border-input"
                  )}>
                    {marcado && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">{getInitials(p.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.cargo ?? "—"}</p>
                  </div>
                  {enviado && (
                    <Badge variant="success" className="shrink-0 text-[9px]">já enviado</Badge>
                  )}
                </button>
              );
            })}
          </div>

          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Aqui é gerado o registro de cada contracheque. O upload dos PDFs entra junto
            com o Storage do Supabase, no bucket privado <code>documentos</code>.
          </p>

          <Button
            className="w-full"
            disabled={selecionados.length === 0 || !competencia || enviar.isPending}
            onClick={() => enviar.mutate()}
          >
            <Upload />
            {enviar.isPending
              ? "Enviando…"
              : `Enviar para ${selecionados.length} pessoa(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
