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
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">{curso.titulo}</DialogTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {curso.professor && (
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {curso.professor}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {cargaLegivel(curso.carga_horaria)}
              </span>
              {curso.nivel && <Badge variant="outline" className="text-[10px]">{curso.nivel}</Badge>}
              {progresso?.concluido && (
                <Badge variant="success" className="text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Concluído
                </Badge>
              )}
            </div>
          </DialogHeader>

          {curso.resumo && !mostrandoQuiz && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{curso.resumo}</p>
          )}

          {/* Vídeo. Sai da tela durante o questionário: o iframe se sobrepõe às
              perguntas, e ninguém precisa do vídeo enquanto responde. */}
          {mostrandoQuiz ? null : incorpora && src ? (
            <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
              <iframe
                src={src}
                title={curso.titulo}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : curso.video_url ? (
            <Button variant="outline" asChild>
              <a href={curso.video_url} target="_blank" rel="noreferrer">
                Abrir o vídeo <ExternalLink />
              </a>
            </Button>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Este curso ainda não tem vídeo cadastrado.
            </p>
          )}

          {!mostrandoQuiz && <Separator />}

          {/* questionário */}
          {mostrandoQuiz && curso.exige_questionario ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Questionário</p>
                <p className="text-[11px] text-muted-foreground">
                  {lista.length} {lista.length === 1 ? "pergunta" : "perguntas"} ·
                  {" "}acerto mínimo de {curso.nota_minima}%
                </p>
              </div>

              {lista.map((p, i) => (
                <div key={p.id}>
                  <p className="mb-2 text-sm font-medium">{i + 1}. {p.enunciado}</p>
                  <div className="space-y-1.5">
                    {p.opcoes.map((o, j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => {
                          const novas = [...respostas];
                          novas[i] = j;
                          setRespostas(novas);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
                          respostas[i] === j
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full border-2",
                          respostas[i] === j ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMostrandoQuiz(false)}>
                  Voltar ao vídeo
                </Button>
                <Button className="flex-1" disabled={!respondeuTudo || concluir.isPending}
                  onClick={() => concluir.mutate()}>
                  Enviar respostas
                </Button>
              </div>
            </div>
          ) : progresso?.concluido ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <span>
                  Curso concluído
                  {progresso.nota !== null && ` com ${progresso.nota}% de acerto`}.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
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
            <div className="space-y-2">
              {curso.exige_questionario ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ao terminar o vídeo, responda o questionário para concluir
                    {curso.emite_certificado && " e receber o certificado"}.
                  </p>
                  <Button className="w-full" disabled={lista.length === 0}
                    onClick={() => setMostrandoQuiz(true)}>
                    <PlayCircle /> Fazer o questionário
                  </Button>
                  {lista.length === 0 && (
                    <p className="text-[11px] text-warning">
                      Nenhuma pergunta cadastrada ainda. Peça a quem administra os
                      treinamentos para incluir as perguntas.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Sem questionário neste curso
                    {curso.emite_certificado && " — o certificado sai direto na conclusão"}.
                  </p>
                  <Button className="w-full" disabled={concluir.isPending}
                    onClick={() => concluir.mutate()}>
                    <CheckCircle2 /> Marcar como concluído
                  </Button>
                </>
              )}
            </div>
          )}
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
