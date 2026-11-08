import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarDocumento, listarDocumentos, podeEnviarDocumento, removerDocumento } from "@/data/store";
import { DOCUMENTO_ACEITA, DOCUMENTO_MAX_BYTES } from "@/integrations/supabase/documentos";
import { BaixarDocumento } from "@/components/BaixarDocumento";
import type { DocumentoCategoria } from "@/lib/types";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function ListaDocumentos({
  categoria,
  icone,
  titulo,
  subtitulo,
}: {
  categoria: DocumentoCategoria;
  icone: LucideIcon;
  titulo: string;
  subtitulo: string;
}) {
  const { userId, isGestor } = useAuth();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const comUpload = podeEnviarDocumento();
  const [form, setForm] = useState({ nome: "", descricao: "", arquivo_nome: "" });

  const { data: documentos } = useQuery({ queryKey: ["documentos"], queryFn: listarDocumentos });
  const invalidar = () => qc.invalidateQueries({ queryKey: ["documentos"] });

  const publicar = useMutation({
    mutationFn: () =>
      criarDocumento({
        user_id: null, nome: form.nome.trim(), descricao: form.descricao.trim() || null,
        competencia: null,
        categoria, arquivo_url: null, arquivo_nome: form.arquivo_nome.trim() || null,
        uploaded_by: userId,
      }, arquivo),
    onSuccess: () => {
      setAberto(false);
      setForm({ nome: "", descricao: "", arquivo_nome: "" });
      setArquivo(null);
      invalidar();
      toast.success("Documento publicado");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const apagar = useMutation({
    mutationFn: (id: string) => removerDocumento(id),
    onSuccess: () => { invalidar(); toast.success("Documento removido"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const itens = (documentos ?? [])
    .filter((d) => d.categoria === categoria && d.user_id === null)
    .filter((d) =>
      d.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (d.descricao ?? "").toLowerCase().includes(busca.toLowerCase())
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={icone}
        titulo={titulo}
        subtitulo={subtitulo}
        acao={
          isGestor && (
            <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) setArquivo(null); }}>
              <DialogTrigger asChild>
                <Button><Plus /> Publicar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publicar documento</DialogTitle>
                  <DialogDescription>
                    Fica visível para todos os colaboradores.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="doc-nome">Nome</Label>
                    <Input id="doc-nome" className="mt-1.5" value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="doc-desc">Descrição</Label>
                    <Textarea id="doc-desc" className="mt-1.5" value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="doc-arq">Arquivo</Label>
                    {comUpload ? (
                      <>
                        <Input id="doc-arq" type="file" className="mt-1.5" accept={DOCUMENTO_ACEITA}
                          key={aberto ? "aberto" : "fechado"}
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            if (f && f.size > DOCUMENTO_MAX_BYTES) {
                              toast.error("O arquivo passa de 20 MB.");
                              e.target.value = "";
                              setArquivo(null);
                              return;
                            }
                            setArquivo(f);
                          }} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Até 20 MB. Todos os colaboradores conseguem baixar.
                        </p>
                      </>
                    ) : (
                      <>
                        <Input id="doc-arq" className="mt-1.5" placeholder="manual.pdf" value={form.arquivo_nome}
                          onChange={(e) => setForm({ ...form, arquivo_nome: e.target.value })} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          No modo de demonstração fica só o nome do arquivo.
                        </p>
                      </>
                    )}
                  </div>
                  <Button className="w-full"
                    disabled={!form.nome.trim() || (comUpload && !arquivo) || publicar.isPending}
                    onClick={() => publicar.mutate()}>
                    {publicar.isPending ? "Publicando…" : "Publicar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex gap-3 p-4 pt-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.nome}</p>
                {d.descricao && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{d.descricao}</p>
                )}
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {d.arquivo_nome ?? "—"} · {formatDate(d.created_at.slice(0, 10))}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <BaixarDocumento doc={d} className="h-7 w-7" />
                {isGestor && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Remover"
                    disabled={apagar.isPending} onClick={() => apagar.mutate(d.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {itens.length === 0 && (
        <EstadoVazio
          icone={icone}
          titulo={busca ? "Nada encontrado" : `Nenhum item em ${titulo}`}
          descricao={
            busca
              ? "Tente outro termo de busca."
              : "Publique o primeiro documento. Ele fica visível para todos os colaboradores."
          }
        />
      )}
    </div>
  );
}
