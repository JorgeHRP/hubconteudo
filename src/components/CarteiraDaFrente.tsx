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
import { EsqueletoTabela } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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
  const { userId, temModulo } = useAuth();
  // A ficha do cliente fica no Painel de CS. Quem não tem esse painel seria
  // devolvido ao início sem explicação; para essa pessoa, o link não aparece.
  const abreFicha = temModulo("cs");
  const destinoDo = (id: string) => (destino ? destino(id) : abreFicha ? `/cs/${id}` : null);
  const qc = useQueryClient();
  const [encerrando, setEncerrando] = useState<string | null>(null);

  const { data: empresas, isLoading: carregando } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
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
    onError: (e: Error) => { setEncerrando(null); toast.error(e.message); },
  });

  const lista = empresas ?? [];
  const daFrente = (id: string) =>
    (projetos ?? []).find((p) => p.empresa_id === id && p.tipo === tipo);

  const com = lista.filter((e) => daFrente(e.id));
  const sem = lista.filter((e) => !daFrente(e.id));
  const nomeDe = (id: string | null) =>
    profiles?.find((p) => p.user_id === id)?.nome ?? "sem responsável";

  if (carregando) {
    return (
      <div role="status" aria-label="Carregando clientes">
        <EsqueletoTabela linhas={4} />
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <EstadoVazio
        icone={Building2}
        titulo="Nenhum cliente cadastrado"
        descricao="Os clientes são cadastrados no Painel de CS. Assim que a primeira empresa entrar, ela aparece aqui para receber o projeto."
        acao={abreFicha
          ? <Button asChild><Link to="/cs">Ir para o Painel de CS <ArrowRight /></Link></Button>
          : undefined}
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
          <Card className="overflow-hidden">
            <Table className="min-w-[44rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Cliente</TableHead>
                  <TableHead>Saúde</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="pr-4 text-right"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {com.map((e) => {
                  const p = daFrente(e.id)!;
                  const abrir = destinoDo(e.id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="max-w-[18rem] pl-4">
                        {abreFicha ? (
                          <Link to={`/cs/${e.id}`}
                            className="block truncate rounded-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                            {e.nome_fantasia}
                          </Link>
                        ) : (
                          <p className="truncate font-medium">{e.nome_fantasia}</p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {e.segmento ?? statusEmpresaLabels[e.status]}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={flagBadgeVariant[p.flag]} className="whitespace-nowrap">
                          {flagLabels[p.flag]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                        {nomeDe(p.responsavel_id)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {p.inicio ? formatDate(p.inicio) : "—"}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          {encerrando === e.id ? (
                            <>
                              <span className="text-xs text-muted-foreground">Encerrar?</span>
                              <Button variant="destructive" size="sm" className="px-3 text-xs"
                                onClick={() => encerrar.mutate(e.id)}>
                                Sim
                              </Button>
                              <Button variant="ghost" size="sm" className="px-3 text-xs"
                                onClick={() => setEncerrando(null)}>
                                Não
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="sm"
                              className="px-2 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => setEncerrando(e.id)}>
                              <XCircle /> Encerrar
                            </Button>
                          )}

                          {abrir && (
                            <Button asChild variant="ghost" size="sm" className="px-2 text-xs">
                              <Link to={abrir}>
                                Abrir <ArrowRight />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {sem.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Clientes sem projeto de {tipoProjetoLabels[tipo]}
          </p>
          <Card className="overflow-hidden">
            <ul className="divide-y">
              {sem.map((e) => (
                <li key={e.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium">{e.nome_fantasia}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[e.segmento, e.cidade].filter(Boolean).join(" · ") || e.razao_social}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={lancar.isPending}
                    className="h-auto min-h-9 max-w-full whitespace-normal py-1.5 text-left"
                    onClick={() => lancar.mutate(e.id)}>
                    <Plus /> Lançar projeto de {tipoProjetoLabels[tipo]}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
