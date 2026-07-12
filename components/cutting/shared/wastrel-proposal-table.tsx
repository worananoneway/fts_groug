import type { ReactNode } from "react";

import { DataTable } from "../../ui/data-table";
import type { DataTableColumn } from "@/types/division";

export interface WastrelProposalRow {
  id: string;
  code: string;
  size: string;
  source: string;
  remark?: string;
  action?: ReactNode;
}

export function WastrelProposalTable({ rows }: { rows: WastrelProposalRow[] }) {
  const columns: Array<DataTableColumn<WastrelProposalRow>> = [
    { key: "code", header: "รหัส", cell: (row) => <span className="font-mono font-bold">{row.code}</span> },
    { key: "size", header: "ขนาด", cell: (row) => <span className="font-mono">{row.size}</span> },
    { key: "source", header: "ที่มา", cell: (row) => row.source },
    {
      key: "remark",
      header: "หมายเหตุ",
      cell: (row) => <span className="text-xs text-slate-500">{row.remark || "-"}</span>,
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      cell: (row) => row.action ?? null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rowKey={(row) => row.id}
      rows={rows}
    />
  );
}
