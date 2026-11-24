import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, ExternalLink, Award, RotateCcw, User, Clock, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  concluirCurso, lerModeloCertificado, listarCertificados, listarPerguntas,
  progressoDoCurso, reabrirCurso,
} from "@/data/store";
import { cargaLegivel, ehIncorporavel, urlDeIncorporacao } from "@/lib/treinamentos";
import type { Certificado, Curso } from "@/lib/types";
import { VisualizadorCertificado } from "@/components/Certificado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Linha da lista lateral: concluída em verde, atual em azul, pendente apagada. Só apresentação. */
function Etapa({
  numero,
  titulo,
  detalhe,
  estado,
}: {
  numero: number;
  titulo: string;
  detalhe: string;
  estado: "concluida" | "atual" | "pendente";
}) {
  return (
    <li
      aria-current={estado === "atual" ? "step" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-2.5 py-2",
        estado === "atual" ? "border-primary/20 bg-card" : "border-transparent"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
          estado === "concluida" && "bg-success/10 text-success",
          estado === "atual" && "bg-primary text-primary-foreground",
          estado === "pendente" && "bg-muted text-muted-foreground"
        )}
      >
        {estado === "concluida" ? <CheckCircle2 className="h-4 w-4" /> : numero}
      </span>
      <div className="min-w-0">
        <p className={cn(
          "truncate text-sm font-medium",
          estado === "atual" && "text-primary",
          estado === "pendente" && "text-muted-foreground"
        )}>
          {titulo}
          <span className="sr-only">
            {estado === "concluida" ? " (concluída)" : estado === "atual" ? " (etapa atual)" : " (pendente)"}
          </span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </li>
  );
}

