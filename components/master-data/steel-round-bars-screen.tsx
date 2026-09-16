"use client";

import {
  dash,
  formatDate,
  formatNumber,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import { StockLocationEditor } from "./stock-location-editor";
import { formatDateTime } from "@/utils/format";
import { loadRoundBarStockFromExpress } from "@/services/master-data/legacy-steel";
import { loadStockLocationMap } from "@/services/master-data/locations";
import type { DataTableColumn } from "@/types/division";
import type { SteelRoundBarRow } from "@/types/master-data";

// ดึงสต็อกเพลาจริงจาก Express แล้วเติม "ที่จัดเก็บ" จากตาราง stock_locations ของเว็บ
async function fetchSteelRoundBars(): Promise<SteelRoundBarRow[]> {
  const [rows, locationMap] = await Promise.all([
    loadRoundBarStockFromExpress(),
    loadStockLocationMap("Round_bar"),
  ]);
  return rows.map((row) => {
    const entry = row.code ? locationMap[row.code] : undefined;
    if (!entry) return row;
    return {
      ...row,
      loc_id: entry.location?.id ?? null,
      location: entry.location?.name ?? null,
      location_type: entry.location?.type ?? null,
      scheduled_at: entry.scheduledAt,
      recorded_at: entry.recordedAt,
    };
  });
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
    key: "received_date",
    header: "วันที่รับเข้า",
    cell: (row) => formatDate(row.received_date),
  },
  {
    key: "location",
    header: "ที่จัดเก็บ",
    cell: (row) =>
      row.location ? (
        <span className="text-sm text-slate-700">{row.location}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    key: "scheduled_at",
    header: "วัน-เวลาที่กำหนด",
    cell: (row) =>
      row.scheduled_at ? (
        <span className="font-mono text-xs">{formatDateTime(row.scheduled_at)}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    key: "recorded_at",
    header: "บันทึกเมื่อ",
    cell: (row) => <span className="font-mono text-xs text-slate-500">{formatDateTime(row.recorded_at)}</span>,
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
      statusOptions={["Active", "Inactive", "Deleted"]}
      detailTitle={(row) => `เพลาเหล็กกลม: ${dash(row.code)}`}
      detailItems={(row) => [
        { label: "รหัสเพลา", value: dash(row.code) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "รหัสวัสดุ (MM)", value: dash(row.mm_id) },
        { label: "เส้นผ่านศูนย์กลาง (มม.)", value: formatNumber(row.diameter) },
        { label: "ความยาว (มม.)", value: formatNumber(row.length) },
        { label: "จำนวนทั้งหมด", value: formatNumber(row.quantity) },
        { label: "จำนวนคงเหลือ", value: formatNumber(row.available_quantity) },
        {
          label: "ตำแหน่งจัดเก็บ",
          value: (
            <StockLocationEditor
              initialLocId={row.loc_id}
              initialScheduledAt={row.scheduled_at ?? null}
              stockCode={row.code}
              stockType="Round_bar"
            />
          ),
          fullWidth: true,
        },
        { label: "วันที่รับเข้า", value: formatDate(row.received_date) },
        { label: "บันทึกที่จัดเก็บ/วันเวลาเมื่อ", value: formatDateTime(row.recorded_at) },
        { label: "หมายเหตุ", value: dash(row.remark) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
