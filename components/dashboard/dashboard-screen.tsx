"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CircleDashed,
  ClipboardList,
  Layers,
  MapPin,
  RefreshCw,
  PieChart,
  Recycle,
  ScrollText,
} from "lucide-react";

import { FactoryAppShell } from "@/components/shell/factory-app-shell";
import { DivisionNav } from "@/components/shell/division-nav";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/components/i18n/language-provider";
import { Skeleton, SkeletonCards } from "@/components/loading";
import { useNavigate } from "@/hooks/use-navigate";
import { loadMsPlates, loadWastrelPlates } from "@/services/division/plates";
import { loadSteelRoundBars, loadWastrelBars } from "@/services/division/round-bars";
import { loadLegacyOrders } from "@/services/division/legacy-orders";
import { loadOrders } from "@/services/division/purchase-orders";
import { loadStockLocationMap } from "@/services/master-data/locations";
import type {
  DataStatus,
  PlateStock,
  PurchaseOrder,
  RoundBarStock,
  SavedPlateScrap,
  SavedRoundScrap,
} from "@/types/division";
import type { LegacyOrder } from "@/services/division/legacy-orders";

// สีชุดเดียวใช้ทั้งหน้า — ผ่านการตรวจ contrast/ตาบอดสีแล้ว
const SERIES = {
  bars: "#2a78d6",
  plates: "#1baf7a",
  scrap: "#eb6834",
  orders: "#4a3aa7",
  unknown: "#94a3b8",
} as const;

// สีสถานะ (มีข้อความกำกับทุกที่ ไม่ใช้สีสื่อความหมายเพียว ๆ)
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#94a3b8",
  IN_PROGRESS: "#2a78d6",
  DONE: "#0ca30c",
  CANCELLED: "#d03b3b",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังตัด",
  DONE: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

