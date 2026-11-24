import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  listarPerguntas, listarTrilhas, removerPergunta, salvarCurso, salvarPergunta,
} from "@/data/store";
import { ehIncorporavel, urlDeIncorporacao } from "@/lib/treinamentos";
import type { Curso, NivelCurso } from "@/lib/types";
import { EscolherCapa } from "@/components/TrilhaDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const niveis: NivelCurso[] = ["Iniciante", "Intermediário", "Avançado"];

export function CursoDialog({
  curso,
  trilhaFixa,
  gatilho,
}: {
  curso?: Curso;
  /** Quando aberto de dentro de uma trilha, o curso já nasce vinculado a ela. */
  trilhaFixa?: string;
  gatilho?: ReactNode;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    titulo: "", professor: "", resumo: "", video_url: "",
    carga_horaria: "1", nivel: "" as string, trilha_id: "",
    exige_questionario: false, nota_minima: "70", emite_certificado: true,
  });
  const [capa, setCapa] = useState<string | null>(null);

  const { data: trilhas } = useQuery({ queryKey: ["trilhas"], queryFn: listarTrilhas });

  useEffect(() => {
    if (!aberto) return;
    setForm({
      titulo: curso?.titulo ?? "",
      professor: curso?.professor ?? "",
      resumo: curso?.resumo ?? "",
      video_url: curso?.video_url ?? "",
      carga_horaria: String(curso?.carga_horaria ?? 1),
      nivel: curso?.nivel ?? "",
      trilha_id: curso?.trilha_id ?? trilhaFixa ?? "",
      exige_questionario: curso?.exige_questionario ?? false,
      nota_minima: String(curso?.nota_minima ?? 70),
      emite_certificado: curso?.emite_certificado ?? true,
    });
    setCapa(curso?.capa ?? null);
  }, [aberto, curso, trilhaFixa]);

  const gravar = useMutation({
    mutationFn: () =>
      salvarCurso({
        id: curso?.id,
        titulo: form.titulo.trim(),
        professor: form.professor.trim() || null,
        resumo: form.resumo.trim() || null,
        video_url: form.video_url.trim() || null,
        carga_horaria: Math.max(1, Number(form.carga_horaria) || 1),
        nivel: (form.nivel || null) as NivelCurso | null,
        trilha_id: form.trilha_id || null,
        capa,
        exige_questionario: form.exige_questionario,
        nota_minima: Math.min(100, Math.max(1, Number(form.nota_minima) || 70)),
        emite_certificado: form.emite_certificado,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cursos"] });
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      setAberto(false);
      toast.success(curso ? "Curso atualizado" : "Curso criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const previa = urlDeIncorporacao(form.video_url);
  const incorpora = ehIncorporavel(form.video_url);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {gatilho ?? <Button size="sm"><Plus /> Novo curso</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{curso ? "Editar curso" : "Novo curso"}</DialogTitle>
          <DialogDescription>
            Cole o link do YouTube, Vimeo ou Drive: o vídeo roda dentro da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="curso-titulo">Nome do curso *</Label>
            <Input id="curso-titulo" className="mt-1.5" value={form.titulo}
              placeholder="Como estruturar uma régua de nutrição"
              onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="curso-professor">Professor</Label>
            <Input id="curso-professor" className="mt-1.5" value={form.professor} placeholder="Quem ministra"
              onChange={(e) => setForm({ ...form, professor: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="curso-trilha">Trilha</Label>
            <Select value={form.trilha_id || "avulso"}
              disabled={Boolean(trilhaFixa)}
              onValueChange={(v) => setForm({ ...form, trilha_id: v === "avulso" ? "" : v })}>
              <SelectTrigger id="curso-trilha" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avulso">Treinamento avulso</SelectItem>
                {trilhas?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="curso-resumo">Mini resumo do conteúdo</Label>
            <Textarea id="curso-resumo" className="mt-1.5" rows={3} value={form.resumo}
              placeholder="Em duas ou três linhas, o que a pessoa vai aprender."
              onChange={(e) => setForm({ ...form, resumo: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="curso-video">Link do vídeo</Label>
            <Input id="curso-video" className="mt-1.5" value={form.video_url}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
            {form.video_url && (
              <p className={cn("mt-1.5 flex items-start gap-1.5 text-xs",
                incorpora ? "text-success" : "text-warning-strong")}>
                {incorpora
                  ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
                {incorpora
                  ? "Reconhecido — o vídeo vai rodar dentro da plataforma."
                  : "Não reconheci a plataforma. O link vai abrir em nova aba."}
              </p>
            )}
            {incorpora && previa && (
              <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-muted">
                <iframe src={previa} title="Prévia" className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="curso-carga">Carga horária (horas)</Label>
            <Input id="curso-carga" type="number" min="1" step="1" className="mt-1.5" value={form.carga_horaria}
              onChange={(e) => setForm({ ...form, carga_horaria: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="curso-nivel">Nível</Label>
            <Select value={form.nivel || "nenhum"}
              onValueChange={(v) => setForm({ ...form, nivel: v === "nenhum" ? "" : v })}>
              <SelectTrigger id="curso-nivel" className="mt-1.5"><SelectValue placeholder="Não definido" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Não definido</SelectItem>
                {niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <EscolherCapa valor={capa} aoTrocar={setCapa} />
          </div>

          <Separator className="sm:col-span-2" />

          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conclusão do curso
            </p>
            <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                checked={form.exige_questionario}
                onChange={(e) => setForm({ ...form, exige_questionario: e.target.checked })} />
              Aplicar questionário ao concluir
            </label>

            {form.exige_questionario && (
              <div className="mb-1 flex items-center gap-2 pl-[1.625rem]">
                <Label htmlFor="curso-nota-minima" className="text-xs text-muted-foreground">Acerto mínimo</Label>
                <Input id="curso-nota-minima" type="number" min="1" max="100" className="h-9 w-20"
                  value={form.nota_minima}
                  onChange={(e) => setForm({ ...form, nota_minima: e.target.value })} />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}

            <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                checked={form.emite_certificado}
                onChange={(e) => setForm({ ...form, emite_certificado: e.target.checked })} />
              Emitir certificado na conclusão
            </label>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button className="w-full sm:w-auto" disabled={!form.titulo.trim() || gravar.isPending}
            onClick={() => gravar.mutate()}>
            {curso ? "Salvar alterações" : "Criar curso"}
          </Button>
        </DialogFooter>

        {curso?.exige_questionario && <Questionario cursoId={curso.id} />}
      </DialogContent>
    </Dialog>
  );
}

/** Perguntas de múltipla escolha do curso. */
function Questionario({ cursoId }: { cursoId: string }) {
  const qc = useQueryClient();
  const [enunciado, setEnunciado] = useState("");
  const [opcoes, setOpcoes] = useState(["", "", "", ""]);
  const [correta, setCorreta] = useState(0);

  const { data: perguntas } = useQuery({
    queryKey: ["perguntas", cursoId], queryFn: () => listarPerguntas(cursoId),
  });

  const atualizar = () => qc.invalidateQueries({ queryKey: ["perguntas", cursoId] });

  const gravar = useMutation({
    mutationFn: () =>
      salvarPergunta({
        curso_id: cursoId,
        enunciado: enunciado.trim(),
        opcoes: opcoes.map((o) => o.trim()).filter(Boolean),
        correta,
      }),
    onSuccess: () => {
      atualizar();
      setEnunciado(""); setOpcoes(["", "", "", ""]); setCorreta(0);
      toast.success("Pergunta adicionada");
    },
  });
  const apagar = useMutation({ mutationFn: removerPergunta, onSuccess: atualizar });

  const preenchidas = opcoes.filter((o) => o.trim()).length;
  const valido = enunciado.trim() && preenchidas >= 2 && correta < preenchidas;

  return (
    <section className="rounded-lg border bg-muted/50 p-4">
      <h3 className="font-display text-base font-semibold">Questionário</h3>
      <p className="mb-3 mt-0.5 text-xs leading-relaxed text-muted-foreground">
        Perguntas de múltipla escolha. Marque a alternativa correta no círculo à esquerda.
      </p>

      {(perguntas ?? []).length > 0 && (
        <ol className="divide-y rounded-lg border bg-card">
          {(perguntas ?? []).map((p, i) => (
            <li key={p.id} className="group px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-medium">{i + 1}. {p.enunciado}</p>
                <button type="button" onClick={() => apagar.mutate(p.id)}
                  title="Excluir pergunta" aria-label="Excluir pergunta"
                  className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,opacity] hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-1 space-y-1">
                {p.opcoes.map((o, j) => (
                  <li key={j} className={cn("flex items-start gap-1.5 text-xs",
                    j === p.correta ? "font-medium text-success" : "text-muted-foreground")}>
                    {j === p.correta
                      ? <Check className="mt-0.5 h-3 w-3 shrink-0" aria-label="Correta" />
                      : <span className="w-3 shrink-0" />}
                    <span className="min-w-0 break-words">{o}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {(perguntas ?? []).length === 0 && (
        <p className="rounded-md border border-warning/30 bg-warning/15 px-3 py-2 text-xs text-warning-strong">
          Nenhuma pergunta ainda. Sem pergunta cadastrada, o curso não pode ser concluído.
        </p>
      )}

      <div className="mt-3 space-y-2 rounded-lg border border-dashed bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova pergunta</p>
        <Input placeholder="Enunciado da pergunta" aria-label="Enunciado da pergunta" value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)} />
        {opcoes.map((o, i) => (
          <div key={i} className="flex items-center gap-1">
            <button type="button" onClick={() => setCorreta(i)}
              title="Marcar como correta"
              aria-label={`Marcar a alternativa ${i + 1} como correta`}
              aria-pressed={correta === i}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <span className={cn("h-4 w-4 rounded-full border-2 transition-colors",
                correta === i ? "border-success bg-success" : "border-muted-foreground/40")} />
            </button>
            <Input className="h-9" placeholder={`Alternativa ${i + 1}`} aria-label={`Alternativa ${i + 1}`} value={o}
              onChange={(e) => {
                const novas = [...opcoes];
                novas[i] = e.target.value;
                setOpcoes(novas);
              }} />
          </div>
        ))}
        <Button size="sm" className="h-9 w-full" disabled={!valido}
          onClick={() => gravar.mutate()}>
          <Plus /> Adicionar pergunta
        </Button>
      </div>
    </section>
  );
}
