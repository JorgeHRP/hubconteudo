import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { atualizarProfile, listarDocumentos } from "@/data/store";
import { formatTelefone, getInitials, roleLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Perfil() {
  const { userId, profile, role, recarregarProfile } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nome: "", cargo: "", departamento: "", telefone: "", data_nascimento: "",
    contato_emergencia_nome: "", contato_emergencia_telefone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome, cargo: profile.cargo ?? "", departamento: profile.departamento ?? "",
        telefone: profile.telefone ?? "", data_nascimento: profile.data_nascimento ?? "",
        contato_emergencia_nome: profile.contato_emergencia_nome ?? "",
        contato_emergencia_telefone: profile.contato_emergencia_telefone ?? "",
      });
    }
  }, [profile]);

  const { data: documentos } = useQuery({ queryKey: ["documentos"], queryFn: listarDocumentos });
  const meus = (documentos ?? []).filter((d) => d.user_id === userId);

  const salvar = useMutation({
    mutationFn: () =>
      atualizarProfile(userId!, {
        nome: form.nome.trim(), cargo: form.cargo.trim() || null,
        departamento: form.departamento.trim() || null, telefone: form.telefone.trim() || null,
        data_nascimento: form.data_nascimento || null,
        contato_emergencia_nome: form.contato_emergencia_nome.trim() || null,
        contato_emergencia_telefone: form.contato_emergencia_telefone.trim() || null,
      }),
    onSuccess: async () => {
      await recarregarProfile();
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil atualizado");
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader icone={UserCircle} titulo="Meu perfil" subtitulo="Seus dados e documentos" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5 pt-5">
            <div className="mb-5 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="gradient-primary text-lg text-primary-foreground">
                  {getInitials(profile?.nome ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile?.nome}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {role ? roleLabels[role] : ""}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="p-nome">Nome</Label>
                <Input id="p-nome" className="mt-1.5" value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-cargo">Cargo</Label>
                <Input id="p-cargo" className="mt-1.5" value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-dep">Departamento</Label>
                <Input id="p-dep" className="mt-1.5" value={form.departamento}
                  onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-tel">Telefone</Label>
                <Input id="p-tel" className="mt-1.5" value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-nasc">Data de nascimento</Label>
                <Input id="p-nasc" type="date" className="mt-1.5" value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
              </div>

              <div className="sm:col-span-2">
                <Separator className="my-1" />
                <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contato de emergência
                </p>
              </div>
              <div>
                <Label htmlFor="p-emerg-nome">Nome</Label>
                <Input id="p-emerg-nome" className="mt-1.5" value={form.contato_emergencia_nome}
                  onChange={(e) => setForm({ ...form, contato_emergencia_nome: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="p-emerg-tel">Telefone</Label>
                <Input id="p-emerg-tel" className="mt-1.5" value={form.contato_emergencia_telefone}
                  onChange={(e) =>
                    setForm({ ...form, contato_emergencia_telefone: formatTelefone(e.target.value) })
                  } />
              </div>
            </div>

            {profile?.cpf && (
              <p className="mt-4 text-xs text-muted-foreground">
                CPF {profile.cpf} · admitido em {formatDate(profile.data_admissao)}. Para corrigir
                estes dados, fale com a gestão de pessoas.
              </p>
            )}

            <Button className="mt-5" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              <Save /> Salvar alterações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 pt-5">
            <p className="mb-3 text-sm font-semibold">Meus documentos</p>
            <div className="space-y-2">
              {meus.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-md border p-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{d.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(d.created_at.slice(0, 10))}
                    </p>
                  </div>
                </div>
              ))}
              {meus.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum documento vinculado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
