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
    <Card className="border-dashed bg-card/60 shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card shadow-card">
          <Icone className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="font-display text-base font-semibold">{titulo}</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{descricao}</p>
        </div>
        {acao}
      </CardContent>
    </Card>
  );
}
