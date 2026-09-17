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
import { EmpresaDialog } from "@/components/EmpresaDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
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

      {lista.length === 0 ? (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhuma empresa cadastrada"
          descricao="Cadastre a primeira empresa com razão social, CNPJ e endereço. Depois de criada, ela aparece no Painel de CS para receber contatos, projetos, dossiê e tarefas."
          acao={<EmpresaDialog />}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, razão social ou CNPJ…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {(Object.keys(statusEmpresaLabels) as StatusEmpresa[]).map((st) => (
                  <SelectItem key={st} value={st}>{statusEmpresaLabels[st]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
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
            <div className="space-y-2">
              {filtradas.map((e) => {
                const frentes = frentesDe(e.id);
                const contato = contatoPrincipal(e.id);
                const equipe = equipeDe(e.id);
                return (
                  <Card key={e.id} className="group">
                    <CardContent className="flex flex-wrap items-start gap-4 p-4 pt-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/cs/${e.id}`} className="font-medium hover:text-primary">
                            {e.nome_fantasia}
                          </Link>
                          <Badge variant={statusEmpresaVariant[e.status]} className="text-[9px]">
                            {statusEmpresaLabels[e.status]}
                          </Badge>
                        </div>

                        <p className="truncate text-xs text-muted-foreground">
                          {e.razao_social}
                          {e.cnpj && ` · ${e.cnpj}`}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          {enderecoDe(e) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {enderecoDe(e)}
                            </span>
                          )}
                          {e.site && (
                            <a href={e.site} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 hover:underline">
                              <Globe className="h-3 w-3" /> site
                            </a>
                          )}
                          {contato && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {contato.nome}
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
                                className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium",
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
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                              <UsersRound className="h-3 w-3" /> Equipe
                            </span>
                            {equipe.slice(0, 4).map((a) => (
                              <span key={a.id}
                                className={cn(
                                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                                  a.respondePelaConta && "border-primary/40 bg-primary/5"
                                )}
                                title={
                                  `${a.pessoa!.nome} — ${funcaoEquipeLabels[a.funcao]}` +
                                  (a.respondePelaConta ? " · responde pela conta" : "")
                                }
                              >
                                {a.respondePelaConta && (
                                  <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                                )}
                                {a.pessoa!.nome.split(" ")[0]}
                                <span className="text-muted-foreground">
                                  {funcaoEquipeLabels[a.funcao]}
                                </span>
                              </span>
                            ))}
                            {equipe.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{equipe.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {confirmando === e.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground">Remover?</span>
                            <Button variant="destructive" size="sm" className="h-7 px-2 text-[10px]"
                              onClick={() => apagar.mutate(e.id)}>
                              Sim
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]"
                              onClick={() => setConfirmando(null)}>
                              Não
                            </Button>
                          </div>
                        ) : (
                          <>
                            <EmpresaDialog empresa={e} gatilho={
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar cadastro">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            } />
                            <Button variant="ghost" size="icon" className="h-8 w-8"
                              title="Remover da carteira"
                              onClick={() => setConfirmando(e.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                              <Link to={`/cs/${e.id}`}>Abrir ficha <ArrowRight /></Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
