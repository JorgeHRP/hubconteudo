import { useState, useEffect } from "react";
import { CalendarIcon, Check, Clock, AlertCircle, Plus, Trash2, Save, List, LayoutGrid } from "lucide-react";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import ModificationFooter, { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/modulos/seo/hooks/use-toast";

interface CalendarEntry {
  id: number;
  date: string;
  title: string;
  keyword: string;
  status: "Publicado" | "Em produção" | "Revisão" | "Agendado";
  author: string;
  type: "Blog" | "Página" | "Landing Page";
  destino: "Blog ESEG" | "Backlink";
}

const initialData: CalendarEntry[] = [
  { id: 1, date: "2026-04-07", title: "Faculdade de Administração em SP: Guia Completo", keyword: "faculdade de administração sp", status: "Publicado", author: "Equipe ESEG", type: "Blog", destino: "Blog ESEG" },
  { id: 2, date: "2026-04-10", title: "Engenharia de Produção: Mercado e Carreira", keyword: "engenharia de produção", status: "Publicado", author: "Equipe ESEG", type: "Blog", destino: "Blog ESEG" },
  { id: 3, date: "2026-04-14", title: "MBA em Gestão: Quando vale a pena?", keyword: "mba gestão empresarial", status: "Em produção", author: "Conteúdo Martech", type: "Blog", destino: "Backlink" },
  { id: 4, date: "2026-04-17", title: "Vestibular 2026: Tudo que você precisa saber", keyword: "vestibular 2026", status: "Agendado", author: "Conteúdo Martech", type: "Blog", destino: "Blog ESEG" },
  { id: 5, date: "2026-04-21", title: "Otimização página de Graduação", keyword: "cursos de graduação sp", status: "Em produção", author: "Conteúdo Martech", type: "Página", destino: "Blog ESEG" },
  { id: 6, date: "2026-04-24", title: "O que faz um Administrador de Empresas?", keyword: "administrador de empresas", status: "Revisão", author: "Equipe ESEG", type: "Blog", destino: "Backlink" },
  { id: 7, date: "2026-04-28", title: "Landing Page Vestibular 2026.2", keyword: "vestibular eseg 2026", status: "Agendado", author: "Conteúdo Martech", type: "Landing Page", destino: "Blog ESEG" },
  { id: 8, date: "2026-05-02", title: "Pós-graduação em Gestão de Pessoas", keyword: "pós graduação gestão de pessoas", status: "Agendado", author: "Equipe ESEG", type: "Blog", destino: "Blog ESEG" },
  { id: 9, date: "2026-05-05", title: "Diferenças entre Engenharia de Produção e Mecânica", keyword: "engenharia de produção vs mecânica", status: "Agendado", author: "Conteúdo Martech", type: "Blog", destino: "Backlink" },
  { id: 10, date: "2026-05-08", title: "Como escolher a melhor faculdade em SP", keyword: "melhor faculdade sp", status: "Agendado", author: "Equipe ESEG", type: "Blog", destino: "Blog ESEG" },
];

const STORAGE_KEY = "editorial-calendar";

const statusConfig = {
  "Publicado": { icon: Check, className: "border-success/20 bg-success/10 text-success" },
  "Em produção": { icon: Clock, className: "border-warning/30 bg-warning/15 text-warning-strong" },
  "Revisão": { icon: AlertCircle, className: "border-info/20 bg-info/10 text-info" },
  "Agendado": { icon: CalendarIcon, className: "border-border bg-muted text-muted-foreground" },
};

const typeConfig = {
  "Blog": "bg-info/10 text-info",
  "Página": "bg-primary/10 text-primary",
  "Landing Page": "bg-accent/10 text-accent",
};

const EditorialCalendar = () => {
  const { value: sharedEntries, save: saveShared, loading: sharedLoading } = useSharedData<CalendarEntry[] | null>(STORAGE_KEY, null);
  const modTracker = useModificationTracker(STORAGE_KEY);
  const comecaVazio = useComecaVazio();
  const [entries, setEntries] = useState<CalendarEntry[]>(comecaVazio ? [] : initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);

  useEffect(() => {
    if (sharedLoading || hasChanges) return;
    if (Array.isArray(sharedEntries) && sharedEntries.length > 0) {
      setEntries(sharedEntries);
    } else {
      setEntries(comecaVazio ? [] : initialData);
    }
  }, [sharedEntries, sharedLoading, hasChanges, comecaVazio]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: "",
    title: "",
    keyword: "",
    status: "Agendado" as CalendarEntry["status"],
    author: "",
    type: "Blog" as CalendarEntry["type"],
    destino: "Blog ESEG" as CalendarEntry["destino"],
  });

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 4, 31),
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const filtered = entries
    .filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (dateRange.from && new Date(entry.date) < dateRange.from) return false;
      if (dateRange.to && new Date(entry.date) > dateRange.to) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const groupedByMonth = filtered.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
    const key = entry.date.slice(0, 7); // YYYY-MM
    (acc[key] ||= []).push(entry);
    return acc;
  }, {});
  const monthKeys = Object.keys(groupedByMonth).sort();

  const stats = {
    total: entries.length,
    published: entries.filter(e => e.status === "Publicado").length,
    inProgress: entries.filter(e => e.status === "Em produção" || e.status === "Revisão").length,
    scheduled: entries.filter(e => e.status === "Agendado").length,
  };

  const handleAdd = () => {
    if (!newEntry.title || !newEntry.date) {
      toast({ title: "Preencha pelo menos título e data", variant: "destructive" });
      return;
    }
    const id = Math.max(0, ...entries.map(e => e.id)) + 1;
    setEntries(prev => [...prev, { ...newEntry, id }]);
    setHasChanges(true);
    setPendingChanges(prev => [...prev, `Adicionou "${newEntry.title}"`]);
    setNewEntry({ date: "", title: "", keyword: "", status: "Agendado", author: "", type: "Blog", destino: "Blog ESEG" });
    setDialogOpen(false);
    toast({ title: "Card adicionado!" });
  };

  const updateEntry = (id: number, patch: Partial<CalendarEntry>) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...patch };
      Object.entries(patch).forEach(([k, v]) => {
        const oldV = (e as any)[k];
        if (String(oldV) !== String(v)) {
          setPendingChanges(p => [...p, `Alterou "${k}" de "${oldV}" para "${v}" em "${e.title}"`]);
        }
      });
      return updated;
    }));
    setHasChanges(true);
  };

  const handleDelete = (id: number) => {
    const removed = entries.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setHasChanges(true);
    setPendingChanges(prev => [...prev, `Removeu "${removed?.title || id}"`]);
  };

  const handleSave = async () => {
    const ok = await saveShared(entries);
    if (!ok) {
      toast({ title: "Erro ao salvar. Verifique sua conexão.", variant: "destructive" });
      return;
    }
    const changesText = pendingChanges.length > 0 ? pendingChanges.join("; ") : "Salvamento manual";
    modTracker.trackSave(changesText);
    setPendingChanges([]);
    setHasChanges(false);
    toast({ title: "Dados salvos e compartilhados!" });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Calendário Editorial</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Cronograma de publicações e entregas</p>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/15 px-3 py-2 text-xs text-warning-strong">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Os artigos <strong>Backlinks</strong> podem sofrer alteração de data de acordo com a postagem de cada plataforma.</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            variant={hasChanges ? "default" : "outline"}
            size="sm"
            className="h-9"
          >
            <Save className="mr-1 h-4 w-4" />
            Salvar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Publicação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Título *" value={newEntry.title} onChange={e => setNewEntry(p => ({ ...p, title: e.target.value }))} />
                <Input type="date" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} />
                <Input placeholder="Palavra-chave" value={newEntry.keyword} onChange={e => setNewEntry(p => ({ ...p, keyword: e.target.value }))} />
                <Input placeholder="Autor" value={newEntry.author} onChange={e => setNewEntry(p => ({ ...p, author: e.target.value }))} />
                <Select value={newEntry.type} onValueChange={v => setNewEntry(p => ({ ...p, type: v as CalendarEntry["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="Página">Página</SelectItem>
                    <SelectItem value="Landing Page">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newEntry.status} onValueChange={v => setNewEntry(p => ({ ...p, status: v as CalendarEntry["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Em produção">Em produção</SelectItem>
                    <SelectItem value="Revisão">Revisão</SelectItem>
                    <SelectItem value="Publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newEntry.destino} onValueChange={v => setNewEntry(p => ({ ...p, destino: v as CalendarEntry["destino"] }))}>
                  <SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blog ESEG">Blog ESEG</SelectItem>
                    <SelectItem value="Backlink">Backlink</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Publicados</p>
          <p className="mt-1 font-display text-2xl font-semibold text-success">{stats.published}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Em andamento</p>
          <p className="mt-1 font-display text-2xl font-semibold text-warning-strong">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Agendados</p>
          <p className="mt-1 font-display text-2xl font-semibold text-muted-foreground">{stats.scheduled}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 w-full justify-start text-left font-normal sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2">
          {["all", "Publicado", "Em produção", "Revisão", "Agendado"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className="h-9"
            >
              {status === "all" ? "Todos" : status}
            </Button>
          ))}
        </div>

        <div className="inline-flex overflow-hidden rounded-md border border-input bg-card sm:ml-auto">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <List className="mr-1 h-4 w-4" /> Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none"
            aria-pressed={viewMode === "calendar"}
            onClick={() => setViewMode("calendar")}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> Calendário
          </Button>
        </div>
      </div>

      {viewMode === "list" && (
      <div className="space-y-6">
        {monthKeys.map((monthKey) => {
          const [y, m] = monthKey.split("-").map(Number);
          const monthLabel = format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
          return (
            <div key={monthKey} className="space-y-3">
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-background py-2">
                <h3 className="text-base font-semibold capitalize text-foreground">{monthLabel}</h3>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{groupedByMonth[monthKey].length} publicações</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {groupedByMonth[monthKey].map((entry) => {
          const StatusIcon = statusConfig[entry.status].icon;
          return (
            <div key={entry.id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                <div className="flex items-center gap-2 lg:w-[140px] lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-1">
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                    aria-label="Data da publicação"
                    className="h-9 w-[150px] px-2 text-xs lg:w-full"
                  />
                  <p className="text-xs uppercase text-muted-foreground lg:text-center">
                    {format(new Date(entry.date), "MMM/yy", { locale: ptBR })}
                  </p>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                      className="h-9 min-w-0 flex-1 basis-[200px] font-semibold"
                      placeholder="Título"
                      aria-label="Título"
                    />
                    <Select value={entry.type} onValueChange={(v) => updateEntry(entry.id, { type: v as CalendarEntry["type"] })}>
                      <SelectTrigger aria-label="Tipo" className={`h-9 w-auto gap-1 border-0 px-2.5 text-xs font-medium ${typeConfig[entry.type]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Blog">Blog</SelectItem>
                        <SelectItem value="Página">Página</SelectItem>
                        <SelectItem value="Landing Page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={entry.keyword}
                      onChange={(e) => updateEntry(entry.id, { keyword: e.target.value })}
                      placeholder="Palavra-chave"
                      aria-label="Palavra-chave"
                      className="h-9 min-w-0 flex-1 basis-[180px] text-xs"
                    />
                    <Input
                      value={entry.author}
                      onChange={(e) => updateEntry(entry.id, { author: e.target.value })}
                      placeholder="Autor"
                      aria-label="Autor"
                      className="h-9 min-w-0 flex-1 basis-[140px] text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={entry.destino} onValueChange={(v) => updateEntry(entry.id, { destino: v as CalendarEntry["destino"] })}>
                    <SelectTrigger aria-label="Destino" className={`h-9 w-auto gap-1 px-2.5 text-xs font-medium ${entry.destino === "Backlink" ? "border-warning/30 bg-warning/15 text-warning-strong" : "border-info/20 bg-info/10 text-info"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blog ESEG">Blog ESEG</SelectItem>
                      <SelectItem value="Backlink">Backlink</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={entry.status} onValueChange={(v) => updateEntry(entry.id, { status: v as CalendarEntry["status"] })}>
                    <SelectTrigger aria-label="Status" className={`h-9 w-auto gap-1 px-2.5 text-xs font-medium ${statusConfig[entry.status].className}`}>
                      <StatusIcon className="inline h-3 w-3 shrink-0" aria-hidden />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Em produção">Em produção</SelectItem>
                      <SelectItem value="Revisão">Revisão</SelectItem>
                      <SelectItem value="Publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label="Remover publicação" className="ml-auto h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:ml-0" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <EstadoVazio
            icone={CalendarIcon}
            titulo="Nenhuma publicação encontrada"
            descricao="Nenhuma publicação encontrada para o filtro selecionado."
          />
        )}
      </div>
      )}

      {viewMode === "calendar" && (
        <div className="space-y-6">
          {monthKeys.map((monthKey) => {
            const [y, m] = monthKey.split("-").map(Number);
            const firstDay = new Date(y, m - 1, 1);
            const monthLabel = format(firstDay, "MMMM 'de' yyyy", { locale: ptBR });
            const daysInMonth = new Date(y, m, 0).getDate();
            const startWeekday = firstDay.getDay(); // 0 = Sun
            const cells: ({ day: number; entries: CalendarEntry[] } | null)[] = [];
            for (let i = 0; i < startWeekday; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${monthKey}-${String(d).padStart(2, "0")}`;
              cells.push({
                day: d,
                entries: groupedByMonth[monthKey].filter((e) => e.date === dateStr),
              });
            }
            while (cells.length % 7 !== 0) cells.push(null);

            return (
              <div key={monthKey} className="overflow-hidden rounded-lg border bg-card shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
                  <h3 className="text-base font-semibold capitalize text-foreground">{monthLabel}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-sm border border-info/30 bg-info/20" />
                      Blog ESEG
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-sm border border-warning/40 bg-warning/30" />
                      Backlink
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                        <div key={d} className="px-2 py-2 text-center">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-px bg-border">
                      {cells.map((cell, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "min-h-[92px] min-w-0 p-1.5 text-xs",
                            cell ? "bg-card" : "bg-muted/60"
                          )}
                        >
                          {cell && (
                            <>
                              <div
                                className={cn(
                                  "mb-1 text-right text-xs tabular-nums",
                                  cell.entries.length > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                )}
                              >
                                {cell.day}
                              </div>
                              <div className="space-y-1">
                                {cell.entries.map((e) => (
                                  <div
                                    key={e.id}
                                    title={`${e.title} — ${e.status}`}
                                    className={cn(
                                      "cursor-default truncate rounded-sm border-l-2 px-1.5 py-0.5 text-xs leading-snug",
                                      e.destino === "Backlink"
                                        ? "border-warning bg-warning/15 text-warning-strong"
                                        : "border-info bg-info/10 text-info"
                                    )}
                                  >
                                    {e.title}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <EstadoVazio
              icone={CalendarIcon}
              titulo="Nenhuma publicação encontrada"
              descricao="Nenhuma publicação encontrada para o filtro selecionado."
            />
          )}
        </div>
      )}

      <ModificationFooter storageKey={STORAGE_KEY} history={modTracker.history} />
    </div>
  );
};

export default EditorialCalendar;


