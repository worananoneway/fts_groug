"use client";

import { useState } from "react";

import { InlineLoading } from "@/components/loading";
import { fromDateTimeInput, toDateTimeInput } from "@/utils/format";

/**
 * ช่องกรอก "วัน-เวลาที่กำหนด" — เลือกแล้วบันทึกลงฐานข้อมูลทันที
 * ใช้ได้ทั้งกับเศษเหล็ก (บันทึกทั้งกลุ่ม) และสต็อกหลัก
 */
export function ScheduleEditor({
  current,
  mixed = false,
  onSave,
  label = "วัน-เวลาที่กำหนด",
}: {
  current: string | null;
  mixed?: boolean;
  onSave: (isoOrNull: string | null) => Promise<void>;
  label?: string;
}) {
  const [value, setValue] = useState<string>(toDateTimeInput(current));
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function handleChange(next: string) {
    setValue(next);
    setIsSaving(true);
    setSaved(false);
    setError(false);
    try {
      await onSave(fromDateTimeInput(next));
      setSaved(true);
    } catch (saveError) {
      console.error("[Schedule] บันทึกวัน-เวลาไม่สำเร็จ:", saveError);
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        aria-label={label}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        disabled={isSaving}
        onChange={(event) => void handleChange(event.target.value)}
        type="datetime-local"
        value={value}
      />
      {value ? (
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50"
          disabled={isSaving}
          onClick={() => void handleChange("")}
        >
          ล้าง
        </button>
      ) : null}

      {mixed && !value ? <span className="text-xs text-amber-600">หลายค่า (เลือกเพื่อตั้งให้ทั้งกลุ่ม)</span> : null}
      <InlineLoading isLoading={isSaving} label="กำลังบันทึก..." />
      {saved && !isSaving ? (
        <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓ (กดรีเฟรชเพื่ออัปเดตตาราง)</span>
      ) : null}
      {error ? <span className="text-xs font-semibold text-red-600">บันทึกไม่สำเร็จ</span> : null}
    </div>
  );
}
