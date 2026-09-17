import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip, Link2, Play, Square, Plus, Trash2, MessageSquare,
  Timer, Eye, X, ExternalLink, ListTree,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  adicionarAnexo, adicionarLink, adicionarSubtarefa, alternarObservador,
  alternarSubtarefa, comentarTarefa, cronometroAtivo, iniciarCronometro,
  lancarTempoManual, listarComentarios, listarEmpresas, listarProfiles,
  listarStatus, listarTempos, listarTiposTarefa, moverTarefa, pararCronometro,
  removerAnexo, removerComentario, removerLink, removerSubtarefa,
} from "@/data/store";
import { prioridadeLabels, prioridadeVariant } from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type { Tarefa } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Limite por arquivo enquanto os anexos moram no navegador. */
const LIMITE_ANEXO = 400 * 1024;

function duracao(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h === 0 && m === 0) return `${segundos}s`;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
}

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function quandoLegivel(iso: string): string {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.floor(min / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Ficha completa da tarefa: cronômetro, subtarefas, anexos, links,
 * observadores e conversa. É aqui que o time trabalha o dia a dia da tarefa —
 * o diálogo de edição cuida só dos campos cadastrais.
 */
export function TarefaDetalhe({
  tarefa,
  aberto,
  onFechar,
}: {
  tarefa: Tarefa | null;
  aberto: boolean;
  onFechar: () => void;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [novaSub, setNovaSub] = useState("");
  const [rotuloLink, setRotuloLink] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [minutos, setMinutos] = useState("");
  const [tick, setTick] = useState(0);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const id = tarefa?.id ?? "";

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: colunas } = useQuery({ queryKey: ["status-tarefa"], queryFn: listarStatus });
  const { data: tipos } = useQuery({ queryKey: ["tipos-tarefa"], queryFn: listarTiposTarefa });
  const { data: comentarios } = useQuery({
    queryKey: ["comentarios-tarefa", id], queryFn: () => listarComentarios(id), enabled: aberto && Boolean(id),
  });
  const { data: tempos } = useQuery({
    queryKey: ["tempos-tarefa", id], queryFn: () => listarTempos(id), enabled: aberto && Boolean(id),
  });
  const { data: ativo } = useQuery({
    queryKey: ["cronometro", userId], queryFn: () => cronometroAtivo(userId!),
    enabled: aberto && Boolean(userId),
  });

  // Enquanto o cronômetro desta tarefa roda, o total na tela precisa andar sozinho.
  const rodando = ativo?.tarefa_id === id;
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  useEffect(() => { if (!aberto) { setTexto(""); setNovaSub(""); } }, [aberto]);

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["tarefas"] });
    qc.invalidateQueries({ queryKey: ["comentarios-tarefa", id] });
    qc.invalidateQueries({ queryKey: ["tempos-tarefa", id] });
    qc.invalidateQueries({ queryKey: ["cronometro", userId] });
  };

  const comentar = useMutation({
    mutationFn: () =>
      comentarTarefa({
        tarefa_id: id,
        autor_id: userId,
        autor_nome: profiles?.find((p) => p.user_id === userId)?.nome ?? "Você",
        texto: texto.trim(),
      }),
    onSuccess: () => { setTexto(""); recarregar(); },
  });

  // Toda ação da ficha faz a mesma coisa ao terminar: recarregar a tarefa na tela.
  const subAdd = useMutation({ mutationFn: (titulo: string) => adicionarSubtarefa(id, titulo, userId), onSuccess: recarregar });
  const subDel = useMutation({ mutationFn: (i: number) => removerSubtarefa(id, i), onSuccess: recarregar });
  const subToggle = useMutation({ mutationFn: (i: number) => alternarSubtarefa(id, i), onSuccess: recarregar });
  const linkAdd = useMutation({
    mutationFn: (dados: { rotulo: string; url: string }) => adicionarLink(id, dados.rotulo, dados.url),
    onSuccess: recarregar,
  });
  const linkDel = useMutation({ mutationFn: (lid: string) => removerLink(id, lid), onSuccess: recarregar });
  const anexoDel = useMutation({ mutationFn: (aid: string) => removerAnexo(id, aid), onSuccess: recarregar });
  const comentDel = useMutation({ mutationFn: (cid: string) => removerComentario(cid), onSuccess: recarregar });
  const observador = useMutation({ mutationFn: (uid: string) => alternarObservador(id, uid), onSuccess: recarregar });
  const trocarStatus = useMutation({ mutationFn: (st: string) => moverTarefa(id, st, userId), onSuccess: recarregar });

  const iniciar = useMutation({
    mutationFn: () => iniciarCronometro(id, userId!),
    onSuccess: () => { recarregar(); toast.success("Cronômetro rodando"); },
  });
  const parar = useMutation({
    mutationFn: () => pararCronometro(userId!),
    onSuccess: () => { recarregar(); toast.success("Tempo registrado"); },
  });
  const manual = useMutation({
    mutationFn: () => lancarTempoManual(id, userId!, Number(minutos)),
    onSuccess: () => { setMinutos(""); recarregar(); toast.success("Tempo lançado"); },
  });

  const anexar = useMutation({
    mutationFn: async (arquivo: File) => {
      if (arquivo.size > LIMITE_ANEXO) {
        throw new Error(
          `"${arquivo.name}" tem ${tamanhoLegivel(arquivo.size)}. O limite atual é ${tamanhoLegivel(LIMITE_ANEXO)} por arquivo.`
        );
      }
      const caminho = await new Promise<string>((ok, erro) => {
        const leitor = new FileReader();
        leitor.onload = () => ok(String(leitor.result));
        leitor.onerror = () => erro(new Error("Não foi possível ler o arquivo."));
        leitor.readAsDataURL(arquivo);
      });
      return adicionarAnexo(id, {
        nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type || "arquivo", caminho,
      }, userId);
    },
    onSuccess: () => { recarregar(); toast.success("Anexo adicionado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!tarefa) return null;

  const tipo = tipos?.find((t) => t.id === tarefa.tipo_id) ?? null;
  const empresa = empresas?.find((e) => e.id === tarefa.empresa_id);
  const nome = (uid: string) => profiles?.find((p) => p.user_id === uid)?.nome ?? "—";
  const ativos = (profiles ?? []).filter((p) => p.ativo);

  const emCurso = rodando && ativo
    ? Math.floor((Date.now() - new Date(ativo.inicio).getTime()) / 1000)
    : 0;
  const registrado = (tempos ?? []).reduce((s, r) => s + (r.segundos ?? 0), 0);
  const total = registrado + emCurso;
  void tick;

  const feitas = tarefa.subtarefas.filter((s) => s.feita).length;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={prioridadeVariant[tarefa.prioridade]} className="text-[10px]">
              {prioridadeLabels[tarefa.prioridade]}
            </Badge>
            {tipo && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${tipo.cor}22`, color: tipo.cor }}>
                {tipo.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {empresa?.nome_fantasia ?? "Tarefa interna"}
            </span>
            {tarefa.prazo && (
              <span className="text-xs text-muted-foreground">· prazo {formatDate(tarefa.prazo)}</span>
            )}
          </div>
          <DialogTitle className="text-left text-lg leading-snug">{tarefa.titulo}</DialogTitle>
          {tarefa.descricao && (
            <p className="whitespace-pre-wrap text-left text-sm text-muted-foreground">
              {tarefa.descricao}
            </p>
          )}
        </DialogHeader>

        {/* situação + cronômetro */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Situação</Label>
            <Select value={tarefa.status_id} onValueChange={(v) => trocarStatus.mutate(v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {colunas?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Timer className="h-3.5 w-3.5" /> Tempo trabalhado
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-lg font-semibold tabular-nums",
                rodando ? "text-success" : "text-foreground")}>
                {duracao(total)}
              </span>
              {rodando ? (
                <Button size="sm" variant="outline" onClick={() => parar.mutate()}>
                  <Square className="h-3.5 w-3.5" /> Parar
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => iniciar.mutate()}>
                  <Play className="h-3.5 w-3.5" /> Iniciar
                </Button>
              )}
            </div>
            {ativo && !rodando && (
              <p className="mt-1 text-[11px] text-warning">
                Você tem outro cronômetro rodando. Iniciar aqui encerra o anterior.
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Input type="number" min="1" placeholder="min" value={minutos} className="h-8 w-24"
                onChange={(e) => setMinutos(e.target.value)} />
              <Button size="sm" variant="ghost" className="h-8"
                disabled={!minutos || Number(minutos) <= 0 || manual.isPending}
                onClick={() => manual.mutate()}>
                Lançar manual
              </Button>
            </div>
            {tarefa.estimativa_horas !== null && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Estimado: {tarefa.estimativa_horas} h
                {total > 0 && ` · ${Math.round((total / 3600 / tarefa.estimativa_horas) * 100)}% do previsto`}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* subtarefas */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs">
              <ListTree className="h-3.5 w-3.5" /> Checklist
            </Label>
            {tarefa.subtarefas.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {feitas} de {tarefa.subtarefas.length}
              </span>
            )}
          </div>
          {tarefa.subtarefas.length > 0 && (
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success transition-all"
                style={{ width: `${(feitas / tarefa.subtarefas.length) * 100}%` }} />
            </div>
          )}
          <div className="space-y-1">
            {tarefa.subtarefas.map((s, i) => (
              <div key={`${s.titulo}-${i}`} className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/50">
                <Checkbox checked={s.feita} onCheckedChange={() => subToggle.mutate(i)} />
                <span className={cn("flex-1 text-sm", s.feita && "text-muted-foreground line-through")}>
                  {s.titulo}
                </span>
                <button type="button" onClick={() => subDel.mutate(i)}
                  className="opacity-0 transition-opacity group-hover:opacity-100">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={novaSub} placeholder="Adicionar item ao checklist" className="h-8"
              onChange={(e) => setNovaSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaSub.trim()) {
                  subAdd.mutate(novaSub.trim()); setNovaSub("");
                }
              }} />
            <Button size="sm" variant="outline" className="h-8" disabled={!novaSub.trim()}
              onClick={() => { subAdd.mutate(novaSub.trim()); setNovaSub(""); }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* anexos e links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" /> Anexos
            </Label>
            <div className="mt-1.5 space-y-1">
              {tarefa.anexos.map((a) => (
                <div key={a.id} className="group flex items-center gap-2 rounded border px-2 py-1.5">
                  <a href={a.caminho} download={a.nome} className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{a.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{tamanhoLegivel(a.tamanho)}</p>
                  </a>
                  <button type="button" onClick={() => anexoDel.mutate(a.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {tarefa.anexos.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum arquivo.</p>
              )}
            </div>
            <input ref={arquivoRef} type="file" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) anexar.mutate(f);
                e.target.value = "";
              }} />
            <Button size="sm" variant="outline" className="mt-2 h-8" disabled={anexar.isPending}
              onClick={() => arquivoRef.current?.click()}>
              <Paperclip className="h-3.5 w-3.5" /> Anexar arquivo
            </Button>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Até {tamanhoLegivel(LIMITE_ANEXO)}. Os arquivos ficam neste navegador até o
              armazenamento do servidor ser ligado.
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Links
            </Label>
            <div className="mt-1.5 space-y-1">
              {tarefa.links.map((l) => (
                <div key={l.id} className="group flex items-center gap-2 rounded border px-2 py-1.5">
                  <a href={l.url} target="_blank" rel="noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-xs hover:underline">
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{l.rotulo}</span>
                  </a>
                  <button type="button" onClick={() => linkDel.mutate(l.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {tarefa.links.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum link.</p>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <Input className="h-8" placeholder="Nome do link" value={rotuloLink}
                onChange={(e) => setRotuloLink(e.target.value)} />
              <div className="flex gap-2">
                <Input className="h-8" placeholder="https://" value={urlLink}
                  onChange={(e) => setUrlLink(e.target.value)} />
                <Button size="sm" variant="outline" className="h-8" disabled={!urlLink.trim()}
                  onClick={() => {
                    linkAdd.mutate({ rotulo: rotuloLink.trim() || urlLink.trim(), url: urlLink.trim() });
                    setRotuloLink(""); setUrlLink("");
                  }}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* observadores */}
        <div>
          <Label className="flex items-center gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" /> Quem acompanha
          </Label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Responsáveis: {tarefa.responsaveis.length ? tarefa.responsaveis.map(nome).join(", ") : "ninguém"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ativos.map((p) => {
              const marcado = tarefa.observadores.includes(p.user_id);
              return (
                <button key={p.user_id} type="button" onClick={() => observador.mutate(p.user_id)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors",
                    marcado ? "border-info bg-info/10 text-info" : "text-muted-foreground hover:bg-muted")}>
                  {p.nome}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* conversa */}
        <div>
          <Label className="flex items-center gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" /> Conversa
          </Label>
          <div className="mt-2 space-y-3">
            {(comentarios ?? []).map((c) => (
              <div key={c.id} className="group flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {c.autor_nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-medium">{c.autor_nome}</span>
                    <span className="ml-1.5 text-muted-foreground">{quandoLegivel(c.created_at)}</span>
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{c.texto}</p>
                </div>
                <button type="button" onClick={() => comentDel.mutate(c.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            {(comentarios ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nada comentado ainda. Use @nome para chamar alguém — quem for citado passa a acompanhar.
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Textarea rows={2} value={texto} placeholder="Escreva um comentário…"
              onChange={(e) => setTexto(e.target.value)} />
            <Button size="sm" disabled={!texto.trim() || comentar.isPending}
              onClick={() => comentar.mutate()}>
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
