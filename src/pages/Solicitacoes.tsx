import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarSolicitacao, listarProfiles, listarSolicitacoes, mudarStatusSolicitacao } from "@/data/store";
import type { SolicitacaoStatus } from "@/lib/types";
import { formatDate } from "@/lib/cs-data";
import { PageHeader } from "@/components/PageHeader";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categorias = ["RH", "TI", "Financeiro", "Facilities", "Outro"];

const statusLabel: Record<SolicitacaoStatus, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const statusVariant: Record<SolicitacaoStatus, "warning" | "info" | "success"> = {
  aberta: "warning",
  em_andamento: "info",
  concluida: "success",
};

export default function Solicitacoes() {
  const { userId, isGestor } = useAuth();
  const qc = useQueryClient();
  const podeTratar = isGestor;

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ categoria: "RH", titulo: "", descricao: "" });

  const { data: solicitacoes } = useQuery({ queryKey: ["solicitacoes"], queryFn: listarSolicitacoes });
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: listarProfiles });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["solicitacoes"] });

  const criar = useMutation({
    mutationFn: () => criarSolicitacao(userId!, form.categoria, form.titulo.trim(), form.descricao.trim()),
    onSuccess: () => {
      setAberto(false);
      setForm({ categoria: "RH", titulo: "", descricao: "" });
      invalidar();
      toast.success("Solicitação aberta");
    },
  });

  const mudar = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SolicitacaoStatus }) =>
      mudarStatusSolicitacao(id, status),
    onSuccess: () => { invalidar(); toast.success("Status atualizado"); },
  });

  const visiveis = (solicitacoes ?? []).filter((s) => podeTratar || s.solicitante_id === userId);
  const nomeDe = (id: string) => profiles?.find((p) => p.user_id === id)?.nome ?? "—";

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={ClipboardList}
        titulo="Solicitações"
        subtitulo={podeTratar ? "Todos os chamados internos" : "Seus chamados internos"}
        acao={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button><Plus /> Nova solicitação</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova solicitação</DialogTitle>
                <DialogDescription>O time responsável recebe e acompanha por aqui.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo" className="mt-1.5" value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Resumo em uma linha"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao" className="mt-1.5" value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Detalhe o que você precisa"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!form.titulo.trim() || !form.descricao.trim() || criar.isPending}
                  onClick={() => criar.mutate()}
                >
                  Abrir solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {visiveis.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.titulo}</span>
                    <Badge variant="secondary" className="text-[9px]">{s.categoria}</Badge>
                    <Badge variant={statusVariant[s.status]} className="text-[9px]">
                      {statusLabel[s.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.descricao}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {nomeDe(s.solicitante_id)} · aberta em {formatDate(s.created_at.slice(0, 10))}
                  </p>
                </div>
                {podeTratar && s.status !== "concluida" && (
                  <div className="flex shrink-0 gap-2">
                    {s.status === "aberta" && (
                      <Button size="sm" variant="outline"
                        onClick={() => mudar.mutate({ id: s.id, status: "em_andamento" })}>
                        Iniciar
                      </Button>
                    )}
                    <Button size="sm"
                      onClick={() => mudar.mutate({ id: s.id, status: "concluida" })}>
                      Concluir
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {visiveis.length === 0 && (
          <EstadoVazio
            icone={ClipboardList}
            titulo="Nenhuma solicitação"
            descricao="Abra um chamado para RH, TI, Financeiro ou Facilities e acompanhe o andamento por aqui."
          />
        )}
      </div>
    </div>
  );
}
