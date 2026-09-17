import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { gerarOnboarding, salvarEmpresa, temOnboarding } from "@/data/store";
import { statusEmpresaLabels } from "@/lib/labels-clientes";
import type { ChurnFlag, EmpresaDossie, StatusEmpresa } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const flags: { valor: ChurnFlag; rotulo: string; cor: string }[] = [
  { valor: "green", rotulo: "Saudável", cor: "bg-success" },
  { valor: "yellow", rotulo: "Atenção", cor: "bg-warning" },
  { valor: "red", rotulo: "Risco", cor: "bg-destructive" },
];

/**
 * Controle rápido do cliente: troca status e flag sem sair da lista.
 * Marcar como onboarding oferece gerar o roteiro de 26 etapas.
 */
export function ControleCliente({
  empresa,
  flagAtual,
  aoMudarFlag,
  compacto,
}: {
  empresa: EmpresaDossie;
  flagAtual: ChurnFlag;
  aoMudarFlag: (f: ChurnFlag) => void;
  compacto?: boolean;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [perguntando, setPerguntando] = useState(false);
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));

  const mudarStatus = useMutation({
    mutationFn: (status: StatusEmpresa) =>
      salvarEmpresa({
        id: empresa.id,
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
        status,
        responsavel_id: empresa.responsavel_id,
        observacoes: empresa.observacoes ?? "",
      }),
    onSuccess: (_e, status) => {
      qc.invalidateQueries({ queryKey: ["empresas"] });
      qc.invalidateQueries({ queryKey: ["empresa", empresa.id] });
      toast.success(`${empresa.nome_fantasia}: ${statusEmpresaLabels[status]}`);
      if (status === "onboarding" && !temOnboarding(empresa.id)) setPerguntando(true);
    },
  });

  const gerar = useMutation({
    mutationFn: () => gerarOnboarding(empresa.id, inicio, empresa.responsavel_id, userId),
    onSuccess: (quantidade) => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      setPerguntando(false);
      toast.success(`${quantidade} etapas de onboarding criadas para validação.`);
    },
    onError: (e: Error) => { setPerguntando(false); toast.error(e.message); },
  });

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <Select
        value={empresa.status}
        onValueChange={(v) => mudarStatus.mutate(v as StatusEmpresa)}
      >
        <SelectTrigger className={cn("h-7 text-xs", compacto ? "w-[124px]" : "w-36")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(statusEmpresaLabels) as StatusEmpresa[]).map((s) => (
            <SelectItem key={s} value={s}>{statusEmpresaLabels[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 rounded-md border p-0.5">
        {flags.map((f) => (
          <button
            key={f.valor}
            title={f.rotulo}
            aria-label={`Marcar como ${f.rotulo}`}
            onClick={() => aoMudarFlag(f.valor)}
            className={cn(
              "h-4 w-4 rounded-full transition-all",
              f.cor,
              flagAtual === f.valor
                ? "ring-2 ring-foreground/30 ring-offset-1"
                : "opacity-30 hover:opacity-70"
            )}
          />
        ))}
      </div>

      <Dialog open={perguntando} onOpenChange={setPerguntando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar o onboarding de {empresa.nome_fantasia}?</DialogTitle>
            <DialogDescription>
              São 26 etapas, do contrato ao go-live, distribuídas em 30 dias. Todas nascem
              em fila para o responsável validar antes de subir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ob-inicio">Data de início</Label>
              <Input id="ob-inicio" type="date" className="mt-1.5" value={inicio}
                onChange={(e) => setInicio(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">
                Os prazos de cada etapa são calculados a partir daqui.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPerguntando(false)}>
                Agora não
              </Button>
              <Button className="flex-1" disabled={gerar.isPending} onClick={() => gerar.mutate()}>
                <Rocket /> Gerar 26 etapas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
