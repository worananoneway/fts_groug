"use client";

import { fmt } from "@/utils/format";
import { useCutting } from "@/hooks/use-cutting";

export function RoundBarSourcePlanCard() {
  const { barDiameter, barLength } = useCutting();

  return (
    <div className="mt-6 rounded-lg bg-slate-50 p-6">
      <p className="mb-4 text-center text-sm text-slate-400">ตัวอย่างขนาดแท่ง</p>
      <div className="flex justify-center">
        <div className="flex h-16 w-full max-w-sm items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 font-mono text-sm font-bold text-blue-800">
          Ø{fmt(barDiameter)} x {fmt(barLength)} มม.
        </div>
      </div>
    </div>
  );
}

