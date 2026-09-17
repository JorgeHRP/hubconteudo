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
    <div className="glass-card overflow-visible animate-fade-in-up">
      {title && (
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges} className={hasChanges ? "bg-eseg-blue hover:bg-eseg-blue/90 text-white" : ""}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              {columns.map((col) => (
                <TableHead key={String(col.key)} className="table-header" style={col.width ? { minWidth: col.width } : undefined}>
                  {col.header}
                </TableHead>
              ))}
              <TableHead className="table-header w-10 sticky right-0 bg-background z-10"></TableHead>
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
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={columns.length + 1} className="py-2 px-4">
                        <span className="text-xs font-semibold text-eseg-blue">{groupVal}</span>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={`hover:bg-muted/20 transition-colors group ${extraClass}`}>
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
                              className="p-2 transition-colors"
                            >
                              <Star
                                className={`h-4 w-4 transition-colors ${isActive ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400/60"}`}
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
                              className="h-8 rounded-none border-0 border-b-2 border-eseg-blue bg-eseg-blue/5 focus-visible:ring-0 text-sm px-3"
                            />
                          ) : (
                            <div className="px-3 py-2 min-h-[36px] cursor-text hover:bg-eseg-blue/5 transition-colors rounded">
                              {col.render ? col.render(row[col.key], row) : (
                                col.type === "url" && row[col.key] ? (
                                  <span className="text-xs text-eseg-blue truncate block max-w-[250px]">{String(row[col.key])}</span>
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
                    <TableCell className="p-1 sticky right-0 bg-background z-10">
                      <button
                        onClick={(e) => deleteRow(rowIndex, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-destructive"
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
      <div className="px-4 py-2 border-t text-xs text-muted-foreground flex justify-between">
        <span>{data.length} registros</span>
        <span>Clique em qualquer célula para editar • Tab para navegar</span>
      </div>
      {storageKey && <ModificationFooter storageKey={storageKey} history={modTracker.history} />}
    </div>
  );
}

export default EditableDataTable;


