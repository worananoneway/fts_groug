"use client";

import { fmt, sqm } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateSourcePlanCard() {
  const { sheetH, sheetW } = useCalculationDivision();
  const previewHeight = Math.max(48, Math.min(240, (sheetH / Math.max(sheetW, 1)) * 240));

  return (
    <div className="mt-6 rounded-lg bg-slate-50 p-6">
      <p className="mb-4 text-center text-sm text-slate-400">ตัวอย่างขนาดแผ่น</p>
      <div className="flex justify-center">
        <div
          className="flex items-center justify-center rounded border-2 border-blue-500 bg-blue-50 font-mono text-sm font-bold text-blue-800"
          style={{ height: previewHeight, width: 240 }}
        >
          {fmt(sheetW)} x {fmt(sheetH)}
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-sm text-slate-500">
        พื้นที่ {sqm(sheetW, sheetH)} ตร.ม.
      </p>
    </div>
  );
}

