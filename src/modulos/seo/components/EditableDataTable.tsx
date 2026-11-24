import React, { useState, useCallback, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ModificationFooter, { useModificationTracker } from "@/modulos/seo/components/ModificationFooter";
import { useSharedData } from "@/modulos/seo/hooks/useSharedData";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface EditableColumn<T> {
  header: string;
  key: keyof T;
  type?: "text" | "number" | "url" | "star" | "select";
  width?: string;
  options?: string[];
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface EditableDataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: EditableColumn<T>[];
  title?: string;
  onDataChange?: (data: T[]) => void;
  createEmptyRow: () => T;
  groupBy?: keyof T;
  storageKey?: string;
  rowClassName?: (row: T) => string;
}

function EditableDataTable<T extends Record<string, any>>({
  data: initialData,
  columns,
  title,
  onDataChange,
  createEmptyRow,
  groupBy,
  storageKey,
  rowClassName,
}: EditableDataTableProps<T>) {
  const comecaVazio = useComecaVazio();
  const sharedKey = `editable-table-${storageKey ?? "default"}`;
  const { value: sharedData, save: saveShared, loading: sharedLoading } = useSharedData<T[] | null>(sharedKey, null);

  const validateShape = useCallback((arr: unknown): arr is T[] => {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const requiredKeys = columns.map((col) => String(col.key));
    return arr.every((row) => row && typeof row === "object" && requiredKeys.every((key) => key in row));
  }, [columns]);

  const [data, setData] = useState<T[]>(() => (comecaVazio ? [] : [...initialData]));
  const [editingCell, setEditingCell] = useState<{ row: number; col: keyof T } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);
  const modTracker = useModificationTracker(storageKey || "default");

  // Sincronizar com dados remotos (carga inicial e mudanças realtime de outros usuários)
  useEffect(() => {
    if (sharedLoading || hasChanges) return;
    if (sharedData && validateShape(sharedData)) {
      setData(sharedData);
    } else {
      setData(comecaVazio ? [] : [...initialData]);
    }
  }, [sharedData, sharedLoading, hasChanges, initialData, validateShape, comecaVazio]);

  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    setHasChanges(true);
    onDataChange?.(newData);
  }, [onDataChange]);

  const handleSave = async () => {
    const ok = await saveShared(data);
    if (!ok) {
      toast.error("Erro ao salvar. Verifique sua conexão.");
      return;
    }
    const changesText = pendingChanges.length > 0 ? pendingChanges.join("; ") : "Salvamento manual";
    modTracker.trackSave(changesText);
    setPendingChanges([]);
    setHasChanges(false);
    toast.success("Dados salvos e compartilhados!");
  };

  const handleCellClick = (rowIndex: number, col: EditableColumn<T>) => {
    setEditingCell({ row: rowIndex, col: col.key });
    setEditValue(String(data[rowIndex][col.key] ?? ""));
  };

  const handleCellBlur = () => {
    if (!editingCell) return;
    const newData = [...data];
    const col = columns.find(c => c.key === editingCell.col);
    const oldVal = data[editingCell.row][editingCell.col];
    const newVal = col?.type === "number" ? (editValue === "" ? 0 : Number(editValue)) : editValue;
    if (String(oldVal) !== String(newVal)) {
      setPendingChanges(prev => [...prev, `Alterou "${String(col?.header)}" de "${String(oldVal)}" para "${String(newVal)}"`]);
    }
    newData[editingCell.row] = { ...newData[editingCell.row], [editingCell.col]: newVal };
    updateData(newData);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    } else if (e.key === "Tab" && editingCell) {
      e.preventDefault();
      handleCellBlur();
      const currentColIndex = columns.findIndex(c => c.key === editingCell.col);
      const nextColIndex = e.shiftKey ? currentColIndex - 1 : currentColIndex + 1;
      if (nextColIndex >= 0 && nextColIndex < columns.length) {
        const nextRow = editingCell.row;
        setTimeout(() => {
          setEditingCell({ row: nextRow, col: columns[nextColIndex].key });
          setEditValue(String(data[nextRow][columns[nextColIndex].key] ?? ""));
        }, 0);
      } else if (!e.shiftKey && editingCell.row + 1 < data.length) {
        const nextRow = editingCell.row + 1;
        setTimeout(() => {
          setEditingCell({ row: nextRow, col: columns[0].key });
          setEditValue(String(data[nextRow][columns[0].key] ?? ""));
        }, 0);
      }
    }
  };

  const addRow = () => {
    updateData([...data, createEmptyRow()]);
    setPendingChanges(prev => [...prev, "Adicionou nova linha"]);
    toast.success("Linha adicionada");
  };

  const deleteRow = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const deletedKeyword = String(data[index][columns[0]?.key] || `linha ${index + 1}`);
    const newData = data.filter((_, i) => i !== index);
    updateData(newData);
    setEditingCell(null);
    setPendingChanges(prev => [...prev, `Removeu "${deletedKeyword}"`]);
    toast.success("Linha removida");
  };

  // Sort data by group for proper grouping
  const sortedData = groupBy
    ? [...data].map((row, idx) => ({ row, idx })).sort((a, b) => {
        const ga = String(a.row[groupBy] ?? "");
        const gb = String(b.row[groupBy] ?? "");
        return ga.localeCompare(gb);
      })
    : data.map((row, idx) => ({ row, idx }));

  let lastGroup = "";

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-card">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3">
          <h3 className="min-w-0 font-display text-base font-semibold text-foreground">{title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="whitespace-nowrap" style={col.width ? { minWidth: col.width } : undefined}>
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="sticky right-0 z-10 w-10 bg-muted">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(({ row, idx: rowIndex }) => {
              const groupVal = groupBy ? String(row[groupBy] ?? "") : "";
              const isNewGroup = groupBy && groupVal !== lastGroup && groupVal !== "";
              if (groupBy) lastGroup = groupVal;

              const extraClass = rowClassName ? rowClassName(row) : "";

              return (
                <React.Fragment key={rowIndex}>
                  {isNewGroup && (
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={columns.length + 1} className="px-3 py-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{groupVal}</span>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={`group ${extraClass}`}>
                    {columns.map((col) => {
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === col.key;
                      
                      if (col.type === "star") {
                        const isActive = !!row[col.key];
                        return (
                          <TableCell key={String(col.key)} className="text-sm p-0 text-center">
                            <button
                              onClick={() => {
                                const newData = [...data];
                                newData[rowIndex] = { ...newData[rowIndex], [col.key]: !isActive };
                                updateData(newData);
                              }}
                              aria-label={isActive ? `Desmarcar ${col.header}` : `Marcar ${col.header}`}
                              aria-pressed={isActive}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            >
                              <Star
                                className={`h-4 w-4 transition-colors ${isActive ? "fill-warning text-warning" : "text-muted-foreground/40 hover:text-warning"}`}
                              />
                            </button>
                          </TableCell>
                        );
                      }

                      if (col.type === "select") {
                        const currentVal = String(row[col.key] ?? "");
                        return (
                          <TableCell key={String(col.key)} className="text-sm p-1">
                            <Select
                              value={currentVal}
                              onValueChange={(v) => {
                                if (v === currentVal) return;
                                const newData = [...data];
                                newData[rowIndex] = { ...newData[rowIndex], [col.key]: v };
                                setPendingChanges(prev => [...prev, `Alterou "${col.header}" de "${currentVal}" para "${v}"`]);
                                updateData(newData);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {(col.options ?? []).map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={String(col.key)}
                          className="text-sm p-0"
                          onClick={() => !isEditing && handleCellClick(rowIndex, col)}
                        >
                          {isEditing ? (
                            <Input
                              autoFocus
                              type={col.type === "number" ? "number" : "text"}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              className="h-9 rounded-none border-0 border-b-2 border-primary bg-primary/5 px-3 text-sm focus-visible:ring-0"
                            />
                          ) : (
                            <div className="min-h-[36px] cursor-text px-3 py-2 transition-colors hover:bg-primary/5">
                              {col.render ? col.render(row[col.key], row) : (
                                col.type === "url" && row[col.key] ? (
                                  <span className="block max-w-[250px] truncate text-xs text-accent">{String(row[col.key])}</span>
                                ) : col.type === "number" ? (
                                  <span>{Number(row[col.key]).toLocaleString()}</span>
                                ) : (
                                  <span>{String(row[col.key] ?? "")}</span>
                                )
                              )}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="sticky right-0 z-10 bg-card p-1">
                      <button
                        onClick={(e) => deleteRow(rowIndex, e)}
                        aria-label="Remover linha"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-opacity hover:bg-destructive/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{data.length} registros</span>
        <span>Clique em qualquer célula para editar • Tab para navegar</span>
      </div>
      {storageKey && (
        <div className="[&>div]:mt-0 [&>div]:rounded-t-none [&>div]:border-x-0 [&>div]:border-b-0 [&>div]:bg-muted/30 [&>div]:shadow-none">
          <ModificationFooter storageKey={storageKey} history={modTracker.history} />
        </div>
      )}
    </div>
  );
}

export default EditableDataTable;


