import { FileQuestion } from "lucide-react";

/**
 * Mostrada nas seções que ainda trazem os números da ESEG escritos no código.
 *
 * Num projeto em branco, exibir aquele conteúdo seria pior do que não mostrar
 * nada: os dados apareceriam sob o nome de outro cliente, como se fossem dele.
 * Até a seção virar editável, ela avisa que ainda não tem dados deste cliente.
 */
export function SecaoSemDados({
  titulo,
  descricao,
  oQueEntraAqui,
}: {
  titulo: string;
  descricao?: string;
  oQueEntraAqui: string;
}) {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card/60 px-6 py-12 text-center">
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card shadow-card">
          <FileQuestion className="h-6 w-6 text-accent" />
        </span>
        <p className="max-w-md text-sm leading-relaxed text-foreground">
          Ainda não há dados deste cliente aqui. {oQueEntraAqui}
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          Esta seção ainda não é editável dentro da plataforma. Enquanto isso, ela fica
          vazia em vez de mostrar os números de outro cliente.
        </p>
      </div>
    </div>
  );
}
