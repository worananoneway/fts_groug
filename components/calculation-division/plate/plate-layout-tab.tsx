"use client";

import { useState } from "react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { ConfirmDialog } from "../../ui/confirm-dialog";
import { EmptyState } from "../../ui/empty-state";
import { Modal } from "../../ui/modal";
import { CalculationSummary } from "../shared/calculation-summary";
import { UnfulfilledAlert } from "../shared/unfulfilled-alert";
import { fmt } from "../mappers";
import { PlateLayoutCanvas } from "./plate-layout-canvas";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { Notice, PlateSheet } from "../types";

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
  } = useCalculationDivision();
  const [previewSheet, setPreviewSheet] = useState<{ sheet: PlateSheet; sheetNo: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
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
    const result = await confirmPlatePlan();
    setNotice(result);
    setConfirmOpen(false);
  }

  async function runCancel() {
    const result = await cancelPlatePlan();
    setNotice(result);
    setCancelOpen(false);
  }

  const columns = splitInTwo(plateResult.sheets);

  return (
    <div className="space-y-6">
      <UnfulfilledAlert message={unfulfilledMessage} />
      {notice ? <AlertBanner tone={notice.ok ? "success" : "warning"}>{notice.text}</AlertBanner> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(160px,1fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <div className="space-y-4 xl:sticky xl:top-64 xl:row-span-2 xl:self-start">
          <CalculationSummary
            averageUtilization={plateAverageUtilization}
            scrapCount={plateScraps.length}
            sourceCount={plateResult.sheets.length}
            sourceLabel="จำนวนแผ่นที่ใช้"
            vertical
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg bg-white p-4 shadow-sm xl:col-span-2">
          <Button onClick={() => setConfirmOpen(true)} variant="success">
            ยืนยัน
          </Button>
          <Button onClick={() => setCancelOpen(true)} variant="danger">
            ยกเลิก
          </Button>
        </div>
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-5">
            {column.map(({ sheet, index }) => (
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
                  sheet={sheet}
                  sheetH={sheetH}
                  sheetNo={index + 1}
                  sheetW={sheetW}
                  sourceCode={selectedPlate?.code}
                />
              </div>
            ))}
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
        open={confirmOpen}
        title="ยืนยันแผนการตัด"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void runConfirm()}
        confirmLabel="ยืนยัน"
        variant="success"
      >
        ระบบจะเปลี่ยนสถานะรายการที่เลือกเป็น Completed และบันทึกเศษลงคลัง
      </ConfirmDialog>
      <ConfirmDialog
        open={cancelOpen}
        title="ยกเลิกแผนการตัด"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => void runCancel()}
        confirmLabel="ยืนยันยกเลิก"
      >
        ระบบจะเปลี่ยนสถานะรายการที่เลือกเป็น Cancelled
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

