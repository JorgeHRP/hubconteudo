import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRight, Building2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  encerrarFrente, lancarFrente, listarEmpresas, listarProfiles, listarProjetos,
} from "@/data/store";
import { statusEmpresaLabels, tipoProjetoLabels } from "@/lib/labels-clientes";
import { flagBadgeVariant, flagLabels, formatDate } from "@/lib/cs-data";
import type { TipoProjeto } from "@/lib/types";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Carteira de uma frente: quem já tem o projeto e quem ainda não tem, com o
 * botão de lançar. Lançar cria o `Projeto`, que é o que faz a frente aparecer
 * em "Projetos por frente" na ficha do cliente no Painel de CS.
 */
export function CarteiraDaFrente({
  tipo,
  destino,
  esconderComProjeto,
}: {
  tipo: TipoProjeto;
  /** Para onde o botão "Abrir" leva. Sem isso, o cartão não tem link próprio. */
  destino?: (empresaId: string) => string;
  /**
   * Some com a seção de quem já tem a frente. Serve para o inbound, que mostra
   * esses clientes acima com o consumo do mês — repetir aqui seria ruído.
   */
  esconderComProjeto?: boolean;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [encerrando, setEncerrando] = useState<string | null>(null);

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetos"], queryFn: listarProjetos });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["projetos"] });
    qc.invalidateQueries({ queryKey: ["empresas"] });
    qc.invalidateQueries({ queryKey: ["clientes-inbound"] });
    qc.invalidateQueries({ queryKey: ["oportunidades"] });
  };

  const lancar = useMutation({
    mutationFn: (empresaId: string) => lancarFrente(empresaId, tipo, userId),
    onSuccess: () => {
      recarregar();
      toast.success(`Projeto lançado. A frente já aparece na ficha do cliente no Painel de CS.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encerrar = useMutation({
    mutationFn: (empresaId: string) => encerrarFrente(empresaId, tipo),
    onSuccess: () => { recarregar(); setEncerrando(null); toast.success("Projeto encerrado"); },
  });

  const lista = empresas ?? [];
  const daFrente = (id: string) =>
    (projetos ?? []).find((p) => p.empresa_id === id && p.tipo === tipo);

  const com = lista.filter((e) => daFrente(e.id));
  const sem = lista.filter((e) => !daFrente(e.id));
  const nomeDe = (id: string | null) =>
    profiles?.find((p) => p.user_id === id)?.nome ?? "sem responsável";

  if (lista.length === 0) {
    return (
      <EstadoVazio
        icone={Building2}
        titulo="Nenhum cliente cadastrado"
        descricao="Os clientes são cadastrados no Painel de CS. Assim que a primeira empresa entrar, ela aparece aqui para receber o projeto."
        acao={<Button asChild><Link to="/cs">Ir para o Painel de CS <ArrowRight /></Link></Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      {com.length > 0 && !esconderComProjeto && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clientes com {tipoProjetoLabels[tipo]}
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {com.map((e) => {
              const p = daFrente(e.id)!;
              return (
                <Card key={e.id}>
                  <CardContent className="p-4 pt-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/cs/${e.id}`} className="truncate font-medium hover:text-primary">
                          {e.nome_fantasia}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.segmento ?? statusEmpresaLabels[e.status]}
                        </p>
                      </div>
                      <Badge variant={flagBadgeVariant[p.flag]} className="shrink-0 text-[9px]">
                        {flagLabels[p.flag]}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {nomeDe(p.responsavel_id)}
                      {p.inicio && ` · desde ${formatDate(p.inicio)}`}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      {encerrando === e.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">Encerrar?</span>
                          <Button variant="destructive" size="sm" className="h-6 px-2 text-[10px]"
                            onClick={() => encerrar.mutate(e.id)}>
                            Sim
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                            onClick={() => setEncerrando(null)}>
                            Não
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-muted-foreground"
                          onClick={() => setEncerrando(e.id)}>
                          <XCircle className="h-3.5 w-3.5" /> Encerrar
                        </Button>
                      )}

                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link to={destino ? destino(e.id) : `/cs/${e.id}`}>
                          Abrir <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {sem.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clientes sem projeto de {tipoProjetoLabels[tipo]}
          </p>
          <div className="space-y-2">
            {sem.map((e) => (
              <Card key={e.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 pt-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.nome_fantasia}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[e.segmento, e.cidade].filter(Boolean).join(" · ") || e.razao_social}
                    </p>
                  </div>
                  <Button size="sm" disabled={lancar.isPending}
                    onClick={() => lancar.mutate(e.id)}>
                    <Plus /> Lançar projeto de {tipoProjetoLabels[tipo]}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
