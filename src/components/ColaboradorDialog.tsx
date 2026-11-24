import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, UserPlus, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { criarColaborador, type NovoColaborador } from "@/data/store";
import { useAuth } from "@/contexts/AuthContext";
import {
  cpfValido, formatCPF, formatTelefone, moduloDescricoes, moduloLabels,
  roleDescricoes, roleLabels,
} from "@/lib/mock-data";
import type { AppModulo, AppRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const vazio: NovoColaborador = {
  nome: "", email: "", cpf: "", cargo: "", departamento: "", telefone: "",
  contato_emergencia_nome: "", contato_emergencia_telefone: "",
  data_admissao: "", data_nascimento: "",
  role: "funcionario", modulos: [], enviar_convite: true,
};

const modulosDisponiveis = Object.keys(moduloLabels) as AppModulo[];

export function ColaboradorDialog({ gatilho }: { gatilho?: ReactNode }) {
  const { isMaster, loginReal } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<NovoColaborador>(vazio);
  const [erro, setErro] = useState<string | null>(null);

  const set = <K extends keyof NovoColaborador>(campo: K, valor: NovoColaborador[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cpfPreenchido = form.cpf.replace(/\D/g, "").length === 11;
  const cpfInvalido = cpfPreenchido && !cpfValido(form.cpf);

  const camposObrigatorios =
    form.nome.trim().length > 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    cpfPreenchido &&
    !cpfInvalido &&
    form.telefone.replace(/\D/g, "").length >= 10 &&
    form.contato_emergencia_nome.trim().length > 2 &&
    form.contato_emergencia_telefone.replace(/\D/g, "").length >= 10 &&
    form.data_admissao !== "";

  const criar = useMutation({
    mutationFn: () => criarColaborador(form),
    onSuccess: (novo) => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setAberto(false);
      setForm(vazio);
      setErro(null);
      toast.success(
        !form.enviar_convite
          ? `${novo.nome} cadastrado sem convite.`
          : loginReal
            ? `${novo.nome} cadastrado. O convite foi enviado para ${novo.email}.`
            : `${novo.nome} cadastrado. O convite por e-mail sai quando o Supabase estiver conectado.`
      );
    },
    onError: (e: Error) => setErro(e.message),
  });

  function alternarModulo(m: AppModulo) {
    set("modulos", form.modulos.includes(m)
      ? form.modulos.filter((x) => x !== m)
      : [...form.modulos, m]);
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => { setAberto(v); if (!v) { setForm(vazio); setErro(null); } }}
    >
      <DialogTrigger asChild>
        {gatilho ?? <Button><UserPlus /> Novo colaborador</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-3xl gap-5">
        <DialogHeader>
          <DialogTitle>Novo colaborador</DialogTitle>
          <DialogDescription>
            Cadastro da pessoa e criação do acesso ao sistema, em um passo só.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dados pessoais
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="col-nome">Nome completo *</Label>
                <Input id="col-nome" className="mt-1.5" value={form.nome}
                  onChange={(e) => set("nome", e.target.value)} placeholder="Nome e sobrenome" />
              </div>

              <div>
                <Label htmlFor="col-cpf">CPF *</Label>
                <Input
                  id="col-cpf" className={cn("mt-1.5", cpfInvalido && "border-destructive")}
                  value={form.cpf} inputMode="numeric" placeholder="000.000.000-00"
                  onChange={(e) => set("cpf", formatCPF(e.target.value))}
                />
                {cpfInvalido && (
                  <p className="mt-1 text-xs text-destructive">CPF inválido.</p>
                )}
              </div>

              <div>
                <Label htmlFor="col-nasc">Data de nascimento</Label>
                <Input id="col-nasc" type="date" className="mt-1.5" value={form.data_nascimento}
                  onChange={(e) => set("data_nascimento", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="col-tel">Telefone de contato *</Label>
                <Input id="col-tel" className="mt-1.5" value={form.telefone} inputMode="tel"
                  placeholder="(00) 00000-0000"
                  onChange={(e) => set("telefone", formatTelefone(e.target.value))} />
              </div>

              <div>
                <Label htmlFor="col-adm">Data de admissão *</Label>
                <Input id="col-adm" type="date" className="mt-1.5" value={form.data_admissao}
                  onChange={(e) => set("data_admissao", e.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contato de emergência
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="col-emerg-nome">Nome *</Label>
                <Input id="col-emerg-nome" className="mt-1.5" value={form.contato_emergencia_nome}
                  placeholder="Quem acionar em caso de emergência"
                  onChange={(e) => set("contato_emergencia_nome", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="col-emerg-tel">Telefone *</Label>
                <Input id="col-emerg-tel" className="mt-1.5" inputMode="tel"
                  value={form.contato_emergencia_telefone} placeholder="(00) 00000-0000"
                  onChange={(e) => set("contato_emergencia_telefone", formatTelefone(e.target.value))} />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cargo e acesso
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="col-cargo">Cargo</Label>
                <Input id="col-cargo" className="mt-1.5" value={form.cargo}
                  onChange={(e) => set("cargo", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="col-dep">Departamento</Label>
                <Input id="col-dep" className="mt-1.5" value={form.departamento}
                  onChange={(e) => set("departamento", e.target.value)} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="col-email">E-mail corporativo *</Label>
                <Input id="col-email" type="email" className="mt-1.5" value={form.email}
                  placeholder="nome@conteudomartech.com.br"
                  onChange={(e) => set("email", e.target.value)} />
                <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                  <input
                    type="checkbox" checked={form.enviar_convite}
                    onChange={(e) => set("enviar_convite", e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    Enviar e-mail com a senha de primeiro acesso
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <Label>Papel no sistema</Label>
                <Select value={form.role} onValueChange={(v) => set("role", v as AppRole)}>
                  <SelectTrigger className="mt-1.5" aria-label="Papel no sistema"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(roleLabels) as AppRole[])
                      .filter((r) => r !== "master" || isMaster)
                      .map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]} — {roleDescricoes[r]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Painéis liberados
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {form.role === "master"
                ? "Master enxerga todos os painéis por definição."
                : "Marque o que esta pessoa poderá acessar. O hub interno e os documentos próprios já vêm liberados."}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {modulosDisponiveis.map((m) => {
                const ativo = form.role === "master" || form.modulos.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={form.role === "master"}
                    aria-pressed={ativo}
                    onClick={() => alternarModulo(m)}
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60",
                      ativo ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      ativo ? "border-primary bg-primary" : "border-input"
                    )}>
                      {ativo && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} aria-hidden />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight text-foreground">{moduloLabels[m]}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{moduloDescricoes[m]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            O repositório de contracheques da pessoa é criado junto com o cadastro e fica
            visível <strong className="font-semibold text-foreground">apenas para ela</strong> e para quem tem o painel de Colaboradores.
          </div>

          {erro && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {erro}
            </div>
          )}
        </div>

        {/* Rodapé de ações preso à base do diálogo enquanto o formulário rola. */}
        <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-muted-foreground sm:mr-auto">* Preenchimento obrigatório</p>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            disabled={!camposObrigatorios || criar.isPending}
            onClick={() => criar.mutate()}
          >
            {criar.isPending ? "Cadastrando…" : "Cadastrar colaborador"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
