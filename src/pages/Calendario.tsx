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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
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

/** Ponto de cor cheia: legenda e marcação do dia no celular. */
const tipoCor: Record<EventoTipo, string> = {
  evento: "bg-primary",
  aniversario: "bg-accent",
  feriado: "bg-destructive",
  treinamento: "bg-info",
  comunicado: "bg-warning",
};

/** Etiqueta em tom suave: eventos dentro da grade e selo do tipo na lista. */
const tipoSuave: Record<EventoTipo, string> = {
  evento: "bg-primary/10 text-primary",
  aniversario: "bg-accent/10 text-accent",
  feriado: "bg-destructive/10 text-destructive",
  treinamento: "bg-info/10 text-info",
  comunicado: "bg-warning/15 text-warning-strong",
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

  // Só desenho: células vazias para fechar a última semana da grade.
  const sobra = (7 - ((primeiroDia + diasNoMes) % 7)) % 7;
  const carregando = eventos === undefined;

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
                <DialogHeader>
                  <DialogTitle>Novo evento</DialogTitle>
                  <DialogDescription>Aparece no calendário de todo o time.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ev-titulo">Título</Label>
                    <Input id="ev-titulo" className="mt-1.5" value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ev-data">Data</Label>
                      <Input id="ev-data" type="date" className="mt-1.5" value={form.data}
                        onChange={(e) => setForm({ ...form, data: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as EventoTipo })}>
                        <SelectTrigger className="mt-1.5" aria-label="Tipo"><SelectValue /></SelectTrigger>
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
                </div>
                <DialogFooter className="gap-2 border-t pt-4 sm:space-x-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button disabled={!form.titulo.trim()} onClick={() => criar.mutate()}>
                    Criar evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <h2 className="font-display text-base font-semibold capitalize" aria-live="polite">
              {ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Mês anterior"
                onClick={() => setRef(new Date(ano, mes - 1, 1))}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Próximo mês"
                onClick={() => setRef(new Date(ano, mes + 1, 1))}>
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b bg-muted/50">
            {diasSemana.map((d) => (
              <div key={d}
                className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`v${i}`} aria-hidden
                className="min-h-[64px] border-b border-r bg-muted/30 sm:min-h-[104px] [&:nth-child(7n)]:border-r-0" />
            ))}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map((dia) => {
              const iso = `${prefixo}-${String(dia).padStart(2, "0")}`;
              const doDia = porDia(dia);
              const ehHoje = iso === hojeIso;
              return (
                <div
                  key={dia}
                  className={cn(
                    "min-h-[64px] min-w-0 border-b border-r p-1 text-left sm:min-h-[104px] sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                    ehHoje && "bg-primary/5"
                  )}
                >
                  <span
                    aria-current={ehHoje ? "date" : undefined}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      ehHoje ? "bg-primary font-semibold text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {dia}
                  </span>

                  {/* Celular: pontos por tipo (o título fica na lista ao lado/abaixo). */}
                  {doDia.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 px-0.5 sm:hidden">
                      {doDia.slice(0, 4).map((e) => (
                        <span key={e.id} title={e.titulo}
                          className={cn("h-2 w-2 rounded-full", tipoCor[e.tipo])} />
                      ))}
                      <span className="sr-only">{doDia.length} evento(s)</span>
                    </div>
                  )}

                  {/* Telas maiores: etiquetas com o título. */}
                  <div className="mt-1 hidden space-y-1 sm:block">
                    {doDia.slice(0, 2).map((e) => (
                      <div key={e.id} title={e.titulo}
                        className={cn("truncate rounded px-1.5 py-0.5 text-xs font-medium", tipoSuave[e.tipo])}>
                        {e.titulo}
                      </div>
                    ))}
                    {doDia.length > 2 && (
                      <span className="block px-1.5 text-xs text-muted-foreground">
                        +{doDia.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: sobra }).map((_, i) => (
              <div key={`s${i}`} aria-hidden
                className="min-h-[64px] border-b border-r bg-muted/30 sm:min-h-[104px] [&:nth-child(7n)]:border-r-0" />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legenda</span>
            {(Object.keys(tipoLabels) as EventoTipo[]).map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden className={cn("h-2 w-2 rounded-full", tipoCor[t])} />
                {tipoLabels[t]}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b py-3.5">
            <CardTitle className="text-base">Eventos do mês</CardTitle>
            {!carregando && doMes.length > 0 && (
              <Badge variant="secondary">{doMes.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {carregando ? (
              <div className="divide-y" role="status" aria-label="Carregando">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : doMes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <CalendarDays className="h-6 w-6 text-accent" aria-hidden />
                <p className="text-sm text-muted-foreground">Nada agendado neste mês.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {doMes.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md",
                        tipoSuave[e.tipo]
                      )}
                    >
                      <span className="sr-only">dia </span>
                      <span className="font-display text-sm font-semibold leading-none">{e.data.slice(8)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.titulo}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn("border-transparent", tipoSuave[e.tipo])}>
                          {tipoLabels[e.tipo]}
                        </Badge>
                      </div>
                      {e.descricao && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{e.descricao}</p>
                      )}
                    </div>
                    {podeCriar && e.criado_por && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                        aria-label={`Remover evento ${e.titulo}`}
                        onClick={() => apagar.mutate(e.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
