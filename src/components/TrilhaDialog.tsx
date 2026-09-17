import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { salvarTrilha } from "@/data/store";
import type { Trilha } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/** Capa é imagem no navegador: acima disso o localStorage estoura. */
const LIMITE_CAPA = 300 * 1024;

/** Escolha de capa: arquivo do computador ou endereço de uma imagem na web. */
export function EscolherCapa({
  valor,
  aoTrocar,
}: {
  valor: string | null;
  aoTrocar: (capa: string | null) => void;
}) {
  const arquivo = useRef<HTMLInputElement>(null);

  const ler = (f: File) => {
    if (f.size > LIMITE_CAPA) {
      toast.error(`A imagem tem ${Math.round(f.size / 1024)} KB. O limite é 300 KB.`);
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => aoTrocar(String(leitor.result));
    leitor.onerror = () => toast.error("Não foi possível ler a imagem.");
    leitor.readAsDataURL(f);
  };

  return (
    <div>
      <Label className="text-xs">Foto de capa</Label>
      {valor ? (
        <div className="relative mt-1.5 overflow-hidden rounded-lg border">
          <img src={valor} alt="Capa" className="h-32 w-full object-cover" />
          <button type="button" onClick={() => aoTrocar(null)}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => arquivo.current?.click()}
          className="mt-1.5 flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted/50">
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs">Escolher imagem (até 300 KB)</span>
        </button>
      )}
      <input ref={arquivo} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ler(f);
          e.target.value = "";
        }} />
      <Input
        className="mt-2 h-8 text-xs"
        placeholder="ou cole o endereço de uma imagem"
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

        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input className="mt-1.5" value={titulo} placeholder="Fundamentos de Inbound"
              onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea className="mt-1.5" value={descricao}
              placeholder="Para quem é a trilha e o que a pessoa vai saber ao final."
              onChange={(e) => setDescricao(e.target.value)} />
          </div>

          <EscolherCapa valor={capa} aoTrocar={setCapa} />

          <Button className="w-full" disabled={!titulo.trim() || gravar.isPending}
            onClick={() => gravar.mutate()}>
            {trilha ? "Salvar alterações" : "Criar trilha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
