"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, CircleDashed, Layers, Recycle, ScrollText } from "lucide-react";

import { FactoryAppShell } from "@/components/shell/factory-app-shell";
import { DivisionNav } from "@/components/shell/division-nav";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/components/i18n/language-provider";
import { loadMsPlates, loadWastrelPlates } from "@/services/division/plates";
import { loadSteelRoundBars, loadWastrelBars } from "@/services/division/round-bars";
import { loadLegacyOrders } from "@/services/division/legacy-orders";
import type { DataStatus, PlateStock, RoundBarStock, SavedPlateScrap, SavedRoundScrap } from "@/types/division";
import type { LegacyOrder } from "@/services/division/legacy-orders";

function fmt(n: number): string {
  return Number(n || 0).toLocaleString("th-TH");
}

export function DashboardScreen() {
  const [status, setStatus] = useState<DataStatus>({ loading: true, error: null, source: "none" });
  const [bars, setBars] = useState<RoundBarStock[]>([]);
  const [plates, setPlates] = useState<PlateStock[]>([]);
  const [scrapBars, setScrapBars] = useState<SavedRoundScrap[]>([]);
  const [scrapPlates, setScrapPlates] = useState<SavedPlateScrap[]>([]);
  const [jp, setJp] = useState<LegacyOrder[]>([]);
  const [detail, setDetail] = useState<{ title: string; items: Array<{ code: string; size: string; qty: number }> } | null>(null);
  const t = useT();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      loadSteelRoundBars(),
      loadMsPlates(),
      loadWastrelBars(),
      loadWastrelPlates(),
      loadLegacyOrders(""),
    ]).then((res) => {
      if (!active) return;
      if (res[0].status === "fulfilled") setBars(res[0].value);
      if (res[1].status === "fulfilled") setPlates(res[1].value);
      if (res[2].status === "fulfilled") setScrapBars(res[2].value);
      if (res[3].status === "fulfilled") setScrapPlates(res[3].value);
      if (res[4].status === "fulfilled") setJp(res[4].value);
      setStatus({ loading: false, error: null, source: "api" });
    });
    return () => {
      active = false;
    };
  }, []);

  const barTotal = useMemo(() => bars.reduce((s, b) => s + (b.available_quantity || 0), 0), [bars]);
  const plateTotal = useMemo(() => plates.reduce((s, p) => s + (p.available_quantity || 0), 0), [plates]);
  const scrapTotal = scrapBars.length + scrapPlates.length;

  const barsByDia = useMemo(() => {
    const map = new Map<number, { qty: number; count: number }>();
    for (const b of bars) {
      const key = b.diameter || 0;
      const e = map.get(key) ?? { qty: 0, count: 0 };
      e.qty += b.available_quantity || 0;
      e.count += 1;
      map.set(key, e);
    }
    return [...map.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);
  }, [bars]);

  function openBarDetail(dia: number) {
    const items = bars
      .filter((b) => (b.diameter || 0) === dia)
      .sort((a, b) => (b.available_quantity || 0) - (a.available_quantity || 0))
      .map((b) => ({ code: b.code, size: `Ø${fmt(b.diameter)} × ${fmt(b.length)} มม.`, qty: b.available_quantity || 0 }));
    setDetail({ title: `เพลาเหล็กกลม Ø${fmt(dia)} มม.`, items });
  }

  function openPlateDetail(thk: number) {
    const items = plates
      .filter((p) => (p.thickness || 0) === thk)
      .sort((a, b) => (b.available_quantity || 0) - (a.available_quantity || 0))
      .map((p) => ({
        code: p.code,
        size: p.width > 0 && p.length > 0 ? `${fmt(p.length)} × ${fmt(p.width)} × หนา ${fmt(p.thickness)} มม.` : `หนา ${fmt(p.thickness)} มม.`,
        qty: p.available_quantity || 0,
      }));
    setDetail({ title: `เหล็กแผ่น หนา ${fmt(thk)} มม.`, items });
  }

  const platesByThk = useMemo(() => {
    const map = new Map<number, { qty: number; count: number }>();
    for (const p of plates) {
      const key = p.thickness || 0;
      const e = map.get(key) ?? { qty: 0, count: 0 };
      e.qty += p.available_quantity || 0;
      e.count += 1;
      map.set(key, e);
    }
    return [...map.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);
  }, [plates]);

  return (
    <FactoryAppShell dataStatus={status} moduleTabs={<DivisionNav active="dashboard" />} subtitle="ภาพรวมสต็อกเหล็กและงานตัด | Dashboard">
      <div className="mx-auto max-w-7xl space-y-6">
    
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t("dash.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{t("dash.subtitle")}</p>
        </div>

    
        <div className="overflow-hidden rounded-2xl bg-[#1E2761] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">{t("dash.totalStock")}</p>
              <p className="mt-1 font-mono text-5xl font-extrabold leading-none">{fmt(barTotal + plateTotal)}</p>
              <p className="mt-2 text-xs text-blue-200/80">
                {t("dash.roundBars")} {fmt(barTotal)} · {t("dash.plates")} {fmt(plateTotal)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <MiniMetric label={t("dash.scrap")} value={fmt(scrapTotal)} sub={`${t("dash.plates")} ${fmt(scrapPlates.length)} · ${t("dash.roundBars")} ${fmt(scrapBars.length)}`} />
              <MiniMetric label={t("dash.jp")} value={fmt(jp.length)} sub={t("dash.fromExpress")} />
            </div>
          </div>
        </div>

        {/* การ์ดหมวดหลัก */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatBig icon={<CircleDashed className="h-5 w-5" />} tone="blue" label={t("dash.roundBars")} value={fmt(barTotal)} sub={`${fmt(bars.length)} ${t("dash.codesUnit")} · ${t("dash.remainingUnit")}`} />
          <StatBig icon={<Layers className="h-5 w-5" />} tone="emerald" label={t("dash.plates")} value={fmt(plateTotal)} sub={`${fmt(plates.length)} ${t("dash.codesUnit")} · ${t("dash.remainingUnit")}`} />
          <StatBig icon={<Recycle className="h-5 w-5" />} tone="amber" label={t("dash.scrap")} value={fmt(scrapTotal)} sub={`${t("dash.plates")} ${fmt(scrapPlates.length)} · ${t("dash.roundBars")} ${fmt(scrapBars.length)}`} />
          <StatBig icon={<ScrollText className="h-5 w-5" />} tone="violet" label={t("dash.jp")} value={fmt(jp.length)} sub={t("dash.latest")} />
        </div>

        {/* กราฟวงกลม — สัดส่วนสต็อก */}
        <DonutCard
          segments={[
            { label: "เพลาเหล็กกลม", value: barTotal, color: "#3B82F6" },
            { label: "เหล็กแผ่น", value: plateTotal, color: "#10B981" },
            { label: "เศษเหล็ก", value: scrapTotal, color: "#F59E0B" },
          ]}
        />

        {/* กราฟแยกย่อย */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BreakdownCard
            icon={<CircleDashed className="h-4 w-4" />}
            title={t("dash.byDiameter")}
            emptyText={t("dash.emptyBars")}
            rows={barsByDia.map(([dia, v]) => ({ key: dia, label: `Ø${fmt(dia)} มม.`, count: v.count, qty: v.qty }))}
            onRowClick={openBarDetail}
          />
          <BreakdownCard
            icon={<Layers className="h-4 w-4" />}
            title={t("dash.byThickness")}
            emptyText={t("dash.emptyPlates")}
            rows={platesByThk.map(([thk, v]) => ({ key: thk, label: `หนา ${fmt(thk)} มม.`, count: v.count, qty: v.qty }))}
            onRowClick={openPlateDetail}
          />
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <Boxes className="h-3.5 w-3.5" /> {t("dash.clickHint")}
        </p>
      </div>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? ""} wide>
        {detail ? (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">{t("dash.detailCode")}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t("dash.detailSize")}</th>
                  <th className="px-4 py-2 text-right font-semibold">{t("dash.detailRemain")}</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it, i) => (
                  <tr key={`${it.code}-${i}`} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs">{it.code}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{it.size}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">{fmt(it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </FactoryAppShell>
  );
}

const toneClasses: Record<string, { chip: string; bar: string }> = {
  blue: { chip: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  emerald: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  amber: { chip: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
  violet: { chip: "bg-violet-50 text-violet-600", bar: "bg-violet-500" },
  slate: { chip: "bg-slate-100 text-slate-600", bar: "bg-slate-500" },
};

function MiniMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs text-blue-200">{label}</p>
      <p className="mt-0.5 font-mono text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[10px] text-blue-200/70">{sub}</p>
    </div>
  );
}

function StatBig({ icon, tone, label, value, sub }: { icon: React.ReactNode; tone: string; label: string; value: string; sub: string }) {
  const t = toneClasses[tone] ?? toneClasses.slate;
  return (
    <div className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${t.chip}`}>{icon}</div>
        <span className={`h-1.5 w-10 rounded-full ${t.bar} opacity-70`} />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-3xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// กราฟโดนัท SVG (ไม่ต้องใช้ library) — วงกลม circumference = 100 เพื่อคิดเป็น %
function DonutChart({ segments, size = 160, label = "" }: { segments: DonutSegment[]; size?: number; label?: string }) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  let offset = 25; // เริ่มที่ 12 นาฬิกา
  return (
    <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label="สัดส่วนสต็อกเหล็ก">
      <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="5" />
      {total > 0 &&
        segments.map((seg) => {
          const pct = (Math.max(0, seg.value) / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const circle = (
            <circle
              key={seg.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={seg.color}
              strokeWidth="5"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              transform="rotate(-90 21 21)"
              strokeLinecap="butt"
            />
          );
          offset -= pct;
          return circle;
        })}
      <text x="21" y="20.5" textAnchor="middle" className="fill-slate-800" style={{ fontSize: 5, fontWeight: 700 }}>
        {fmt(total)}
      </text>
      <text x="21" y="25.5" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 2.6 }}>
        {label}
      </text>
    </svg>
  );
}

function DonutCard({ segments }: { segments: DonutSegment[] }) {
  const t = useT();
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-slate-800">{t("dash.composition")}</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <DonutChart segments={segments} label={t("dash.total")} />
        <div className="space-y-3">
          {segments.map((seg) => {
            const pct = total > 0 ? Math.round((Math.max(0, seg.value) / total) * 100) : 0;
            return (
              <div key={seg.label} className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
                <span className="w-32 text-sm text-slate-600">{seg.label}</span>
                <span className="w-16 text-right font-mono text-sm font-bold text-slate-800">{fmt(seg.value)}</span>
                <span className="w-12 text-right font-mono text-xs text-slate-400">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BreakdownCard({
  icon,
  title,
  rows,
  emptyText,
  onRowClick,
}: {
  icon: React.ReactNode;
  title: string;
  rows: Array<{ key: number; label: string; count: number; qty: number }>;
  emptyText: string;
  onRowClick: (key: number) => void;
}) {
  const max = Math.max(...rows.map((x) => x.qty), 1);
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => {
            const pct = Math.round((r.qty / max) * 100);
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => onRowClick(r.key)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-blue-50/70"
              >
                <span className="w-24 shrink-0 text-sm font-medium text-slate-600">{r.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-blue-600 px-2.5"
                    style={{ width: `${Math.max(pct, 12)}%` }}
                  >
                    <span className="font-mono text-xs font-bold text-white">{fmt(r.qty)}</span>
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-400">{fmt(r.count)} รหัส</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
