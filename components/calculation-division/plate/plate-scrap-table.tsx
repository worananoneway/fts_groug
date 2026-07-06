"use client";

import { Badge } from "../../ui/badge";
import { DataTable } from "../../ui/data-table";
import { fmt, sqm } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { DataTableColumn, PlateScrap } from "../types";

export function PlateScrapTable({ rows }: { rows: PlateScrap[] }) {
  const { plateSavedScrapKeys } = useCalculationDivision();
  const columns: Array<DataTableColumn<PlateScrap>> = [
    { key: "no", header: "#", cell: (_row, index) => index + 1 },
    { key: "source", header: "ที่มา", cell: (row) => `แผ่นที่ ${row.sheetNo}` },
    { key: "w", header: "กว้าง (มม.)", cell: (row) => <span className="font-mono">{fmt(Math.floor(row.w))}</span> },
    { key: "h", header: "ยาว (มม.)", cell: (row) => <span className="font-mono">{fmt(Math.floor(row.h))}</span> },
    { key: "area", header: "พื้นที่ (ตร.ม.)", cell: (row) => <span className="font-mono">{sqm(row.w, row.h)}</span> },
    {
      key: "status",
      header: "สถานะ",
      cell: (row) =>
        plateSavedScrapKeys.includes(`${row.sheetNo}:${row.x}:${row.y}`) ? (
          <Badge tone="emerald">บันทึกแล้ว</Badge>
        ) : (
          <Badge>ยังไม่บันทึก</Badge>
        ),
    },
  ];

  return <DataTable columns={columns} rowKey={(row) => `${row.sheetNo}:${row.x}:${row.y}`} rows={rows} />;
}

