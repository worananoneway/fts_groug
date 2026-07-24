"use client";

import {
  dash,
  formatNumber,
  MasterDataScreen,
  unwrapListReply,
} from "./master-data-screen";
import useWastrelSteelRoundBarsApi from "@/hooks/master-data/wastrel_steel_round_bars";
import type { DataTableColumn } from "@/types/division";
import type { ScrapMember, WastrelSteelRoundBarGroup, WastrelSteelRoundBarRow } from "@/types/master-data";

const wastrelSteelRoundBarsApi = useWastrelSteelRoundBarsApi();

// จัดกลุ่มเศษเพลาเหล็กกลมตาม เกรดวัสดุ + ขนาด (Ø×ยาว) — ขนาดเท่ากันรวมเป็นกลุ่มเดียว
function groupBars(rows: WastrelSteelRoundBarRow[]): WastrelSteelRoundBarGroup[] {
  const map = new Map<string, WastrelSteelRoundBarGroup>();
  for (const row of rows) {
    if (row.status && ["Deleted", "Used", "Inactive"].includes(row.status)) continue;
    const grade = row.material?.grade ?? row.material?.code ?? "-";
    const key = `${grade}|${row.diameter ?? 0}x${row.length ?? 0}`;
    const member: ScrapMember = {
      display_id: row.display_id ?? row.id,
      source_code: row.source_steel_round_bar?.code ?? null,
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
        diameter: row.diameter,
        length: row.length,
        total_available: Number(row.available_quantity) || 0,
        total_quantity: Number(row.quantity) || 0,
        piece_count: 1,
        members: [member],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_available - a.total_available);
}

async function fetchGroups(): Promise<WastrelSteelRoundBarGroup[]> {
  const rows = unwrapListReply<WastrelSteelRoundBarRow>(await wastrelSteelRoundBarsApi.get());
  return groupBars(rows);
}

const columns: Array<DataTableColumn<WastrelSteelRoundBarGroup>> = [
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
    header: "ขนาด Ø×ยาว (มม.)",
    cell: (row) => (
      <span className="font-mono text-xs">
        Ø{formatNumber(row.diameter)} × {formatNumber(row.length)}
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

export function WastrelSteelRoundBarsScreen() {
  return (
    <MasterDataScreen<WastrelSteelRoundBarGroup>
      navKey="wastrel_steel_round_bars"
      title="เศษเพลาเหล็กกลม"
      description="คลังเศษเพลาเหล็กกลมจากงานตัด — รวมชิ้นขนาดเท่ากันเป็นกลุ่มเดียว | Wastrel Steel Round Bars"
      columns={columns}
      fetchRows={fetchGroups}
      rowKey={(row, index) => row.id ?? `wsrbg-${index}`}
      searchText={(row) =>
        [row.material?.code, row.material?.name, row.material?.grade, ...row.members.map((m) => m.source_code)]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหาวัสดุ / เกรด / รหัสเหล็กต้นทาง"
      detailTitle={(row) => `เศษเพลาเหล็กกลม Ø${formatNumber(row.diameter)}×${formatNumber(row.length)} มม.`}
      detailItems={(row) => [
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "เกรด", value: dash(row.material?.grade ?? row.material?.code) },
        {
          label: "ขนาด (Ø×ยาว)",
          value: `Ø${formatNumber(row.diameter)} × ${formatNumber(row.length)} มม.`,
        },
        { label: "จำนวนรวมคงเหลือ", value: formatNumber(row.total_available) },
        { label: "จำนวนชิ้นในกลุ่ม", value: `${formatNumber(row.piece_count)} รหัส` },
        { label: "รายละเอียดแต่ละชิ้น", value: <MembersTable members={row.members} /> },
      ]}
    />
  );
}
