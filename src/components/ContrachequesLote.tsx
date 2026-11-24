import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarRange, Check, FileCheck2, Paperclip, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarDocumento, listarDocumentos, listarProfiles, podeEnviarDocumento } from "@/data/store";
import { DOCUMENTO_ACEITA, DOCUMENTO_MAX_BYTES } from "@/integrations/supabase/documentos";
import { getInitials } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  /** Com o banco ligado, cada pessoa marcada precisa do próprio arquivo. */
  const comUpload = podeEnviarDocumento();
  const [arquivos, setArquivos] = useState<Record<string, File>>({});
  const semArquivo = comUpload ? selecionados.filter((u) => !arquivos[u]) : [];

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
    // Um por vez: se algum falhar, os anteriores ficam gravados e saem da lista
    // de pendentes, e o RH reenvia só o que faltou.
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
        }, arquivos[user_id] ?? null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.success(
        `${selecionados.length} contracheque(s) de ${competenciaLegivel(competencia)} enviados`
      );
      setAberto(false);
      setSelecionados([]);
      setArquivos({});
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ["documentos"] });
      toast.error((e as Error).message);
    },
  });

  function escolherArquivo(user_id: string, f: File | null) {
    if (f && f.size > DOCUMENTO_MAX_BYTES) {
      toast.error(`"${f.name}" passa de 20 MB.`);
      return;
    }
    setArquivos((a) => {
      const novo = { ...a };
      if (f) novo[user_id] = f; else delete novo[user_id];
      return novo;
    });
    if (f) setSelecionados((s) => (s.includes(user_id) ? s : [...s, user_id]));
  }

  function abrir(v: boolean) {
    setAberto(v);
    if (v) { setSelecionados([]); setArquivos({}); }
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
              id="lote-comp" type="month" className="mt-1.5 w-full sm:w-48" value={competencia}
              onChange={(e) => { setCompetencia(e.target.value); setSelecionados([]); }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular-nums">
                {pendentes.length} de {ativos.length} ainda sem contracheque
              </span>
            </span>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button
                variant="outline" size="sm"
                onClick={() => setSelecionados(pendentes.map((p) => p.user_id))}
                disabled={pendentes.length === 0}
              >
                Marcar todos os pendentes
              </Button>
              {selecionados.length > 0 && (
                <Button variant="ghost" size="sm"
                  onClick={() => setSelecionados([])}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {!profiles ? (
            <div className="space-y-3 rounded-md border p-3" role="status" aria-label="Carregando colaboradores">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="max-h-72 divide-y overflow-y-auto rounded-md border">
            {ativos.map((p) => {
              const enviado = jaTem(p.user_id);
              const marcado = selecionados.includes(p.user_id);
              const pronto = Boolean(arquivos[p.user_id]);
              const faltaArquivo = comUpload && marcado && !pronto;
              const alternar = () =>
                setSelecionados((s) =>
                  s.includes(p.user_id) ? s.filter((x) => x !== p.user_id) : [...s, p.user_id]
                );
              return (
                <div
                  key={p.user_id}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 transition-colors sm:gap-3",
                    enviado
                      ? "bg-muted/40"
                      : faltaArquivo
                        ? "bg-destructive/10"
                        : marcado
                          ? "bg-primary/5"
                          : "hover:bg-muted/40"
                  )}
                >
                  <button
                    type="button" disabled={enviado} onClick={alternar}
                    aria-pressed={marcado}
                    className={cn(
                      "flex min-h-9 min-w-0 flex-1 items-center gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      enviado && "opacity-60"
                    )}
                  >
                    <div aria-hidden className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      marcado ? "border-primary bg-primary" : "border-input bg-card"
                    )}>
                      {marcado && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <Avatar className="hidden h-8 w-8 sm:flex">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(p.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.nome}</p>
                      {pronto ? (
                        <p className="flex items-center gap-1 text-xs text-success">
                          <FileCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{arquivos[p.user_id]?.name}</span>
                        </p>
                      ) : faltaArquivo ? (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">Falta escolher o arquivo</span>
                        </p>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">{p.cargo ?? "—"}</p>
                      )}
                    </div>
                  </button>
                  {enviado ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <Check className="h-3 w-3" aria-hidden /> Já enviado
                    </Badge>
                  ) : comUpload && (
                    <label
                      className={cn(
                        "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-ring/50",
                        pronto
                          ? "border-success/20 text-success hover:bg-success/10"
                          : faltaArquivo
                            ? "border-destructive/20 text-destructive hover:bg-destructive/10"
                            : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title="Escolher o arquivo desta pessoa"
                    >
                      <Paperclip className="h-3.5 w-3.5" aria-hidden />
                      {arquivos[p.user_id] ? "Trocar" : "Arquivo"}
                      <input
                        type="file" className="sr-only" accept={DOCUMENTO_ACEITA}
                        onChange={(e) => { escolherArquivo(p.user_id, e.target.files?.[0] ?? null); e.target.value = ""; }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {comUpload
              ? "Escolha o arquivo de cada pessoa (até 20 MB). Ao escolher, ela já fica marcada."
              : "No modo de demonstração é gerado só o registro de cada contracheque, sem o arquivo."}
          </p>

          {semArquivo.length > 0 && (
            <p role="status" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              {semArquivo.length} pessoa(s) marcada(s) ainda sem arquivo.
            </p>
          )}

          <Button
            className="w-full"
            disabled={selecionados.length === 0 || !competencia || semArquivo.length > 0 || enviar.isPending}
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
