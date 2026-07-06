"use client";

import { RefreshCw } from "lucide-react";

import { Select } from "../../ui/select";
import { fmt } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateStockSelector() {
  const { dataStatus, selectedPlate, selectedPlateId, setSelectedPlateId, stockPlates } = useCalculationDivision();

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">เลือกแผ่นจากคลัง (ms_plates)</span>
        {dataStatus.loading ? (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            โหลด
          </span>
        ) : null}
      </div>
      <Select
        onChange={(event) => setSelectedPlateId(event.target.value)}
        options={stockPlates.map((plate) => ({
          value: plate.id,
          label: `${plate.code} | ${fmt(plate.length)}x${fmt(plate.width)} หนา ${plate.thickness} มม. (คงเหลือ ${plate.available_quantity})`,
        }))}
        placeholder="กำหนดขนาดเอง"
        value={selectedPlateId}
      />
      {selectedPlate ? (
        <p className="mt-2 font-mono text-xs text-blue-700">
          ใช้แผ่น {selectedPlate.code} | หนา {selectedPlate.thickness} มม. | สถานะ{" "}
          {selectedPlate.status ?? "-"}
        </p>
      ) : null}
    </div>
  );
}

