import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, ExternalLink, Users, Clock, Trash2, Plug } from "lucide-react";
import { toast } from "sonner";
import { criarReuniao, listarIntegracoes, listarReunioes, removerReuniao } from "@/data/store";
import { formatDate } from "@/lib/cs-data";
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

const vazio = {
  titulo: "", data: "", duracao_minutos: "", participantes: "", resumo: "", gravacao_url: "",
};

export function ReunioesCliente({
  clienteId,
  readWorkspaceUrl,
}: {
  clienteId: string;
  readWorkspaceUrl: string | null;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);

  const { data: reunioes } = useQuery({
    queryKey: ["reunioes", clienteId],
    queryFn: () => listarReunioes(clienteId),
  });
  const { data: integracoes } = useQuery({ queryKey: ["integracoes"], queryFn: listarIntegracoes });

  const read = integracoes?.find((i) => i.chave === "read_ai");

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["reunioes", clienteId] });
    qc.invalidateQueries({ queryKey: ["historico", clienteId] });
    qc.invalidateQueries({ queryKey: ["producao", clienteId] });
  };

  const criar = useMutation({
    mutationFn: () =>
      criarReuniao({
        cliente_id: clienteId,
        titulo: form.titulo.trim(),
        data: form.data,
        duracao_minutos: Number(form.duracao_minutos) || null,
        participantes: form.participantes
          .split(",").map((p) => p.trim()).filter(Boolean),
        resumo: form.resumo.trim() || null,
        gravacao_url: form.gravacao_url.trim() || null,
      }),
    onSuccess: () => {
      setAberto(false);
      setForm(vazio);
      invalidar();
      toast.success("Reunião registrada");
    },
  });

  const apagar = useMutation({
    mutationFn: (id: string) => removerReuniao(id),
    onSuccess: () => { invalidar(); toast.success("Reunião removida"); },
  });

  const registrar = (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus /> Registrar reunião</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar reunião</DialogTitle>
          <DialogDescription>
            Com o Read.ai ligado, as reuniões entram sozinhas. Use isto para registrar
            uma que aconteceu fora dele.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="re-tit">Título</Label>
            <Input id="re-tit" className="mt-1.5" value={form.titulo}
              placeholder="Reunião de carteira — setembro"
              onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="re-data">Data</Label>
              <Input id="re-data" type="date" className="mt-1.5" value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="re-dur">Duração (min)</Label>
              <Input id="re-dur" type="number" className="mt-1.5" value={form.duracao_minutos}
                onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="re-part">Participantes</Label>
            <Input id="re-part" className="mt-1.5" value={form.participantes}
              placeholder="Separe por vírgula"
              onChange={(e) => setForm({ ...form, participantes: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="re-res">Resumo / ata</Label>
            <Textarea id="re-res" className="mt-1.5" value={form.resumo}
              placeholder="O que ficou decidido"
              onChange={(e) => setForm({ ...form, resumo: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="re-grav">Link da gravação</Label>
            <Input id="re-grav" className="mt-1.5" value={form.gravacao_url} placeholder="https://…"
              onChange={(e) => setForm({ ...form, gravacao_url: e.target.value })} />
          </div>
          <Button className="w-full" disabled={!form.titulo.trim() || !form.data}
            onClick={() => criar.mutate()}>
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      {read && !read.conectada && (
        <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <Plug className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">Read.ai não conectado.</strong> Ao ligar a
            integração, as gravações e atas de cada reunião deste cliente entram aqui e na
            linha do tempo automaticamente.
            {readWorkspaceUrl
              ? " O workspace do cliente já está cadastrado."
              : " Cadastre o workspace do Read na edição do cliente."}
          </span>
        </div>
      )}

      <div className="flex justify-end">{registrar}</div>

      {reunioes?.length === 0 ? (
        <EstadoVazio
          icone={Video}
          titulo="Nenhuma reunião registrada"
          descricao="Com o Read.ai ligado, cada reunião gravada vira um registro aqui — com resumo, participantes e link da gravação — e entra na jornada do cliente."
        />
      ) : (
        <div className="space-y-3">
          {reunioes?.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{r.titulo}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(r.data)}</span>
                      {r.duracao_minutos && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.duracao_minutos} min
                        </span>
                      )}
                      {r.participantes.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {r.participantes.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="text-[9px]">
                      {r.read_meeting_id ? "Read.ai" : "Manual"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => apagar.mutate(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {r.resumo && (
                  <p className="mt-2 whitespace-pre-wrap border-t pt-2 text-sm text-muted-foreground">
                    {r.resumo}
                  </p>
                )}

                {r.participantes.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.participantes.join(" · ")}
                  </p>
                )}

                {(r.gravacao_url || r.transcricao_url) && (
                  <div className="mt-2 flex gap-3">
                    {r.gravacao_url && (
                      <a href={r.gravacao_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Gravação <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {r.transcricao_url && (
                      <a href={r.transcricao_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Transcrição <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
