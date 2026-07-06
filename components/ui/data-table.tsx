import type { ReactNode } from "react";

import { cn } from "./button";
import type { DataTableColumn } from "../calculation-division/types";

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  className?: string;
}

export function DataTable<T>({ className, columns, empty, rowKey, rows }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <>{empty ?? <p className="p-6 text-center text-sm text-slate-400">ไม่มีข้อมูล</p>}</>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3 font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-b border-slate-100">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3", column.className)}>
                  {column.cell(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
