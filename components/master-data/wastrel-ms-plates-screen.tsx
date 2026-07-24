"use client";

import {
  dash,
  formatNumber,
  MasterDataScreen,
  unwrapListReply,
} from "./master-data-screen";
import useWastrelMsPlatesApi from "@/hooks/master-data/wastrel_ms_plates";
import type { DataTableColumn } from "@/types/division";
import type { ScrapMember, WastrelMsPlateGroup, WastrelMsPlateRow } from "@/types/master-data";

const wastrelMsPlatesApi = useWastrelMsPlatesApi();

// จัดกลุ่มเศษเหล็กแผ่นตาม เกรดวัสดุ + ขนาด (ยาว×กว้าง×หนา) — ขนาดเท่ากันรวมเป็นกลุ่มเดียว
function groupPlates(rows: WastrelMsPlateRow[]): WastrelMsPlateGroup[] {
  const map = new Map<string, WastrelMsPlateGroup>();
  for (const row of rows) {
    if (row.status && ["Deleted", "Used", "Inactive"].includes(row.status)) continue;
    const grade = row.material?.grade ?? row.material?.code ?? "-";
    const key = `${grade}|${row.length ?? 0}x${row.width ?? 0}x${row.thickness ?? 0}`;
    const member: ScrapMember = {
      display_id: row.display_id ?? row.id,
      source_code: row.source_ms_plate?.code ?? null,
      available_quantity: row.available_quantity ?? 0,
      order_no: row.order?.no ?? null,
    };
    const existing = map.get(key);
    if (existing) {
      existing.total_available += Number(row.available_quantity) || 0;
      existing.total_quantity += Number(row.quantity) || 0;
      existing.piece_count += 1;
      existing.members.push(member);
    } else {
      map.set(key, {
        id: key,
        material: row.material,
        length: row.length,
        width: row.width,
        thickness: row.thickness,
        total_available: Number(row.available_quantity) || 0,
        total_quantity: Number(row.quantity) || 0,
        piece_count: 1,
        members: [member],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_available - a.total_available);
}

async function fetchGroups(): Promise<WastrelMsPlateGroup[]> {
  const rows = unwrapListReply<WastrelMsPlateRow>(await wastrelMsPlatesApi.get());
  return groupPlates(rows);
}

const columns: Array<DataTableColumn<WastrelMsPlateGroup>> = [
  {
    key: "material",
    header: "วัสดุ / เกรด",
    cell: (row) => (
      <div>
        <p>{dash(row.material?.name)}</p>
        <p className="font-mono text-xs text-slate-400">{dash(row.material?.grade ?? row.material?.code)}</p>
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
    key: "total",
    header: "จำนวนรวมคงเหลือ",
    className: "text-right",
    cell: (row) => <span className="font-mono text-sm font-bold text-emerald-700">{formatNumber(row.total_available)}</span>,
  },
  {
    key: "pieces",
    header: "จำนวนชิ้น (รหัส)",
    className: "text-right",
    cell: (row) => <span className="font-mono text-xs">{formatNumber(row.piece_count)}</span>,
  },
];

function MembersTable({ members }: { members: ScrapMember[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">รหัสเศษ</th>
            <th className="px-3 py-2 text-left font-semibold">จากเหล็กต้นทาง (รหัส)</th>
            <th className="px-3 py-2 text-left font-semibold">อ้างอิง PO</th>
            <th className="px-3 py-2 text-right font-semibold">คงเหลือ</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.display_id ?? i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 font-mono">{dash(m.display_id)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500">{dash(m.source_code)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500">{dash(m.order_no)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{formatNumber(m.available_quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WastrelMsPlatesScreen() {
  return (
    <MasterDataScreen<WastrelMsPlateGroup>
      navKey="wastrel_ms_plates"
      title="เศษเหล็กแผ่น"
      description="คลังเศษเหล็กแผ่นจากงานตัด — รวมชิ้นขนาดเท่ากันเป็นกลุ่มเดียว | Wastrel MS Plates"
      columns={columns}
      fetchRows={fetchGroups}
      rowKey={(row, index) => row.id ?? `wmspg-${index}`}
      searchText={(row) =>
        [row.material?.code, row.material?.name, row.material?.grade, ...row.members.map((m) => m.source_code)]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหาวัสดุ / เกรด / รหัสเหล็กต้นทาง"
      detailTitle={(row) =>
        `เศษเหล็กแผ่น ${formatNumber(row.length)}×${formatNumber(row.width)}×${formatNumber(row.thickness)} มม.`
      }
      detailItems={(row) => [
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "เกรด", value: dash(row.material?.grade ?? row.material?.code) },
        {
          label: "ขนาด (ยาว×กว้าง×หนา)",
          value: `${formatNumber(row.length)} × ${formatNumber(row.width)} × ${formatNumber(row.thickness)} มม.`,
        },
        { label: "จำนวนรวมคงเหลือ", value: formatNumber(row.total_available) },
        { label: "จำนวนชิ้นในกลุ่ม", value: `${formatNumber(row.piece_count)} รหัส` },
        { label: "รายละเอียดแต่ละชิ้น", value: <MembersTable members={row.members} /> },
      ]}
    />
  );
}