/** Assistir, responder o questionário e concluir. */
export function PlayerCurso({
  curso,
  aberto,
  onFechar,
}: {
  curso: Curso | null;
  aberto: boolean;
  onFechar: () => void;
}) {
  const { userId, profile } = useAuth();
  const qc = useQueryClient();
  const [respostas, setRespostas] = useState<number[]>([]);
  const [mostrandoQuiz, setMostrandoQuiz] = useState(false);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [verCertificado, setVerCertificado] = useState(false);

  const id = curso?.id ?? "";

  const { data: perguntas } = useQuery({
    queryKey: ["perguntas", id], queryFn: () => listarPerguntas(id),
    enabled: aberto && Boolean(id),
  });
  const { data: modelo } = useQuery({
    queryKey: ["modelo-certificado"], queryFn: lerModeloCertificado,
  });
  const { data: meusCertificados } = useQuery({
    queryKey: ["certificados", userId], queryFn: () => listarCertificados(userId!),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!aberto) { setRespostas([]); setMostrandoQuiz(false); }
  }, [aberto]);

  const progresso = id && userId ? progressoDoCurso(id, userId) : null;

  const concluir = useMutation({
    mutationFn: () =>
      concluirCurso(id, userId!, curso?.exige_questionario ? respostas : undefined),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["progresso-cursos", userId] });
      qc.invalidateQueries({ queryKey: ["certificados", userId] });
      qc.invalidateQueries({ queryKey: ["cursos"] });
      setMostrandoQuiz(false);

      if (!r.aprovado) {
        toast.error(
          `Você acertou ${r.nota}% e o mínimo é ${curso?.nota_minima}%. Reveja o conteúdo e tente de novo.`
        );
        return;
      }
      toast.success(
        r.nota !== null ? `Aprovado com ${r.nota}% de acerto!` : "Curso concluído!"
      );
      if (r.certificado) { setCertificado(r.certificado); setVerCertificado(true); }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reabrir = useMutation({
    mutationFn: () => reabrirCurso(id, userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progresso-cursos", userId] });
      setRespostas([]);
      toast.success("Curso reaberto");
    },
  });

  if (!curso) return null;

  const incorpora = ehIncorporavel(curso.video_url);
  const src = urlDeIncorporacao(curso.video_url);
  const lista = perguntas ?? [];
  const respondeuTudo = lista.length > 0 && respostas.length === lista.length
    && respostas.every((r) => r !== undefined);
  const doCurso = meusCertificados?.find((c) => c.curso_id === curso.id) ?? null;

  return (
    <>
      <Dialog open={aberto && !verCertificado} onOpenChange={(v) => !v && onFechar()}>
        <DialogContent className="max-h-[92vh] max-w-4xl gap-5 overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-left">{curso.titulo}</DialogTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-muted-foreground">
              {curso.professor && (
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {curso.professor}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {cargaLegivel(curso.carga_horaria)}
              </span>
              {curso.nivel && <Badge variant="outline" className="font-normal text-muted-foreground">{curso.nivel}</Badge>}
              {progresso?.concluido && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Concluído
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Conteúdo à esquerda e etapas à direita; no celular as etapas descem para baixo do conteúdo. */}
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
            <div className="min-w-0 space-y-4">
              {/* Vídeo. Sai da tela durante o questionário: o iframe se sobrepõe às
                  perguntas, e ninguém precisa do vídeo enquanto responde. */}
              {mostrandoQuiz ? null : incorpora && src ? (
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <iframe
                    src={src}
                    title={curso.titulo}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : curso.video_url ? (
                <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 px-4 py-8 text-center">
                  <PlayCircle className="h-8 w-8 text-accent" aria-hidden />
                  <p className="text-sm text-muted-foreground">Este vídeo abre em uma nova aba.</p>
                  <Button variant="outline" asChild>
                    <a href={curso.video_url} target="_blank" rel="noreferrer">
                      Abrir o vídeo <ExternalLink />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Este curso ainda não tem vídeo cadastrado.
                </p>
              )}

              {curso.resumo && !mostrandoQuiz && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sobre o curso
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{curso.resumo}</p>
                </div>
              )}

              {!mostrandoQuiz && <Separator />}

              {/* questionário */}
              {mostrandoQuiz && curso.exige_questionario ? (
                <div className="space-y-5">
                  <div>
                    <p className="font-display text-base font-semibold">Questionário</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {lista.length} {lista.length === 1 ? "pergunta" : "perguntas"} ·
                      {" "}acerto mínimo de {curso.nota_minima}%
                    </p>
                  </div>

                  {lista.map((p, i) => (
                    <div key={p.id}>
                      <p className="mb-2 break-words text-sm font-medium">{i + 1}. {p.enunciado}</p>
                      <div className="space-y-1.5">
                        {p.opcoes.map((o, j) => (
                          <button
                            key={j}
                            type="button"
                            aria-pressed={respostas[i] === j}
                            onClick={() => {
                              const novas = [...respostas];
                              novas[i] = j;
                              setRespostas(novas);
                            }}
                            className={cn(
                              "flex min-h-10 w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                              respostas[i] === j
                                ? "border-primary bg-primary/10"
                                : "hover:bg-muted/50"
                            )}
                          >
                            <span aria-hidden className={cn("h-3.5 w-3.5 shrink-0 rounded-full border-2",
                              respostas[i] === j ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                            <span className="min-w-0 break-words">{o}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setMostrandoQuiz(false)}>
                      Voltar ao vídeo
                    </Button>
                    <Button disabled={!respondeuTudo || concluir.isPending}
                      onClick={() => concluir.mutate()}>
                      Enviar respostas
                    </Button>
                  </div>
                </div>
              ) : progresso?.concluido ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/10 px-3 py-2.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      Curso concluído
                      {progresso.nota !== null && ` com ${progresso.nota}% de acerto`}.
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {doCurso && (
                      <Button onClick={() => { setCertificado(doCurso); setVerCertificado(true); }}>
                        <Award /> Ver certificado
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => reabrir.mutate()}>
                      <RotateCcw /> Refazer o curso
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {curso.exige_questionario ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Ao terminar o vídeo, responda o questionário para concluir
                        {curso.emite_certificado && " e receber o certificado"}.
                      </p>
                      <Button className="w-full sm:w-auto" disabled={lista.length === 0}
                        onClick={() => setMostrandoQuiz(true)}>
                        <PlayCircle /> Fazer o questionário
                      </Button>
                      {lista.length === 0 && (
                        <p className="rounded-md border border-warning/30 bg-warning/15 px-3 py-2 text-xs text-warning-strong">
                          Nenhuma pergunta cadastrada ainda. Peça a quem administra os
                          treinamentos para incluir as perguntas.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sem questionário neste curso
                        {curso.emite_certificado && " — o certificado sai direto na conclusão"}.
                      </p>
                      <Button className="w-full sm:w-auto" disabled={concluir.isPending}
                        onClick={() => concluir.mutate()}>
                        <CheckCircle2 /> Marcar como concluído
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <aside aria-label="Etapas do curso" className="rounded-lg border bg-muted/50 p-3">
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Etapas do curso
              </p>
              <ol className="space-y-1">
                <Etapa
                  numero={1}
                  titulo="Assistir ao conteúdo"
                  detalhe={cargaLegivel(curso.carga_horaria)}
                  estado={progresso?.concluido || mostrandoQuiz ? "concluida" : "atual"}
                />
                {curso.exige_questionario && (
                  <Etapa
                    numero={2}
                    titulo="Questionário"
                    detalhe={`Acerto mínimo de ${curso.nota_minima}%`}
                    estado={progresso?.concluido ? "concluida" : mostrandoQuiz ? "atual" : "pendente"}
                  />
                )}
                {curso.emite_certificado && (
                  <Etapa
                    numero={curso.exige_questionario ? 3 : 2}
                    titulo="Certificado"
                    detalhe={progresso?.concluido ? "Emitido na conclusão" : "Liberado ao concluir"}
                    estado={progresso?.concluido ? "concluida" : "pendente"}
                  />
                )}
              </ol>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      {modelo && (
        <VisualizadorCertificado
          certificado={certificado}
          modelo={modelo}
          nome={profile?.nome ?? "—"}
          aberto={verCertificado}
          onFechar={() => setVerCertificado(false)}
        />
      )}
    </>
  );
}
