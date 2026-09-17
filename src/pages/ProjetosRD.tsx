import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Rocket, Plus, Building2, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  criarImplantacao, encerrarImplantacao, listarEmpresas, listarImplantacoes,
} from "@/data/store";
import {
  ferramentaLabels, ferramentaTom, roteiroDaFerramenta, type Ferramenta, type FaseImplantacao,
} from "@/modulos/rd/roteiros";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ferramentas = Object.keys(ferramentaLabels) as Ferramenta[];

/** Progresso do roteiro: itens concluídos sobre o total. */
export function progressoDaFerramenta(fases: unknown[]) {
  const lista = fases as FaseImplantacao[];
  const itens = lista.flatMap((f) => f.items ?? []);
  const feitos = itens.filter((i) => i.status === "concluido" || i.status === "nao_se_aplica");
  return { total: itens.length, feitos: feitos.length };
}

export default function ProjetosRD() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [escolhidas, setEscolhidas] = useState<Ferramenta[]>(["rd_crm"]);

  const { data: empresas } = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas });
  const { data: implantacoes } = useQuery({ queryKey: ["implantacoes"], queryFn: listarImplantacoes });

  const criar = useMutation({
    mutationFn: () =>
      criarImplantacao({
        empresa_id: empresaId,
        ferramentas: escolhidas,
        roteiros: Object.fromEntries(escolhidas.map((f) => [f, roteiroDaFerramenta(f)])),
        criado_por: userId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["implantacoes"] });
      qc.invalidateQueries({ queryKey: ["projetos"] });
      setAberto(false);
      setEmpresaId("");
      setEscolhidas(["rd_crm"]);
      toast.success("Implantação criada com o roteiro completo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const encerrar = useMutation({
    mutationFn: (id: string) => encerrarImplantacao(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["implantacoes"] });
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Implantação encerrada");
    },
  });

  const semImplantacao = (empresas ?? []).filter(
    (e) => !implantacoes?.some((i) => i.empresa_id === e.id)
  );
  const nomeEmpresa = (id: string) =>
    empresas?.find((e) => e.id === id)?.nome_fantasia ?? "—";

  const novaImplantacao = (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button disabled={semImplantacao.length === 0}><Plus /> Nova implantação</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova implantação</DialogTitle>
          <DialogDescription>
            Cada ferramenta escolhida abre com o roteiro completo de fases e checklist.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {semImplantacao.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Ferramentas contratadas</Label>
            <div className="mt-2 grid gap-1.5">
              {ferramentas.map((f) => {
                const marcada = escolhidas.includes(f);
                const roteiro = roteiroDaFerramenta(f);
                const itens = roteiro.flatMap((x) => x.items).length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setEscolhidas((s) => s.includes(f) ? s.filter((x) => x !== f) : [...s, f])
                    }
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                      marcada ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      marcada ? "border-primary bg-primary" : "border-input"
                    )}>
                      {marcada && <span className="text-[10px] leading-none text-primary-foreground">✓</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ferramentaLabels[f]}</p>
                      <p className="text-xs text-muted-foreground">
                        {roteiro.length} fases · {itens} itens de checklist
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!empresaId || escolhidas.length === 0 || criar.isPending}
            onClick={() => criar.mutate()}
          >
            Criar implantação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Rocket}
        titulo="Projetos de Implantação RD"
        subtitulo="Roteiro por ferramenta, do acesso ao go-live"
        acao={novaImplantacao}
      />

      {(empresas ?? []).length === 0 ? (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhum cliente cadastrado"
          descricao="A implantação é sempre de um cliente da carteira. Cadastre a empresa no Painel de CS primeiro."
          acao={<Button asChild variant="outline"><Link to="/cs">Ir para o Painel de CS</Link></Button>}
        />
      ) : implantacoes?.length === 0 ? (
        <EstadoVazio
          icone={Rocket}
          titulo="Nenhuma implantação em andamento"
          descricao="Crie a primeira. O RD CRM abre com 10 fases e 38 itens; o RD Conversas, com 7 fases e 54 itens."
          acao={novaImplantacao}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {implantacoes?.map((i) => {
            const totais = i.ferramentas.map((f) => progressoDaFerramenta(i.dados[f]?.fases ?? []));
            const total = totais.reduce((s, t) => s + t.total, 0);
            const feitos = totais.reduce((s, t) => s + t.feitos, 0);
            const pct = total ? Math.round((feitos / total) * 100) : 0;

            return (
              <Card key={i.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-5 pt-5">
                  <Link to={`/projetos-rd/${i.id}`} className="group">
                    <p className="truncate font-semibold group-hover:text-primary">
                      {nomeEmpresa(i.empresa_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde {formatDate(i.created_at.slice(0, 10))}
                    </p>
                  </Link>

                  <div className="my-3 flex flex-wrap gap-1">
                    {i.ferramentas.map((f) => (
                      <span key={f}
                        className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium",
                          ferramentaTom[f as Ferramenta])}>
                        {ferramentaLabels[f as Ferramenta]}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium tabular-nums">{feitos} de {total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          pct === 100 ? "bg-success" : "gradient-primary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {pct === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                        {pct}% concluído
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          title="Encerrar implantação"
                          onClick={() => encerrar.mutate(i.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link to={`/projetos-rd/${i.id}`}><ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
