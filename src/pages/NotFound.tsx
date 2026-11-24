import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/Marca";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-card text-center shadow-pop">
        <div className="assinatura-marca h-1" aria-hidden />
        <div className="px-8 py-12">
          <Marca altura={28} className="mx-auto" />
          <p className="mt-8 font-display text-6xl font-semibold tracking-tight text-primary">404</p>
          <h1 className="mt-3 text-lg font-semibold">Esta página não existe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O endereço pode ter mudado ou sido digitado errado.
          </p>
          <Button asChild className="mt-8">
            <Link to="/"><ArrowLeft /> Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
