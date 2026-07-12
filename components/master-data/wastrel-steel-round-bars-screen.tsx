"use client";

import {
  dash,
  formatDate,
  formatNumber,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import useWastrelSteelRoundBarsApi from "@/hooks/master-data/wastrel_steel_round_bars";
import type { DataTableColumn } from "@/types/division";
import type { WastrelSteelRoundBarRow } from "@/types/master-data";

const wastrelSteelRoundBarsApi = useWastrelSteelRoundBarsApi();

async function fetchWastrelSteelRoundBars(): Promise<WastrelSteelRoundBarRow[]> {
  return unwrapListReply<WastrelSteelRoundBarRow>(await wastrelSteelRoundBarsApi.get());
}

const columns: Array<DataTableColumn<WastrelSteelRoundBarRow>> = [
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
    header: "จากเพลาต้นทาง",
    cell: (row) => <span className="font-mono text-xs">{dash(row.source_steel_round_bar?.code)}</span>,
  },
  {
    key: "size",
    header: "Ø×ยาว (มม.)",
    cell: (row) => (
      <span className="font-mono text-xs">
        Ø{formatNumber(row.diameter)} × {formatNumber(row.length)}
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

export function WastrelSteelRoundBarsScreen() {
  return (
    <MasterDataScreen<WastrelSteelRoundBarRow>
      navKey="wastrel_steel_round_bars"
      title="เศษเพลาเหล็กกลม"
      description="คลังเศษเพลาเหล็กกลมจากงานตัด | Wastrel Steel Round Bars"
      columns={columns}
      fetchRows={fetchWastrelSteelRoundBars}
      rowKey={(row, index) => row.id ?? `wsrb-${index}`}
      searchText={(row) =>
        [
          row.display_id,
          row.material?.code,
          row.material?.name,
          row.source_steel_round_bar?.code,
          row.order?.no,
        ]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหารหัสเศษ / วัสดุ / PO"
      statusOf={(row) => row.status}
      statusOptions={["Active", "Inactive", "Reserved", "Used", "AVAILABLE", "Deleted"]}
      detailTitle={(row) => `เศษเพลาเหล็กกลม: ${dash(row.display_id ?? row.id)}`}
      detailItems={(row) => [
        { label: "รหัสเศษ", value: dash(row.display_id ?? row.id) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "รหัสวัสดุ", value: dash(row.material?.code) },
        { label: "เกรด", value: dash(row.material?.grade) },
        { label: "จากเพลาต้นทาง", value: dash(row.source_steel_round_bar?.code) },
        { label: "เส้นผ่านศูนย์กลาง (มม.)", value: formatNumber(row.diameter) },
        { label: "ความยาว (มม.)", value: formatNumber(row.length) },
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
