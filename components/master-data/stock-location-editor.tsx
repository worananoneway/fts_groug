"use client";

import { useEffect, useState } from "react";

import { InlineLoading } from "@/components/loading";
import { fromDateTimeInput, toDateTimeInput } from "@/utils/format";
import {
  loadLocations,
  locationTypeLabel,
  saveStockLocation,
  type LocationOption,
  type StockLocationType,
} from "@/services/master-data/locations";

// โหลดรายการที่จัดเก็บครั้งเดียวแล้วแชร์กันทุกที่ (กันยิง API ซ้ำตอนเปิดหลาย modal)
let locationsPromise: Promise<LocationOption[]> | null = null;
function getLocations(): Promise<LocationOption[]> {
  if (!locationsPromise) {
    locationsPromise = loadLocations().catch((error) => {
      console.error("[StockLocation] โหลดรายการที่จัดเก็บไม่สำเร็จ:", error);
      locationsPromise = null;
      return [];
    });
  }
  return locationsPromise;
}

/**
 * เลือก "ตำแหน่งจัดเก็บ" ให้สต็อกหนึ่งรหัส แล้วบันทึกลงตาราง stock_locations ทันที
 * ใช้ในหน้าข้อมูลหลัก (เหล็กแผ่น / เพลาเหล็กกลม) — รหัสจากระบบคลังเดิมก็ผูกได้
 */
export function StockLocationEditor({
  stockType,
  stockCode,
  initialLocId = null,
  initialScheduledAt = null,
}: {
  stockType: StockLocationType;
  stockCode: string | null;
  initialLocId?: string | null;
  /** วัน-เวลาที่กำหนดไว้เดิม (ISO) */
  initialScheduledAt?: string | null;
}) {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locId, setLocId] = useState<string>(initialLocId ?? "");
  const [scheduleInput, setScheduleInput] = useState<string>(toDateTimeInput(initialScheduledAt));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getLocations().then((rows) => {
      if (!active) return;
      setLocations(rows);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // บันทึกทั้งที่จัดเก็บและวัน-เวลาไปพร้อมกันเสมอ (API เป็น upsert ทั้งแถว)
  async function persist(nextLocId: string, nextSchedule: string) {
    if (!stockCode) return;
    setIsSaving(true);
    setSaved(false);
    setError(null);
    try {
      await saveStockLocation(
        stockType,
        stockCode,
        nextLocId === "" ? null : nextLocId,
        fromDateTimeInput(nextSchedule),
      );
      setSaved(true);
    } catch (saveError) {
      console.error("[StockLocation] บันทึกไม่สำเร็จ:", saveError);
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChange(value: string) {
    setLocId(value);
    await persist(value, scheduleInput);
  }

  async function handleScheduleChange(value: string) {
    setScheduleInput(value);
    await persist(locId, value);
  }

  if (!stockCode) return <span className="text-slate-300">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        value={locId}
        disabled={isLoading || isSaving}
        onChange={(event) => void handleChange(event.target.value)}
      >
        <option value="">— ยังไม่กำหนดที่จัดเก็บ —</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name} ({locationTypeLabel(location.type)})
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-xs text-slate-500">
        วัน-เวลาที่กำหนด
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
          disabled={isSaving}
          onChange={(event) => void handleScheduleChange(event.target.value)}
          type="datetime-local"
          value={scheduleInput}
        />
      </label>
      {scheduleInput ? (
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
          disabled={isSaving}
          onClick={() => void handleScheduleChange("")}
        >
          ล้างวันเวลา
        </button>
      ) : null}

      <InlineLoading isLoading={isLoading} label="กำลังโหลดที่จัดเก็บ..." />
      <InlineLoading isLoading={isSaving} label="กำลังบันทึก..." />

      {saved && !isSaving ? (
        <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓ (กดรีเฟรชเพื่ออัปเดตตาราง)</span>
      ) : null}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </div>
  );
}
