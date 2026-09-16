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
import { loadPlateStockFromExpress } from "@/services/master-data/legacy-steel";
import { loadStockLocationMap } from "@/services/master-data/locations";
import type { DataTableColumn } from "@/types/division";
import type { MsPlateRow } from "@/types/master-data";

// ดึงสต็อกเหล็กแผ่นจริงจาก Express (แทนข้อมูลตัวอย่างเดิมใน PostgreSQL)
// แล้วเติม "ที่จัดเก็บ" ที่เราบันทึกไว้เองในตาราง stock_locations (Express ไม่มีช่องนี้)
async function fetchMsPlates(): Promise<MsPlateRow[]> {
  const [rows, locationMap] = await Promise.all([
    loadPlateStockFromExpress(),
    loadStockLocationMap("Ms_plate"),
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

const columns: Array<DataTableColumn<MsPlateRow>> = [
  {
    key: "code",
    header: "รหัสแผ่น",
    cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{dash(row.code)}</span>,
  },
  {
    key: "material",
    header: "วัสดุ",
    cell: (row) => (
      <div>
        <p>{dash(row.material?.name)}</p>
        <p className="font-mono text-xs text-slate-400">{dash(row.mm_id)}</p>
      </div>
    ),
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

export function MsPlatesScreen() {
  return (
    <MasterDataScreen<MsPlateRow>
      navKey="ms_plates"
      title="เหล็กแผ่น"
      description="ข้อมูลหลักเหล็กแผ่น | MS Plates"
      columns={columns}
      fetchRows={fetchMsPlates}
      rowKey={(row, index) => row.id ?? `msp-${index}`}
      searchText={(row) =>
        [row.code, row.mm_id, row.material?.name, row.location].filter(Boolean).join(" ")
      }
      searchPlaceholder="ค้นหารหัสแผ่น / วัสดุ / ตำแหน่ง"
      statusOf={(row) => row.status}
      statusOptions={["Active", "Inactive", "Deleted"]}
      detailTitle={(row) => `เหล็กแผ่น: ${dash(row.code)}`}
      detailItems={(row) => [
        { label: "รหัสแผ่น", value: dash(row.code) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "รหัสวัสดุ (MM)", value: dash(row.mm_id) },
        { label: "ความยาว (มม.)", value: formatNumber(row.length) },
        { label: "ความกว้าง (มม.)", value: formatNumber(row.width) },
        { label: "ความหนา (มม.)", value: formatNumber(row.thickness) },
        { label: "จำนวนทั้งหมด", value: formatNumber(row.quantity) },
        { label: "จำนวนคงเหลือ", value: formatNumber(row.available_quantity) },
        {
          label: "ตำแหน่งจัดเก็บ",
          value: (
            <StockLocationEditor
              initialLocId={row.loc_id}
              initialScheduledAt={row.scheduled_at ?? null}
              stockCode={row.code}
              stockType="Ms_plate"
            />
          ),
          fullWidth: true,
        },
        { label: "วันที่รับเข้า", value: formatDate(row.received_date) },
        { label: "บันทึกที่จัดเก็บ/วันเวลาเมื่อ", value: formatDateTime(row.recorded_at) },
        { label: "หมายเหตุ", value: dash(row.remark) },
        { label: "ผู้บันทึก", value: dash(row.employee?.name?.th) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
