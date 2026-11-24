import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { alterarNegocio, criarNegocio, removerNegocio, type DadosNegocio } from "@/data/store";
import { etapasFunil, produtoLabels } from "@/lib/cs-data";
import type { EtapaFunil, ProdutoCliente, VendaNegocio } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SEM_UNIDADE = "nenhuma";

interface Form {
  nome: string; empresa: string; etapa: EtapaFunil; valor: string;
  responsavel: string; origem: string; produto: ProdutoCliente | typeof SEM_UNIDADE;
}

const vazio: Form = {
  nome: "", empresa: "", etapa: "prospeccao", valor: "",
  responsavel: "", origem: "", produto: SEM_UNIDADE,
};

/** Cadastro e edição de negócio feito à mão. Negócio do RD Station não passa por aqui. */
export function NegocioDialog({ negocio, gatilho }: { negocio?: VendaNegocio; gatilho: ReactNode }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(vazio);

  useEffect(() => {
    if (!aberto) return;
    setForm(negocio ? {
      nome: negocio.nome,
      empresa: negocio.empresa ?? "",
      etapa: negocio.etapa,
      valor: String(negocio.valor),
      responsavel: negocio.responsavel ?? "",
      origem: negocio.origem ?? "",
      produto: negocio.produto ?? SEM_UNIDADE,
    } : vazio);
  }, [aberto, negocio]);

  const dados = (): DadosNegocio => ({
    nome: form.nome.trim(),
    empresa: form.empresa.trim() || null,
    etapa: form.etapa,
    valor: Math.max(0, Number(form.valor.replace(",", ".")) || 0),
    responsavel: form.responsavel.trim() || null,
    origem: form.origem.trim() || null,
    produto: form.produto === SEM_UNIDADE ? null : form.produto,
  });

  const fechar = (mensagem: string) => {
    qc.invalidateQueries({ queryKey: ["negocios"] });
    setAberto(false);
    toast.success(mensagem);
  };

  const salvar = useMutation({
    mutationFn: () => (negocio ? alterarNegocio(negocio.id, dados()) : criarNegocio(dados())),
    onSuccess: () => fechar(negocio ? "Negócio atualizado" : "Negócio cadastrado"),
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: () => removerNegocio(negocio!.id),
    onSuccess: () => fechar("Negócio removido"),
    onError: (e: Error) => toast.error(e.message),
  });

  const campo = (chave: keyof Form) => ({
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [chave]: e.target.value }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent className="p-5 sm:p-6">
        <DialogHeader className="pr-6">
          <DialogTitle>{negocio ? "Editar negócio" : "Novo negócio"}</DialogTitle>
          <DialogDescription>
            Ao marcar como ganho ou perdido, o negócio sai do pipeline e entra na taxa de conversão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="n-nome">Negócio</Label>
            <Input id="n-nome" className="mt-1.5" placeholder="Inbound 2027 — Graduação" {...campo("nome")} />
          </div>
          <div>
            <Label htmlFor="n-emp">Empresa</Label>
            <Input id="n-emp" className="mt-1.5" placeholder="Instituição" {...campo("empresa")} />
          </div>
          <div>
            <Label htmlFor="n-valor">Valor (R$)</Label>
            <Input id="n-valor" type="number" min="0" step="0.01" inputMode="decimal" className="mt-1.5 tabular-nums" {...campo("valor")} />
          </div>
          <div>
            <Label htmlFor="n-etapa">Etapa</Label>
            <Select value={form.etapa} onValueChange={(v) => setForm({ ...form, etapa: v as EtapaFunil })}>
              <SelectTrigger id="n-etapa" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {etapasFunil.map((e) => <SelectItem key={e.valor} value={e.valor}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="n-unidade">Unidade</Label>
            <Select value={form.produto}
              onValueChange={(v) => setForm({ ...form, produto: v as Form["produto"] })}>
              <SelectTrigger id="n-unidade" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_UNIDADE}>Sem unidade</SelectItem>
                {Object.entries(produtoLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="n-resp">Responsável</Label>
            <Input id="n-resp" className="mt-1.5" {...campo("responsavel")} />
          </div>
          <div>
            <Label htmlFor="n-orig">Origem</Label>
            <Input id="n-orig" className="mt-1.5" placeholder="Indicação, evento, inbound…" {...campo("origem")} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {negocio ? (
            <Button variant="outline" disabled={remover.isPending} onClick={() => remover.mutate()}
              className="text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
              <Trash2 /> Remover
            </Button>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <Button className="sm:min-w-44" disabled={!form.nome.trim() || salvar.isPending}
            onClick={() => salvar.mutate()}>
            {negocio ? "Salvar" : "Cadastrar negócio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
