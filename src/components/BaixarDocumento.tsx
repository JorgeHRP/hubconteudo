import {
  Download, File, FileArchive, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { abrirDocumento } from "@/data/store";
import type { Documento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Aparência por tipo de arquivo: ícone, tom do quadrado e rótulo curto. */
const TIPOS_ARQUIVO: { extensoes: string[]; icone: LucideIcon; tom: string; rotulo: string }[] = [
  { extensoes: ["pdf"], icone: FileText, tom: "bg-destructive/10 text-destructive", rotulo: "PDF" },
  { extensoes: ["doc", "docx", "odt", "rtf", "txt", "md"], icone: FileText, tom: "bg-info/10 text-info", rotulo: "Texto" },
  { extensoes: ["xls", "xlsx", "csv", "ods"], icone: FileSpreadsheet, tom: "bg-success/10 text-success", rotulo: "Planilha" },
  { extensoes: ["ppt", "pptx", "odp", "key"], icone: Presentation, tom: "bg-warning/15 text-warning-strong", rotulo: "Apresentação" },
  { extensoes: ["png", "jpg", "jpeg", "gif", "webp", "svg", "ai", "psd", "eps"], icone: FileImage, tom: "bg-accent/10 text-accent", rotulo: "Imagem" },
  { extensoes: ["mp4", "mov", "avi", "webm"], icone: FileVideo, tom: "bg-accent/10 text-accent", rotulo: "Vídeo" },
  { extensoes: ["zip", "rar", "7z"], icone: FileArchive, tom: "bg-muted text-muted-foreground", rotulo: "Compactado" },
];

/** Deduz o tipo pela extensão do nome (ou do endereço) que o documento já traz. */
function tipoDoArquivo(doc: Documento) {
  const origem = (doc.arquivo_nome ?? doc.arquivo_url ?? "").split(/[?#]/)[0];
  const extensao = origem.includes(".") ? origem.slice(origem.lastIndexOf(".") + 1).toLowerCase() : "";
  return (
    TIPOS_ARQUIVO.find((t) => t.extensoes.includes(extensao)) ??
    { icone: File, tom: "bg-primary/10 text-primary", rotulo: "Arquivo" }
  );
}

/** Quadrado suave com o ícone do tipo de arquivo. */
export function IconeDocumento({ doc, className }: { doc: Documento; className?: string }) {
  const { icone: Icone, tom, rotulo } = tipoDoArquivo(doc);
  return (
    <span
      title={rotulo}
      className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", tom, className)}
    >
      <Icone className="h-5 w-5" aria-hidden />
      <span className="sr-only">{rotulo}</span>
    </span>
  );
}

/** Baixa o arquivo do documento. Sem arquivo anexado, o botão fica apagado. */
export function BaixarDocumento({ doc, className }: { doc: Documento; className?: string }) {
  const tem = Boolean(doc.arquivo_url);
  const rotulo = tem ? `Baixar ${doc.arquivo_nome ?? "arquivo"}` : "Sem arquivo anexado";
  return (
    <Button
      variant="outline" size="icon"
      className={cn("h-9 w-9 shrink-0 text-primary hover:text-accent", className)}
      disabled={!tem}
      title={rotulo}
      aria-label={rotulo}
      onClick={() => abrirDocumento(doc).catch((e) => toast.error((e as Error).message))}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
