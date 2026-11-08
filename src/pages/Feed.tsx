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

      <Card className="mb-5">
        <CardContent className="p-4 pt-4">
          <Textarea
            placeholder="Escreva um comunicado para o time…"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="min-h-[80px] resize-none border-0 bg-muted/40 focus-visible:ring-1"
          />
          {previa && (
            <div className="relative mt-3 inline-block">
              <img src={previa} alt="" className="max-h-48 rounded-md border" />
              <button type="button" title="Tirar a imagem" onClick={() => escolherImagem(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 shadow">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <Select value={tipo} onValueChange={(v) => setTipo(v as PostTipo)}>
              <SelectTrigger className="h-9 w-40">
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
              disabled={!conteudo.trim() || publicar.isPending}
              onClick={() => publicar.mutate()}
            >
              <Send /> {publicar.isPending ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <Card key={post.id} className={cn(post.fixado && "ring-1 ring-primary/30")}>
              <CardContent className="p-4 pt-4">
                <div className="mb-3 flex items-start gap-3">
                  <AvatarPessoa nome={nomeDe(post.autor_id)} foto={fotoDe(post.autor_id)}
                    className="h-9 w-9" classeIniciais="text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{nomeDe(post.autor_id)}</span>
                      <Badge variant="secondary" className="text-[9px]">{tipoLabels[post.tipo]}</Badge>
                      {post.fixado && (
                        <Badge variant="info" className="gap-1 text-[9px]">
                          <Pin className="h-2.5 w-2.5" /> Fixado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tempoRelativo(post.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {isGestor && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fixar.mutate(post.id)}>
                        <Pin className={cn("h-4 w-4", post.fixado && "text-primary")} />
                      </Button>
                    )}
                    {podeApagar && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => apagar.mutate(post.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.conteudo}</p>
                {post.imagem_url && (
                  <a href={post.imagem_url} target="_blank" rel="noreferrer" className="mt-3 block">
                    <img src={post.imagem_url} alt="" loading="lazy"
                      className="max-h-[28rem] w-full rounded-md border object-contain bg-muted/30" />
                  </a>
                )}

                <div className="mt-3 flex items-center gap-4 border-t pt-3">
                  <button
                    onClick={() => curtir.mutate(post.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      curtiu ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", curtiu && "fill-current")} />
                    {post.curtidas.length}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {post.comentarios.length}
                  </span>
                </div>

                {post.comentarios.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {post.comentarios.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <AvatarPessoa nome={nomeDe(c.autor_id)} foto={fotoDe(c.autor_id)}
                          className="h-6 w-6" classeIniciais="text-[8px]" />
                        <div className="min-w-0 flex-1 rounded-md bg-muted/40 px-3 py-1.5">
                          <span className="text-xs font-medium">{nomeDe(c.autor_id)}</span>
                          <p className="text-xs text-muted-foreground">{c.conteudo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const texto = (comentando[post.id] ?? "").trim();
                    if (!texto) return;
                    enviarComentario.mutate({ id: post.id, texto });
                    setComentando((c) => ({ ...c, [post.id]: "" }));
                  }}
                >
                  <Input
                    placeholder="Comentar…"
                    value={comentando[post.id] ?? ""}
                    onChange={(e) => setComentando((c) => ({ ...c, [post.id]: e.target.value }))}
                    className="h-9 text-xs"
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-9">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
