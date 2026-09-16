"use client";

import { Autocomplete } from "../../ui/autocomplete";
import { InlineLoading } from "@/components/loading";
import { fmt } from "@/utils/format";
import { useCutting } from "@/hooks/use-cutting";

export function PlateStockSelector() {
  const { dataStatus, selectedPlate, selectedPlateId, setSelectedPlateId, stockPlates } = useCutting();

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">เลือกแผ่นจากคลัง (ms_plates)</span>
        <InlineLoading isLoading={dataStatus.isLoading} label="กำลังโหลดคลัง..." />
      </div>
      <Autocomplete
        onValueChange={setSelectedPlateId}
        options={stockPlates.map((plate) => {
          // บางรหัสจากคลังเดิมแกะขนาดจากชื่อสินค้าไม่ได้ — บอกให้ชัดว่าต้องกรอกเอง
          const hasSize = Number(plate.length) > 0 && Number(plate.width) > 0;
          const size = hasSize ? `${fmt(plate.length)}×${fmt(plate.width)} มม.` : "ไม่ระบุขนาด (ต้องกรอกเอง)";
          return {
            value: plate.id,
            label: `${plate.code} | ${size} หนา ${plate.thickness || "-"} มม. (คงเหลือ ${plate.available_quantity})`,
          };
        })}
        placeholder={stockPlates.length === 0 ? "ไม่มีแผ่นในคลัง" : "เลือกแผ่นจากคลัง"}
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

