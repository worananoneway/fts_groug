"use client";

import { Recycle, Save } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { EmptyState } from "../../ui/empty-state";
import { WastrelProposalTable } from "../shared/wastrel-proposal-table";
import { fmt, sqm } from "../mappers";
import { PlateScrapTable } from "./plate-scrap-table";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateScrapTab() {
  const {
    plateScrapMessage,
    plateScraps,
    removeScrapPlate,
    savePlateScraps,
    scrapPlates,
    unsavedPlateScraps,
  } = useCalculationDivision();

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Recycle className="h-5 w-5 text-blue-600" />
            เศษจากการคำนวณล่าสุด
          </h2>
          <Button
            disabled={unsavedPlateScraps.length === 0}
            icon={<Save className="h-4 w-4" />}
            onClick={savePlateScraps}
            variant="success"
          >
            บันทึกเศษลงคลัง ({unsavedPlateScraps.length})
          </Button>
        </div>
        {plateScrapMessage ? (
          <AlertBanner className="mb-4" tone={plateScrapMessage.ok ? "success" : "warning"}>
            {plateScrapMessage.text}
          </AlertBanner>
        ) : null}
        {plateScraps.length === 0 ? (
          <EmptyState>ยังไม่มีเศษจากการคำนวณ ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>
        ) : (
          <PlateScrapTable rows={plateScraps} />
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Recycle className="h-5 w-5 text-blue-600" />
          เศษในคลัง
        </h2>
        {scrapPlates.length === 0 ? (
          <EmptyState>ยังไม่มีเศษเหล็กในคลัง</EmptyState>
        ) : (
          <WastrelProposalTable
            rows={scrapPlates.map((scrap) => ({
              id: scrap.id,
              code: scrap.code,
              size: `${fmt(scrap.length)} x ${fmt(scrap.width)} x หนา ${fmt(scrap.thickness)} มม. (${sqm(
                scrap.length,
                scrap.width,
              )} ตร.ม.)`,
              source: "ms_plates",
              remark: scrap.remark,
              action: (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-500 hover:underline"
                  onClick={() => removeScrapPlate(scrap.id)}
                >
                  ลบ
                </button>
              ),
            }))}
          />
        )}
      </section>
    </div>
  );
}
