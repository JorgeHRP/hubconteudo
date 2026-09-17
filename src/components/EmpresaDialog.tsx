import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { listarProfiles, salvarEmpresa, type NovaEmpresa } from "@/data/store";
import {
  cnpjValido, estadosBR, formatCEP, formatCNPJ, statusEmpresaLabels,
} from "@/lib/labels-clientes";
import type { Empresa, StatusEmpresa } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const vazio: NovaEmpresa = {
  razao_social: "", nome_fantasia: "", cnpj: "", segmento: "", site: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  status: "prospect", responsavel_id: null, observacoes: "",
};

export function EmpresaDialog({
  empresa,
  gatilho,
}: {
  empresa?: Empresa;
  gatilho?: ReactNode;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<NovaEmpresa>(vazio);
  const [erro, setErro] = useState<string | null>(null);

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  useEffect(() => {
    if (!aberto) return;
    setErro(null);
    setForm(
      empresa
        ? {
            razao_social: empresa.razao_social,
            nome_fantasia: empresa.nome_fantasia,
            cnpj: empresa.cnpj,
            segmento: empresa.segmento ?? "",
            site: empresa.site ?? "",
            cep: empresa.cep ?? "",
            logradouro: empresa.logradouro ?? "",
            numero: empresa.numero ?? "",
            complemento: empresa.complemento ?? "",
            bairro: empresa.bairro ?? "",
            cidade: empresa.cidade ?? "",
            estado: empresa.estado ?? "",
            status: empresa.status,
            responsavel_id: empresa.responsavel_id,
            observacoes: empresa.observacoes ?? "",
          }
        : vazio
    );
  }, [aberto, empresa]);

  const set = <K extends keyof NovaEmpresa>(campo: K, valor: NovaEmpresa[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cnpjPreenchido = form.cnpj.replace(/\D/g, "").length === 14;
  const cnpjInvalido = cnpjPreenchido && !cnpjValido(form.cnpj);
  const podeSalvar = form.razao_social.trim().length > 2 && cnpjPreenchido && !cnpjInvalido;

  const salvar = useMutation({
    mutationFn: () => salvarEmpresa({ ...form, id: empresa?.id }),
    onSuccess: (e) => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setAberto(false);
      toast.success(empresa ? "Empresa atualizada" : `${e?.nome_fantasia} cadastrada`);
    },
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {gatilho ?? <Button><Building2 /> Nova empresa</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{empresa ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>
            Os projetos — CS, tráfego, SEO e RD — são cadastrados depois, dentro da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identificação
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="emp-razao">Razão social *</Label>
                <Input id="emp-razao" className="mt-1.5" value={form.razao_social}
                  placeholder="Nome jurídico completo"
                  onChange={(e) => set("razao_social", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emp-fantasia">Nome fantasia</Label>
                <Input id="emp-fantasia" className="mt-1.5" value={form.nome_fantasia}
                  placeholder="Como o time chama"
                  onChange={(e) => set("nome_fantasia", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emp-cnpj">CNPJ *</Label>
                <Input
                  id="emp-cnpj" inputMode="numeric" placeholder="00.000.000/0000-00"
                  className={cn("mt-1.5", cnpjInvalido && "border-destructive")}
                  value={form.cnpj}
                  onChange={(e) => set("cnpj", formatCNPJ(e.target.value))}
                />
                {cnpjInvalido && <p className="mt-1 text-xs text-destructive">CNPJ inválido.</p>}
              </div>
              <div>
                <Label htmlFor="emp-seg">Segmento</Label>
                <Input id="emp-seg" className="mt-1.5" value={form.segmento}
                  placeholder="Ensino superior, colégio, varejo…"
                  onChange={(e) => set("segmento", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emp-site">Site</Label>
                <Input id="emp-site" className="mt-1.5" value={form.site} placeholder="https://…"
                  onChange={(e) => set("site", e.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Endereço
            </p>
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="emp-cep">CEP</Label>
                <Input id="emp-cep" inputMode="numeric" className="mt-1.5" value={form.cep}
                  placeholder="00000-000"
                  onChange={(e) => set("cep", formatCEP(e.target.value))} />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="emp-log">Logradouro</Label>
                <Input id="emp-log" className="mt-1.5" value={form.logradouro}
                  onChange={(e) => set("logradouro", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="emp-num">Número</Label>
                <Input id="emp-num" className="mt-1.5" value={form.numero}
                  onChange={(e) => set("numero", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="emp-comp">Complemento</Label>
                <Input id="emp-comp" className="mt-1.5" value={form.complemento}
                  onChange={(e) => set("complemento", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="emp-bairro">Bairro</Label>
                <Input id="emp-bairro" className="mt-1.5" value={form.bairro}
                  onChange={(e) => set("bairro", e.target.value)} />
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="emp-cidade">Cidade</Label>
                <Input id="emp-cidade" className="mt-1.5" value={form.cidade}
                  onChange={(e) => set("cidade", e.target.value)} />
              </div>
              <div className="sm:col-span-1">
                <Label>UF</Label>
                <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {estadosBR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Relação com a agência
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as StatusEmpresa)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusEmpresaLabels) as StatusEmpresa[]).map((s) => (
                      <SelectItem key={s} value={s}>{statusEmpresaLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável na agência</Label>
                <Select
                  value={form.responsavel_id ?? "nenhum"}
                  onValueChange={(v) => set("responsavel_id", v === "nenhum" ? null : v)}
                >
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Não definido</SelectItem>
                    {profiles?.filter((p) => p.ativo).map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="emp-obs">Observações</Label>
                <Textarea id="emp-obs" className="mt-1.5" value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)} />
              </div>
            </div>
          </section>

          {erro && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}

          <Button className="w-full" disabled={!podeSalvar || salvar.isPending}
            onClick={() => salvar.mutate()}>
            {salvar.isPending ? "Salvando…" : empresa ? "Salvar alterações" : "Cadastrar empresa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
