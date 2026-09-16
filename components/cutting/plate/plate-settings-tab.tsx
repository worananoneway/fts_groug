"use client";

import { ChevronRight, Layers, Package, Scissors } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { PlateItemForm } from "./plate-item-form";
import { PlateItemList } from "./plate-item-list";
import { PlateSourcePlanCard } from "./plate-source-plan-card";
import { PlateStockSelector } from "./plate-stock-selector";
import { useCutting } from "@/hooks/use-cutting";

export function PlateSettingsTab() {
  const {
    calculatePlate,
    clearPlatePoLoad,
    dismissPlateCalcNotice,
    plateCalcNotice,
    kerf,
    minScrap,
    plateItems,
    plateLoadedFromPo,
    plateTotalPieces,
    setKerf,
    setMinScrap,
    setSheetH,
    setSheetW,
    sheetH,
    sheetW,
  } = useCutting();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,3fr)_minmax(0,7fr)]">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Layers className="h-5 w-5 text-blue-600" />
          ขนาดแผ่นเหล็ก
        </h2>

        {plateLoadedFromPo ? (
          <AlertBanner className="mb-4" tone="info">
            โหลดรายการจาก {plateLoadedFromPo}
            <button
              type="button"
              className="ml-2 font-semibold underline"
              onClick={clearPlatePoLoad}
            >
              ล้างป้ายกำกับ
            </button>
          </AlertBanner>
        ) : null}

        <PlateStockSelector />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field
            label="ความกว้าง W (มม.)"
            onChange={(event) => setSheetW(Number(event.target.value))}
            type="number"
            value={sheetW}
          />
          <Field
            label="ความยาว H (มม.)"
            onChange={(event) => setSheetH(Number(event.target.value))}
            type="number"
            value={sheetH}
          />
        </div>

        <PlateSourcePlanCard />
      </section>

      <section className="flex flex-col rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-56 lg:h-[calc(100vh-15.5rem)] lg:overflow-auto ">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Package className="h-5 w-5 text-blue-600" />
          รายการสั่งตัด
        </h2>
        <PlateItemForm />
        <PlateItemList />
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>{plateItems.length} รายการ</span>
          <span>
            รวม <b className="text-base text-slate-800">{plateTotalPieces}</b> ชิ้น
          </span>
        </div>
        {plateCalcNotice ? (
          <AlertBanner className="mt-4" tone={plateCalcNotice.ok ? "success" : "danger"}>
            {plateCalcNotice.text}
            <button type="button" className="ml-2 font-semibold underline" onClick={dismissPlateCalcNotice}>
              ปิด
            </button>
          </AlertBanner>
        ) : null}

        <Button
          className="mt-4 w-full py-4 text-base"
          disabled={plateItems.length === 0}
          icon={<Scissors className="h-5 w-5" />}
          onClick={calculatePlate}
          variant="warning"
        >
          คำนวณแผนการตัด
          <ChevronRight className="h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}

