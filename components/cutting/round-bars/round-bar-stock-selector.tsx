"use client";

import { Autocomplete } from "../../ui/autocomplete";
import { InlineLoading } from "@/components/loading";
import { fmt } from "@/utils/format";
import { useCutting } from "@/hooks/use-cutting";

export function RoundBarStockSelector() {
  const { dataStatus, selectedBar, selectedBarId, setSelectedBarId, stockBars } = useCutting();

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">เลือกแท่งจากคลัง (steel_round_bars)</span>
        <InlineLoading isLoading={dataStatus.isLoading} label="กำลังโหลดคลัง..." />
      </div>
      <Autocomplete
        onValueChange={setSelectedBarId}
        options={stockBars.map((bar) => {
          // บางรหัสจากคลังเดิมแกะขนาดจากชื่อสินค้าไม่ได้ — บอกให้ชัดว่าต้องกรอกเอง
          const hasSize = Number(bar.diameter) > 0 && Number(bar.length) > 0;
          const size = hasSize
            ? `Ø${fmt(bar.diameter)} × ${fmt(bar.length)} มม.`
            : "ไม่ระบุขนาด (ต้องกรอกเอง)";
          return {
            value: bar.id,
            label: `${bar.code} | ${size} (คงเหลือ ${bar.available_quantity})`,
          };
        })}
        placeholder={stockBars.length === 0 ? "ไม่มีแท่งในคลัง" : undefined}
        value={selectedBarId}
      />
      {selectedBar ? (
        <p className="mt-2 font-mono text-xs text-blue-700">
          ใช้แท่ง {selectedBar.code} | Ø{selectedBar.diameter} มม. | สถานะ {selectedBar.status ?? "-"}
        </p>
      ) : null}
    </div>
  );
}

