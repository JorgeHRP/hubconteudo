import { BookOpen } from "lucide-react";
import { ListaDocumentos } from "@/components/ListaDocumentos";

export default function ManualInterno() {
  return (
    <ListaDocumentos
      categoria="manual"
      icone={BookOpen}
      titulo="Manual Interno"
      subtitulo="Como a agência funciona: processos, rituais e combinados"
    />
  );
}
