import { getInitials } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** Foto da pessoa; sem foto (ou enquanto carrega), as iniciais. */
export function AvatarPessoa({
  nome, foto, className, classeIniciais,
}: {
  nome: string;
  foto?: string | null;
  className?: string;
  classeIniciais?: string;
}) {
  return (
    <Avatar className={className}>
      {foto && <AvatarImage src={foto} alt={nome} />}
      <AvatarFallback className={classeIniciais}>{getInitials(nome || "?")}</AvatarFallback>
    </Avatar>
  );
}
