"use client";

import { Badge } from "../../ui/badge";
import { DataTable } from "../../ui/data-table";
import { fmt } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { DataTableColumn, RoundScrap } from "../types";

export function RoundBarScrapTable({ rows }: { rows: RoundScrap[] }) {
  const { roundSavedScrapKeys } = useCalculationDivision();
  const columns: Array<DataTableColumn<RoundScrap>> = [
    { key: "no", header: "#", cell: (_row, index) => index + 1 },
    { key: "source", header: "ที่มา", cell: (row) => `แท่งที่ ${row.barNo}` },
    {
      key: "length",
      header: "ความยาว (มม.)",
      cell: (row) => <span className="font-mono">{fmt(Math.floor(row.length))}</span>,
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (row) =>
        roundSavedScrapKeys.includes(`${row.barNo}:${row.length}`) ? (
          <Badge tone="emerald">บันทึกแล้ว</Badge>
        ) : (
          <Badge>ยังไม่บันทึก</Badge>
        ),
    },
  ];

  return <DataTable columns={columns} rowKey={(row) => `${row.barNo}:${row.length}`} rows={rows} />;
}

