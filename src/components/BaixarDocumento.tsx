import { Download } from "lucide-react";
import { toast } from "sonner";
import { abrirDocumento } from "@/data/store";
import type { Documento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Baixa o arquivo do documento. Sem arquivo anexado, o botão fica apagado. */
export function BaixarDocumento({ doc, className }: { doc: Documento; className?: string }) {
  const tem = Boolean(doc.arquivo_url);
  return (
    <Button
      variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", className)}
      disabled={!tem}
      title={tem ? `Baixar ${doc.arquivo_nome ?? "arquivo"}` : "Sem arquivo anexado"}
      onClick={() => abrirDocumento(doc).catch((e) => toast.error((e as Error).message))}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
