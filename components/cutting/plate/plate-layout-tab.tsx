"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ConfirmDialog } from "../../ui/confirm-dialog";
import { EmptyState } from "../../ui/empty-state";
import { Modal } from "../../ui/modal";
import { TimedToast } from "../../ui/timed-toast";
import { CalculationSummary } from "../shared/calculation-summary";
import { UnfulfilledAlert, groupUnfulfilled } from "../shared/unfulfilled-alert";
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
  const router = useNavigate();
  const [previewSheet, setPreviewSheet] = useState<{ sheet: PlateSheet; sheetNo: number } | null>(null);
  const [planAction, setPlanAction] = useState<PlanAction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedSheets, setResolvedSheets] = useState<Record<number, "confirmed" | "cancelled">>({});
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(() => router.push("/po"), 1500);
    return () => clearTimeout(timer);
  }, [allDone, router]);

  if (!plateResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledItems = groupUnfulfilled(
    plateResult.unplaced.map((item) => `${item.code} · ${fmt(item.w)}×${fmt(item.h)} มม.`),
  );

  function markResolved(sourceNo: number | undefined, status: "confirmed" | "cancelled") {
    const next = { ...resolvedSheets };
    if (sourceNo) {
      next[sourceNo] = status;
    } else {
      plateResult?.sheets.forEach((_, i) => {
        next[i + 1] = status;
      });
    }
    setResolvedSheets(next);
    if (plateResult && Object.keys(next).length >= plateResult.sheets.length) {
      setAllDone(true);
    }
  }

  async function runConfirm() {
    if (!planAction) return;
    setIsProcessing(true);
    try {
      const result = await confirmPlatePlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
      setNotice(result);
      if (result.ok) markResolved(planAction.sourceNo, "confirmed");
      setPlanAction(null);
    } finally {
      setIsProcessing(false);
    }
  }

  async function runCancel() {
    if (!planAction) return;
    setIsProcessing(true);
    try {
      const result = await cancelPlatePlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
      setNotice(result);
      if (result.ok) markResolved(planAction.sourceNo, "cancelled");
      setPlanAction(null);
    } finally {
      setIsProcessing(false);
    }
  }

  const columns = splitInTwo(plateResult.sheets);

  return (
    <div className="space-y-6">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <UnfulfilledAlert
        hint={`แผ่นที่ใช้อยู่คือ ${fmt(sheetW)} × ${fmt(sheetH)} มม. — ถ้าขนาดนี้ไม่ถูกต้อง กลับไปแท็บ “ตั้งค่าและสั่งตัด” เพื่อแก้ขนาดแผ่นหรือเลือกแผ่นใหม่`}
        items={unfulfilledItems}
        total={plateResult.unplaced.length}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(160px,1fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <div className="space-y-4 xl:sticky xl:top-56 xl:row-span-2 xl:self-start">
          <CalculationSummary
            averageUtilization={plateAverageUtilization}
            scrapCount={plateScraps.length}
            sourceCount={plateResult.sheets.length}
            sourceLabel="จำนวนแผ่นที่ใช้"
            vertical
          />
        </div>
        {plateResult.sheets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center xl:col-span-2">
            <p className="text-base font-semibold text-slate-700">ยังไม่มีแผ่นไหนตัดได้</p>
            <p className="mt-1 text-sm text-slate-500">
              ทุกชิ้นในรายการใหญ่กว่าแผ่นขนาด {fmt(sheetW)} × {fmt(sheetH)} มม. ที่เลือกไว้
            </p>
            <p className="mt-3 text-sm text-slate-500">
              กลับไปแท็บ <b>ตั้งค่าและสั่งตัด</b> แล้วแก้ขนาดแผ่น หรือเลือกแผ่นจากคลังที่ใหญ่พอ
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm xl:col-span-2">
            <p className="text-sm text-slate-500">
              ตรวจแผนแต่ละแผ่นแล้วกดยืนยันทีละแผ่น หรือยืนยันทั้งหมดพร้อมกัน
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setPlanAction({ mode: "confirm" })} variant="success">
                ยืนยันทั้งหมด
              </Button>
              <Button onClick={() => setPlanAction({ mode: "cancel" })} variant="danger">
                ยกเลิกทั้งหมด
              </Button>
            </div>
          </div>
        )}
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-5">
            {column.map(({ sheet, index }) => {
              const detailIds = detailIdsForSheet(sheet);
              const sheetNo = index + 1;
              const status = resolvedSheets[sheetNo];
              return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewSheet({ sheet, sheetNo })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewSheet({ sheet, sheetNo });
                  }
                }}
                className={status ? "opacity-50 grayscale transition-all" : "transition-all"}
              >
                <PlateLayoutCanvas
                  actions={
                    status ? (
                      <Badge tone={status === "confirmed" ? "emerald" : "red"}>
                        {status === "confirmed" ? "ยืนยันแล้ว" : "ยกเลิกแล้ว"}
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlanAction({ detailIds, mode: "confirm", sourceNo: sheetNo });
                          }}
                          variant="success"
                        >
                          ยืนยัน
                        </Button>
                        <Button
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlanAction({ detailIds, mode: "cancel", sourceNo: sheetNo });
                          }}
                          variant="danger"
                        >
                          ยกเลิก
                        </Button>
                      </>
                    )
                  }
                  sheet={sheet}
                  sheetH={sheetH}
                  sheetNo={sheetNo}
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
        title={planAction?.sourceNo ? `ยืนยันแผนการตัดแผ่นที่ ${planAction.sourceNo}` : "ยืนยันแผนการตัดทั้งหมด"}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runConfirm()}
        confirmLabel="ยืนยัน"
        isLoading={isProcessing}
        variant="success"
      >
        {planAction?.sourceNo
          ? "ระบบจะเปลี่ยนสถานะรายการในแผ่นนี้เป็น Completed และบันทึกเศษของแผ่นนี้ลงคลัง"
          : "ระบบจะเปลี่ยนสถานะรายการทุกแผ่นเป็น Completed และบันทึกเศษทั้งหมดลงคลัง"}
      </ConfirmDialog>
      <ConfirmDialog
        open={planAction?.mode === "cancel"}
        title={planAction?.sourceNo ? `ยกเลิกแผนการตัดแผ่นที่ ${planAction.sourceNo}` : "ยกเลิกแผนการตัดทั้งหมด"}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runCancel()}
        confirmLabel="ยืนยันยกเลิก"
        isLoading={isProcessing}
      >
        {planAction?.sourceNo
          ? "ระบบจะเปลี่ยนสถานะรายการในแผ่นนี้เป็น Cancelled"
          : "ระบบจะเปลี่ยนสถานะรายการทุกแผ่นเป็น Cancelled"}
      </ConfirmDialog>
      <Modal
        open={allDone}
        title="เสร็จสมบูรณ์"
        onClose={() => router.push("/po")}
        footer={
          <div className="flex justify-center">
            <Button onClick={() => router.push("/po")} variant="success">
              ไปหน้าใบสั่งซื้อ PO ตอนนี้
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">ยืนยันครบทุกแผ่นแล้ว</h3>
          <p className="max-w-xs text-sm text-slate-500">
            ระบบบันทึกเศษของทุกแผ่นลงคลังเรียบร้อยแล้ว กำลังพาไปหน้าใบสั่งซื้อ PO...
          </p>
        </div>
      </Modal>
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
  detailIds?: string[];
  mode: "confirm" | "cancel";
  sourceNo?: number;
}

function detailIdsForSheet(sheet: PlateSheet): string[] {
  return Array.from(new Set(sheet.pieces.map((piece) => piece.orderDetailId).filter(Boolean))) as string[];
}

