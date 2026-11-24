import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Rocket, Plus, Building2, ArrowRight, Trash2, CheckCircle2, Check } from "lucide-react";
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
import { EsqueletoTabela } from "@/components/Esqueletos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
                    aria-pressed={marcada}
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      marcada ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div aria-hidden className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      marcada ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"
                    )}>
                      {marcada && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
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

      {!empresas || !implantacoes ? (
        <div role="status" aria-label="Carregando implantações">
          <EsqueletoTabela linhas={4} colunas={4} />
        </div>
      ) : empresas.length === 0 ? (
        <EstadoVazio
          icone={Building2}
          titulo="Nenhum cliente cadastrado"
          descricao="A implantação é sempre de um cliente da carteira. Cadastre a empresa no Painel de CS primeiro."
          acao={<Button asChild variant="outline"><Link to="/cs">Ir para o Painel de CS</Link></Button>}
        />
      ) : implantacoes.length === 0 ? (
        <EstadoVazio
          icone={Rocket}
          titulo="Nenhuma implantação em andamento"
          descricao="Crie a primeira. O RD CRM abre com 10 fases e 38 itens; o RD Conversas, com 7 fases e 54 itens."
          acao={novaImplantacao}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 sm:pl-5">Cliente</TableHead>
                <TableHead>Ferramentas</TableHead>
                <TableHead className="w-[15rem]">Progresso</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="pr-4 text-right sm:pr-5">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {implantacoes.map((i) => {
                const totais = i.ferramentas.map((f) => progressoDaFerramenta(i.dados[f]?.fases ?? []));
                const total = totais.reduce((s, t) => s + t.total, 0);
                const feitos = totais.reduce((s, t) => s + t.feitos, 0);
                const pct = total ? Math.round((feitos / total) * 100) : 0;

                return (
                  <TableRow key={i.id}>
                    <TableCell className="max-w-[16rem] pl-4 sm:pl-5">
                      <Link to={`/projetos-rd/${i.id}`}
                        className="block truncate rounded-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                        {nomeEmpresa(i.empresa_id)}
                      </Link>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        Desde {formatDate(i.created_at.slice(0, 10))}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {i.ferramentas.map((f) => (
                          <span key={f}
                            className={cn("whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
                              ferramentaTom[f as Ferramenta])}>
                            {ferramentaLabels[f as Ferramenta]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                          role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
                          aria-label={`Progresso de ${nomeEmpresa(i.empresa_id)}`}>
                          <div
                            className={cn("h-full rounded-full transition-all",
                              pct === 100 ? "bg-success" : "bg-primary")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          {feitos} de {total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pct === 100 ? "success" : pct > 0 ? "info" : "secondary"}
                        className="gap-1 whitespace-nowrap tabular-nums">
                        {pct === 100 && <CheckCircle2 className="h-3 w-3" aria-hidden />}
                        {pct}% concluído
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-3 sm:pr-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Encerrar implantação" aria-label="Encerrar implantação"
                          onClick={() => encerrar.mutate(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" asChild>
                          <Link to={`/projetos-rd/${i.id}`} title="Abrir implantação" aria-label="Abrir implantação">
                            <ArrowRight className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
