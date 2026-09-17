import { FolderOpen } from "lucide-react";
import { ListaDocumentos } from "@/components/ListaDocumentos";

export default function Repositorios() {
  return (
    <ListaDocumentos
      categoria="repositorio"
      icone={FolderOpen}
      titulo="Repositórios"
      subtitulo="Playbooks, modelos e materiais de apoio"
    />
  );
}
