"use client";

import { Recycle, Save } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { EmptyState } from "../../ui/empty-state";
import { WastrelProposalTable } from "../shared/wastrel-proposal-table";
import { fmt } from "../mappers";
import { RoundBarScrapTable } from "./round-bar-scrap-table";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function RoundBarScrapTab() {
  const {
    removeScrapBar,
    roundScrapMessage,
    roundScraps,
    saveRoundScraps,
    scrapBars,
    unsavedRoundScraps,
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
            disabled={unsavedRoundScraps.length === 0}
            icon={<Save className="h-4 w-4" />}
            onClick={saveRoundScraps}
            variant="success"
          >
            บันทึกเศษลงคลัง ({unsavedRoundScraps.length})
          </Button>
        </div>
        {roundScrapMessage ? (
          <AlertBanner className="mb-4" tone={roundScrapMessage.ok ? "success" : "warning"}>
            {roundScrapMessage.text}
          </AlertBanner>
        ) : null}
        {roundScraps.length === 0 ? (
          <EmptyState>ยังไม่มีเศษจากการคำนวณ ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>
        ) : (
          <RoundBarScrapTable rows={roundScraps} />
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Recycle className="h-5 w-5 text-blue-600" />
          เศษในคลัง
        </h2>
        {scrapBars.length === 0 ? (
          <EmptyState>ยังไม่มีเศษเพลาในคลัง</EmptyState>
        ) : (
          <WastrelProposalTable
            rows={scrapBars.map((scrap) => ({
              id: scrap.id,
              code: scrap.code,
              size: `Ø${fmt(scrap.diameter)} x ${fmt(scrap.length)} มม.`,
              source: "steel_round_bars",
              remark: scrap.remark,
              action: (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-500 hover:underline"
                  onClick={() => removeScrapBar(scrap.id)}
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

