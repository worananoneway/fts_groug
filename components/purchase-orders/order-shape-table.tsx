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
      cell: (row) =>
        row.isReference ? (
          <Badge tone="slate">สินค้า</Badge>
        ) : (
          <Badge tone={row.shape === "ROUND" ? "blue" : "emerald"}>{shapeLabel(row.shape)}</Badge>
        ),
    },
    { key: "material", header: "วัสดุ", cell: (row) => row.material },
    {
      key: "size",
      header: "ขนาด",
      cell: (row) =>
        row.isReference ? (
          <span className="text-slate-400">—</span>
        ) : (
          <span className="font-mono">{sizeLabel(row)}</span>
        ),
    },
    {
      key: "qty",
      header: "จำนวน",
      className: "text-right",
      cell: (row) => (
        <span className="font-mono">
          {fmt(row.qty)}
          {row.isReference && row.unit ? ` ${row.unit}` : ""}
        </span>
      ),
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
            {/* รายการสินค้าที่นำเข้าจาก Express เป็นข้อมูลอ่านอย่างเดียว — แก้ไขไม่ได้ */}
            {row.isReference ? null : (
              <IconButton
                icon={<Pencil className="h-4 w-4" />}
                label={`แก้ไขรายละเอียด ${row.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit?.(row);
                }}
                tone="primary"
              />
            )}
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
  if (row.shape === "ROUND") {
    const dia = row.diameter ?? 0;
    const len = row.length ?? 0;
    if (dia > 0 && len > 0) return `Ø${fmt(dia)} x ${fmt(len)} มม.`;
    if (dia > 0) return `Ø${fmt(dia)} มม. · รอระบุความยาว`;
    return "รอระบุขนาด";
  }
  const width = row.width ?? 0;
  const len = row.length ?? 0;
  const thickness = row.thickness ?? 0;
  // แผ่นที่ Express ระบุ "สั่งทำ" จะมีแต่ความหนา — แสดงเท่าที่มี
  if (width > 0 && len > 0) {
    return `${fmt(width)} x ${fmt(len)}${thickness > 0 ? ` x หนา ${fmt(thickness)}` : ""} มม.`;
  }
  if (thickness > 0) return `หนา ${fmt(thickness)} มม. · รอระบุขนาด`;
  return "รอระบุขนาด";
}

function statusTone(status: OrderDetail["status"]) {
  if (status === "COMPLETED") return "emerald";
  if (status === "IN_PROCESS") return "blue";
  if (status === "CANCELLED" || status === "REJECTED") return "red";
  return "amber";
}

