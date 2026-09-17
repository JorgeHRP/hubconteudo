import { useState, useEffect } from "react";
import { CalendarIcon, Check, Clock, AlertCircle, Plus, Trash2, Save, List, LayoutGrid } from "lucide-react";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import ModificationFooter, { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  "Publicado": { icon: Check, className: "badge-active" },
  "Em produção": { icon: Clock, className: "badge-pending" },
  "Revisão": { icon: AlertCircle, className: "badge-status bg-blue-100 text-blue-700" },
  "Agendado": { icon: CalendarIcon, className: "badge-status bg-muted text-muted-foreground" },
};

const typeConfig = {
  "Blog": "bg-eseg-blue/10 text-eseg-blue",
  "Página": "bg-eseg-navy/10 text-eseg-navy",
  "Landing Page": "bg-eseg-cyan/10 text-eseg-cyan",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Calendário Editorial</h1>
          <p className="text-muted-foreground text-sm mt-1">Cronograma de publicações e entregas</p>
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Os artigos <strong>Backlinks</strong> podem sofrer alteração de data de acordo com a postagem de cada plataforma.</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            variant={hasChanges ? "default" : "outline"}
            size="sm"
            className={hasChanges ? "bg-primary" : ""}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="h-4 w-4 mr-1" />
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
                <Button onClick={handleAdd} className="w-full bg-primary">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <p className="stat-value">{stats.total}</p>
          <p className="stat-label">Total</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-1">
          <p className="stat-value text-emerald-600">{stats.published}</p>
          <p className="stat-label">Publicados</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-2">
          <p className="stat-value text-amber-500">{stats.inProgress}</p>
          <p className="stat-label">Em andamento</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-3">
          <p className="stat-value text-muted-foreground">{stats.scheduled}</p>
          <p className="stat-label">Agendados</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
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

        <div className="flex gap-2">
          {["all", "Publicado", "Em produção", "Revisão", "Agendado"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-primary" : ""}
            >
              {status === "all" ? "Todos" : status}
            </Button>
          ))}
        </div>

        <div className="ml-auto inline-flex rounded-md border border-input overflow-hidden">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode("calendar")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" /> Calendário
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
              <div className="flex items-center gap-3 sticky top-0 z-10 bg-background/80 backdrop-blur py-2">
                <h2 className="text-lg font-semibold capitalize text-eseg-navy">{monthLabel}</h2>
                <span className="text-xs text-muted-foreground">{groupedByMonth[monthKey].length} publicações</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {groupedByMonth[monthKey].map((entry) => {
          const StatusIcon = statusConfig[entry.status].icon;
          return (
            <div key={entry.id} className="glass-card-hover p-5">
              <div className="flex items-start gap-4">
                <div className="text-center min-w-[70px]">
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                    className="h-8 text-xs px-1 text-center"
                  />
                  <p className="text-xs text-muted-foreground uppercase mt-1">
                    {format(new Date(entry.date), "MMM/yy", { locale: ptBR })}
                  </p>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                      className="h-8 font-semibold flex-1 min-w-[200px]"
                      placeholder="Título"
                    />
                    <Select value={entry.type} onValueChange={(v) => updateEntry(entry.id, { type: v as CalendarEntry["type"] })}>
                      <SelectTrigger className={`h-7 w-auto px-2 text-xs border-0 ${typeConfig[entry.type]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Blog">Blog</SelectItem>
                        <SelectItem value="Página">Página</SelectItem>
                        <SelectItem value="Landing Page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      value={entry.keyword}
                      onChange={(e) => updateEntry(entry.id, { keyword: e.target.value })}
                      placeholder="Palavra-chave"
                      className="h-7 text-xs flex-1 min-w-[180px]"
                    />
                    <Input
                      value={entry.author}
                      onChange={(e) => updateEntry(entry.id, { author: e.target.value })}
                      placeholder="Autor"
                      className="h-7 text-xs flex-1 min-w-[140px]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={entry.destino} onValueChange={(v) => updateEntry(entry.id, { destino: v as CalendarEntry["destino"] })}>
                    <SelectTrigger className={`h-8 w-auto px-2 text-xs ${entry.destino === "Backlink" ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-eseg-blue/10 text-eseg-blue border-eseg-blue/30"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blog ESEG">Blog ESEG</SelectItem>
                      <SelectItem value="Backlink">Backlink</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={entry.status} onValueChange={(v) => updateEntry(entry.id, { status: v as CalendarEntry["status"] })}>
                    <SelectTrigger className={`h-8 w-auto px-2 text-xs ${statusConfig[entry.status].className}`}>
                      <StatusIcon className="inline h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Em produção">Em produção</SelectItem>
                      <SelectItem value="Revisão">Revisão</SelectItem>
                      <SelectItem value="Publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}>
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
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">Nenhuma publicação encontrada para o filtro selecionado.</p>
          </div>
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
              <div key={monthKey} className="glass-card p-4">
                <h2 className="text-lg font-semibold capitalize text-eseg-navy mb-3">{monthLabel}</h2>
                <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-1">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <div key={d} className="text-center py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[90px] rounded-md border border-border/50 p-1.5 text-xs",
                        cell ? "bg-card" : "bg-muted/30"
                      )}
                    >
                      {cell && (
                        <>
                          <div className="text-right text-[11px] font-semibold text-muted-foreground mb-1">{cell.day}</div>
                          <div className="space-y-1">
                            {cell.entries.map((e) => (
                              <div
                                key={e.id}
                                title={`${e.title} — ${e.status}`}
                                className={cn(
                                  "truncate rounded px-1.5 py-0.5 text-[10px] leading-tight cursor-default",
                                  e.destino === "Backlink"
                                    ? "bg-amber-100 text-amber-800 border-l-2 border-amber-500"
                                    : "bg-eseg-blue/10 text-eseg-blue border-l-2 border-eseg-blue"
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
            );
          })}

          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Nenhuma publicação encontrada para o filtro selecionado.</p>
            </div>
          )}
        </div>
      )}

      <ModificationFooter storageKey={STORAGE_KEY} history={modTracker.history} />
    </div>
  );
};

export default EditorialCalendar;


