"use client";

import { Recycle } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { EmptyState } from "../../ui/empty-state";
import { WastrelProposalTable } from "../shared/wastrel-proposal-table";
import { fmt, sqm } from "@/utils/format";
import { PlateScrapTable } from "./plate-scrap-table";
import { useCutting } from "@/hooks/use-cutting";

export function PlateScrapTab() {
  const {
    plateScrapMessage,
    plateScraps,
    removeScrapPlate,
    scrapPlates,
  } = useCutting();

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Recycle className="h-5 w-5 text-blue-600" />
          เศษจากการคำนวณล่าสุด
        </h2>
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
