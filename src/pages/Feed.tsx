import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Newspaper, Heart, ImagePlus, MessageCircle, Pin, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  alternarCurtida, alternarFixado, comentar, criarPost, listarPosts, listarProfiles,
  podeAnexarImagemPost, removerPost,
} from "@/data/store";
import { AvatarPessoa } from "@/components/AvatarPessoa";
import type { PostTipo } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const tipoLabels: Record<PostTipo, string> = {
  comunicado: "Comunicado",
  evento: "Evento",
  novidade: "Novidade",
  geral: "Geral",
};

/** Tom do selo por tipo de publicação (só aparência). */
const tipoVariantes: Record<PostTipo, "info" | "warning" | "success" | "secondary"> = {
  comunicado: "info",
  evento: "warning",
  novidade: "success",
  geral: "secondary",
};

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export default function Feed() {
  const { userId, isGestor } = useAuth();
  const qc = useQueryClient();
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState<PostTipo>("geral");
  const [imagem, setImagem] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const imagemRef = useRef<HTMLInputElement>(null);
  const comImagem = podeAnexarImagemPost();

  function escolherImagem(f: File | null) {
    if (previa) URL.revokeObjectURL(previa);
    if (f && !f.type.startsWith("image/")) { toast.error("Escolha uma imagem."); f = null; }
    if (f && f.size > 10 * 1024 * 1024) { toast.error("A imagem passa de 10 MB."); f = null; }
    setImagem(f);
    setPrevia(f ? URL.createObjectURL(f) : null);
  }
  const [comentando, setComentando] = useState<Record<string, string>>({});

  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: listarPosts });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["posts"] });

  const publicar = useMutation({
    mutationFn: () => criarPost(userId!, conteudo.trim(), tipo, imagem),
    onSuccess: () => {
      setConteudo("");
      setTipo("geral");
      escolherImagem(null);
      invalidar();
      toast.success("Publicado no mural");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const curtir = useMutation({ mutationFn: (id: string) => alternarCurtida(id, userId!), onSuccess: invalidar });
  const fixar = useMutation({
    mutationFn: (id: string) => alternarFixado(id),
    onSuccess: () => { invalidar(); toast.success("Aviso atualizado"); },
  });
  const apagar = useMutation({
    mutationFn: (id: string) => removerPost(id),
    onSuccess: () => { invalidar(); toast.success("Publicação removida"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const enviarComentario = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => comentar(id, userId!, texto),
    onSuccess: invalidar,
  });

  const nomeDe = (id: string) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";
  const fotoDe = (id: string) => profiles?.find((p) => p.user_id === id)?.foto_url ?? null;

  return (
    <div className="animate-fade-in">
      <PageHeader icone={Newspaper} titulo="Feed / Mural" subtitulo="Comunicação interna da agência" />

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nova publicação
            </p>
            <Textarea
              aria-label="Nova publicação"
              placeholder="Escreva um comunicado para o time…"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="min-h-[88px] resize-none"
            />
            {previa && (
              <div className="relative mt-3 inline-block">
                <img src={previa} alt="" className="max-h-48 rounded-md border" />
                <button type="button" title="Tirar a imagem" aria-label="Tirar a imagem"
                  onClick={() => escolherImagem(null)}
                  className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-card transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/50 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={tipo} onValueChange={(v) => setTipo(v as PostTipo)}>
                <SelectTrigger className="h-9 w-40 bg-card" aria-label="Tipo da publicação">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {comImagem && (
                <>
                  <Button type="button" variant="ghost" size="sm" className="h-9"
                    title="Anexar imagem (até 10 MB)" onClick={() => imagemRef.current?.click()}>
                    <ImagePlus /> Imagem
                  </Button>
                  <input ref={imagemRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { escolherImagem(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                </>
              )}
            </div>
            <Button
              size="sm"
              className="ml-auto"
              disabled={!conteudo.trim() || publicar.isPending}
              onClick={() => publicar.mutate()}
            >
              <Send /> {publicar.isPending ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!posts && <EsqueletoLista linhas={3} />}

      {posts?.length === 0 && (
        <EstadoVazio
          icone={Newspaper}
          titulo="O mural está vazio"
          descricao="Publique o primeiro comunicado para o time. Avisos podem ser fixados no topo e aparecem também na tela inicial."
        />
      )}

      <div className="space-y-4">
        {posts?.map((post) => {
          const curtiu = userId ? post.curtidas.includes(userId) : false;
          const podeApagar = isGestor || post.autor_id === userId;
          return (
            <Card key={post.id} className={cn("overflow-hidden", post.fixado && "border-primary/30")}>
              <CardContent className="p-0">
                <div className="p-4 sm:p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <AvatarPessoa nome={nomeDe(post.autor_id)} foto={fotoDe(post.autor_id)}
                      className="h-10 w-10" classeIniciais="text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-semibold">{nomeDe(post.autor_id)}</span>
                        <Badge variant={tipoVariantes[post.tipo]}>{tipoLabels[post.tipo]}</Badge>
                        {post.fixado && (
                          <Badge variant="outline" className="gap-1">
                            <Pin className="h-3 w-3 text-accent" aria-hidden /> Fixado
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{tempoRelativo(post.created_at)}</p>
                    </div>
                    <div className="-mr-1.5 -mt-1.5 flex shrink-0">
                      {isGestor && (
                        <Button variant="ghost" size="icon" className="h-9 w-9"
                          title={post.fixado ? "Desafixar aviso" : "Fixar aviso"}
                          aria-label={post.fixado ? "Desafixar aviso" : "Fixar aviso"}
                          aria-pressed={post.fixado}
                          onClick={() => fixar.mutate(post.id)}>
                          <Pin className={cn("h-4 w-4", post.fixado ? "text-accent" : "text-muted-foreground")} />
                        </Button>
                      )}
                      {podeApagar && (
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Remover publicação" aria-label="Remover publicação"
                          onClick={() => apagar.mutate(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{post.conteudo}</p>
                  {post.imagem_url && (
                    <a href={post.imagem_url} target="_blank" rel="noreferrer"
                      aria-label="Abrir imagem em nova aba"
                      className="mt-3 block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      <img src={post.imagem_url} alt="" loading="lazy"
                        className="max-h-[28rem] w-full rounded-md border bg-muted/50 object-contain" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 border-t px-2.5 py-1.5 sm:px-3.5">
                  <button
                    type="button"
                    aria-pressed={curtiu}
                    aria-label={curtiu ? "Descurtir publicação" : "Curtir publicação"}
                    onClick={() => curtir.mutate(post.id)}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      curtiu ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", curtiu && "fill-current")} aria-hidden />
                    {post.curtidas.length}
                  </button>
                  <span className="flex h-9 items-center gap-1.5 px-2 text-xs font-medium tabular-nums text-muted-foreground">
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {post.comentarios.length}
                    <span className="sr-only">comentários</span>
                  </span>
                </div>

                <div className="space-y-3 border-t bg-muted/50 px-4 py-3 sm:px-5">
                  {post.comentarios.length > 0 && (
                    <ul className="space-y-3">
                      {post.comentarios.map((c) => (
                        <li key={c.id} className="flex gap-2.5">
                          <AvatarPessoa nome={nomeDe(c.autor_id)} foto={fotoDe(c.autor_id)}
                            className="h-7 w-7" classeIniciais="text-xs" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold">{nomeDe(c.autor_id)}</p>
                            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                              {c.conteudo}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const texto = (comentando[post.id] ?? "").trim();
                      if (!texto) return;
                      enviarComentario.mutate({ id: post.id, texto });
                      setComentando((c) => ({ ...c, [post.id]: "" }));
                    }}
                  >
                    <Input
                      aria-label="Escrever comentário"
                      placeholder="Comentar…"
                      value={comentando[post.id] ?? ""}
                      onChange={(e) => setComentando((c) => ({ ...c, [post.id]: e.target.value }))}
                      className="h-9 bg-card text-sm"
                    />
                    <Button type="submit" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                      title="Enviar comentário" aria-label="Enviar comentário">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
