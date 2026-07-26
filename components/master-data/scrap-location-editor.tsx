"use client";

import { useState } from "react";

import { SCRAP_LOCATIONS } from "@/constants/scrap-locations";

// dropdown เลือกพื้นที่จัดเก็บเศษ + บันทึกลงฐานข้อมูล (ใช้ทั้งเศษแผ่นและเศษเพลา)
export function ScrapLocationEditor({
  current,
  mixed = false,
  onSave,
}: {
  current: string | null;
  mixed?: boolean;
  onSave: (location: string | null) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function handleChange(value: string) {
    const loc = value === "" ? null : value;
    setSaving(true);
    setSaved(false);
    setError(false);
    try {
      await onSave(loc);
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        value={mixed ? "" : current ?? ""}
        disabled={saving}
        onChange={(e) => void handleChange(e.target.value)}
      >
        <option value="">{mixed ? "— หลายที่ (เลือกเพื่อรวมเป็นที่เดียว) —" : "— ยังไม่กำหนดที่เก็บ —"}</option>
        {SCRAP_LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      {saving ? <span className="text-xs text-slate-400">กำลังบันทึก...</span> : null}
      {saved ? <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓ (กดรีเฟรชเพื่ออัปเดตตาราง)</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">บันทึกไม่สำเร็จ</span> : null}
    </div>
  );
}
