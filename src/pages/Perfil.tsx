import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, UserCircle, Save, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { atualizarProfile, listarDocumentos, podeTrocarFoto, trocarFoto } from "@/data/store";
import { AvatarPessoa } from "@/components/AvatarPessoa";
import { formatTelefone, roleLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { BaixarDocumento } from "@/components/BaixarDocumento";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  const fotoRef = useRef<HTMLInputElement>(null);
  const foto = useMutation({
    mutationFn: (arquivo: File | null) => trocarFoto(userId!, arquivo),
    onSuccess: async (nova) => {
      await recarregarProfile();
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success(nova ? "Foto atualizada" : "Foto removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader icone={UserCircle} titulo="Meu perfil" subtitulo="Seus dados e documentos" />

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:gap-5">
            <AvatarPessoa nome={profile?.nome ?? "?"} foto={profile?.foto_url}
              className="h-20 w-20 shrink-0 border"
              classeIniciais="bg-primary font-display text-xl font-semibold text-primary-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="font-display text-lg font-semibold leading-tight">{profile?.nome}</p>
                {role && <Badge variant="secondary">{roleLabels[role]}</Badge>}
              </div>
              {profile?.cargo && (
                <p className="mt-1 text-sm text-foreground">
                  {profile.cargo}
                  {profile.departamento ? ` · ${profile.departamento}` : ""}
                </p>
              )}
              <p className="mt-0.5 break-all text-sm text-muted-foreground">{profile?.email}</p>
              {podeTrocarFoto() && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={foto.isPending}
                    onClick={() => fotoRef.current?.click()}>
                    <Camera />
                    {foto.isPending ? "Enviando…" : profile?.foto_url ? "Trocar foto" : "Pôr foto"}
                  </Button>
                  {profile?.foto_url && (
                    <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={foto.isPending}
                      onClick={() => foto.mutate(null)}>
                      Tirar foto
                    </Button>
                  )}
                  <input ref={fotoRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) foto.mutate(f);
                      e.target.value = "";
                    }} />
                </div>
              )}
            </div>
          </div>

          <CardContent className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dados pessoais
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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

            </div>

            <Separator className="my-5" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contato de emergência
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <p className="mt-5 rounded-md bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                CPF {profile.cpf} · admitido em {formatDate(profile.data_admissao)}. Para corrigir
                estes dados, fale com a gestão de pessoas.
              </p>
            )}
          </CardContent>

          <div className="flex justify-end border-t bg-muted/50 px-5 py-3">
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              <Save /> Salvar alterações
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-accent" aria-hidden /> Meus documentos
            </CardTitle>
          </CardHeader>
          {!documentos ? (
            <div className="divide-y border-t" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2 px-5 py-3">
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              ))}
            </div>
          ) : meus.length === 0 ? (
            <p className="border-t px-5 py-4 text-sm text-muted-foreground">Nenhum documento vinculado.</p>
          ) : (
            <ul className="divide-y border-t">
              {meus.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3 pl-5 pr-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.created_at.slice(0, 10))}
                    </p>
                  </div>
                  <BaixarDocumento doc={d} className="h-9 w-9" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
