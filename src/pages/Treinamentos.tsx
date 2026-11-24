import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap, Award, Route, PlayCircle, CheckCircle2, Clock, User,
  Settings2, Trash2, Pencil, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  lerModeloCertificado, listarCertificados, listarCursos, listarProgressoCursos,
  listarTrilhas, progressoDaTrilha, removerCurso, removerTrilha,
  salvarModeloCertificado,
} from "@/data/store";
import { cargaLegivel } from "@/lib/treinamentos";
import { formatDate } from "@/lib/cs-data";
import type { Certificado, Curso, ModeloCertificado, Trilha } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { TrilhaDialog } from "@/components/TrilhaDialog";
import { CursoDialog } from "@/components/CursoDialog";
import { PlayerCurso } from "@/components/PlayerCurso";
import { VisualizadorCertificado } from "@/components/Certificado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const focoVisivel = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/* Em tela de toque as ações ficam sempre à vista; com mouse, aparecem ao passar ou focar. */
const acoesDiscretas =
  "transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100";

/** Capa do card, em proporção fixa. Sem imagem, mostra a inicial sobre fundo suave. */
function Capa({ src, titulo, alto }: { src: string | null; titulo: string; alto?: boolean }) {
  const proporcao = alto ? "aspect-video" : "aspect-[2/1]";
  if (src) {
    return (
      <div className={cn(proporcao, "w-full overflow-hidden border-b bg-muted")}>
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cn(proporcao, "flex w-full items-center justify-center border-b bg-primary/10")} aria-hidden>
      <span className="font-display text-4xl font-semibold text-primary/70">
        {titulo.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

/** Grade de cartões de espera, no mesmo formato do catálogo. */
function EsqueletoCatalogo() {
  return (
    <div role="status" aria-label="Carregando treinamentos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="overflow-hidden" aria-hidden>
          <Skeleton className="aspect-video w-full rounded-none" />
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Treinamentos() {
  const { userId, profile, isMaster } = useAuth();
  const qc = useQueryClient();
  const [assistindo, setAssistindo] = useState<Curso | null>(null);
  const [trilhaAberta, setTrilhaAberta] = useState<Trilha | null>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);

  const { data: trilhas, isLoading: carregandoTrilhas } = useQuery({ queryKey: ["trilhas"], queryFn: listarTrilhas });
  const { data: cursos, isLoading: carregandoCursos } = useQuery({ queryKey: ["cursos"], queryFn: listarCursos });
  const { data: progresso } = useQuery({
    queryKey: ["progresso-cursos", userId],
    queryFn: () => listarProgressoCursos(userId!),
    enabled: Boolean(userId),
  });
  const { data: certificados } = useQuery({
    queryKey: ["certificados", userId],
    queryFn: () => listarCertificados(userId!),
    enabled: Boolean(userId),
  });
  const { data: modelo } = useQuery({
    queryKey: ["modelo-certificado"], queryFn: lerModeloCertificado,
  });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["trilhas"] });
    qc.invalidateQueries({ queryKey: ["cursos"] });
  };

  const apagarTrilha = useMutation({
    mutationFn: removerTrilha,
    onSuccess: () => { recarregar(); toast.success("Trilha removida"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const apagarCurso = useMutation({
    mutationFn: removerCurso,
    onSuccess: () => { recarregar(); toast.success("Curso removido"); },
  });

  const listaTrilhas = trilhas ?? [];
  const listaCursos = cursos ?? [];
  const avulsos = listaCursos.filter((c) => c.trilha_id === null);
  const feito = (id: string) =>
    (progresso ?? []).some((p) => p.curso_id === id && p.concluido);
  const concluidos = (progresso ?? []).filter((p) => p.concluido).length;
  const horasFeitas = listaCursos
    .filter((c) => feito(c.id))
    .reduce((s, c) => s + c.carga_horaria, 0);

  const vazio = listaTrilhas.length === 0 && listaCursos.length === 0;

  /* ---- dentro de uma trilha ---- */
  if (trilhaAberta) {
    const daTrilha = listaCursos.filter((c) => c.trilha_id === trilhaAberta.id);
    const p = userId ? progressoDaTrilha(trilhaAberta.id, userId) : null;

    return (
      <div className="animate-fade-in">
        <Button variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground"
          onClick={() => setTrilhaAberta(null)}>
          <ChevronLeft /> Treinamentos
        </Button>

        <PageHeader
          icone={Route}
          titulo={trilhaAberta.titulo}
          subtitulo={
            p
              ? `${p.feitos} de ${p.total} cursos concluídos · ${cargaLegivel(p.horas)} no total`
              : trilhaAberta.descricao ?? ""
          }
          acao={isMaster && <CursoDialog trilhaFixa={trilhaAberta.id} />}
        />

        {(trilhaAberta.descricao || (p && p.total > 0)) && (
          <Card className="mb-6">
            <CardContent className="space-y-4 p-5">
              {trilhaAberta.descricao && (
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{trilhaAberta.descricao}</p>
              )}

              {p && p.total > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold uppercase tracking-wide text-muted-foreground">Seu progresso</span>
                    <span className="font-medium tabular-nums text-foreground">{p.percentual}% concluído</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className={cn("h-full rounded-full transition-all", p.percentual >= 100 ? "bg-success" : "bg-primary")}
                      style={{ width: `${p.percentual}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {daTrilha.length === 0 ? (
          <EstadoVazio
            icone={PlayCircle}
            titulo="Trilha sem cursos"
            descricao="Adicione o primeiro curso desta trilha: nome, professor, resumo e o link do vídeo."
            acao={isMaster && <CursoDialog trilhaFixa={trilhaAberta.id} />}
          />
        ) : (
          <Card className="overflow-hidden">
            <ol className="divide-y">
              {daTrilha.map((c, i) => (
                <li key={c.id} className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                  <span aria-hidden className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    feito(c.id) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {feito(c.id) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>

                  <button type="button" onClick={() => setAssistindo(c)}
                    className={cn("min-w-0 flex-1 basis-40 rounded-sm text-left", focoVisivel)}>
                    <p className="truncate text-sm font-medium transition-colors hover:text-primary">{c.titulo}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {c.professor && <span>{c.professor}</span>}
                      <span>{cargaLegivel(c.carga_horaria)}</span>
                      {c.exige_questionario && <span>· com questionário</span>}
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    {feito(c.id) && (
                      <Badge variant="success" className="mr-1 hidden sm:inline-flex">Concluído</Badge>
                    )}
                    <Button size="sm" variant={feito(c.id) ? "outline" : "default"}
                      className="h-9 sm:h-8" onClick={() => setAssistindo(c)}>
                      <PlayCircle /> {feito(c.id) ? "Rever" : "Assistir"}
                    </Button>

                    {isMaster && (
                      <div className={cn("flex gap-0.5", acoesDiscretas)}>
                        <CursoDialog curso={c} gatilho={
                          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8"
                            title="Editar curso" aria-label="Editar curso">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        } />
                        <Button variant="ghost" size="icon" title="Excluir curso" aria-label="Excluir curso"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
                          onClick={() => apagarCurso.mutate(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <PlayerCurso curso={assistindo} aberto={assistindo !== null}
          onFechar={() => setAssistindo(null)} />
      </div>
    );
  }

  /* ---- lista geral ---- */
  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={GraduationCap}
        titulo="Treinamentos"
        subtitulo={
          concluidos > 0
            ? `${concluidos} ${concluidos === 1 ? "curso concluído" : "cursos concluídos"} · ${cargaLegivel(horasFeitas)}`
            : "Trilhas de conhecimento e treinamentos avulsos"
        }
        acao={
          isMaster && (
            <div className="flex flex-wrap gap-2">
              <ModeloDialog modelo={modelo} />
              <CursoDialog />
              <TrilhaDialog />
            </div>
          )
        }
      />

      {carregandoTrilhas || carregandoCursos ? (
        <EsqueletoCatalogo />
      ) : vazio ? (
        <EstadoVazio
          icone={GraduationCap}
          titulo="Nenhum treinamento publicado"
          descricao="Crie uma trilha para encadear vários cursos, ou um treinamento avulso para um assunto só. Cada curso tem vídeo, professor, resumo e pode terminar com questionário e certificado."
          acao={isMaster && (
            <div className="flex flex-wrap justify-center gap-2">
              <TrilhaDialog />
              <CursoDialog />
            </div>
          )}
        />
      ) : (
        <Tabs defaultValue="catalogo">
          <TabsList>
            <TabsTrigger value="catalogo"><GraduationCap /> Catálogo</TabsTrigger>
            <TabsTrigger value="certificados"><Award /> Meus certificados</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo" className="space-y-6">
            {listaTrilhas.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Trilhas de conhecimento
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listaTrilhas.map((t) => {
                    const p = userId ? progressoDaTrilha(t.id, userId) : null;
                    return (
                      <Card key={t.id} className="group flex flex-col overflow-hidden transition-colors hover:border-primary/30">
                        <button type="button" onClick={() => setTrilhaAberta(t)} tabIndex={-1} aria-hidden
                          className="block w-full text-left">
                          <Capa src={t.capa} titulo={t.titulo} alto />
                        </button>
                        <CardContent className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-2">
                            <button type="button" onClick={() => setTrilhaAberta(t)}
                              className={cn("min-w-0 rounded-sm text-left", focoVisivel)}>
                              <p className="line-clamp-2 font-display text-base font-semibold leading-snug transition-colors hover:text-primary">
                                {t.titulo}
                              </p>
                            </button>
                            {isMaster && (
                              <div className={cn("-mr-1.5 -mt-1 flex shrink-0 gap-0.5", acoesDiscretas)}>
                                <TrilhaDialog trilha={t} gatilho={
                                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8"
                                    title="Editar trilha" aria-label="Editar trilha">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                } />
                                <Button variant="ghost" size="icon" title="Excluir trilha" aria-label="Excluir trilha"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
                                  onClick={() => apagarTrilha.mutate(t.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {t.descricao && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {t.descricao}
                            </p>
                          )}

                          {p && (
                            <div className="mt-auto pt-4">
                              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="truncate">
                                  {p.total === 0
                                    ? "Sem cursos ainda"
                                    : `${p.feitos} de ${p.total} · ${cargaLegivel(p.horas)}`}
                                </span>
                                {p.total > 0 && p.percentual >= 100 && (
                                  <Badge variant="success" className="shrink-0">Concluída</Badge>
                                )}
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                                <div className={cn("h-full rounded-full transition-all", p.percentual >= 100 ? "bg-success" : "bg-primary")}
                                  style={{ width: `${p.percentual}%` }} />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {avulsos.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Treinamentos avulsos
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {avulsos.map((c) => (
                    <Card key={c.id} className="group flex flex-col overflow-hidden transition-colors hover:border-primary/30">
                      <button type="button" onClick={() => setAssistindo(c)} tabIndex={-1} aria-hidden
                        className="block w-full">
                        <Capa src={c.capa} titulo={c.titulo} />
                      </button>
                      <CardContent className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" onClick={() => setAssistindo(c)}
                            className={cn("min-w-0 rounded-sm text-left", focoVisivel)}>
                            <p className="line-clamp-2 font-display text-base font-semibold leading-snug transition-colors hover:text-primary">
                              {c.titulo}
                            </p>
                          </button>
                          {feito(c.id) ? (
                            <Badge variant="success" className="shrink-0 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Concluído
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0">A fazer</Badge>
                          )}
                        </div>

                        {c.resumo && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.resumo}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                          {c.professor && (
                            <span className="flex min-w-0 items-center gap-1">
                              <User className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.professor}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {cargaLegivel(c.carga_horaria)}
                          </span>
                          {c.nivel && <Badge variant="outline" className="font-normal text-muted-foreground">{c.nivel}</Badge>}
                        </div>

                        <div className="mt-auto pt-4">
                          <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className={cn("h-full rounded-full bg-success transition-all", feito(c.id) ? "w-full" : "w-0")} />
                          </div>
                          <div className="mt-3 flex items-center gap-1">
                            <Button size="sm" variant={feito(c.id) ? "outline" : "default"}
                              className="h-9 flex-1 sm:h-8" onClick={() => setAssistindo(c)}>
                              <PlayCircle /> {feito(c.id) ? "Rever" : "Assistir"}
                            </Button>
                            {isMaster && (
                              <div className={cn("flex gap-0.5", acoesDiscretas)}>
                                <CursoDialog curso={c} gatilho={
                                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8"
                                    title="Editar curso" aria-label="Editar curso">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                } />
                                <Button variant="ghost" size="icon" title="Excluir curso" aria-label="Excluir curso"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
                                  onClick={() => apagarCurso.mutate(c.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="certificados">
            {(certificados ?? []).length === 0 ? (
              <EstadoVazio
                icone={Award}
                titulo="Nenhum certificado ainda"
                descricao="Conclua um curso que emita certificado e ele aparece aqui, pronto para baixar em PDF."
              />
            ) : (
              <Card className="overflow-hidden">
                <ul className="divide-y">
                  {certificados?.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
                      <span aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning-strong">
                        <Award className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 basis-40">
                        <p className="truncate text-sm font-medium">{c.titulo}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {cargaLegivel(c.carga_horaria)} · emitido em{" "}
                          {formatDate(c.emitido_em.slice(0, 10))} · código {c.codigo}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-9 sm:h-8"
                        onClick={() => setCertificado(c)}>
                        Ver certificado
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <PlayerCurso curso={assistindo} aberto={assistindo !== null}
        onFechar={() => setAssistindo(null)} />

      {modelo && (
        <VisualizadorCertificado
          certificado={certificado}
          modelo={modelo}
          nome={profile?.nome ?? "—"}
          aberto={certificado !== null}
          onFechar={() => setCertificado(null)}
        />
      )}
    </div>
  );
}

/** Edição do modelo único de certificado. */
function ModeloDialog({ modelo }: { modelo?: ModeloCertificado }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<ModeloCertificado | null>(null);

  const atual = form ?? modelo ?? null;

  const gravar = useMutation({
    mutationFn: () => salvarModeloCertificado(form ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modelo-certificado"] });
      setAberto(false);
      toast.success("Modelo salvo");
    },
  });

  const set = (campo: keyof ModeloCertificado, valor: string) =>
    setForm({ ...(atual as ModeloCertificado), [campo]: valor });

  return (
    <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (v) setForm(modelo ?? null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings2 /> Modelo de certificado</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modelo de certificado</DialogTitle>
          <DialogDescription>
            Vale para todos os cursos. Só o nome de quem fez, o curso e a carga horária
            mudam de um documento para outro.
          </DialogDescription>
        </DialogHeader>

        {atual && (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="modelo-titulo">Título do documento</Label>
                <Input id="modelo-titulo" className="mt-1.5" value={atual.titulo}
                  onChange={(e) => set("titulo", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="modelo-texto">Texto</Label>
                <Textarea id="modelo-texto" className="mt-1.5" rows={4} value={atual.texto}
                  onChange={(e) => set("texto", e.target.value)} />
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Use <code className="rounded bg-muted px-1">{"{nome}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{curso}"}</code> e{" "}
                  <code className="rounded bg-muted px-1">{"{horas}"}</code> —
                  são trocados pelos dados reais na hora de emitir.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="modelo-assinante">Quem assina</Label>
                  <Input id="modelo-assinante" className="mt-1.5" value={atual.assinante}
                    onChange={(e) => set("assinante", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="modelo-cargo">Cargo</Label>
                  <Input id="modelo-cargo" className="mt-1.5" value={atual.cargo_assinante}
                    onChange={(e) => set("cargo_assinante", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="modelo-cidade">Cidade</Label>
                <Input id="modelo-cidade" className="mt-1.5" value={atual.cidade}
                  onChange={(e) => set("cidade", e.target.value)} />
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button className="w-full sm:w-auto" onClick={() => gravar.mutate()}>Salvar modelo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
