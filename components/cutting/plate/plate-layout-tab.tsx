"use client";

import { useState } from "react";

import { Button } from "../../ui/button";
import { ConfirmDialog } from "../../ui/confirm-dialog";
import { EmptyState } from "../../ui/empty-state";
import { Modal } from "../../ui/modal";
import { TimedToast } from "../../ui/timed-toast";
import { CalculationSummary } from "../shared/calculation-summary";
import { UnfulfilledAlert } from "../shared/unfulfilled-alert";
import { fmt } from "@/utils/format";
import { PlateLayoutCanvas } from "./plate-layout-canvas";
import { useCutting } from "@/hooks/use-cutting";
import type { Notice, PlateSheet } from "@/types/division";

export function PlateLayoutTab() {
  const {
    cancelPlatePlan,
    confirmPlatePlan,
    plateAverageUtilization,
    plateResult,
    plateScraps,
    selectedPlate,
    sheetH,
    sheetW,
  } = useCutting();
  const [previewSheet, setPreviewSheet] = useState<{ sheet: PlateSheet; sheetNo: number } | null>(null);
  const [planAction, setPlanAction] = useState<PlanAction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  if (!plateResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledMessage =
    plateResult.unplaced.length > 0
      ? `มี ${plateResult.unplaced.length} ชิ้นที่ใหญ่เกินแผ่นเหล็ก: ${plateResult.unplaced
          .map((item) => `${item.code} (${fmt(item.w)}x${fmt(item.h)})`)
          .join(", ")}`
      : "";

  async function runConfirm() {
    if (!planAction) return;
    const result = await confirmPlatePlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
    setNotice(result);
    setPlanAction(null);
  }

  async function runCancel() {
    if (!planAction) return;
    const result = await cancelPlatePlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
    setNotice(result);
    setPlanAction(null);
  }

  const columns = splitInTwo(plateResult.sheets);

  return (
    <div className="space-y-6">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <UnfulfilledAlert message={unfulfilledMessage} />
      <div className="grid gap-5 xl:grid-cols-[minmax(160px,1fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <div className="space-y-4 xl:sticky xl:top-56 xl:self-start">
          <CalculationSummary
            averageUtilization={plateAverageUtilization}
            scrapCount={plateScraps.length}
            sourceCount={plateResult.sheets.length}
            sourceLabel="จำนวนแผ่นที่ใช้"
            vertical
          />
        </div>
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-5">
            {column.map(({ sheet, index }) => {
              const detailIds = detailIdsForSheet(sheet);
              return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewSheet({ sheet, sheetNo: index + 1 })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewSheet({ sheet, sheetNo: index + 1 });
                  }
                }}
              >
                <PlateLayoutCanvas
                  actions={
                    <>
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPlanAction({ detailIds, mode: "confirm", sourceNo: index + 1 });
                        }}
                        variant="success"
                      >
                        ยืนยัน
                      </Button>
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPlanAction({ detailIds, mode: "cancel", sourceNo: index + 1 });
                        }}
                        variant="danger"
                      >
                        ยกเลิก
                      </Button>
                    </>
                  }
                  sheet={sheet}
                  sheetH={sheetH}
                  sheetNo={index + 1}
                  sheetW={sheetW}
                  sourceCode={selectedPlate?.code}
                />
              </div>
              );
            })}
          </div>
        ))}
      </div>
      <Modal open={Boolean(previewSheet)} title="แผนผังการตัด" onClose={() => setPreviewSheet(null)} fullscreen>
        {previewSheet ? (
          <PlateLayoutCanvas
            sheet={previewSheet.sheet}
            sheetH={sheetH}
            sheetNo={previewSheet.sheetNo}
            sheetW={sheetW}
            sourceCode={selectedPlate?.code}
          />
        ) : null}
      </Modal>
      <ConfirmDialog
        open={planAction?.mode === "confirm"}
        title={`ยืนยันแผนการตัดแผ่นที่ ${planAction?.sourceNo ?? ""}`}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runConfirm()}
        confirmLabel="ยืนยัน"
        variant="success"
      >
        ระบบจะเปลี่ยนสถานะรายการในแผ่นนี้เป็น Completed และบันทึกเศษของแผ่นนี้ลงคลัง
      </ConfirmDialog>
      <ConfirmDialog
        open={planAction?.mode === "cancel"}
        title={`ยกเลิกแผนการตัดแผ่นที่ ${planAction?.sourceNo ?? ""}`}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runCancel()}
        confirmLabel="ยืนยันยกเลิก"
      >
        ระบบจะเปลี่ยนสถานะรายการในแผ่นนี้เป็น Cancelled
      </ConfirmDialog>
    </div>
  );
}

function splitInTwo<T>(items: T[]): Array<Array<{ sheet: T; index: number }>> {
  return [
    items.map((sheet, index) => ({ sheet, index })).filter((_, index) => index % 2 === 0),
    items.map((sheet, index) => ({ sheet, index })).filter((_, index) => index % 2 === 1),
  ];
}

interface PlanAction {
  detailIds: string[];
  mode: "confirm" | "cancel";
  sourceNo: number;
}

function detailIdsForSheet(sheet: PlateSheet): string[] {
  return Array.from(new Set(sheet.pieces.map((piece) => piece.orderDetailId).filter(Boolean))) as string[];
}

