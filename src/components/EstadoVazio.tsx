import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
  acao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <Card className="border border-dashed bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icone className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{titulo}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>
        </div>
        {acao}
      </CardContent>
    </Card>
  );
}
