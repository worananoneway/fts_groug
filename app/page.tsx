"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Package,
  Recycle,
  RefreshCw,
  Ruler,
  Save,
  Scissors,
  Settings,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCuttingPlan } from "../hooks/use_cutting_plan";
import { useMsPlates } from "../hooks/use_ms_plates";
import { SCRAP_CODE_PREFIX } from "./lib/ms_plates_api";

/* ---------- constants ---------- */

const TABS = [
  { key: "settings", label: "ตั้งค่าและสั่งตัด", icon: Settings },
  { key: "layout", label: "แผนผังการตัด", icon: Ruler },
  { key: "scrap", label: "คลังเศษเหล็ก", icon: Recycle },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ---------- helpers ---------- */

const fmt = (n: number) => n.toLocaleString("en-US");

const sqm = (w: number, h: number) =>
  ((w * h) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

function nextCode(used: string[]): string {
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(65 + i);
    if (!used.includes(c)) return c;
  }
  return `X${used.length + 1}`;
}

/* ---------- page ---------- */

export default function Home() {
  const [tab, setTab] = useState<TabKey>("settings");

  const plan = useCuttingPlan();
  const inventory = useMsPlates();

  // sheet source: plate selected from backend inventory (null = manual size)
  const [selectedPlateId, setSelectedPlateId] = useState<string>("");
  const selectedPlate = useMemo(
    () => inventory.stockPlates.find((p) => p.id === selectedPlateId) ?? null,
    [inventory.stockPlates, selectedPlateId],
  );

  // add form
  const [formCode, setFormCode] = useState("");
  const [formW, setFormW] = useState("");
  const [formH, setFormH] = useState("");
  const [formQty, setFormQty] = useState("1");

  // scrap saving state
  const [savingScraps, setSavingScraps] = useState(false);
  const [scrapMessage, setScrapMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedScrapKeys, setSavedScrapKeys] = useState<string[]>([]);

  const selectPlate = (id: string) => {
    setSelectedPlateId(id);
    const p = inventory.stockPlates.find((pl) => pl.id === id);
    if (p) {
      plan.setSheetW(p.length);
      plan.setSheetH(p.width);
    }
  };

  const addItem = () => {
    const w = Number(formW);
    const h = Number(formH);
    if (!w || !h || w <= 0 || h <= 0) return;
    const code = (formCode.trim().toUpperCase() || nextCode(plan.items.map((it) => it.code))).slice(0, 3);
    plan.addItem(code, w, h, Number(formQty));
    setFormCode("");
    setFormW("");
    setFormH("");
    setFormQty("1");
  };

  const calculate = () => {
    if (plan.calculate()) {
      setSavedScrapKeys([]);
      setScrapMessage(null);
      setTab("layout");
    }
  };

  const scrapKey = (sc: { sheetNo: number; x: number; y: number }) =>
    `${sc.sheetNo}:${sc.x}:${sc.y}`;
  const unsavedScraps = plan.scraps.filter((sc) => !savedScrapKeys.includes(scrapKey(sc)));

  const saveScraps = async () => {
    if (unsavedScraps.length === 0 || savingScraps) return;
    setSavingScraps(true);
    setScrapMessage(null);
    const stamp = Date.now().toString(36).toUpperCase();
    let saved = 0;
    let firstError: string | null = null;
    for (const [i, sc] of unsavedScraps.entries()) {
      try {
        await inventory.create({
          code: `${SCRAP_CODE_PREFIX}${stamp}-${i + 1}`,
          length: Math.floor(sc.w),
          width: Math.floor(sc.h),
          thickness: selectedPlate?.thickness || 1,
          quantity: 1,
          available_quantity: 1,
          remark: `เศษจากแผ่นที่ ${sc.sheetNo}${selectedPlate ? ` (แผ่นแม่ ${selectedPlate.code})` : ""} ขนาด ${Math.floor(sc.w)}×${Math.floor(sc.h)} มม.`,
        });
        saved++;
        setSavedScrapKeys((prev) => [...prev, scrapKey(sc)]);
      } catch (e) {
        firstError ??= e instanceof Error ? e.message : "บันทึกไม่สำเร็จ";
      }
    }
    setScrapMessage(
      firstError
        ? { ok: false, text: `บันทึกได้ ${saved}/${unsavedScraps.length} ชิ้น — ${firstError}` }
        : { ok: true, text: `บันทึกเศษลงคลังแล้ว ${saved} ชิ้น` },
    );
    setSavingScraps(false);
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* ===== header ===== */}
      <header className="bg-[#1a2f7a] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-400 text-[#1a2f7a] shadow-md">
              <Scissors className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-widest">FTS-GROUP</h1>
              <p className="text-sm text-blue-200">
                ระบบคำนวณการตัดเหล็กแผ่น · Steel Sheet Cutting Optimizer
              </p>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-1.5 sm:flex">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-blue-100">
              <Info className="h-4 w-4" />
              Guillotine Packing Algorithm
            </div>
            <span
              className={`flex items-center gap-1.5 text-xs ${inventory.loading
                  ? "text-blue-200"
                  : inventory.error
                    ? "text-amber-300"
                    : "text-emerald-300"
                }`}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {inventory.loading
                ? "กำลังเชื่อมต่อหลังบ้าน…"
                : inventory.error
                  ? "หลังบ้านออฟไลน์"
                  : "เชื่อมต่อหลังบ้านแล้ว"}
            </span>
          </div>
        </div>

        {/* tabs */}
        <nav className="mx-auto mt-4 flex max-w-6xl gap-2 px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-3 px-5 py-3 text-sm font-semibold transition ${tab === t.key
                  ? "border-amber-400 text-white"
                  : "border-transparent text-blue-200 hover:text-white"
                }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* ===== tab 1 : settings ===== */}
        {tab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
            {/* sheet settings card */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Layers className="h-5 w-5 text-blue-600" /> ขนาดแผ่นเหล็ก
              </h2>

              {/* pick from backend inventory */}
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    เลือกแผ่นจากคลัง (ms_plates)
                  </span>
                  {inventory.error && (
                    <button
                      onClick={inventory.refetch}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่
                    </button>
                  )}
                </div>
                {inventory.loading ? (
                  <p className="animate-pulse text-sm text-slate-400">กำลังโหลดคลังแผ่นเหล็ก…</p>
                ) : inventory.error ? (
                  <p className="flex items-center gap-1.5 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {inventory.error} — กรอกขนาดเองได้ด้านล่าง
                  </p>
                ) : inventory.stockPlates.length === 0 ? (
                  <p className="text-sm text-slate-400">คลังยังไม่มีแผ่นเหล็ก — กรอกขนาดเองด้านล่าง</p>
                ) : (
                  <select
                    value={selectedPlateId}
                    onChange={(e) => selectPlate(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— กำหนดขนาดเอง —</option>
                    {inventory.stockPlates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {fmt(p.length)}×{fmt(p.width)} หนา {p.thickness} มม. (คงเหลือ{" "}
                        {p.available_quantity})
                      </option>
                    ))}
                  </select>
                )}
                {selectedPlate && (
                  <p className="mt-2 font-mono text-xs text-blue-700">
                    ใช้แผ่น {selectedPlate.code} · หนา {selectedPlate.thickness} มม. · สถานะ{" "}
                    {selectedPlate.status}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">ความกว้าง W (มม.)</span>
                  <input
                    type="number"
                    value={plan.sheetW}
                    onChange={(e) => {
                      plan.setSheetW(Number(e.target.value));
                      setSelectedPlateId("");
                    }}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">ความยาว H (มม.)</span>
                  <input
                    type="number"
                    value={plan.sheetH}
                    onChange={(e) => {
                      plan.setSheetH(Number(e.target.value));
                      setSelectedPlateId("");
                    }}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">
                    ความกว้างใบตัด Kerf (มม.)
                  </span>
                  <input
                    type="number"
                    value={plan.kerf}
                    onChange={(e) => plan.setKerf(Number(e.target.value))}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">
                    เศษขั้นต่ำที่บันทึก (มม.)
                  </span>
                  <input
                    type="number"
                    value={plan.minScrap}
                    onChange={(e) => plan.setMinScrap(Number(e.target.value))}
                    className={inputCls}
                  />
                </label>
              </div>

              {/* sheet preview */}
              <div className="mt-6 rounded-xl bg-slate-50 p-6">
                <p className="mb-4 text-center text-sm text-slate-400">ตัวอย่างขนาดแผ่น</p>
                <div className="flex justify-center">
                  <div
                    className="flex items-center justify-center rounded border-2 border-blue-500 bg-blue-50 font-mono text-sm font-bold text-blue-800"
                    style={{
                      width: 240,
                      height: Math.max(
                        48,
                        Math.min(240, (plan.sheetH / Math.max(plan.sheetW, 1)) * 240),
                      ),
                    }}
                  >
                    {fmt(plan.sheetW)} × {fmt(plan.sheetH)}
                  </div>
                </div>
                <p className="mt-4 text-center font-mono text-sm text-slate-500">
                  พื้นที่ {sqm(plan.sheetW, plan.sheetH)} ตร.ม.
                </p>
              </div>
            </section>

            {/* cut list card */}
            <section className="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Package className="h-5 w-5 text-blue-600" /> รายการสั่งตัด
              </h2>

              {/* add form */}
              <div className="mb-4 grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">รหัส</span>
                  <input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="A–Z"
                    className={`${inputCls} text-center`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">กว้าง W</span>
                  <input
                    type="number"
                    value={formW}
                    onChange={(e) => setFormW(e.target.value)}
                    placeholder="มม."
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">ยาว H</span>
                  <input
                    type="number"
                    value={formH}
                    onChange={(e) => setFormH(e.target.value)}
                    placeholder="มม."
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-slate-600">จำนวน</span>
                  <input
                    type="number"
                    min={1}
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <button
                  onClick={addItem}
                  className="flex h-[46px] items-center justify-center rounded-xl bg-blue-600 px-5 text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                  aria-label="เพิ่มรายการ"
                >
                  <Package className="h-5 w-5" />
                </button>
              </div>

              {/* item rows */}
              <div className="flex-1 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                {plan.items.length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-400">
                    ยังไม่มีรายการ — เพิ่มชิ้นงานที่ต้องการตัดด้านบน
                  </p>
                )}
                {plan.items.map((it) => (
                  <div
                    key={it.id}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-3 bg-slate-50/50 px-4 py-3 font-mono text-slate-700"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <span
                        className="inline-block h-3.5 w-3.5 rounded"
                        style={{ backgroundColor: it.color }}
                      />
                      {it.code}
                    </span>
                    <span>{fmt(it.w)}</span>
                    <span>{fmt(it.h)}</span>
                    <span className="font-bold text-blue-700">×{it.qty}</span>
                    <button
                      onClick={() => plan.removeItem(it.id)}
                      className="text-slate-300 transition hover:text-red-500"
                      aria-label={`ลบรายการ ${it.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{plan.items.length} รายการ</span>
                <span>
                  รวม <b className="text-base text-slate-800">{plan.totalPieces}</b> ชิ้น
                </span>
              </div>
            </section>

            {/* calculate button spans right column on large screens */}
            <div className="lg:col-start-2">
              <button
                onClick={calculate}
                disabled={plan.items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 py-5 text-xl font-bold text-white shadow-lg shadow-orange-200 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                <Scissors className="h-5 w-5" /> คำนวณแผนการตัด <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== tab 2 : layout ===== */}
        {tab === "layout" && (
          <div className="space-y-6">
            {!plan.result && (
              <div className="rounded-2xl bg-white p-16 text-center text-slate-400 shadow-sm">
                ยังไม่มีแผนการตัด — ไปที่แท็บ “ตั้งค่าและสั่งตัด” แล้วกดคำนวณ
              </div>
            )}

            {plan.result && plan.result.unplaced.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
                <span>
                  มี {plan.result.unplaced.length} ชิ้นที่ใหญ่เกินแผ่นเหล็ก:{" "}
                  {plan.result.unplaced.map((u) => `${u.code} (${fmt(u.w)}×${fmt(u.h)})`).join(", ")}
                </span>
              </div>
            )}

            {plan.result && (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="จำนวนแผ่นที่ใช้" value={`${plan.result.sheets.length} แผ่น`} />
                <StatCard
                  label="การใช้พื้นที่เฉลี่ย"
                  value={`${(
                    (plan.result.sheets.reduce(
                      (s, sh) => s + sh.pieces.reduce((a, p) => a + p.w * p.h, 0),
                      0,
                    ) /
                      (plan.result.sheets.length * plan.sheetW * plan.sheetH || 1)) *
                    100
                  ).toFixed(1)}%`}
                />
                <StatCard label="เศษที่เก็บได้" value={`${plan.scraps.length} ชิ้น`} />
              </div>
            )}

            {plan.result?.sheets.map((sheet, si) => {
              const used = sheet.pieces.reduce((a, p) => a + p.w * p.h, 0);
              const util = (used / (plan.sheetW * plan.sheetH)) * 100;
              return (
                <section key={si} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">
                      แผ่นที่ {si + 1}{" "}
                      <span className="ml-2 font-mono text-sm font-normal text-slate-500">
                        {fmt(plan.sheetW)} × {fmt(plan.sheetH)} มม.
                        {selectedPlate && ` · ${selectedPlate.code}`}
                      </span>
                    </h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700">
                      ใช้พื้นที่ {util.toFixed(1)}%
                    </span>
                  </div>
                  <svg
                    viewBox={`0 0 ${plan.sheetW} ${plan.sheetH}`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50"
                  >
                    {sheet.freeRects
                      .filter((fr) => fr.w >= plan.minScrap && fr.h >= plan.minScrap)
                      .map((fr, i) => (
                        <rect
                          key={`s${i}`}
                          x={fr.x}
                          y={fr.y}
                          width={fr.w}
                          height={fr.h}
                          fill="#f0fdf4"
                          stroke="#86efac"
                          strokeWidth={2}
                          strokeDasharray="12 8"
                        />
                      ))}
                    {sheet.pieces.map((p, i) => (
                      <g key={i}>
                        <rect
                          x={p.x}
                          y={p.y}
                          width={p.w}
                          height={p.h}
                          fill={p.color}
                          fillOpacity={0.85}
                          stroke="#1e293b"
                          strokeWidth={2}
                        />
                        <text
                          x={p.x + p.w / 2}
                          y={p.y + p.h / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={Math.min(p.w, p.h) * 0.3}
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill="#fff"
                        >
                          {p.code}
                        </text>
                        <text
                          x={p.x + p.w / 2}
                          y={p.y + p.h / 2 + Math.min(p.w, p.h) * 0.28}
                          textAnchor="middle"
                          fontSize={Math.min(p.w, p.h) * 0.13}
                          fontFamily="monospace"
                          fill="#ffffffcc"
                        >
                          {fmt(p.w)}×{fmt(p.h)}
                          {p.rotated ? " ↻" : ""}
                        </text>
                      </g>
                    ))}
                  </svg>
                </section>
              );
            })}
          </div>
        )}

        {/* ===== tab 3 : scrap ===== */}
        {tab === "scrap" && (
          <div className="space-y-6">
            {/* scraps from the last calculation, not yet saved */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Scissors className="h-5 w-5 text-blue-600" /> เศษจากการคำนวณล่าสุด
                  <span className="text-sm font-normal text-slate-400">
                    (ขนาดตั้งแต่ {fmt(plan.minScrap)} มม. ขึ้นไป)
                  </span>
                </h2>
                <button
                  onClick={saveScraps}
                  disabled={unsavedScraps.length === 0 || savingScraps}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
                >
                  <Save className="h-4 w-4" />
                  {savingScraps ? "กำลังบันทึก…" : `บันทึกเศษลงคลัง (${unsavedScraps.length})`}
                </button>
              </div>
              {scrapMessage && (
                <p
                  className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${scrapMessage.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                    }`}
                >
                  {scrapMessage.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  {scrapMessage.text}
                </p>
              )}
              {plan.scraps.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">
                  ยังไม่มีเศษจากการคำนวณ — ไปที่แท็บ “ตั้งค่าและสั่งตัด” แล้วกดคำนวณ
                </p>
              ) : (
                <ScrapTable
                  rows={plan.scraps.map((sc, i) => ({
                    key: scrapKey(sc),
                    no: i + 1,
                    source: `แผ่นที่ ${sc.sheetNo}`,
                    w: Math.floor(sc.w),
                    h: Math.floor(sc.h),
                    saved: savedScrapKeys.includes(scrapKey(sc)),
                  }))}
                />
              )}
            </section>

            {/* saved scraps from backend */}
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Recycle className="h-5 w-5 text-blue-600" /> เศษในคลัง
                  <span className="text-sm font-normal text-slate-400">(จากหลังบ้าน ms_plates)</span>
                </h2>
                <button
                  onClick={inventory.refetch}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <RefreshCw className="h-4 w-4" /> รีเฟรช
                </button>
              </div>
              {inventory.loading ? (
                <p className="animate-pulse p-8 text-center text-sm text-slate-400">
                  กำลังโหลดคลังเศษเหล็ก…
                </p>
              ) : inventory.error ? (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> เชื่อมต่อหลังบ้านไม่ได้: {inventory.error}
                </p>
              ) : inventory.scrapPlates.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">
                  ยังไม่มีเศษเหล็กในคลัง — บันทึกเศษจากการคำนวณด้านบนได้เลย
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-4 py-3">รหัส</th>
                        <th className="px-4 py-3">กว้าง (มม.)</th>
                        <th className="px-4 py-3">ยาว (มม.)</th>
                        <th className="px-4 py-3">หนา (มม.)</th>
                        <th className="px-4 py-3">พื้นที่ (ตร.ม.)</th>
                        <th className="px-4 py-3">หมายเหตุ</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="font-mono text-slate-700">
                      {inventory.scrapPlates.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 font-bold">{p.code}</td>
                          <td className="px-4 py-3">{fmt(p.length)}</td>
                          <td className="px-4 py-3">{fmt(p.width)}</td>
                          <td className="px-4 py-3">{p.thickness}</td>
                          <td className="px-4 py-3">{sqm(p.length, p.width)}</td>
                          <td className="max-w-60 truncate px-4 py-3 font-sans text-xs text-slate-500">
                            {p.remark}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() =>
                                inventory.remove(p.id).catch((e) =>
                                  setScrapMessage({
                                    ok: false,
                                    text: e instanceof Error ? e.message : "ลบไม่สำเร็จ",
                                  }),
                                )
                              }
                              className="text-slate-300 transition hover:text-red-500"
                              aria-label={`ลบ ${p.code}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center font-mono text-sm text-slate-400">
        FTS-GROUP · Steel Sheet Cutting Optimizer · ระบบคำนวณการตัดเหล็กแผ่น
      </footer>
    </div>
  );
}

/* ---------- small components ---------- */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function ScrapTable({
  rows,
}: {
  rows: { key: string; no: number; source: string; w: number; h: number; saved: boolean }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">ที่มา</th>
            <th className="px-4 py-3">กว้าง (มม.)</th>
            <th className="px-4 py-3">ยาว (มม.)</th>
            <th className="px-4 py-3">พื้นที่ (ตร.ม.)</th>
            <th className="px-4 py-3">สถานะ</th>
          </tr>
        </thead>
        <tbody className="font-mono text-slate-700">
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-slate-100">
              <td className="px-4 py-3">{r.no}</td>
              <td className="px-4 py-3">{r.source}</td>
              <td className="px-4 py-3">{fmt(r.w)}</td>
              <td className="px-4 py-3">{fmt(r.h)}</td>
              <td className="px-4 py-3">{sqm(r.w, r.h)}</td>
              <td className="px-4 py-3">
                {r.saved ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                    บันทึกแล้ว
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                    ยังไม่บันทึก
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
