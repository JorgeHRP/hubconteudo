import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Power, Mail, Users, UsersRound, Plug, Link2, CheckCircle2, RotateCcw,
  RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  alternarAtivo, definirPapel, listarIntegracoes, listarPaineis, listarProfiles,
  modulosDe, papelDe, registrarConvite, salvarIntegracao, sincronizarClickUp, zerarDados,
} from "@/data/store";
import { moduloLabels, roleDescricoes, roleLabels } from "@/lib/mock-data";
import type { AppRole, IntegracaoChave } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EquipesAgencia } from "@/components/EquipesAgencia";
import { PermissoesDialog } from "@/components/PermissoesDialog";
import { ColaboradorDialog } from "@/components/ColaboradorDialog";
import { ClickUpDialog } from "@/components/ClickUpDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoVazio } from "@/components/EstadoVazio";
import { EsqueletoIndicadores, EsqueletoTabela } from "@/components/Esqueletos";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { isMaster, userId, loginReal } = useAuth();
  const qc = useQueryClient();

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });
  const { data: paineis } = useQuery({ queryKey: ["paineis"], queryFn: listarPaineis });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["profiles"] });

  const mudarPapel = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: AppRole }) => definirPapel(user_id, role),
    onSuccess: () => { invalidar(); toast.success("Papel atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternar = useMutation({
    mutationFn: (user_id: string) => alternarAtivo(user_id),
    onSuccess: () => { invalidar(); toast.success("Status alterado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reenviar = useMutation({
    mutationFn: (user_id: string) => registrarConvite(user_id),
    onSuccess: () => {
      invalidar();
      toast.success(
        loginReal
          ? "E-mail com o link de criar senha enviado."
          : "Convite marcado para reenvio. O disparo real depende do Supabase."
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ligar = useMutation({
    mutationFn: ({ chave, conectada }: { chave: IntegracaoChave; conectada: boolean }) =>
      salvarIntegracao(chave, conectada),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["integracoes"] });
      toast.success(
        v.conectada
          ? "Integração marcada como conectada. A sincronização real entra com a edge function."
          : "Integração desligada."
      );
    },
  });

  const sincronizar = useMutation({
    mutationFn: sincronizarClickUp,
    onSuccess: (r) => {
      qc.invalidateQueries();
      if (!r.empresas) {
        toast.warning("Nenhum cliente vinculado ao ClickUp ainda. Use Vincular clientes.");
        return;
      }
      const resumo = `${r.tarefas} tarefas de ${r.empresas} cliente(s)` +
        (r.removidas ? `, ${r.removidas} retirada(s)` : "");
      if (r.falhas.length) toast.warning(`Sincronizado com falhas: ${resumo}. ${r.falhas[0]}`);
      else toast.success(`ClickUp sincronizado: ${resumo}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Settings}
        titulo="Painel Admin"
        subtitulo="Usuários, papéis, permissões e integrações"
        acao={<ColaboradorDialog />}
      />

      <Tabs defaultValue="usuarios">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="usuarios"><Users /> Usuários</TabsTrigger>
          <TabsTrigger value="equipes"><UsersRound /> Equipes</TabsTrigger>
          <TabsTrigger value="integracoes"><Plug /> Integrações</TabsTrigger>
          <TabsTrigger value="paineis"><Link2 /> Painéis externos</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          {!profiles ? (
            <div role="status" aria-label="Carregando usuários">
              <EsqueletoTabela linhas={6} colunas={4} />
            </div>
          ) : profiles.length === 0 ? (
            <EstadoVazio
              icone={Users}
              titulo="Nenhum usuário cadastrado"
              descricao="Cadastre a primeira pessoa do time pelo botão no topo da página. Depois é só definir o papel e os painéis que ela enxerga."
            />
          ) : (
            <Card className="overflow-hidden">
              <Table className="min-w-[32rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="hidden lg:table-cell">Painéis</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => {
                    const papel = papelDe(p.user_id);
                    const mods = modulosDe(p.user_id);
                    const euMesmo = p.user_id === userId;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={p.ativo ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                              {p.nome}
                            </span>
                            {!p.ativo && <Badge variant="secondary">Inativo</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{p.cargo ?? "—"}</p>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="break-all">{p.email}</span>
                            {p.convite_enviado_em && (
                              <Badge variant="info" className="whitespace-nowrap">Convite enviado</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={papel}
                            disabled={!isMaster || euMesmo}
                            onValueChange={(v) => mudarPapel.mutate({ user_id: p.user_id, role: v as AppRole })}
                          >
                            <SelectTrigger className="h-9 w-36 text-xs" aria-label={`Papel de ${p.nome}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(roleLabels) as AppRole[]).map((r) => (
                                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex max-w-md flex-wrap gap-1">
                            {papel === "master" ? (
                              <Badge variant="outline">Todos os painéis</Badge>
                            ) : mods.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              mods.map((m) => (
                                <Badge key={m} variant="secondary">
                                  {moduloLabels[m]}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost" size="icon" className="h-9 w-9" title="Reenviar convite"
                              aria-label={`Reenviar convite para ${p.nome}`}
                              onClick={() => reenviar.mutate(p.user_id)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <PermissoesDialog userId={p.user_id} nome={p.nome} papel={papel} />
                            <Button
                              variant="ghost" size="icon" className="h-9 w-9"
                              title={p.ativo ? "Desativar" : "Reativar"}
                              aria-label={p.ativo ? `Desativar ${p.nome}` : `Reativar ${p.nome}`}
                              disabled={euMesmo}
                              onClick={() => alternar.mutate(p.user_id)}
                            >
                              <Power className={p.ativo ? "h-4 w-4" : "h-4 w-4 text-destructive"} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            O que cada papel pode fazer
          </p>
          <Card>
            <CardContent className="grid p-0 sm:grid-cols-3 sm:divide-x">
              {(Object.keys(roleLabels) as AppRole[]).map((r) => (
                <div key={r} className="border-b p-4 last:border-b-0 sm:border-b-0">
                  <p className="text-sm font-semibold">{roleLabels[r]}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{roleDescricoes[r]}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipes">
          <EquipesAgencia />
        </TabsContent>

        <TabsContent value="integracoes">
          {!integracoes ? (
            <div role="status" aria-label="Carregando integrações">
              <EsqueletoIndicadores />
            </div>
          ) : integracoes.length === 0 ? (
            <EstadoVazio
              icone={Plug}
              titulo="Nenhuma integração disponível"
              descricao="As fontes de dados que alimentam os painéis aparecem aqui assim que forem cadastradas."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {integracoes.map((i) => (
                <Card key={i.chave} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                          i.conectada ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Plug className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <p className="text-sm font-semibold">{i.nome}</p>
                          <Badge variant={i.conectada ? "success" : "secondary"} className="shrink-0 whitespace-nowrap">
                            {i.conectada ? "Conectada" : "Não conectada"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.descricao}</p>
                      </div>
                    </div>
                    <dl className="mt-3 space-y-1.5 border-t pt-3 text-xs">
                      <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                        <dt className="text-muted-foreground">Alimenta</dt>
                        <dd className="font-medium text-foreground">{i.destino}</dd>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                        <dt className="text-muted-foreground">Segredo</dt>
                        <dd className="min-w-0">
                          <code className="break-all rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{i.segredo}</code>
                        </dd>
                      </div>
                    </dl>
                    {i.ultima_sincronizacao && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                        Sincronizado em {new Date(i.ultima_sincronizacao).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {isMaster && i.chave === "clickup" && loginReal && (
                      <div className="mt-auto grid gap-2 pt-3 min-[420px]:grid-cols-2">
                        <ClickUpDialog />
                        <Button size="sm" disabled={sincronizar.isPending} onClick={() => sincronizar.mutate()}>
                          {sincronizar.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                          Sincronizar agora
                        </Button>
                      </div>
                    )}
                    {isMaster && !(i.chave === "clickup" && loginReal) && (
                      <div className="mt-auto pt-3">
                        <Button
                          variant={i.conectada ? "outline" : "default"}
                          size="sm"
                          className="w-full"
                          onClick={() => ligar.mutate({ chave: i.chave, conectada: !i.conectada })}
                        >
                          {i.conectada ? "Desligar" : "Marcar como conectada"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Ligar aqui registra a intenção e libera a interface. A sincronização de verdade
            depende da edge function <code className="rounded bg-muted px-1 py-0.5">sync-&lt;serviço&gt;</code> e do segredo cadastrado no Supabase.
          </p>
        </TabsContent>

        <TabsContent value="paineis">
          {!paineis ? (
            <div role="status" aria-label="Carregando painéis">
              <EsqueletoIndicadores />
            </div>
          ) : paineis.length === 0 ? (
            <EstadoVazio
              icone={Link2}
              titulo="Nenhum painel externo"
              descricao="Os painéis incorporados ao menu lateral aparecem aqui, com a indicação de quais já têm endereço configurado."
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {paineis.map((p) => (
                  <li key={p.chave} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3">
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="text-sm font-medium">{p.nome}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.descricao}</p>
                      {p.url && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Link2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                          <span className="truncate">{p.url}</span>
                        </p>
                      )}
                    </div>
                    <Badge variant={p.url ? "success" : "secondary"} className="shrink-0 whitespace-nowrap">
                      {p.url ? "Configurado" : "Sem URL"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            A URL de cada painel é configurada na própria tela dele, no menu lateral.
          </p>

          {isMaster && (
            <Card className="mt-6 border-destructive/30">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-sm font-medium">Zerar dados locais</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Apaga tudo o que foi cadastrado neste navegador e volta ao estado inicial.
                    Útil enquanto o Supabase não está conectado.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={loginReal}
                  title={loginReal ? "Indisponível com o banco ligado" : undefined}
                  onClick={() => {
                    zerarDados();
                    qc.invalidateQueries();
                    toast.success("Dados locais zerados");
                  }}
                >
                  <RotateCcw /> Zerar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
