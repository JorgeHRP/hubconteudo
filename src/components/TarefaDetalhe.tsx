import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip, Link2, Play, Square, Plus, Trash2, MessageSquare,
  Timer, Eye, X, ExternalLink, ListTree, Building2, CalendarClock, Columns3,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  abrirAnexo, adicionarLink, adicionarSubtarefa, alternarObservador, anexarArquivo, limiteAnexo,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Rótulo pequeno que abre cada seção da ficha. */
function RotuloSecao({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icone className="h-3.5 w-3.5" aria-hidden /> {children}
    </h3>
  );
}

/** Botão só com ícone para remover um item da ficha. */
const botaoRemover =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

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
    mutationFn: (arquivo: File) => anexarArquivo(id, arquivo, userId),
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
      <DialogContent className="max-h-[90vh] max-w-3xl gap-5 overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="space-y-2.5 pr-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={prioridadeVariant[tarefa.prioridade]}>
              {prioridadeLabels[tarefa.prioridade]}
            </Badge>
            {tipo && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${tipo.cor}22`, color: tipo.cor }}>
                {tipo.label}
              </span>
            )}
            <Badge variant="outline" className="max-w-full gap-1 font-normal text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{empresa?.nome_fantasia ?? "Tarefa interna"}</span>
            </Badge>
            {tarefa.prazo && (
              <Badge variant="outline" className="gap-1 font-normal tabular-nums text-muted-foreground">
                <CalendarClock className="h-3 w-3 shrink-0" /> Prazo {formatDate(tarefa.prazo)}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-left text-lg leading-snug sm:text-xl">{tarefa.titulo}</DialogTitle>
          {tarefa.descricao && (
            <p className="whitespace-pre-wrap text-left text-sm leading-relaxed text-muted-foreground">
              {tarefa.descricao}
            </p>
          )}
        </DialogHeader>

        {/* situação + cronômetro */}
        <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2 sm:gap-6">
          <section className="space-y-2">
            <RotuloSecao icone={Columns3}>Situação</RotuloSecao>
            <Select value={tarefa.status_id} onValueChange={(v) => trocarStatus.mutate(v)}>
              <SelectTrigger className="bg-card" aria-label="Situação da tarefa"><SelectValue /></SelectTrigger>
              <SelectContent>
                {colunas?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section className="space-y-2">
            <RotuloSecao icone={Timer}>Tempo trabalhado</RotuloSecao>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("font-display text-2xl font-semibold tabular-nums",
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
            {tarefa.estimativa_horas !== null && (
              <p className="text-xs text-muted-foreground">
                Estimado: {tarefa.estimativa_horas} h
                {total > 0 && ` · ${Math.round((total / 3600 / tarefa.estimativa_horas) * 100)}% do previsto`}
              </p>
            )}
            {ativo && !rodando && (
              <p className="rounded-md border border-warning/30 bg-warning/15 px-2.5 py-1.5 text-xs text-warning-strong">
                Você tem outro cronômetro rodando. Iniciar aqui encerra o anterior.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Input type="number" min="1" placeholder="min" value={minutos} className="h-9 w-24 bg-card"
                aria-label="Minutos a lançar manualmente"
                onChange={(e) => setMinutos(e.target.value)} />
              <Button size="sm" variant="ghost" className="h-9"
                disabled={!minutos || Number(minutos) <= 0 || manual.isPending}
                onClick={() => manual.mutate()}>
                Lançar manual
              </Button>
            </div>
          </section>
        </div>

        {/* subtarefas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <RotuloSecao icone={ListTree}>Checklist</RotuloSecao>
            {tarefa.subtarefas.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {feitas} de {tarefa.subtarefas.length}
              </span>
            )}
          </div>
          {tarefa.subtarefas.length > 0 && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success transition-all"
                style={{ width: `${(feitas / tarefa.subtarefas.length) * 100}%` }} />
            </div>
          )}
          {tarefa.subtarefas.length > 0 && (
            <div className="divide-y rounded-md border">
              {tarefa.subtarefas.map((s, i) => (
                <div key={`${s.titulo}-${i}`} className="flex items-center gap-2.5 py-1 pl-3 pr-1 transition-colors hover:bg-muted/50">
                  <Checkbox checked={s.feita} aria-label={s.titulo} onCheckedChange={() => subToggle.mutate(i)} />
                  <span className={cn("min-w-0 flex-1 break-words text-sm", s.feita && "text-muted-foreground line-through")}>
                    {s.titulo}
                  </span>
                  <button type="button" onClick={() => subDel.mutate(i)} className={botaoRemover}
                    title="Remover item" aria-label={`Remover item ${s.titulo}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={novaSub} placeholder="Adicionar item ao checklist" className="h-9"
              aria-label="Novo item do checklist"
              onChange={(e) => setNovaSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaSub.trim()) {
                  subAdd.mutate(novaSub.trim()); setNovaSub("");
                }
              }} />
            <Button size="sm" variant="outline" className="h-9 shrink-0" disabled={!novaSub.trim()}
              aria-label="Adicionar item ao checklist"
              onClick={() => { subAdd.mutate(novaSub.trim()); setNovaSub(""); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <Separator />

        {/* anexos e links */}
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="space-y-3">
            <RotuloSecao icone={Paperclip}>Anexos</RotuloSecao>
            {tarefa.anexos.length > 0 ? (
              <div className="divide-y rounded-md border">
                {tarefa.anexos.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-1 pl-3 pr-1">
                    <button type="button" title="Abrir o arquivo"
                      className="min-w-0 flex-1 rounded-sm py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => abrirAnexo(a).catch((e) => toast.error((e as Error).message))}>
                      <p className="truncate text-sm font-medium hover:underline">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{tamanhoLegivel(a.tamanho)}</p>
                    </button>
                    <button type="button" onClick={() => anexoDel.mutate(a.id)} className={botaoRemover}
                      title="Remover anexo" aria-label={`Remover anexo ${a.nome}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum arquivo.</p>
            )}
            <input ref={arquivoRef} type="file" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) anexar.mutate(f);
                e.target.value = "";
              }} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Button size="sm" variant="outline" className="h-9" disabled={anexar.isPending}
                onClick={() => arquivoRef.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" /> {anexar.isPending ? "Enviando…" : "Anexar arquivo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Até {tamanhoLegivel(limiteAnexo())} por arquivo.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <RotuloSecao icone={Link2}>Links</RotuloSecao>
            {tarefa.links.length > 0 ? (
              <div className="divide-y rounded-md border">
                {tarefa.links.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 py-1 pl-3 pr-1">
                    <a href={l.url} target="_blank" rel="noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1.5 text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{l.rotulo}</span>
                    </a>
                    <button type="button" onClick={() => linkDel.mutate(l.id)} className={botaoRemover}
                      title="Remover link" aria-label={`Remover link ${l.rotulo}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum link.</p>
            )}
            <div className="space-y-2">
              <Input className="h-9" placeholder="Nome do link" value={rotuloLink} aria-label="Nome do link"
                onChange={(e) => setRotuloLink(e.target.value)} />
              <div className="flex gap-2">
                <Input className="h-9" placeholder="https://" value={urlLink} aria-label="Endereço do link"
                  onChange={(e) => setUrlLink(e.target.value)} />
                <Button size="sm" variant="outline" className="h-9 shrink-0" disabled={!urlLink.trim()}
                  aria-label="Adicionar link"
                  onClick={() => {
                    linkAdd.mutate({ rotulo: rotuloLink.trim() || urlLink.trim(), url: urlLink.trim() });
                    setRotuloLink(""); setUrlLink("");
                  }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>

        <Separator />

        {/* observadores */}
        <section className="space-y-3">
          <div className="space-y-1">
            <RotuloSecao icone={Eye}>Quem acompanha</RotuloSecao>
            <p className="text-xs text-muted-foreground">
              Responsáveis: {tarefa.responsaveis.length ? tarefa.responsaveis.map(nome).join(", ") : "ninguém"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ativos.map((p) => {
              const marcado = tarefa.observadores.includes(p.user_id);
              return (
                <button key={p.user_id} type="button" aria-pressed={marcado}
                  onClick={() => observador.mutate(p.user_id)}
                  className={cn("min-h-8 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    marcado
                      ? "border-info/20 bg-info/10 font-medium text-info"
                      : "bg-card text-muted-foreground hover:bg-muted")}>
                  {p.nome}
                </button>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* conversa */}
        <section className="space-y-3">
          <RotuloSecao icone={MessageSquare}>Conversa</RotuloSecao>
          {(comentarios ?? []).length > 0 && (
            <div className="divide-y">
              {(comentarios ?? []).map((c) => (
                <div key={c.id} className="flex gap-3 py-3 first:pt-0">
                  <div aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {c.autor_nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium text-foreground">{c.autor_nome}</span>
                      <span className="ml-1.5 text-muted-foreground">{quandoLegivel(c.created_at)}</span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{c.texto}</p>
                  </div>
                  <button type="button" onClick={() => comentDel.mutate(c.id)} className={botaoRemover}
                    title="Apagar comentário" aria-label={`Apagar comentário de ${c.autor_nome}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {(comentarios ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nada comentado ainda. Use @nome para chamar alguém — quem for citado passa a acompanhar.
            </p>
          )}
          <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
            <Textarea rows={2} value={texto} placeholder="Escreva um comentário…" className="bg-card"
              aria-label="Novo comentário"
              onChange={(e) => setTexto(e.target.value)} />
            <div className="flex justify-end">
              <Button size="sm" disabled={!texto.trim() || comentar.isPending}
                onClick={() => comentar.mutate()}>
                Enviar
              </Button>
            </div>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
