import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { enviarCapa, limiteCapa, salvarTrilha } from "@/data/store";
import type { Trilha } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/** Escolha de capa: arquivo do computador ou endereço de uma imagem na web. */
export function EscolherCapa({
  valor,
  aoTrocar,
}: {
  valor: string | null;
  aoTrocar: (capa: string | null) => void;
}) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const limite = limiteCapa();
  const limiteLegivel = limite >= 1024 * 1024 ? `${limite / 1024 / 1024} MB` : `${limite / 1024} KB`;

  const ler = async (f: File) => {
    setEnviando(true);
    try {
      aoTrocar(await enviarCapa(f));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <Label>Foto de capa</Label>
      {valor ? (
        <div className="relative mt-1.5 aspect-video max-h-48 w-full overflow-hidden rounded-lg border bg-muted">
          <img src={valor} alt="Capa" className="h-full w-full object-cover" />
          <button type="button" onClick={() => aoTrocar(null)}
            title="Remover capa" aria-label="Remover capa"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-card transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => arquivo.current?.click()} disabled={enviando}
          className="mt-1.5 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60">
          <ImagePlus className="h-5 w-5 text-accent" aria-hidden />
          <span className="px-3 text-center text-sm">{enviando ? "Enviando…" : `Escolher imagem (até ${limiteLegivel})`}</span>
        </button>
      )}
      <input ref={arquivo} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ler(f);
          e.target.value = "";
        }} />
      <Input
        className="mt-2"
        placeholder="ou cole o endereço de uma imagem"
        aria-label="Endereço de uma imagem na web"
        value={valor?.startsWith("data:") ? "" : valor ?? ""}
        onChange={(e) => aoTrocar(e.target.value || null)}
      />
    </div>
  );
}

export function TrilhaDialog({ trilha, gatilho }: { trilha?: Trilha; gatilho?: ReactNode }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capa, setCapa] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setTitulo(trilha?.titulo ?? "");
    setDescricao(trilha?.descricao ?? "");
    setCapa(trilha?.capa ?? null);
  }, [aberto, trilha]);

  const gravar = useMutation({
    mutationFn: () =>
      salvarTrilha({
        id: trilha?.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        capa,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trilhas"] });
      setAberto(false);
      toast.success(trilha ? "Trilha atualizada" : "Trilha criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {gatilho ?? <Button size="sm"><Plus /> Nova trilha</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trilha ? "Editar trilha" : "Nova trilha de conhecimento"}</DialogTitle>
          <DialogDescription>
            Uma trilha reúne cursos numa ordem. Quem faz todos recebe o certificado de cada um.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="trilha-titulo">Título *</Label>
            <Input id="trilha-titulo" className="mt-1.5" value={titulo} placeholder="Fundamentos de Inbound"
              onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="trilha-descricao">Descrição</Label>
            <Textarea id="trilha-descricao" className="mt-1.5" rows={3} value={descricao}
              placeholder="Para quem é a trilha e o que a pessoa vai saber ao final."
              onChange={(e) => setDescricao(e.target.value)} />
          </div>

          <EscolherCapa valor={capa} aoTrocar={setCapa} />
        </div>

        <DialogFooter className="border-t pt-4">
          <Button className="w-full sm:w-auto" disabled={!titulo.trim() || gravar.isPending}
            onClick={() => gravar.mutate()}>
            {trilha ? "Salvar alterações" : "Criar trilha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
