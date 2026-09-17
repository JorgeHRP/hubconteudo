import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { criarEvento, listarEventos, removerEvento } from "@/data/store";
import type { EventoTipo } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const tipoLabels: Record<EventoTipo, string> = {
  evento: "Evento",
  aniversario: "Aniversário",
  feriado: "Feriado",
  treinamento: "Treinamento",
  comunicado: "Comunicado",
};

const tipoCor: Record<EventoTipo, string> = {
  evento: "bg-primary",
  aniversario: "bg-accent",
  feriado: "bg-destructive",
  treinamento: "bg-info",
  comunicado: "bg-warning",
};

const diasSemana = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default function Calendario() {
  const { userId, isGestor } = useAuth();
  const qc = useQueryClient();
  const podeCriar = isGestor;

  const hoje = new Date();
  const [ref, setRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    titulo: "", data: hoje.toISOString().slice(0, 10),
    tipo: "evento" as EventoTipo, descricao: "",
  });

  const { data: eventos } = useQuery({ queryKey: ["eventos"], queryFn: listarEventos });
  const invalidar = () => qc.invalidateQueries({ queryKey: ["eventos"] });

  const criar = useMutation({
    mutationFn: () =>
      criarEvento({
        titulo: form.titulo.trim(), data: form.data, tipo: form.tipo,
        descricao: form.descricao.trim() || null, criado_por: userId,
      }),
    onSuccess: () => {
      setAberto(false);
      setForm({ titulo: "", data: hoje.toISOString().slice(0, 10), tipo: "evento", descricao: "" });
      invalidar();
      toast.success("Evento criado");
    },
  });

  const apagar = useMutation({
    mutationFn: (id: string) => removerEvento(id),
    onSuccess: () => { invalidar(); toast.success("Evento removido"); },
  });

  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;

  const doMes = (eventos ?? []).filter((e) => e.data.startsWith(prefixo));
  const porDia = (dia: number) =>
    doMes.filter((e) => Number(e.data.slice(8)) === dia);

  const hojeIso = hoje.toISOString().slice(0, 10);

  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={CalendarDays}
        titulo="Calendário"
        subtitulo="Eventos, feriados, treinamentos e aniversários"
        acao={
          podeCriar && (
            <Dialog open={aberto} onOpenChange={setAberto}>
              <DialogTrigger asChild>
                <Button><Plus /> Novo evento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ev-titulo">Título</Label>
                    <Input id="ev-titulo" className="mt-1.5" value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ev-data">Data</Label>
                      <Input id="ev-data" type="date" className="mt-1.5" value={form.data}
                        onChange={(e) => setForm({ ...form, data: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as EventoTipo })}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(tipoLabels).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ev-desc">Descrição</Label>
                    <Textarea id="ev-desc" className="mt-1.5" value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <Button className="w-full" disabled={!form.titulo.trim()} onClick={() => criar.mutate()}>
                    Criar evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon"
                onClick={() => setRef(new Date(ano, mes - 1, 1))}>
                <ChevronLeft />
              </Button>
              <p className="text-sm font-semibold capitalize">
                {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
              <Button variant="ghost" size="icon"
                onClick={() => setRef(new Date(ano, mes + 1, 1))}>
                <ChevronRight />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {diasSemana.map((d) => (
                <div key={d} className="pb-2 text-[10px] font-medium uppercase text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`v${i}`} />)}
              {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => {
                const iso = `${prefixo}-${String(dia).padStart(2, "0")}`;
                const doDia = porDia(dia);
                return (
                  <div
                    key={dia}
                    className={cn(
                      "min-h-[62px] rounded-md border p-1 text-left",
                      iso === hojeIso ? "border-primary bg-primary/5" : "border-transparent bg-muted/20"
                    )}
                  >
                    <span className={cn("text-xs", iso === hojeIso && "font-bold text-primary")}>{dia}</span>
                    <div className="mt-0.5 space-y-0.5">
                      {doDia.slice(0, 2).map((e) => (
                        <div key={e.id} className="flex items-center gap-1">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tipoCor[e.tipo])} />
                          <span className="truncate text-[9px] text-muted-foreground">{e.titulo}</span>
                        </div>
                      ))}
                      {doDia.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{doDia.length - 2}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 pt-4">
            <p className="mb-3 text-sm font-semibold">Eventos do mês</p>
            <div className="space-y-2">
              {doMes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nada agendado neste mês.</p>
              )}
              {doMes.map((e) => (
                <div key={e.id} className="flex items-start gap-2 rounded-md border p-2">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tipoCor[e.tipo])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      dia {e.data.slice(8)} · <Badge variant="secondary" className="text-[9px]">{tipoLabels[e.tipo]}</Badge>
                    </p>
                    {e.descricao && <p className="mt-1 text-xs text-muted-foreground">{e.descricao}</p>}
                  </div>
                  {podeCriar && e.criado_por && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      onClick={() => apagar.mutate(e.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
