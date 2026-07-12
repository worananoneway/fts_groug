import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "../ui/badge";
import { DataTable } from "../ui/data-table";
import { IconButton } from "../ui/icon-button";
import { fmt, orderDetailStatusLabel } from "@/utils/format";
import type { DataTableColumn, OrderDetail } from "@/types/division";

export function OrderShapeTable({
  onDelete,
  onEdit,
  onRowClick,
  rows,
  title,
}: {
  onDelete?: (row: OrderDetail) => void;
  onEdit?: (row: OrderDetail) => void;
  onRowClick?: (row: OrderDetail) => void;
  rows: OrderDetail[];
  title: string;
}) {
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
    {
      key: "status",
      header: "สถานะ",
      cell: (row) => <Badge tone={statusTone(row.status)}>{orderDetailStatusLabel(row.status)}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) =>
        row.status === "COMPLETED" || row.status === "CANCELLED" ? null : (
          <div className="flex justify-end gap-1">
            <IconButton
              icon={<Pencil className="h-4 w-4" />}
              label={`แก้ไขรายละเอียด ${row.id}`}
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(row);
              }}
              tone="primary"
            />
            <IconButton
              icon={<Trash2 className="h-4 w-4" />}
              label={`ลบรายการ ${row.id}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(row);
              }}
              tone="danger"
            />
          </div>
        ),
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-slate-700">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200/80 shadow-sm">
        <DataTable columns={columns} onRowClick={onRowClick} rowKey={(row) => row.id} rows={rows} />
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

function statusTone(status: OrderDetail["status"]) {
  if (status === "COMPLETED") return "emerald";
  if (status === "IN_PROCESS") return "blue";
  if (status === "CANCELLED" || status === "REJECTED") return "red";
  return "amber";
}

