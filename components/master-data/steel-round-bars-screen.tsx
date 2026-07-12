"use client";

import {
  dash,
  formatDate,
  formatNumber,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import steelRoundBarsApi from "@/hooks/master-data/steel_round_bars";
import type { DataTableColumn } from "@/types/division";
import type { SteelRoundBarRow } from "@/types/master-data";

async function fetchSteelRoundBars(): Promise<SteelRoundBarRow[]> {
  return unwrapListReply<SteelRoundBarRow>(await steelRoundBarsApi.get());
}

const columns: Array<DataTableColumn<SteelRoundBarRow>> = [
  {
    key: "code",
    header: "รหัสเพลา",
    cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{dash(row.code)}</span>,
  },
  {
    key: "mm_id",
    header: "รหัสวัสดุ (MM)",
    cell: (row) => <span className="font-mono text-xs">{dash(row.mm_id)}</span>,
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
    key: "location",
    header: "ตำแหน่งจัดเก็บ",
    cell: (row) => (
      <div>
        <p>{dash(row.location)}</p>
        <p className="text-xs text-slate-400">{dash(row.location_type)}</p>
      </div>
    ),
  },
  {
    key: "received_date",
    header: "วันที่รับเข้า",
    cell: (row) => formatDate(row.received_date),
  },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export function SteelRoundBarsScreen() {
  return (
    <MasterDataScreen<SteelRoundBarRow>
      navKey="steel_round_bars"
      title="เพลาเหล็กกลม"
      description="ข้อมูลหลักเพลาเหล็กกลม | Steel Round Bars"
      columns={columns}
      fetchRows={fetchSteelRoundBars}
      rowKey={(row, index) => row.id ?? `srb-${index}`}
      searchText={(row) => [row.code, row.mm_id, row.location].filter(Boolean).join(" ")}
      searchPlaceholder="ค้นหารหัสเพลา / วัสดุ / ตำแหน่ง"
      statusOf={(row) => row.status}
      statusOptions={["AVAILABLE", "RESERVED", "USED", "SCRAP"]}
      detailTitle={(row) => `เพลาเหล็กกลม: ${dash(row.code)}`}
      detailItems={(row) => [
        { label: "รหัสเพลา", value: dash(row.code) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "รหัสวัสดุ (MM)", value: dash(row.mm_id) },
        { label: "เส้นผ่านศูนย์กลาง (มม.)", value: formatNumber(row.diameter) },
        { label: "ความยาว (มม.)", value: formatNumber(row.length) },
        { label: "จำนวนทั้งหมด", value: formatNumber(row.quantity) },
        { label: "จำนวนคงเหลือ", value: formatNumber(row.available_quantity) },
        { label: "ตำแหน่งจัดเก็บ", value: `${dash(row.location)} (${dash(row.location_type)})` },
        { label: "วันที่รับเข้า", value: formatDate(row.received_date) },
        { label: "หมายเหตุ", value: dash(row.remark) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
