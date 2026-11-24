import { useState, useEffect } from "react";
import { Plus, Save, FileText, CheckCircle, XCircle, Wrench, Pencil, User, TrendingUp, Search, CalendarIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EstadoVazio } from "@/components/EstadoVazio";
import { toast } from "@/modulos/seo/hooks/use-toast";
import { type Pauta, type StatusPauta, type TipoPublicacao, type TipoConteudo, type Responsavel, type Prioridade, STORAGE_KEY, initialPautas } from "@/modulos/seo/data/pautasData";
import PautasCalendar from "@/modulos/seo/components/PautasCalendar";
import ModificationFooter, { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";

const statusConfig: Record<StatusPauta, { icon: typeof CheckCircle; className: string }> = {
  "Pauta Aprovada": { icon: CheckCircle, className: "border-success/20 bg-success/10 text-success" },
  "Negada": { icon: XCircle, className: "border-destructive/20 bg-destructive/10 text-destructive" },
  "Fazer Internamente": { icon: Wrench, className: "border-warning/30 bg-warning/15 text-warning-strong" },
  "Pendente": { icon: FileText, className: "border-border bg-muted text-muted-foreground" },
};

const prioridadeConfig: Record<Prioridade, string> = {
  "⚡ Quick Win": "border-success/20 bg-success/10 text-success",
  "📈 Médio Prazo": "border-warning/30 bg-warning/15 text-warning-strong",
  "🎯 Alvo Futuro": "border-info/20 bg-info/10 text-info",
};

const Pautas = () => {
  const modTracker = useModificationTracker("pautas");
  const { value: sharedPautas, save: saveShared, loading: sharedLoading } = useSharedData<Pauta[] | null>(STORAGE_KEY, null);
  const comecaVazio = useComecaVazio();
  const [pautas, setPautas] = useState<Pauta[]>(comecaVazio ? [] : initialPautas);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (sharedLoading || hasChanges) return;
    if (Array.isArray(sharedPautas) && sharedPautas.length > 0) {
      setPautas(sharedPautas);
    } else {
      // Banco vazio: tenta migrar dados antigos do localStorage (one-shot)
      try {
        const legacy = localStorage.getItem(STORAGE_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPautas(parsed);
            saveShared(parsed).then((ok) => {
              if (ok) {
                localStorage.removeItem(STORAGE_KEY);
                modTracker.trackSave("Migração automática do localStorage para o banco compartilhado");
              }
            });
            return;
          }
        }
      } catch {}
      setPautas(comecaVazio ? [] : initialPautas);
    }
  }, [sharedPautas, sharedLoading, hasChanges, saveShared, modTracker, comecaVazio]);
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [mesFilter, setMesFilter] = useState<string>("all");
  const [newPauta, setNewPauta] = useState<Omit<Pauta, "id">>({
    titulo: "", keyword: "", status: "Pendente", tipoPublicacao: "Blogpost", tipoConteudo: "Informativo",
    responsavel: "Conteúdo Martech", categoria: "📚 Cursos", volume: "", kd: "", prioridade: "⚡ Quick Win",
  });
  const [editingField, setEditingField] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const categorias = [...new Set(pautas.map(p => p.categoria))].sort();

  const filtered = pautas.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (prioridadeFilter !== "all" && p.prioridade !== prioridadeFilter) return false;
    if (categoriaFilter !== "all" && p.categoria !== categoriaFilter) return false;
    if (searchTerm && !p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && !p.keyword.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: pautas.length,
    aprovadas: pautas.filter(p => p.status === "Pauta Aprovada").length,
    negadas: pautas.filter(p => p.status === "Negada").length,
    internas: pautas.filter(p => p.status === "Fazer Internamente").length,
    pendentes: pautas.filter(p => p.status === "Pendente").length,
  };

  const handleAdd = () => {
    if (!newPauta.titulo) { toast({ title: "Preencha o título", variant: "destructive" }); return; }
    const id = Math.max(0, ...pautas.map(p => p.id)) + 1;
    setPautas(prev => [...prev, { ...newPauta, id }]);
    setHasChanges(true);
    setPendingChanges(prev => [...prev, `Adicionou pauta "${newPauta.titulo}"`]);
    setNewPauta({ titulo: "", keyword: "", status: "Pendente", tipoPublicacao: "Blogpost", tipoConteudo: "Informativo", responsavel: "Conteúdo Martech", categoria: "📚 Cursos", volume: "", kd: "", prioridade: "⚡ Quick Win" });
    setDialogOpen(false);
    toast({ title: "Pauta adicionada!" });
  };

  const handleFieldChange = (id: number, field: keyof Pauta, value: string) => {
    const pauta = pautas.find(p => p.id === id);
    setPautas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    setHasChanges(true);
    setPendingChanges(prev => [...prev, `Alterou ${field} de "${pauta?.titulo || id}" para "${value}"`]);
  };
  const startEdit = (id: number, field: string, value: string) => { setEditingField({ id, field }); setEditValue(value); };
  const saveEdit = () => { if (editingField && editValue.trim()) handleFieldChange(editingField.id, editingField.field as keyof Pauta, editValue.trim()); setEditingField(null); };
  const handleSave = async () => {
    const ok = await saveShared(pautas);
    if (!ok) {
      toast({ title: "Erro ao salvar. Verifique sua conexão.", variant: "destructive" });
      return;
    }
    const changesText = pendingChanges.length > 0 ? pendingChanges.join("; ") : "Salvamento manual";
    modTracker.trackSave(changesText);
    setPendingChanges([]);
    setHasChanges(false);
    toast({ title: "Pautas salvas e compartilhadas!" });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Pautas</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Gestão de pautas e aprovações de conteúdo — {filtered.length} de {pautas.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} variant={hasChanges ? "default" : "outline"} size="sm" className="h-9">
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9"><Plus className="mr-1 h-4 w-4" /> Nova Pauta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Pauta</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Título do Artigo *" value={newPauta.titulo} onChange={e => setNewPauta(p => ({ ...p, titulo: e.target.value }))} />
                <Input placeholder="Keyword" value={newPauta.keyword} onChange={e => setNewPauta(p => ({ ...p, keyword: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Volume" value={newPauta.volume} onChange={e => setNewPauta(p => ({ ...p, volume: e.target.value }))} />
                  <Input placeholder="KD" value={newPauta.kd} onChange={e => setNewPauta(p => ({ ...p, kd: e.target.value }))} />
                </div>
                <Select value={newPauta.prioridade} onValueChange={v => setNewPauta(p => ({ ...p, prioridade: v as Prioridade }))}>
                  <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="⚡ Quick Win">⚡ Quick Win</SelectItem>
                    <SelectItem value="📈 Médio Prazo">📈 Médio Prazo</SelectItem>
                    <SelectItem value="🎯 Alvo Futuro">🎯 Alvo Futuro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newPauta.status} onValueChange={v => setNewPauta(p => ({ ...p, status: v as StatusPauta }))}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pauta Aprovada">Pauta Aprovada</SelectItem>
                    <SelectItem value="Negada">Negada</SelectItem>
                    <SelectItem value="Fazer Internamente">Fazer Internamente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newPauta.tipoPublicacao} onValueChange={v => setNewPauta(p => ({ ...p, tipoPublicacao: v as TipoPublicacao }))}>
                  <SelectTrigger><SelectValue placeholder="Tipo de Publicação" /></SelectTrigger>
                  <SelectContent>
                    {["Página", "Landing Page", "Blogpost", "Guia", "FAQ", "Lista", "Comparativo", "Infográfico", "E-book", "Webinar", "Vídeo", "Podcast"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newPauta.tipoConteudo} onValueChange={v => setNewPauta(p => ({ ...p, tipoConteudo: v as TipoConteudo }))}>
                  <SelectTrigger><SelectValue placeholder="Tipo de Conteúdo" /></SelectTrigger>
                  <SelectContent>
                    {["Comparativo", "Institucional", "Consultivo", "Direcionador", "Educacional", "Transacional", "Navegacional", "Informativo", "Promocional"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newPauta.responsavel} onValueChange={v => setNewPauta(p => ({ ...p, responsavel: v as Responsavel }))}>
                  <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conteúdo Martech">Conteúdo Martech</SelectItem>
                    <SelectItem value="Renata ESEG">Renata ESEG</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Aprovadas</p>
          <p className="mt-1 font-display text-2xl font-semibold text-success">{stats.aprovadas}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Negadas</p>
          <p className="mt-1 font-display text-2xl font-semibold text-destructive">{stats.negadas}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Fazer Interno</p>
          <p className="mt-1 font-display text-2xl font-semibold text-warning-strong">{stats.internas}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="mt-1 font-display text-2xl font-semibold text-muted-foreground">{stats.pendentes}</p>
        </div>
      </div>

      {/* View Toggle + Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")} aria-pressed={viewMode === "cards"} className="h-9">
            <LayoutGrid className="mr-1 h-4 w-4" /> Cards
          </Button>
          <Button variant={viewMode === "calendar" ? "default" : "outline"} size="sm" onClick={() => setViewMode("calendar")} aria-pressed={viewMode === "calendar"} className="h-9">
            <CalendarIcon className="mr-1 h-4 w-4" /> Calendário
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Buscar por título ou keyword..." aria-label="Buscar por título ou keyword" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Prioridades</SelectItem>
              <SelectItem value="⚡ Quick Win">⚡ Quick Win</SelectItem>
              <SelectItem value="📈 Médio Prazo">📈 Médio Prazo</SelectItem>
              <SelectItem value="🎯 Alvo Futuro">🎯 Alvo Futuro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {viewMode === "calendar" && (
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[180px]"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {["all", "Pendente", "Pauta Aprovada", "Negada", "Fazer Internamente"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s} className="h-9">
              {s === "all" ? "Todas" : s}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <PautasCalendar pautas={filtered} mesFilter={mesFilter} />
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(pauta => {
              const StatusIcon = statusConfig[pauta.status].icon;
              return (
                <div key={pauta.id} className="space-y-3 rounded-lg border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    {editingField?.id === pauta.id && editingField.field === "titulo" ? (
                      <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && saveEdit()} className="h-9 flex-1 text-sm" aria-label="Título da pauta" autoFocus />
                    ) : (
                      <h3 className="flex-1 cursor-pointer font-display text-sm font-semibold leading-snug text-foreground transition-colors hover:text-accent" onClick={() => startEdit(pauta.id, "titulo", pauta.titulo)} title="Clique para editar">
                        <Pencil className="mr-1 inline h-3 w-3 text-muted-foreground" aria-hidden />{pauta.titulo}
                      </h3>
                    )}
                  </div>

                  {editingField?.id === pauta.id && editingField.field === "keyword" ? (
                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && saveEdit()} className="h-9 text-xs" aria-label="Keyword da pauta" autoFocus />
                  ) : (
                    <p className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={() => startEdit(pauta.id, "keyword", pauta.keyword)} title="Clique para editar">
                      <Pencil className="mr-1 inline h-3 w-3" aria-hidden /><span className="font-medium">KW:</span> {pauta.keyword || "—"}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" aria-hidden /> Vol: {pauta.volume || "—"}</span>
                    <span>KD: {pauta.kd || "—"}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={statusConfig[pauta.status].className}>
                      <StatusIcon className="mr-1 h-3 w-3" aria-hidden />{pauta.status}
                    </Badge>
                    <Badge variant="outline" className={prioridadeConfig[pauta.prioridade] || ""}>
                      {pauta.prioridade}
                    </Badge>
                    {pauta.mesPublicacao && (
                      <Badge variant="outline" className="border-accent/20 bg-accent/10 text-accent">
                        <CalendarIcon className="mr-1 h-3 w-3" aria-hidden />{pauta.mesPublicacao}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{pauta.tipoPublicacao}</Badge>
                    <Badge variant="secondary">{pauta.tipoConteudo}</Badge>
                    <Badge variant="outline">{pauta.categoria}</Badge>
                  </div>

                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" aria-hidden /> {pauta.responsavel || "Conteúdo Martech"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 border-t pt-3">
                    <Select value={pauta.status} onValueChange={v => handleFieldChange(pauta.id, "status", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pauta Aprovada">Pauta Aprovada</SelectItem>
                        <SelectItem value="Negada">Negada</SelectItem>
                        <SelectItem value="Fazer Internamente">Fazer Internamente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.prioridade} onValueChange={v => handleFieldChange(pauta.id, "prioridade", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="⚡ Quick Win">⚡ Quick Win</SelectItem>
                        <SelectItem value="📈 Médio Prazo">📈 Médio Prazo</SelectItem>
                        <SelectItem value="🎯 Alvo Futuro">🎯 Alvo Futuro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.tipoPublicacao} onValueChange={v => handleFieldChange(pauta.id, "tipoPublicacao", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Página", "Landing Page", "Blogpost", "Guia", "FAQ", "Lista", "Comparativo", "Infográfico", "E-book", "Webinar", "Vídeo", "Podcast"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={pauta.tipoConteudo} onValueChange={v => handleFieldChange(pauta.id, "tipoConteudo", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Comparativo", "Institucional", "Consultivo", "Direcionador", "Educacional", "Transacional", "Navegacional", "Informativo", "Promocional"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={pauta.responsavel || "Conteúdo Martech"} onValueChange={v => handleFieldChange(pauta.id, "responsavel", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conteúdo Martech">Conteúdo Martech</SelectItem>
                        <SelectItem value="Renata ESEG">Renata ESEG</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.mesPublicacao || "sem-mes"} onValueChange={v => handleFieldChange(pauta.id, "mesPublicacao", v === "sem-mes" ? "" : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Mês de publicação" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem-mes">Sem mês definido</SelectItem>
                        {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <EstadoVazio
              icone={FileText}
              titulo="Nenhuma pauta encontrada"
              descricao="Ajuste a busca ou os filtros para ver outras pautas, ou adicione uma nova."
            />
          )}
        </>
      )}

      {/* Footer - Última modificação */}
      <ModificationFooter storageKey="pautas" history={modTracker.history} />
    </div>
  );
};

export default Pautas;


