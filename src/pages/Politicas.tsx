import { Shield } from "lucide-react";
import { ListaDocumentos } from "@/components/ListaDocumentos";

export default function Politicas() {
  return (
    <ListaDocumentos
      categoria="politica"
      icone={Shield}
      titulo="Políticas"
      subtitulo="Normas internas e código de conduta"
    />
  );
}