function fmt(n: number): string {
  return Number(n || 0).toLocaleString("th-TH");
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

/** yyyy-mm-dd ของ n วันก่อน (ใช้จัดกลุ่มใบสั่งตัดรายวัน) */
function dayKey(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DashboardScreen() {
  const [status, setStatus] = useState<DataStatus>({ isLoading: true, error: null, source: "none" });
  const [bars, setBars] = useState<RoundBarStock[]>([]);
  const [plates, setPlates] = useState<PlateStock[]>([]);
  const [scrapBars, setScrapBars] = useState<SavedRoundScrap[]>([]);
  const [scrapPlates, setScrapPlates] = useState<SavedPlateScrap[]>([]);
  const [jp, setJp] = useState<LegacyOrder[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [locatedCodes, setLocatedCodes] = useState(0);
  const [detail, setDetail] = useState<{ title: string; items: Array<{ code: string; size: string; qty: number }> } | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const t = useT();
  const router = useNavigate();

  const load = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    const res = await Promise.allSettled([
      loadSteelRoundBars(),
      loadMsPlates(),
      loadWastrelBars(),
      loadWastrelPlates(),
      loadLegacyOrders(""),
      loadOrders(),
      Promise.all([loadStockLocationMap("Ms_plate"), loadStockLocationMap("Round_bar")]),
    ]);
    if (res[0].status === "fulfilled") setBars(res[0].value);
    if (res[1].status === "fulfilled") setPlates(res[1].value);
    if (res[2].status === "fulfilled") setScrapBars(res[2].value);
    if (res[3].status === "fulfilled") setScrapPlates(res[3].value);
    if (res[4].status === "fulfilled") setJp(res[4].value);
    if (res[5].status === "fulfilled") setOrders(res[5].value.purchaseOrders ?? []);
    if (res[6].status === "fulfilled") {
      const [plateMap, barMap] = res[6].value;
      setLocatedCodes(
        Object.values(plateMap).filter((entry) => entry.location).length +
          Object.values(barMap).filter((entry) => entry.location).length,
      );
    }
    const labels = ["เพลาเหล็กกลม", "เหล็กแผ่น", "เศษเพลา", "เศษเหล็กแผ่น", "ใบสั่งตัด (JP)", "ใบสั่งซื้อ", "ที่จัดเก็บ"];
    const failed = res
      .map((item, index) => (item.status === "rejected" ? labels[index] : null))
      .filter((label): label is string => Boolean(label));
    setFailedSources(failed);
    setUpdatedAt(new Date());
    setStatus({ isLoading: false, error: null, source: failed.length === labels.length ? "none" : "api" });
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const barTotal = useMemo(() => bars.reduce((s, b) => s + (b.available_quantity || 0), 0), [bars]);
  const plateTotal = useMemo(() => plates.reduce((s, p) => s + (p.available_quantity || 0), 0), [plates]);
  const scrapTotal = scrapBars.length + scrapPlates.length;
  const grandTotal = barTotal + plateTotal + scrapTotal;

  // จัดกลุ่มตามขนาด — กลุ่มที่ไม่มีขนาด (0) แยกไว้ท้ายสุดและใช้สีเทา ไม่ให้แย่งความสนใจ
  const groupBy = useCallback(
    (rows: Array<{ size: number; qty: number }>) => {
      const map = new Map<number, { qty: number; count: number }>();
      for (const row of rows) {
        const e = map.get(row.size) ?? { qty: 0, count: 0 };
        e.qty += row.qty;
        e.count += 1;
        map.set(row.size, e);
      }
      const entries = [...map.entries()];
      const known = entries.filter(([size]) => size > 0).sort((a, b) => b[1].qty - a[1].qty).slice(0, 7);
      const unknown = entries.filter(([size]) => size <= 0);
      return [...known, ...unknown];
    },
    [],
  );

  const barsByDia = useMemo(
    () => groupBy(bars.map((b) => ({ size: b.diameter || 0, qty: b.available_quantity || 0 }))),
    [bars, groupBy],
  );
  const platesByThk = useMemo(
    () => groupBy(plates.map((p) => ({ size: p.thickness || 0, qty: p.available_quantity || 0 }))),
    [plates, groupBy],
  );

  const orderStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { PENDING: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 };
    for (const order of orders) counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, [orders]);

  const jpByDay = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => dayKey(6 - index));
    const counts = new Map(days.map((day) => [day, 0]));
    for (const order of jp) {
      const day = String(order.docDate ?? "").slice(0, 10);
      if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts.entries()].map(([day, count]) => ({ day, count }));
  }, [jp]);

  const scrapNoLocation = useMemo(
    () => [...scrapPlates, ...scrapBars].filter((item) => !item.location).length,
    [scrapBars, scrapPlates],
  );
  const scrapScheduled = useMemo(
    () => [...scrapPlates, ...scrapBars].filter((item) => item.scheduledAt).length,
    [scrapBars, scrapPlates],
  );

  function openBarDetail(dia: number) {
    const items = bars
      .filter((b) => (b.diameter || 0) === dia)
      .sort((a, b) => (b.available_quantity || 0) - (a.available_quantity || 0))
      .map((b) => ({ code: b.code, size: `Ø${fmt(b.diameter)} × ${fmt(b.length)} มม.`, qty: b.available_quantity || 0 }));
    setDetail({ title: dia > 0 ? `${t("dash.roundBars")} Ø${fmt(dia)} มม.` : `${t("dash.roundBars")} · ${t("dash.unknownSize")}`, items });
  }

  function openPlateDetail(thk: number) {
    const items = plates
      .filter((p) => (p.thickness || 0) === thk)
      .sort((a, b) => (b.available_quantity || 0) - (a.available_quantity || 0))
      .map((p) => ({
        code: p.code,
        size: p.width > 0 && p.length > 0 ? `${fmt(p.length)} × ${fmt(p.width)} × ${fmt(p.thickness)} มม.` : `หนา ${fmt(p.thickness)} มม.`,
        qty: p.available_quantity || 0,
      }));
    setDetail({ title: thk > 0 ? `${t("dash.plates")} หนา ${fmt(thk)} มม.` : `${t("dash.plates")} · ${t("dash.unknownSize")}`, items });
  }

  const shell = (children: React.ReactNode) => (
    <FactoryAppShell dataStatus={status} moduleTabs={<DivisionNav active="dashboard" />} subtitle={t("dash.subtitle")}>
      {children}
    </FactoryAppShell>
  );

  if (status.isLoading && !updatedAt) {
    return shell(
      <div className="mx-auto max-w-7xl space-y-6" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">กำลังโหลดแดชบอร์ด...</span>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <SkeletonCards className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>,
    );
  }

  const shares = [
    { key: "bars", label: t("dash.roundBars"), value: barTotal, color: SERIES.bars },
    { key: "plates", label: t("dash.plates"), value: plateTotal, color: SERIES.plates },
    { key: "scrap", label: t("dash.scrap"), value: scrapTotal, color: SERIES.scrap },
  ].filter((item) => item.value > 0);

  const totalCodes = bars.length + plates.length;
  const todoItems = [
    {
      key: "jp",
      icon: <ScrollText className="h-4 w-4" />,
      label: t("dash.jpNotImported"),
      value: jp.length,
      unit: t("dash.items"),
      href: "/po",
      tone: SERIES.orders,
      show: jp.length > 0,
    },
    {
      key: "scrap-loc",
      icon: <MapPin className="h-4 w-4" />,
      label: t("dash.scrapNoLocation"),
      value: scrapNoLocation,
      unit: "ชิ้น",
      href: "/master-data/setting/wastrel_ms_plates",
      tone: SERIES.scrap,
      show: scrapNoLocation > 0,
    },
    {
      key: "scrap-sched",
      icon: <CalendarClock className="h-4 w-4" />,
      label: t("dash.scrapScheduled"),
      value: scrapScheduled,
      unit: "ชิ้น",
      href: "/master-data/setting/wastrel_steel_round_bars",
      tone: SERIES.plates,
      show: scrapScheduled > 0,
    },
    {
      key: "stock-loc",
      icon: <Boxes className="h-4 w-4" />,
      label: `${t("dash.stockWithLocation")} (${fmt(locatedCodes)}/${fmt(totalCodes)})`,
      value: locatedCodes,
      unit: "รหัส",
      href: "/master-data/setting/ms_plates",
      tone: SERIES.bars,
      show: true,
    },
  ].filter((item) => item.show);

  const maxJp = Math.max(...jpByDay.map((d) => d.count), 1);

  return shell(
    <div className="mx-auto max-w-7xl space-y-6">
      {failedSources.length > 0 ? (
        <AlertBanner tone="warning">
          ดึงข้อมูลบางส่วนไม่ได้ ({failedSources.join(", ")}) — ตัวเลขด้านล่างจึงยังไม่ครบ
          ถ้าเป็นข้อมูลจากคลังเดิม ให้ตรวจสอบว่าเปิด ZeroTier/VPN อยู่ แล้วกดรีเฟรช
        </AlertBanner>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t("dash.title")}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{t("dash.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt ? (
            <span className="font-mono text-xs text-slate-400">
              {t("dash.updatedAt")} {updatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
          <Button
            icon={<RefreshCw className="h-4 w-4" />}
            isLoading={status.isLoading}
            loadingLabel="กำลังโหลด..."
            onClick={() => void load()}
            size="sm"
            variant="secondary"
          >
            {t("dash.refresh")}
          </Button>
        </div>
      </div>

      {/* รวม + สัดส่วน */}
      <section className="overflow-hidden rounded-2xl bg-[#1E2761] p-6 text-white shadow-lg sm:p-7">
        <p className="text-sm font-medium text-blue-200">{t("dash.totalStock")}</p>
        <p className="mt-1 flex items-baseline gap-2 font-mono text-4xl font-extrabold leading-none sm:text-5xl">
          {fmt(grandTotal)}
          <span className="text-base font-medium text-blue-200">ชิ้น</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {shares.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-blue-100">{item.label}</span>
              <span className="font-mono text-sm font-bold text-white">{fmt(item.value)}</span>
              <span className="font-mono text-xs text-blue-200/80">{pct(item.value, grandTotal).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* การ์ดตัวเลขหลัก — คลิกไปหน้าที่เกี่ยวข้องได้ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          color={SERIES.bars}
          icon={<CircleDashed className="h-5 w-5" />}
          label={t("dash.roundBars")}
          onClick={() => router.push("/master-data/setting/steel_round_bars")}
          sub={`${fmt(bars.length)} ${t("dash.codesUnit")} · ${t("dash.remainingUnit")}`}
          unit="ชิ้น"
          value={fmt(barTotal)}
        />
        <StatTile
          color={SERIES.plates}
          icon={<Layers className="h-5 w-5" />}
          label={t("dash.plates")}
          onClick={() => router.push("/master-data/setting/ms_plates")}
          sub={`${fmt(plates.length)} ${t("dash.codesUnit")} · ${t("dash.remainingUnit")}`}
          unit="ชิ้น"
          value={fmt(plateTotal)}
        />
        <StatTile
          color={SERIES.scrap}
          icon={<Recycle className="h-5 w-5" />}
          label={t("dash.scrap")}
          onClick={() => router.push("/master-data/setting/wastrel_ms_plates")}
          sub={`${t("dash.plates")} ${fmt(scrapPlates.length)} · ${t("dash.roundBars")} ${fmt(scrapBars.length)}`}
          unit="ชิ้น"
          value={fmt(scrapTotal)}
        />
        <StatTile
          color={SERIES.orders}
          icon={<ScrollText className="h-5 w-5" />}
          label={t("dash.jp")}
          onClick={() => router.push("/po")}
          sub={t("dash.fromExpress")}
          unit={t("dash.items")}
          value={fmt(jp.length)}
        />
      </div>

      {/* สัดส่วน (แผนภูมิวงกลม) + สถานะงานตัด + สิ่งที่ต้องทำ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <StockPieCard
          hint={t("dash.pieHint")}
          onSliceClick={(key) => {
            if (key === "bars") router.push("/master-data/setting/steel_round_bars");
            if (key === "plates") router.push("/master-data/setting/ms_plates");
            if (key === "scrap") router.push("/master-data/setting/wastrel_ms_plates");
          }}
          segments={shares}
          title={t("dash.composition")}
          total={grandTotal}
          totalLabel={t("dash.total")}
        />

        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <CardHeader
            color={SERIES.orders}
            icon={<ClipboardList className="h-4 w-4" />}
            right={`${fmt(orders.length)} ${t("dash.items")}`}
            title={t("dash.poStatus")}
          />
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีใบสั่งซื้อในระบบ</p>
          ) : (
            <>
              <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
                {Object.entries(orderStatusCounts)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <div
                      key={key}
                      className="h-full rounded-full"
                      style={{ width: `${pct(count, orders.length)}%`, backgroundColor: STATUS_COLORS[key] }}
                      title={`${STATUS_LABELS[key]} ${count}`}
                    />
                  ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(orderStatusCounts).map(([key, count]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => router.push("/po")}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
                      {STATUS_LABELS[key]}
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums text-slate-800">{fmt(count)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <CardHeader color={SERIES.scrap} icon={<CalendarClock className="h-4 w-4" />} title={t("dash.todo")} />
          {todoItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t("dash.allClear")}</p>
          ) : (
            <ul className="space-y-2">
              {todoItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${item.tone}1a`, color: item.tone }}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{item.label}</span>
                    <span className="font-mono text-base font-bold tabular-nums text-slate-800">{fmt(item.value)}</span>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* กราฟแยกตามขนาด */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownCard
          color={SERIES.bars}
          emptyText={t("dash.emptyBars")}
          icon={<CircleDashed className="h-4 w-4" />}
          onRowClick={openBarDetail}
          rows={barsByDia.map(([dia, v]) => ({
            key: dia,
            label: dia > 0 ? `Ø${fmt(dia)} มม.` : t("dash.unknownSize"),
            count: v.count,
            qty: v.qty,
            muted: dia <= 0,
          }))}
          title={t("dash.byDiameter")}
          topLabel={t("dash.topN")}
          total={barTotal}
          unitLabel={t("dash.codesUnit")}
        />
        <BreakdownCard
          color={SERIES.plates}
          emptyText={t("dash.emptyPlates")}
          icon={<Layers className="h-4 w-4" />}
          onRowClick={openPlateDetail}
          rows={platesByThk.map(([thk, v]) => ({
            key: thk,
            label: thk > 0 ? `หนา ${fmt(thk)} มม.` : t("dash.unknownSize"),
            count: v.count,
            qty: v.qty,
            muted: thk <= 0,
          }))}
          title={t("dash.byThickness")}
          topLabel={t("dash.topN")}
          total={plateTotal}
          unitLabel={t("dash.codesUnit")}
        />
      </div>

      {/* ใบสั่งตัด: กราฟ 7 วัน + รายการล่าสุด */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <CardHeader
          color={SERIES.orders}
          icon={<ScrollText className="h-4 w-4" />}
          right={`${fmt(jp.length)} ${t("dash.items")}`}
          title={t("dash.jpTrend")}
        />

        <div className="mb-6 flex h-28 items-end gap-2">
          {jpByDay.map(({ day, count }) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1.5" title={`${day} · ${count}`}>
              <span className="font-mono text-xs font-bold tabular-nums text-slate-700">{count > 0 ? fmt(count) : ""}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max((count / maxJp) * 72, count > 0 ? 6 : 2)}px`,
                  backgroundColor: count > 0 ? SERIES.orders : "#e2e8f0",
                }}
              />
              <span className="font-mono text-[11px] text-slate-400">{day.slice(8)}/{day.slice(5, 7)}</span>
            </div>
          ))}
        </div>

        {jp.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">{t("dash.noJp")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-4 font-semibold">เลขที่</th>
                  <th className="py-2 pr-4 font-semibold">ลูกค้า</th>
                  <th className="py-2 pr-4 font-semibold">อ้างอิง</th>
                  <th className="py-2 text-right font-semibold">วันที่</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {jp.slice(0, 6).map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-slate-50"
                    onClick={() => router.push("/po")}
                  >
                    <td className="py-2 pr-4 font-mono text-xs font-semibold text-slate-800">{order.docNumber}</td>
                    <td className="max-w-[22rem] truncate py-2 pr-4">{order.customerName}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-400">{order.customerRef || "—"}</td>
                    <td className="py-2 text-right font-mono text-xs text-slate-500">{order.docDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <Boxes className="h-3.5 w-3.5" /> {t("dash.clickHint")}
      </p>

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
    </div>,
  );
}

/**
 * แผนภูมิวงกลม (โดนัท) สัดส่วนสต็อก
 * - เว้นช่องว่างระหว่างชิ้นส่วนตามสีพื้น อ่านขอบได้ชัด
 * - ตัวเลข/% อยู่ในรายการด้านขวาเสมอ (ไม่พึ่งสีอย่างเดียว)
 * - ชี้หรือคลิกได้ทั้งชิ้นส่วนและรายการ
 */
function StockPieCard({
  hint,
  onSliceClick,
  segments,
  title,
  total,
  totalLabel,
}: {
  hint: string;
  onSliceClick: (key: string) => void;
  segments: Array<{ key: string; label: string; value: number; color: string }>;
  title: string;
  total: number;
  totalLabel: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  // เส้นรอบวง = 100 หน่วย ทำให้คิดเป็น % ได้ตรง ๆ
  const RADIUS = 15.915;
  const GAP = segments.length > 1 ? 0.8 : 0;
  let offset = 25; // เริ่มวาดที่ 12 นาฬิกา

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <CardHeader color="#2a78d6" icon={<PieChart className="h-4 w-4" />} title={title} />

      <div className="flex flex-col items-center gap-5">
        <svg
          aria-label={`${title}: ${segments.map((s) => `${s.label} ${fmt(s.value)}`).join(", ")}`}
          className="h-44 w-44"
          role="img"
          viewBox="0 0 42 42"
        >
          <circle cx="21" cy="21" r={RADIUS} fill="none" stroke="#eef2f7" strokeWidth="6" />
          {total > 0 &&
            segments.map((segment) => {
              const share = pct(segment.value, total);
              const dash = Math.max(share - GAP, 0.4);
              const circle = (
                <circle
                  key={segment.key}
                  className="cursor-pointer transition-[stroke-width,opacity]"
                  cx="21"
                  cy="21"
                  fill="none"
                  onClick={() => onSliceClick(segment.key)}
                  onMouseEnter={() => setActive(segment.key)}
                  onMouseLeave={() => setActive(null)}
                  r={RADIUS}
                  stroke={segment.color}
                  strokeDasharray={`${dash} ${100 - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  strokeOpacity={active && active !== segment.key ? 0.35 : 1}
                  strokeWidth={active === segment.key ? 8 : 6}
                  transform="rotate(-90 21 21)"
                >
                  <title>
                    {segment.label} {fmt(segment.value)} ({share.toFixed(1)}%)
                  </title>
                </circle>
              );
              offset -= share;
              return circle;
            })}
          <text
            x="21"
            y="20"
            textAnchor="middle"
            className="fill-slate-800"
            style={{ fontSize: 5, fontWeight: 700 }}
          >
            {fmt(total)}
          </text>
          <text x="21" y="25" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 2.6 }}>
            {totalLabel}
          </text>
        </svg>

        <ul className="w-full space-y-1.5">
          {segments.map((segment) => (
            <li key={segment.key}>
              <button
                type="button"
                onClick={() => onSliceClick(segment.key)}
                onMouseEnter={() => setActive(segment.key)}
                onMouseLeave={() => setActive(null)}
                className={`grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                  active === segment.key ? "bg-slate-50" : ""
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="truncate text-sm text-slate-600">{segment.label}</span>
                <span className="font-mono text-sm font-bold tabular-nums text-slate-800">{fmt(segment.value)}</span>
                <span className="w-12 text-right font-mono text-xs tabular-nums text-slate-400">
                  {pct(segment.value, total).toFixed(1)}%
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-center text-[11px] text-slate-400">{hint}</p>
      </div>
    </section>
  );
}

function CardHeader({
  color,
  icon,
  right,
  title,
}: {
  color: string;
  icon: React.ReactNode;
  right?: string;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {icon}
        </span>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
      </div>
      {right ? (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-500">{right}</span>
      ) : null}
    </div>
  );
}

/** การ์ดตัวเลขหลัก — คลิกเพื่อไปหน้ารายละเอียด */
function StatTile({
  color,
  icon,
  label,
  onClick,
  sub,
  unit,
  value,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  sub: string;
  unit?: string;
  value: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              {icon}
            </span>
            <p className="text-sm font-medium text-slate-500">{label}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
        </div>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-bold tabular-nums text-slate-800">{value}</span>
          {unit ? <span className="text-xs text-slate-400">{unit}</span> : null}
        </p>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      </div>
    </button>
  );
}

/** กราฟแท่งแนวนอน — ตัวเลขและ % อยู่นอกแท่ง, กลุ่มที่ไม่ระบุขนาดเป็นสีเทา */
function BreakdownCard({
  color,
  emptyText,
  icon,
  onRowClick,
  rows,
  title,
  topLabel,
  total,
  unitLabel,
}: {
  color: string;
  emptyText: string;
  icon: React.ReactNode;
  onRowClick: (key: number) => void;
  rows: Array<{ key: number; label: string; count: number; qty: number; muted?: boolean }>;
  title: string;
  topLabel: string;
  total: number;
  unitLabel: string;
}) {
  const max = Math.max(...rows.map((row) => row.qty), 1);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <CardHeader color={color} icon={icon} right={topLabel} title={title} />

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => {
            const barColor = row.muted ? SERIES.unknown : color;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  onClick={() => onRowClick(row.key)}
                  className="grid w-full grid-cols-[7.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                  title={`${row.label} · ${fmt(row.qty)} · ${fmt(row.count)} ${unitLabel}`}
                >
                  <span className={`truncate text-sm ${row.muted ? "text-slate-400" : "font-medium text-slate-600"}`}>
                    {row.label}
                  </span>
                  <span className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full transition-all"
                      style={{ width: `${Math.max((row.qty / max) * 100, 2)}%`, backgroundColor: barColor }}
                    />
                  </span>
                  <span className="flex items-baseline gap-2 justify-self-end text-right">
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-800">{fmt(row.qty)}</span>
                    <span className="w-10 font-mono text-[11px] tabular-nums text-slate-400">
                      {pct(row.qty, total).toFixed(0)}%
                    </span>
                    <span className="w-14 font-mono text-[11px] tabular-nums text-slate-400">
                      {fmt(row.count)} {unitLabel}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
