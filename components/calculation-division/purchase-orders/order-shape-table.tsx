import { Badge } from "../../ui/badge";
import { DataTable } from "../../ui/data-table";
import { fmt } from "../mappers";
import type { DataTableColumn, OrderDetail } from "../types";

export function OrderShapeTable({ rows, title }: { rows: OrderDetail[]; title: string }) {
  const columns: Array<DataTableColumn<OrderDetail>> = [
    {
      key: "shape",
      header: "ทรง",
      cell: (row) => <Badge tone={row.shape === "ROUND" ? "blue" : "emerald"}>{shapeLabel(row.shape)}</Badge>,
    },
    { key: "material", header: "วัสดุ", cell: (row) => row.material },
    {
      key: "size",
      header: "ขนาด",
      cell: (row) => <span className="font-mono">{sizeLabel(row)}</span>,
    },
    {
      key: "qty",
      header: "จำนวน",
      className: "text-right",
      cell: (row) => <span className="font-mono">{fmt(row.qty)}</span>,
    },
    {
      key: "remaining",
      header: "คงเหลือ",
      className: "text-right",
      cell: (row) => <span className="font-mono">{fmt(row.remaining)}</span>,
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-slate-700">{title}</h3>
      <div className="overflow-hidden rounded-lg border border-slate-100">
        <DataTable columns={columns} rowKey={(row) => row.id} rows={rows} />
      </div>
    </div>
  );
}

function shapeLabel(shape: OrderDetail["shape"]) {
  return shape === "ROUND" ? "เพลากลม" : "แผ่น";
}

function sizeLabel(row: OrderDetail) {
  if (row.shape === "ROUND") return `Ø${fmt(row.diameter ?? 0)} x ${fmt(row.length)} มม.`;
  return `${fmt(row.width ?? 0)} x ${fmt(row.length)} x หนา ${fmt(row.thickness ?? 0)} มม.`;
}

