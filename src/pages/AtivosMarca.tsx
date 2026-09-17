import { Palette } from "lucide-react";
import { ListaDocumentos } from "@/components/ListaDocumentos";

export default function AtivosMarca() {
  return (
    <ListaDocumentos
      categoria="ativo_marca"
      icone={Palette}
      titulo="Ativos da Marca"
      subtitulo="Logos, brandbook e templates oficiais"
    />
  );
}
