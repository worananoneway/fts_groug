"use client";

import { useEffect, useState } from "react";

import { InlineLoading } from "@/components/loading";
import { SCRAP_LOCATIONS } from "@/constants/scrap-locations";
import { loadLocations } from "@/services/master-data/locations";

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
  // รายการที่จัดเก็บมาจากตาราง locations ในฐานข้อมูล (ถ้าโหลดไม่ได้ค่อยใช้ค่าคงที่สำรอง)
  const [options, setOptions] = useState<string[]>(SCRAP_LOCATIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadLocations()
      .then((rows) => {
        if (!active || rows.length === 0) return;
        setOptions(rows.map((row) => row.name));
      })
      .catch((loadError) => {
        console.error("[ScrapLocation] โหลดรายการที่จัดเก็บไม่สำเร็จ ใช้ค่าคงที่แทน:", loadError);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleChange(value: string) {
    const loc = value === "" ? null : value;
    setIsSaving(true);
    setSaved(false);
    setError(false);
    try {
      await onSave(loc);
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        value={mixed ? "" : current ?? ""}
        disabled={isSaving}
        onChange={(e) => void handleChange(e.target.value)}
      >
        <option value="">{mixed ? "— หลายที่ (เลือกเพื่อรวมเป็นที่เดียว) —" : "— ยังไม่กำหนดที่เก็บ —"}</option>
        {options.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      <InlineLoading isLoading={isSaving} label="กำลังบันทึก..." />
      {saved ? <span className="text-xs font-semibold text-emerald-600">บันทึกแล้ว ✓ (กดรีเฟรชเพื่ออัปเดตตาราง)</span> : null}
      {error ? <span className="text-xs font-semibold text-red-600">บันทึกไม่สำเร็จ</span> : null}
    </div>
  );
}
