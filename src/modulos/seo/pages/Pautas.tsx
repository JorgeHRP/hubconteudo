import { useState, useEffect } from "react";
import { Plus, Save, FileText, CheckCircle, XCircle, Wrench, Pencil, User, TrendingUp, Search, CalendarIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/modulos/seo/hooks/use-toast";
import { type Pauta, type StatusPauta, type TipoPublicacao, type TipoConteudo, type Responsavel, type Prioridade, STORAGE_KEY, initialPautas } from "@/modulos/seo/data/pautasData";
import PautasCalendar from "@/modulos/seo/components/PautasCalendar";
import ModificationFooter, { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";

const statusConfig: Record<StatusPauta, { icon: typeof CheckCircle; className: string }> = {
  "Pauta Aprovada": { icon: CheckCircle, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "Negada": { icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
  "Fazer Internamente": { icon: Wrench, className: "bg-amber-100 text-amber-700 border-amber-200" },
  "Pendente": { icon: FileText, className: "bg-muted text-muted-foreground border-border" },
};

const prioridadeConfig: Record<Prioridade, string> = {
  "⚡ Quick Win": "bg-emerald-100 text-emerald-700",
  "📈 Médio Prazo": "bg-amber-100 text-amber-700",
  "🎯 Alvo Futuro": "bg-blue-100 text-blue-700",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Pautas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de pautas e aprovações de conteúdo — {filtered.length} de {pautas.length}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant={hasChanges ? "default" : "outline"} size="sm" className={hasChanges ? "bg-primary" : ""}>
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary"><Plus className="h-4 w-4 mr-1" /> Nova Pauta</Button>
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
                <Button onClick={handleAdd} className="w-full bg-primary">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <p className="stat-value">{stats.total}</p><p className="stat-label">Total</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-1">
          <p className="stat-value text-emerald-600">{stats.aprovadas}</p><p className="stat-label">Aprovadas</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-2">
          <p className="stat-value text-red-500">{stats.negadas}</p><p className="stat-label">Negadas</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up-delay-3">
          <p className="stat-value text-amber-500">{stats.internas}</p><p className="stat-label">Fazer Interno</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <p className="stat-value text-muted-foreground">{stats.pendentes}</p><p className="stat-label">Pendentes</p>
        </div>
      </div>

      {/* View Toggle + Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")} className={viewMode === "cards" ? "bg-primary" : ""}>
            <LayoutGrid className="h-4 w-4 mr-1" /> Cards
          </Button>
          <Button variant={viewMode === "calendar" ? "default" : "outline"} size="sm" onClick={() => setViewMode("calendar")} className={viewMode === "calendar" ? "bg-primary" : ""}>
            <CalendarIcon className="h-4 w-4 mr-1" /> Calendário
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Prioridades</SelectItem>
              <SelectItem value="⚡ Quick Win">⚡ Quick Win</SelectItem>
              <SelectItem value="📈 Médio Prazo">📈 Médio Prazo</SelectItem>
              <SelectItem value="🎯 Alvo Futuro">🎯 Alvo Futuro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {viewMode === "calendar" && (
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {["all", "Pendente", "Pauta Aprovada", "Negada", "Fazer Internamente"].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? "bg-primary" : ""}>
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
                <div key={pauta.id} className="glass-card-hover p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {editingField?.id === pauta.id && editingField.field === "titulo" ? (
                      <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && saveEdit()} className="text-sm h-8 flex-1" autoFocus />
                    ) : (
                      <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => startEdit(pauta.id, "titulo", pauta.titulo)} title="Clique para editar">
                        <Pencil className="h-3 w-3 inline mr-1 opacity-40" />{pauta.titulo}
                      </h3>
                    )}
                  </div>

                  {editingField?.id === pauta.id && editingField.field === "keyword" ? (
                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === "Enter" && saveEdit()} className="text-xs h-7" autoFocus />
                  ) : (
                    <p className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => startEdit(pauta.id, "keyword", pauta.keyword)} title="Clique para editar">
                      <Pencil className="h-2.5 w-2.5 inline mr-1 opacity-40" /><span className="font-medium">KW:</span> {pauta.keyword || "—"}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Vol: {pauta.volume || "—"}</span>
                    <span>KD: {pauta.kd || "—"}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-xs ${statusConfig[pauta.status].className}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />{pauta.status}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs border-0 ${prioridadeConfig[pauta.prioridade] || ""}`}>
                      {pauta.prioridade}
                    </Badge>
                    {pauta.mesPublicacao && (
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        <CalendarIcon className="h-3 w-3 mr-1" />{pauta.mesPublicacao}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs bg-eseg-blue/10 text-eseg-blue border-0">{pauta.tipoPublicacao}</Badge>
                    <Badge variant="secondary" className="text-xs bg-eseg-cyan/10 text-eseg-cyan border-0">{pauta.tipoConteudo}</Badge>
                    <Badge variant="outline" className="text-xs">{pauta.categoria}</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {pauta.responsavel || "Conteúdo Martech"}
                  </p>

                  <div className="border-t border-border pt-3 space-y-2">
                    <Select value={pauta.status} onValueChange={v => handleFieldChange(pauta.id, "status", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pauta Aprovada">Pauta Aprovada</SelectItem>
                        <SelectItem value="Negada">Negada</SelectItem>
                        <SelectItem value="Fazer Internamente">Fazer Internamente</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.prioridade} onValueChange={v => handleFieldChange(pauta.id, "prioridade", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="⚡ Quick Win">⚡ Quick Win</SelectItem>
                        <SelectItem value="📈 Médio Prazo">📈 Médio Prazo</SelectItem>
                        <SelectItem value="🎯 Alvo Futuro">🎯 Alvo Futuro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.tipoPublicacao} onValueChange={v => handleFieldChange(pauta.id, "tipoPublicacao", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Página", "Landing Page", "Blogpost", "Guia", "FAQ", "Lista", "Comparativo", "Infográfico", "E-book", "Webinar", "Vídeo", "Podcast"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={pauta.tipoConteudo} onValueChange={v => handleFieldChange(pauta.id, "tipoConteudo", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Comparativo", "Institucional", "Consultivo", "Direcionador", "Educacional", "Transacional", "Navegacional", "Informativo", "Promocional"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={pauta.responsavel || "Conteúdo Martech"} onValueChange={v => handleFieldChange(pauta.id, "responsavel", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conteúdo Martech">Conteúdo Martech</SelectItem>
                        <SelectItem value="Renata ESEG">Renata ESEG</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={pauta.mesPublicacao || "sem-mes"} onValueChange={v => handleFieldChange(pauta.id, "mesPublicacao", v === "sem-mes" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Mês de publicação" /></SelectTrigger>
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
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Nenhuma pauta encontrada.</p>
            </div>
          )}
        </>
      )}

      {/* Footer - Última modificação */}
      <ModificationFooter storageKey="pautas" history={modTracker.history} />
    </div>
  );
};

export default Pautas;


