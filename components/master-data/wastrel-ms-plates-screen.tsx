"use client";

import {
  dash,
  formatDate,
  formatNumber,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import useWastrelMsPlatesApi from "@/hooks/master-data/wastrel_ms_plates";
import type { DataTableColumn } from "@/types/division";
import type { WastrelMsPlateRow } from "@/types/master-data";

const wastrelMsPlatesApi = useWastrelMsPlatesApi();

async function fetchWastrelMsPlates(): Promise<WastrelMsPlateRow[]> {
  return unwrapListReply<WastrelMsPlateRow>(await wastrelMsPlatesApi.get());
}

const columns: Array<DataTableColumn<WastrelMsPlateRow>> = [
  {
    key: "display_id",
    header: "รหัสเศษ",
    cell: (row) => (
      <span className="font-mono text-xs font-semibold text-slate-700">{dash(row.display_id ?? row.id)}</span>
    ),
  },
  {
    key: "material",
    header: "วัสดุ",
    cell: (row) => (
      <div>
        <p>{dash(row.material?.name)}</p>
        <p className="font-mono text-xs text-slate-400">{dash(row.material?.code)}</p>
      </div>
    ),
  },
  {
    key: "source",
    header: "จากแผ่นต้นทาง",
    cell: (row) => <span className="font-mono text-xs">{dash(row.source_ms_plate?.code)}</span>,
  },
  {
    key: "size",
    header: "ขนาด ยาว×กว้าง×หนา (มม.)",
    cell: (row) => (
      <span className="font-mono text-xs">
        {formatNumber(row.length)} × {formatNumber(row.width)} × {formatNumber(row.thickness)}
      </span>
    ),
  },
  {
    key: "quantity",
    header: "คงเหลือ/ทั้งหมด",
    cell: (row) => (
      <span className="font-mono text-xs">
        {formatNumber(row.available_quantity)} / {formatNumber(row.quantity)}
      </span>
    ),
  },
  {
    key: "order",
    header: "อ้างอิง PO",
    cell: (row) => <span className="font-mono text-xs">{dash(row.order?.no)}</span>,
  },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export function WastrelMsPlatesScreen() {
  return (
    <MasterDataScreen<WastrelMsPlateRow>
      navKey="wastrel_ms_plates"
      title="เศษเหล็กแผ่น"
      description="คลังเศษเหล็กแผ่นจากงานตัด | Wastrel MS Plates"
      columns={columns}
      fetchRows={fetchWastrelMsPlates}
      rowKey={(row, index) => row.id ?? `wmsp-${index}`}
      searchText={(row) =>
        [row.display_id, row.material?.code, row.material?.name, row.source_ms_plate?.code, row.order?.no]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหารหัสเศษ / วัสดุ / PO"
      statusOf={(row) => row.status}
      statusOptions={["Active", "Inactive", "Reserved", "Used", "AVAILABLE", "Deleted"]}
      detailTitle={(row) => `เศษเหล็กแผ่น: ${dash(row.display_id ?? row.id)}`}
      detailItems={(row) => [
        { label: "รหัสเศษ", value: dash(row.display_id ?? row.id) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "รหัสวัสดุ", value: dash(row.material?.code) },
        { label: "เกรด", value: dash(row.material?.grade) },
        { label: "จากแผ่นต้นทาง", value: dash(row.source_ms_plate?.code) },
        { label: "ความยาว (มม.)", value: formatNumber(row.length) },
        { label: "ความกว้าง (มม.)", value: formatNumber(row.width) },
        { label: "ความหนา (มม.)", value: formatNumber(row.thickness) },
        { label: "จำนวนทั้งหมด", value: formatNumber(row.quantity) },
        { label: "จำนวนคงเหลือ", value: formatNumber(row.available_quantity) },
        { label: "อ้างอิง PO", value: dash(row.order?.no) },
        { label: "หมายเหตุ", value: dash(row.remark) },
        { label: "ผู้บันทึก", value: dash(row.emp?.name?.th) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
