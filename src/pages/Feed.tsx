import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Newspaper, Heart, MessageCircle, Pin, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  alternarCurtida, alternarFixado, comentar, criarPost, listarPosts, listarProfiles, removerPost,
} from "@/data/store";
import { getInitials } from "@/lib/mock-data";
import type { PostTipo } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [comentando, setComentando] = useState<Record<string, string>>({});

  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: listarPosts });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["posts"] });

  const publicar = useMutation({
    mutationFn: () => criarPost(userId!, conteudo.trim(), tipo),
    onSuccess: () => {
      setConteudo("");
      setTipo("geral");
      invalidar();
      toast.success("Publicado no mural");
    },
  });

  const curtir = useMutation({ mutationFn: (id: string) => alternarCurtida(id, userId!), onSuccess: invalidar });
  const fixar = useMutation({
    mutationFn: (id: string) => alternarFixado(id),
    onSuccess: () => { invalidar(); toast.success("Aviso atualizado"); },
  });
  const apagar = useMutation({
    mutationFn: (id: string) => removerPost(id),
    onSuccess: () => { invalidar(); toast.success("Publicação removida"); },
  });
  const enviarComentario = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => comentar(id, userId!, texto),
    onSuccess: invalidar,
  });

  const nomeDe = (id: string) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";

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
          <div className="mt-3 flex items-center justify-between gap-2">
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
            <Button
              size="sm"
              disabled={!conteudo.trim() || publicar.isPending}
              onClick={() => publicar.mutate()}
            >
              <Send /> Publicar
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
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[10px]">{getInitials(nomeDe(post.autor_id))}</AvatarFallback>
                  </Avatar>
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
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[8px]">{getInitials(nomeDe(c.autor_id))}</AvatarFallback>
                        </Avatar>
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
