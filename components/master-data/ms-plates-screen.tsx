"use client";

import {
  dash,
  formatDate,
  formatNumber,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import useMsPlatesApi from "@/hooks/master-data/ms_plates";
import type { DataTableColumn } from "@/types/division";
import type { MsPlateRow } from "@/types/master-data";

const msPlatesApi = useMsPlatesApi();

async function fetchMsPlates(): Promise<MsPlateRow[]> {
  return unwrapListReply<MsPlateRow>(await msPlatesApi.get());
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
        { label: "ตำแหน่งจัดเก็บ", value: `${dash(row.location)} (${dash(row.location_type)})` },
        { label: "วันที่รับเข้า", value: formatDate(row.received_date) },
        { label: "หมายเหตุ", value: dash(row.remark) },
        { label: "ผู้บันทึก", value: dash(row.employee?.name?.th) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
