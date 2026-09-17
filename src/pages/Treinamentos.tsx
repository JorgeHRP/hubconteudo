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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Capa do card. Sem imagem, mostra um degradê com a inicial. */
function Capa({ src, titulo, alto }: { src: string | null; titulo: string; alto?: boolean }) {
  const altura = alto ? "h-36" : "h-28";
  if (src) {
    return <img src={src} alt="" className={cn(altura, "w-full object-cover")} />;
  }
  return (
    <div className={cn(altura, "gradient-primary flex w-full items-center justify-center")}>
      <span className="text-3xl font-bold text-primary-foreground/90">
        {titulo.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

export default function Treinamentos() {
  const { userId, profile, isMaster } = useAuth();
  const qc = useQueryClient();
  const [assistindo, setAssistindo] = useState<Curso | null>(null);
  const [trilhaAberta, setTrilhaAberta] = useState<Trilha | null>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);

  const { data: trilhas } = useQuery({ queryKey: ["trilhas"], queryFn: listarTrilhas });
  const { data: cursos } = useQuery({ queryKey: ["cursos"], queryFn: listarCursos });
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
        <Button variant="ghost" size="sm" className="mb-2 -ml-2"
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

        {trilhaAberta.descricao && (
          <p className="mb-4 text-sm text-muted-foreground">{trilhaAberta.descricao}</p>
        )}

        {p && p.total > 0 && (
          <div className="mb-5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="gradient-primary h-full transition-all"
                style={{ width: `${p.percentual}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{p.percentual}% concluído</p>
          </div>
        )}

        {daTrilha.length === 0 ? (
          <EstadoVazio
            icone={PlayCircle}
            titulo="Trilha sem cursos"
            descricao="Adicione o primeiro curso desta trilha: nome, professor, resumo e o link do vídeo."
            acao={isMaster && <CursoDialog trilhaFixa={trilhaAberta.id} />}
          />
        ) : (
          <div className="space-y-2">
            {daTrilha.map((c, i) => (
              <Card key={c.id} className="group">
                <CardContent className="flex flex-wrap items-center gap-3 p-3 pt-3">
                  <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    feito(c.id) ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {feito(c.id) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>

                  <button type="button" onClick={() => setAssistindo(c)}
                    className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium hover:underline">{c.titulo}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {c.professor && <span>{c.professor}</span>}
                      <span>{cargaLegivel(c.carga_horaria)}</span>
                      {c.exige_questionario && <span>· com questionário</span>}
                    </div>
                  </button>

                  <Button size="sm" variant={feito(c.id) ? "outline" : "default"}
                    className="h-8 text-xs" onClick={() => setAssistindo(c)}>
                    {feito(c.id) ? "Rever" : "Assistir"}
                  </Button>

                  {isMaster && (
                    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <CursoDialog curso={c} gatilho={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      } />
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => apagarCurso.mutate(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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

      {vazio ? (
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
                      <Card key={t.id} className="group overflow-hidden">
                        <button type="button" onClick={() => setTrilhaAberta(t)} className="block w-full text-left">
                          <Capa src={t.capa} titulo={t.titulo} alto />
                        </button>
                        <CardContent className="p-4 pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <button type="button" onClick={() => setTrilhaAberta(t)}
                              className="min-w-0 text-left">
                              <p className="truncate font-semibold hover:text-primary">{t.titulo}</p>
                            </button>
                            {isMaster && (
                              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <TrilhaDialog trilha={t} gatilho={
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                } />
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => apagarTrilha.mutate(t.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {t.descricao && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {t.descricao}
                            </p>
                          )}

                          {p && (
                            <div className="mt-3">
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="gradient-primary h-full transition-all"
                                  style={{ width: `${p.percentual}%` }} />
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {p.total === 0
                                  ? "Sem cursos ainda"
                                  : `${p.feitos} de ${p.total} · ${cargaLegivel(p.horas)}`}
                              </p>
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
                    <Card key={c.id} className="group overflow-hidden">
                      <button type="button" onClick={() => setAssistindo(c)} className="block w-full">
                        <Capa src={c.capa} titulo={c.titulo} />
                      </button>
                      <CardContent className="p-4 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" onClick={() => setAssistindo(c)} className="min-w-0 text-left">
                            <p className="truncate font-semibold hover:text-primary">{c.titulo}</p>
                          </button>
                          {feito(c.id) && (
                            <Badge variant="success" className="shrink-0 text-[9px]">
                              <CheckCircle2 className="h-3 w-3" /> Feito
                            </Badge>
                          )}
                        </div>

                        {c.resumo && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.resumo}</p>
                        )}

                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {c.professor && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {c.professor}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {cargaLegivel(c.carga_horaria)}
                          </span>
                          {c.nivel && <Badge variant="outline" className="text-[9px]">{c.nivel}</Badge>}
                        </div>

                        <div className="mt-3 flex items-center gap-1 border-t pt-2.5">
                          <Button size="sm" variant={feito(c.id) ? "outline" : "default"}
                            className="h-7 flex-1 text-xs" onClick={() => setAssistindo(c)}>
                            <PlayCircle className="h-3.5 w-3.5" /> {feito(c.id) ? "Rever" : "Assistir"}
                          </Button>
                          {isMaster && (
                            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <CursoDialog curso={c} gatilho={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              } />
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => apagarCurso.mutate(c.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
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
              <div className="space-y-2">
                {certificados?.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex flex-wrap items-center gap-3 p-4 pt-4">
                      <Award className="h-5 w-5 shrink-0 text-warning" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cargaLegivel(c.carga_horaria)} · emitido em{" "}
                          {formatDate(c.emitido_em.slice(0, 10))} · código {c.codigo}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs"
                        onClick={() => setCertificado(c)}>
                        Ver certificado
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
          <div className="space-y-3">
            <div>
              <Label>Título do documento</Label>
              <Input className="mt-1.5" value={atual.titulo}
                onChange={(e) => set("titulo", e.target.value)} />
            </div>
            <div>
              <Label>Texto</Label>
              <Textarea className="mt-1.5" rows={4} value={atual.texto}
                onChange={(e) => set("texto", e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use <code>{"{nome}"}</code>, <code>{"{curso}"}</code> e <code>{"{horas}"}</code> —
                são trocados pelos dados reais na hora de emitir.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Quem assina</Label>
                <Input className="mt-1.5" value={atual.assinante}
                  onChange={(e) => set("assinante", e.target.value)} />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input className="mt-1.5" value={atual.cargo_assinante}
                  onChange={(e) => set("cargo_assinante", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Cidade</Label>
              <Input className="mt-1.5" value={atual.cidade}
                onChange={(e) => set("cidade", e.target.value)} />
            </div>

            <Button className="w-full" onClick={() => gravar.mutate()}>Salvar modelo</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
