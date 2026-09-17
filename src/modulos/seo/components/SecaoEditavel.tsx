import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Check, X, Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Casca de edição das seções do painel de SEO.
 *
 * As telas nasceram com o conteúdo da ESEG escrito no código. Aqui elas ganham
 * um botão de editar sem cada uma ter que refazer o mesmo controle de estado,
 * salvar, cancelar e voltar ao original.
 */
export function SecaoEditavel<T>({
  titulo,
  descricao,
  conteudo,
  aoSalvar,
  aoRestaurar,
  editando,
  setEditando,
  children,
  editor,
  salvando,
}: {
  titulo: string;
  descricao?: string;
  conteudo: T;
  aoSalvar: (novo: T) => Promise<boolean> | Promise<unknown>;
  /** Volta ao conteúdo de origem — modelo da ESEG ou estrutura vazia. */
  aoRestaurar?: () => void;
  editando: boolean;
  setEditando: (v: boolean) => void;
  children: ReactNode;
  editor: (rascunho: T, setRascunho: (v: T) => void) => ReactNode;
  salvando?: boolean;
}) {
  const [rascunho, setRascunho] = useState<T>(conteudo);

  // Entrar em edição sempre parte do que está na tela agora.
  useEffect(() => {
    if (editando) setRascunho(conteudo);
  }, [editando, conteudo]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="gradient-text text-2xl font-bold">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          {editando ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditando(false)}>
                <X /> Cancelar
              </Button>
              <Button size="sm" disabled={salvando}
                onClick={async () => {
                  await aoSalvar(rascunho);
                  setEditando(false);
                  toast.success("Seção salva");
                }}>
                <Check /> Salvar
              </Button>
            </>
          ) : (
            <>
              {aoRestaurar && (
                <Button variant="ghost" size="sm" title="Voltar ao conteúdo de origem"
                  onClick={aoRestaurar}>
                  <RotateCcw /> Restaurar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
                <Pencil /> Editar
              </Button>
            </>
          )}
        </div>
      </div>

      {editando ? editor(rascunho, setRascunho) : children}
    </div>
  );
}

/** Lista de itens em edição: adicionar, remover e reordenar. */
export function ListaEditavel<T>({
  itens,
  aoTrocar,
  novoItem,
  linha,
  rotuloNovo = "Adicionar item",
}: {
  itens: T[];
  aoTrocar: (novos: T[]) => void;
  novoItem: () => T;
  linha: (item: T, aoMudar: (novo: T) => void) => ReactNode;
  rotuloNovo?: string;
}) {
  return (
    <div className="space-y-2">
      {itens.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
          <div className="min-w-0 flex-1">
            {linha(item, (novo) => {
              const copia = [...itens];
              copia[i] = novo;
              aoTrocar(copia);
            })}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => aoTrocar(itens.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => aoTrocar([...itens, novoItem()])}>
        <Plus /> {rotuloNovo}
      </Button>

      {itens.length === 0 && (
        <p className="pt-1 text-xs text-muted-foreground">
          Nenhum item. Use o botão acima para começar.
        </p>
      )}
    </div>
  );
}
