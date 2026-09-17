import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Power, Mail, Users, UsersRound, Plug, Link2, CheckCircle2, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  alternarAtivo, definirPapel, listarIntegracoes, listarPaineis, listarProfiles,
  modulosDe, papelDe, registrarConvite, salvarIntegracao, zerarDados,
} from "@/data/store";
import { moduloLabels, roleDescricoes, roleLabels } from "@/lib/mock-data";
import type { AppRole, IntegracaoChave } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EquipesAgencia } from "@/components/EquipesAgencia";
import { PermissoesDialog } from "@/components/PermissoesDialog";
import { ColaboradorDialog } from "@/components/ColaboradorDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { isMaster, userId } = useAuth();
  const qc = useQueryClient();

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });
  const { data: paineis } = useQuery({ queryKey: ["paineis"], queryFn: listarPaineis });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["profiles"] });

  const mudarPapel = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: AppRole }) => definirPapel(user_id, role),
    onSuccess: () => { invalidar(); toast.success("Papel atualizado"); },
  });

  const alternar = useMutation({
    mutationFn: (user_id: string) => alternarAtivo(user_id),
    onSuccess: () => { invalidar(); toast.success("Status alterado"); },
  });

  const reenviar = useMutation({
    mutationFn: (user_id: string) => registrarConvite(user_id),
    onSuccess: () => {
      invalidar();
      toast.success("Convite marcado para reenvio. O disparo real depende do Supabase.");
    },
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

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Settings}
        titulo="Painel Admin"
        subtitulo="Usuários, papéis, permissões e integrações"
        acao={<ColaboradorDialog />}
      />

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios"><Users /> Usuários</TabsTrigger>
          <TabsTrigger value="equipes"><UsersRound /> Equipes</TabsTrigger>
          <TabsTrigger value="integracoes"><Plug /> Integrações</TabsTrigger>
          <TabsTrigger value="paineis"><Link2 /> Painéis externos</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="hidden p-3 font-medium md:table-cell">E-mail</th>
                    <th className="p-3 font-medium">Papel</th>
                    <th className="hidden p-3 font-medium lg:table-cell">Painéis</th>
                    <th className="p-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles?.map((p) => {
                    const papel = papelDe(p.user_id);
                    const mods = modulosDe(p.user_id);
                    const euMesmo = p.user_id === userId;
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          <span className={p.ativo ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                            {p.nome}
                          </span>
                          <p className="text-xs text-muted-foreground">{p.cargo ?? "—"}</p>
                        </td>
                        <td className="hidden p-3 text-muted-foreground md:table-cell">
                          {p.email}
                          {p.convite_enviado_em && (
                            <Badge variant="info" className="ml-2 text-[9px]">convite enviado</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Select
                            value={papel}
                            disabled={!isMaster || euMesmo}
                            onValueChange={(v) => mudarPapel.mutate({ user_id: p.user_id, role: v as AppRole })}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(roleLabels) as AppRole[]).map((r) => (
                                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="hidden p-3 lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {papel === "master" ? (
                              <Badge variant="secondary" className="text-[9px]">todos</Badge>
                            ) : mods.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              mods.map((m) => (
                                <Badge key={m} variant="secondary" className="text-[9px]">
                                  {moduloLabels[m]}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8" title="Reenviar convite"
                              onClick={() => reenviar.mutate(p.user_id)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <PermissoesDialog userId={p.user_id} nome={p.nome} papel={papel} />
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              title={p.ativo ? "Desativar" : "Reativar"}
                              disabled={euMesmo}
                              onClick={() => alternar.mutate(p.user_id)}
                            >
                              <Power className={p.ativo ? "h-4 w-4" : "h-4 w-4 text-destructive"} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(roleLabels) as AppRole[]).map((r) => (
              <Card key={r}>
                <CardContent className="p-4 pt-4">
                  <p className="text-sm font-semibold">{roleLabels[r]}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{roleDescricoes[r]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="equipes">
          <EquipesAgencia />
        </TabsContent>

        <TabsContent value="integracoes">
          <div className="grid gap-3 sm:grid-cols-2">
            {integracoes?.map((i) => (
              <Card key={i.chave}>
                <CardContent className="p-4 pt-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{i.nome}</p>
                      <p className="text-xs text-muted-foreground">{i.descricao}</p>
                    </div>
                    <Badge variant={i.conectada ? "success" : "secondary"} className="shrink-0 text-[9px]">
                      {i.conectada ? "Conectada" : "Não conectada"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                    <span>Alimenta: <strong className="text-foreground">{i.destino}</strong></span>
                    <span>·</span>
                    <code className="rounded bg-muted px-1.5 py-0.5">{i.segredo}</code>
                  </div>
                  {i.ultima_sincronizacao && (
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      Sincronizado em {new Date(i.ultima_sincronizacao).toLocaleString("pt-BR")}
                    </p>
                  )}
                  {isMaster && (
                    <Button
                      variant={i.conectada ? "outline" : "default"}
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => ligar.mutate({ chave: i.chave, conectada: !i.conectada })}
                    >
                      {i.conectada ? "Desligar" : "Marcar como conectada"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ligar aqui registra a intenção e libera a interface. A sincronização de verdade
            depende da edge function <code>sync-&lt;serviço&gt;</code> e do segredo cadastrado no Supabase.
          </p>
        </TabsContent>

        <TabsContent value="paineis">
          <div className="grid gap-3 sm:grid-cols-2">
            {paineis?.map((p) => (
              <Card key={p.chave}>
                <CardContent className="p-4 pt-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.descricao}</p>
                    </div>
                    <Badge variant={p.url ? "success" : "secondary"} className="shrink-0 text-[9px]">
                      {p.url ? "Configurado" : "Sem URL"}
                    </Badge>
                  </div>
                  {p.url && (
                    <p className="truncate border-t pt-2 text-xs text-muted-foreground">{p.url}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            A URL de cada painel é configurada na própria tela dele, no menu lateral.
          </p>

          {isMaster && (
            <Card className="mt-6 border border-destructive/30">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 pt-4">
                <div>
                  <p className="text-sm font-medium">Zerar dados locais</p>
                  <p className="text-xs text-muted-foreground">
                    Apaga tudo o que foi cadastrado neste navegador e volta ao estado inicial.
                    Útil enquanto o Supabase não está conectado.
                  </p>
                </div>
                <Button
                  variant="destructive"
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
