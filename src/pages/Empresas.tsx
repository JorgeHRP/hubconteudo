import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Search, Pencil, Trash2, ArrowRight, MapPin, Globe, Users,
  UsersRound, Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  listarContatosTodos, listarEmpresas, listarProfiles, listarProjetos,
  listarTodasAlocacoes, removerEmpresa,
} from "@/data/store";
import {
  funcaoEquipeLabels, statusEmpresaLabels, statusEmpresaVariant,
  tipoProjetoLabels, tipoProjetoTom,
} from "@/lib/labels-clientes";
import { formatDate } from "@/lib/cs-data";
import type { StatusEmpresa } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoLista } from "@/components/Esqueletos";
import { EmpresaDialog } from "@/components/EmpresaDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Cadastro de empresas. É a mesma ficha usada dentro do Painel de CS — aqui ela
 * ganha porta própria, para quem só precisa cadastrar ou corrigir dados
 * cadastrais sem entrar na operação da conta.
 */
export default function Empresas() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const { data: empresas, isLoading: carregando } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: projetos } = useQuery({ queryKey: ["projetos"], queryFn: listarProjetos });
  const { data: contatos } = useQuery({ queryKey: ["contatos"], queryFn: listarContatosTodos });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: alocacoes } = useQuery({ queryKey: ["alocacoes"], queryFn: listarTodasAlocacoes });

  const apagar = useMutation({
    mutationFn: removerEmpresa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setConfirmando(null);
      toast.success("Empresa removida da carteira");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = empresas ?? [];
  const termo = busca.trim().toLowerCase();
  const filtradas = lista.filter((e) => {
    const bateBusca =
      !termo ||
      e.nome_fantasia.toLowerCase().includes(termo) ||
      e.razao_social.toLowerCase().includes(termo) ||
      e.cnpj.includes(termo);
    const bateStatus = status === "todos" || e.status === status;
    return bateBusca && bateStatus;
  });

  const frentesDe = (id: string) => (projetos ?? []).filter((p) => p.empresa_id === id);
  const contatoPrincipal = (id: string) =>
    contatos?.find((c) => c.empresa_id === id && c.principal);

  /**
   * Quem da agência atende a conta.
   *
   * `principal` é por função — vários podem ser principais, cada um na sua.
   * A estrela fica só no CS principal, que é quem responde pela conta; marcar
   * todo mundo faria a estrela não significar nada.
   */
  const equipeDe = (id: string) =>
    (alocacoes ?? [])
      .filter((a) => a.empresa_id === id)
      .map((a) => ({
        ...a,
        pessoa: profiles?.find((p) => p.user_id === a.user_id),
        respondePelaConta: a.funcao === "cs" && a.principal,
      }))
      .filter((a) => a.pessoa)
      .sort((a, b) => Number(b.respondePelaConta) - Number(a.respondePelaConta));
  const nomeDe = (id: string | null) =>
    profiles?.find((p) => p.user_id === id)?.nome ?? null;

  const enderecoDe = (e: (typeof lista)[number]) =>
    [e.cidade, e.estado].filter(Boolean).join(" - ") || null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Building2}
        titulo="Cadastro de Empresas"
        subtitulo="Razão social, CNPJ, endereço e responsável. É a mesma ficha do Painel de CS."
        acao={<EmpresaDialog />}
      />

      {carregando ? (
        <div role="status" aria-label="Carregando empresas">
          <EsqueletoLista />
        </div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhuma empresa cadastrada"
          descricao="Cadastre a primeira empresa com razão social, CNPJ e endereço. Depois de criada, ela aparece no Painel de CS para receber contatos, projetos, dossiê e tarefas."
          acao={<EmpresaDialog />}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-card pl-9"
                placeholder="Buscar por nome, razão social ou CNPJ…"
                aria-label="Buscar empresa"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-card sm:w-52" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {(Object.keys(statusEmpresaLabels) as StatusEmpresa[]).map((st) => (
                  <SelectItem key={st} value={st}>{statusEmpresaLabels[st]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="mb-3 text-xs tabular-nums text-muted-foreground">
            {filtradas.length === lista.length
              ? `${lista.length} ${lista.length === 1 ? "empresa cadastrada" : "empresas cadastradas"}`
              : `${filtradas.length} de ${lista.length}`}
          </p>

          {filtradas.length === 0 ? (
            <EstadoVazio
              icone={Search}
              titulo="Nada encontrado"
              descricao="Ajuste a busca ou o status."
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
              {filtradas.map((e) => {
                const frentes = frentesDe(e.id);
                const contato = contatoPrincipal(e.id);
                const equipe = equipeDe(e.id);
                return (
                  <li key={e.id} className="transition-colors hover:bg-muted/40">
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0 flex-1 basis-64">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/cs/${e.id}`}
                            className="rounded-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                            {e.nome_fantasia}
                          </Link>
                          <Badge variant={statusEmpresaVariant[e.status]}>
                            {statusEmpresaLabels[e.status]}
                          </Badge>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {e.razao_social}
                          {e.cnpj && <span className="tabular-nums">{` · ${e.cnpj}`}</span>}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {enderecoDe(e) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {enderecoDe(e)}
                            </span>
                          )}
                          {e.site && (
                            <a href={e.site} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 rounded-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                              <Globe className="h-3 w-3 shrink-0" aria-hidden /> site
                            </a>
                          )}
                          {contato && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 shrink-0" aria-hidden /> {contato.nome}
                            </span>
                          )}
                          {/* O responsável já aparece com estrela na equipe abaixo;
                              repetir aqui seria dizer a mesma coisa duas vezes. */}
                          {nomeDe(e.responsavel_id) &&
                            !equipe.some((a) => a.user_id === e.responsavel_id) && (
                              <span>responsável: {nomeDe(e.responsavel_id)}</span>
                            )}
                          <span>desde {formatDate(e.created_at.slice(0, 10))}</span>
                        </div>

                        {frentes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {frentes.map((p) => (
                              <span key={p.id}
                                className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium",
                                  tipoProjetoTom[p.tipo])}>
                                {tipoProjetoLabels[p.tipo]}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quem atende a conta. Só aparece quando há alguém alocado —
                            um bloco vazio em toda empresa seria só ruído. */}
                        {equipe.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              <UsersRound className="h-3 w-3" aria-hidden /> Equipe
                            </span>
                            {equipe.slice(0, 4).map((a) => (
                              <span key={a.id}
                                className={cn(
                                  "flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-xs",
                                  a.respondePelaConta && "border-primary/30 bg-primary/10"
                                )}
                                title={
                                  `${a.pessoa!.nome} — ${funcaoEquipeLabels[a.funcao]}` +
                                  (a.respondePelaConta ? " · responde pela conta" : "")
                                }
                              >
                                {a.respondePelaConta && (
                                  <Star className="h-3 w-3 shrink-0 fill-primary text-primary" aria-hidden />
                                )}
                                {a.pessoa!.nome.split(" ")[0]}
                                <span className="text-muted-foreground">
                                  {funcaoEquipeLabels[a.funcao]}
                                </span>
                              </span>
                            ))}
                            {equipe.length > 4 && (
                              <span className="text-xs tabular-nums text-muted-foreground">
                                +{equipe.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="-ml-2 flex shrink-0 items-center gap-1 sm:ml-0">
                        {confirmando === e.id ? (
                          <div className="ml-2 flex items-center gap-1.5 sm:ml-0">
                            <span className="text-xs text-muted-foreground">Remover?</span>
                            <Button variant="destructive" size="sm" className="px-3 text-xs"
                              onClick={() => apagar.mutate(e.id)}>
                              Sim
                            </Button>
                            <Button variant="ghost" size="sm" className="px-3 text-xs"
                              onClick={() => setConfirmando(null)}>
                              Não
                            </Button>
                          </div>
                        ) : (
                          <>
                            <EmpresaDialog empresa={e} gatilho={
                              <Button variant="ghost" size="icon" className="h-9 w-9"
                                title="Editar cadastro" aria-label={`Editar cadastro de ${e.nome_fantasia}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            } />
                            <Button variant="ghost" size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              title="Remover da carteira" aria-label={`Remover ${e.nome_fantasia} da carteira`}
                              onClick={() => setConfirmando(e.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="text-xs">
                              <Link to={`/cs/${e.id}`}>Abrir ficha <ArrowRight /></Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
