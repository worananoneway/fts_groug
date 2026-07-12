"use client";

import { RefreshCw } from "lucide-react";

import { Select } from "../../ui/select";
import { fmt } from "@/utils/format";
import { useCutting } from "@/hooks/use-cutting";

export function RoundBarStockSelector() {
  const { dataStatus, selectedBar, selectedBarId, setSelectedBarId, stockBars } = useCutting();

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">เลือกแท่งจากคลัง (steel_round_bars)</span>
        {dataStatus.loading ? (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            โหลด
          </span>
        ) : null}
      </div>
      <Select
        onChange={(event) => setSelectedBarId(event.target.value)}
        options={stockBars.map((bar) => ({
          value: bar.id,
          label: `${bar.code} | Ø${fmt(bar.diameter)} x ${fmt(bar.length)} มม. (คงเหลือ ${bar.available_quantity})`,
        }))}
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

