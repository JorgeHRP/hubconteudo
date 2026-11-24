import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
}

function DataTable<T>({ data, columns, title }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-card">
      {title && (
        <div className="border-b px-4 py-3">
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead key={i} className={`whitespace-nowrap ${col.className || ""}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col, j) => (
                  <TableCell key={j} className={`px-3 py-2 text-sm ${col.className || ""}`}>
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;


