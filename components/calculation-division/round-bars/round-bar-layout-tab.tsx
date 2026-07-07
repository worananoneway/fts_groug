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
import { RoundBarLayoutCanvas } from "./round-bar-layout-canvas";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { Notice, RoundBarLayout } from "../types";

export function RoundBarLayoutTab() {
  const { barDiameter, barLength, cancelRoundPlan, confirmRoundPlan, roundAverageUtilization, roundResult, roundScraps } =
    useCalculationDivision();
  const [previewBar, setPreviewBar] = useState<{ bar: RoundBarLayout; barNo: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  if (!roundResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledMessage =
    roundResult.unplaced.length > 0
      ? `มี ${roundResult.unplaced.length} ชิ้นที่ยาวเกินแท่งเหล็ก: ${roundResult.unplaced
          .map((item) => `${item.code} (${fmt(item.length)} มม.)`)
          .join(", ")}`
      : "";

  async function runConfirm() {
    const result = await confirmRoundPlan();
    setNotice(result);
    setConfirmOpen(false);
  }

  async function runCancel() {
    const result = await cancelRoundPlan();
    setNotice(result);
    setCancelOpen(false);
  }

  const columns = splitInTwo(roundResult.bars);

  return (
    <div className="space-y-6">
      <UnfulfilledAlert message={unfulfilledMessage} />
      {notice ? <AlertBanner tone={notice.ok ? "success" : "warning"}>{notice.text}</AlertBanner> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(160px,1fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <div className="space-y-4 xl:sticky xl:top-64 xl:row-span-2 xl:self-start">
          <CalculationSummary
            averageUtilization={roundAverageUtilization}
            scrapCount={roundScraps.length}
            sourceCount={roundResult.bars.length}
            sourceLabel="จำนวนแท่งที่ใช้"
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
            {column.map(({ bar, index }) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewBar({ bar, barNo: index + 1 })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewBar({ bar, barNo: index + 1 });
                  }
                }}
              >
                <RoundBarLayoutCanvas
                  bar={bar}
                  barDiameter={barDiameter}
                  barLength={barLength}
                  barNo={index + 1}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Modal open={Boolean(previewBar)} title="แผนผังการตัด" onClose={() => setPreviewBar(null)} fullscreen>
        {previewBar ? (
          <RoundBarLayoutCanvas
            bar={previewBar.bar}
            barDiameter={barDiameter}
            barLength={barLength}
            barNo={previewBar.barNo}
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

function splitInTwo<T>(items: T[]): Array<Array<{ bar: T; index: number }>> {
  return [
    items.map((bar, index) => ({ bar, index })).filter((_, index) => index % 2 === 0),
    items.map((bar, index) => ({ bar, index })).filter((_, index) => index % 2 === 1),
  ];
}

