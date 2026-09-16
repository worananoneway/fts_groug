"use client";

import { useState } from "react";

import {
  dash,
  formatNumber,
  MasterDataScreen,
  unwrapListReply,
} from "./master-data-screen";
import { ScheduleEditor } from "./schedule-editor";
import { ScrapLocationEditor } from "./scrap-location-editor";
import { formatDateTime } from "@/utils/format";
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
      id: row.id,
      display_id: row.display_id ?? row.id,
      source_code: row.source_steel_round_bar?.code ?? null,
      available_quantity: row.available_quantity ?? 0,
      order_no: row.order?.no ?? null,
      location: row.location ?? null,
      scheduled_at: row.scheduled_at ?? null,
      created_at: row.created_at ?? null,
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
        location: null,
        location_mixed: false,
        scheduled_at: null,
        scheduled_mixed: false,
        latest_created_at: null,
        members: [member],
      });
    }
  }
  for (const g of map.values()) {
    const locs = new Set(g.members.map((m) => m.location ?? ""));
    if (locs.size === 1) {
      const only = [...locs][0];
      g.location = only || null;
      g.location_mixed = false;
    } else {
      g.location = null;
      g.location_mixed = true;
    }

    // วัน-เวลาที่กำหนด: ตรงกันทุกชิ้น = แสดงค่านั้น, ต่างกัน = "หลายค่า"
    const schedules = new Set(g.members.map((m) => m.scheduled_at ?? ""));
    if (schedules.size === 1) {
      const only = [...schedules][0];
      g.scheduled_at = only || null;
      g.scheduled_mixed = false;
    } else {
      g.scheduled_at = null;
      g.scheduled_mixed = true;
    }

    // วันที่บันทึกเข้าคลัง = ชิ้นล่าสุดในกลุ่ม
    g.latest_created_at = g.members
      .map((m) => m.created_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .pop() ?? null;
  }
  return Array.from(map.values()).sort((a, b) => b.total_available - a.total_available);
}

async function fetchGroups(): Promise<WastrelSteelRoundBarGroup[]> {
  const rows = unwrapListReply<WastrelSteelRoundBarRow>(await wastrelSteelRoundBarsApi.get());
  return groupBars(rows);
}

function LocationCell({ group }: { group: WastrelSteelRoundBarGroup }) {
  if (group.location_mixed) return <span className="text-amber-600">หลายที่</span>;
  return <span>{group.location ? group.location : <span className="text-slate-300">— ยังไม่กำหนด</span>}</span>;
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
    key: "location",
    header: "ที่เก็บ",
    cell: (row) => <LocationCell group={row} />,
  },
  {
    key: "scheduled_at",
    header: "วัน-เวลาที่กำหนด",
    cell: (row) =>
      row.scheduled_mixed ? (
        <span className="text-amber-600">หลายค่า</span>
      ) : row.scheduled_at ? (
        <span className="font-mono text-xs">{formatDateTime(row.scheduled_at)}</span>
      ) : (
        <span className="text-slate-300">— ยังไม่กำหนด</span>
      ),
  },
  {
    key: "created_at",
    header: "บันทึกเมื่อ",
    cell: (row) => <span className="font-mono text-xs text-slate-500">{formatDateTime(row.latest_created_at)}</span>,
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
            <th className="px-3 py-2 text-left font-semibold">ที่เก็บ</th>
            <th className="px-3 py-2 text-left font-semibold">วัน-เวลาที่กำหนด</th>
            <th className="px-3 py-2 text-left font-semibold">บันทึกเมื่อ</th>
            <th className="px-3 py-2 text-right font-semibold">คงเหลือ</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.id ?? i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 font-mono">{dash(m.display_id)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500">{dash(m.source_code)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500">{dash(m.order_no)}</td>
              <td className="px-3 py-1.5 text-slate-500">{dash(m.location)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-500">{formatDateTime(m.scheduled_at)}</td>
              <td className="px-3 py-1.5 font-mono text-slate-400">{formatDateTime(m.created_at)}</td>
              <td className="px-3 py-1.5 text-right font-mono">{formatNumber(m.available_quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupLocationEditor({ group }: { group: WastrelSteelRoundBarGroup }) {
  const [value, setValue] = useState<string | null>(group.location);
  return (
    <ScrapLocationEditor
      current={value}
      mixed={group.location_mixed && value === group.location}
      onSave={async (loc) => {
        await wastrelSteelRoundBarsApi.updateLocation(group.members.map((m) => m.id), loc);
        setValue(loc);
      }}
    />
  );
}

function GroupScheduleEditor({ group }: { group: WastrelSteelRoundBarGroup }) {
  const [value, setValue] = useState<string | null>(group.scheduled_at);
  return (
    <ScheduleEditor
      current={value}
      mixed={group.scheduled_mixed && value === group.scheduled_at}
      onSave={async (iso) => {
        await wastrelSteelRoundBarsApi.updateSchedule(group.members.map((m) => m.id), iso);
        setValue(iso);
      }}
    />
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
        [row.material?.code, row.material?.name, row.material?.grade, row.location, ...row.members.map((m) => m.source_code)]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหาวัสดุ / เกรด / ที่เก็บ / รหัสเหล็กต้นทาง"
      detailTitle={(row) => `เศษเพลาเหล็กกลม Ø${formatNumber(row.diameter)}×${formatNumber(row.length)} มม.`}
      detailItems={(row) => [
        { label: "วัสดุ", value: dash(row.material?.name) },
        { label: "เกรด", value: dash(row.material?.grade ?? row.material?.code) },
        {
          label: "ขนาด (Ø×ยาว)",
          value: `Ø${formatNumber(row.diameter)} × ${formatNumber(row.length)} มม.`,
        },
        {
          label: "จำนวนรวมคงเหลือ",
          value: (
            <span className="text-lg font-bold text-emerald-700">
              {formatNumber(row.total_available)}{" "}
              <span className="text-xs font-normal text-slate-400">({formatNumber(row.piece_count)} รหัส)</span>
            </span>
          ),
        },
        { label: "พื้นที่จัดเก็บ (ทั้งกลุ่ม)", value: <GroupLocationEditor group={row} />, fullWidth: true },
        { label: "วัน-เวลาที่กำหนด (ทั้งกลุ่ม)", value: <GroupScheduleEditor group={row} />, fullWidth: true },
        { label: "บันทึกเข้าคลังล่าสุด", value: formatDateTime(row.latest_created_at) },
        { label: `รายละเอียดแต่ละชิ้น (${formatNumber(row.piece_count)} รหัส)`, value: <MembersTable members={row.members} />, fullWidth: true },
      ]}
    />
  );
}
