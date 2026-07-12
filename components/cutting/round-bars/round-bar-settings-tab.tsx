"use client";

import { ChevronRight, Package, Ruler, Scissors } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { RoundBarItemForm } from "./round-bar-item-form";
import { RoundBarItemList } from "./round-bar-item-list";
import { RoundBarSourcePlanCard } from "./round-bar-source-plan-card";
import { RoundBarStockSelector } from "./round-bar-stock-selector";
import { useCutting } from "@/hooks/use-cutting";

export function RoundBarSettingsTab() {
  const {
    barDiameter,
    barLength,
    calculateRound,
    clearRoundPoLoad,
    rKerf,
    rMinScrap,
    roundItems,
    roundLoadedFromPo,
    roundMatchedCount,
    roundMismatchedCount,
    roundMismatchText,
    roundTotalPieces,
    setBarDiameter,
    setBarLength,
    setRKerf,
    setRMinScrap,
  } = useCutting();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,3fr)_minmax(0,7fr)]">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Ruler className="h-5 w-5 text-blue-600" />
          ขนาดเพลาเหล็กกลม
        </h2>

        {roundLoadedFromPo ? (
          <AlertBanner className="mb-4" tone="info">
            โหลดรายการจาก {roundLoadedFromPo}
            <button
              type="button"
              className="ml-2 font-semibold underline"
              onClick={clearRoundPoLoad}
            >
              ล้างป้ายกำกับ
            </button>
          </AlertBanner>
        ) : null}

        {roundMismatchedCount > 0 ? (
          <AlertBanner className="mb-4" tone="warning">
            {roundMismatchText}
          </AlertBanner>
        ) : null}

        <RoundBarStockSelector />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field
            label="เส้นผ่านศูนย์กลาง Ø (มม.)"
            onChange={(event) => setBarDiameter(Number(event.target.value))}
            type="number"
            value={barDiameter}
          />
          <Field
            label="ความยาวแท่ง (มม.)"
            onChange={(event) => setBarLength(Number(event.target.value))}
            type="number"
            value={barLength}
          />
          <Field
            label="ความกว้างใบตัด Kerf (มม.)"
            onChange={(event) => setRKerf(Number(event.target.value))}
            type="number"
            value={rKerf}
          />
          <Field
            label="เศษขั้นต่ำที่บันทึก (มม.)"
            onChange={(event) => setRMinScrap(Number(event.target.value))}
            type="number"
            value={rMinScrap}
          />
        </div>

        <RoundBarSourcePlanCard />
      </section>

      <section className="flex flex-col rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-56 lg:h-[calc(100vh-15.5rem)] lg:overflow-auto">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Package className="h-5 w-5 text-blue-600" />
          รายการสั่งตัดเพลา
        </h2>
        <RoundBarItemForm />
        <RoundBarItemList />
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>{roundItems.length} รายการ</span>
          <span>
            รวม <b className="text-base text-slate-800">{roundTotalPieces}</b> ชิ้น
          </span>
        </div>
        <Button
          className="mt-4 w-full py-4 text-base"
          disabled={roundMatchedCount === 0}
          icon={<Scissors className="h-5 w-5" />}
          onClick={calculateRound}
          variant="warning"
        >
          คำนวณแผนการตัด
          <ChevronRight className="h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}

