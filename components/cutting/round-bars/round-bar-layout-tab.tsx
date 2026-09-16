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
import { RoundBarLayoutCanvas } from "./round-bar-layout-canvas";
import { useCutting } from "@/hooks/use-cutting";
import type { Notice, RoundBarLayout } from "@/types/division";

export function RoundBarLayoutTab() {
  const {
    barDiameter,
    barLength,
    cancelRoundPlan,
    confirmRoundPlan,
    roundAverageUtilization,
    roundResult,
    roundScraps,
    selectedBar,
  } = useCutting();
  const router = useNavigate();
  const [previewBar, setPreviewBar] = useState<{ bar: RoundBarLayout; barNo: number } | null>(null);
  const [planAction, setPlanAction] = useState<PlanAction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolvedBars, setResolvedBars] = useState<Record<number, "confirmed" | "cancelled">>({});
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(() => router.push("/po"), 1500);
    return () => clearTimeout(timer);
  }, [allDone, router]);

  if (!roundResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledItems = groupUnfulfilled(
    roundResult.unplaced.map((item) => `${item.code} · ${fmt(item.length)} มม.`),
  );

  function markResolved(sourceNo: number | undefined, status: "confirmed" | "cancelled") {
    const next = { ...resolvedBars };
    if (sourceNo) {
      next[sourceNo] = status;
    } else {
      roundResult?.bars.forEach((_, i) => {
        next[i + 1] = status;
      });
    }
    setResolvedBars(next);
    if (roundResult && Object.keys(next).length >= roundResult.bars.length) {
      setAllDone(true);
    }
  }

  async function runConfirm() {
    if (!planAction) return;
    setIsProcessing(true);
    try {
      const result = await confirmRoundPlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
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
      const result = await cancelRoundPlan({ detailIds: planAction.detailIds, scrapSourceNo: planAction.sourceNo });
      setNotice(result);
      if (result.ok) markResolved(planAction.sourceNo, "cancelled");
      setPlanAction(null);
    } finally {
      setIsProcessing(false);
    }
  }

  const columns = splitInTwo(roundResult.bars);

  return (
    <div className="space-y-6">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <UnfulfilledAlert
        hint={`แท่งที่ใช้อยู่ยาว ${fmt(barLength)} มม. — ถ้าไม่ถูกต้อง กลับไปแท็บ “ตั้งค่าและสั่งตัด” เพื่อแก้ความยาวแท่งหรือเลือกแท่งใหม่`}
        items={unfulfilledItems}
        total={roundResult.unplaced.length}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(160px,1fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <div className="space-y-4 xl:sticky xl:top-56 xl:row-span-2 xl:self-start">
          <CalculationSummary
            averageUtilization={roundAverageUtilization}
            scrapCount={roundScraps.length}
            sourceCount={roundResult.bars.length}
            sourceLabel="จำนวนแท่งที่ใช้"
            vertical
          />
        </div>
        {roundResult.bars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center xl:col-span-2">
            <p className="text-base font-semibold text-slate-700">ยังไม่มีแท่งไหนตัดได้</p>
            <p className="mt-1 text-sm text-slate-500">
              ทุกชิ้นในรายการยาวกว่าแท่งขนาด {fmt(barLength)} มม. ที่เลือกไว้
            </p>
            <p className="mt-3 text-sm text-slate-500">
              กลับไปแท็บ <b>ตั้งค่าและสั่งตัด</b> แล้วแก้ความยาวแท่ง หรือเลือกแท่งจากคลังที่ยาวพอ
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm xl:col-span-2">
            <p className="text-sm text-slate-500">
              ตรวจแผนแต่ละแท่งแล้วกดยืนยันทีละแท่ง หรือยืนยันทั้งหมดพร้อมกัน
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
            {column.map(({ bar, index }) => {
              const detailIds = detailIdsForBar(bar);
              const barNo = index + 1;
              const status = resolvedBars[barNo];
              return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewBar({ bar, barNo })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewBar({ bar, barNo });
                  }
                }}
                className={status ? "opacity-50 grayscale transition-all" : "transition-all"}
              >
                <RoundBarLayoutCanvas
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
                            setPlanAction({ detailIds, mode: "confirm", sourceNo: barNo });
                          }}
                          variant="success"
                        >
                          ยืนยัน
                        </Button>
                        <Button
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlanAction({ detailIds, mode: "cancel", sourceNo: barNo });
                          }}
                          variant="danger"
                        >
                          ยกเลิก
                        </Button>
                      </>
                    )
                  }
                  bar={bar}
                  barDiameter={barDiameter}
                  barLength={barLength}
                  barNo={barNo}
                  sourceCode={selectedBar?.code}
                />
              </div>
              );
            })}
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
            sourceCode={selectedBar?.code}
          />
        ) : null}
      </Modal>
      <ConfirmDialog
        open={planAction?.mode === "confirm"}
        title={planAction?.sourceNo ? `ยืนยันแผนการตัดแท่งที่ ${planAction.sourceNo}` : "ยืนยันแผนการตัดทั้งหมด"}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runConfirm()}
        confirmLabel="ยืนยัน"
        isLoading={isProcessing}
        variant="success"
      >
        {planAction?.sourceNo
          ? "ระบบจะเปลี่ยนสถานะรายการในแท่งนี้เป็น Completed และบันทึกเศษของแท่งนี้ลงคลัง"
          : "ระบบจะเปลี่ยนสถานะรายการทุกแท่งเป็น Completed และบันทึกเศษทั้งหมดลงคลัง"}
      </ConfirmDialog>
      <ConfirmDialog
        open={planAction?.mode === "cancel"}
        title={planAction?.sourceNo ? `ยกเลิกแผนการตัดแท่งที่ ${planAction.sourceNo}` : "ยกเลิกแผนการตัดทั้งหมด"}
        onCancel={() => setPlanAction(null)}
        onConfirm={() => void runCancel()}
        confirmLabel="ยืนยันยกเลิก"
        isLoading={isProcessing}
      >
        {planAction?.sourceNo
          ? "ระบบจะเปลี่ยนสถานะรายการในแท่งนี้เป็น Cancelled"
          : "ระบบจะเปลี่ยนสถานะรายการทุกแท่งเป็น Cancelled"}
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
          <h3 className="text-lg font-bold text-slate-800">ยืนยันครบทุกแท่งแล้ว</h3>
          <p className="max-w-xs text-sm text-slate-500">
            ระบบบันทึกเศษของทุกแท่งลงคลังเรียบร้อยแล้ว กำลังพาไปหน้าใบสั่งซื้อ PO...
          </p>
        </div>
      </Modal>
    </div>
  );
}

function splitInTwo<T>(items: T[]): Array<Array<{ bar: T; index: number }>> {
  return [
    items.map((bar, index) => ({ bar, index })).filter((_, index) => index % 2 === 0),
    items.map((bar, index) => ({ bar, index })).filter((_, index) => index % 2 === 1),
  ];
}

interface PlanAction {
  detailIds?: string[];
  mode: "confirm" | "cancel";
  sourceNo?: number;
}

function detailIdsForBar(bar: RoundBarLayout): string[] {
  return Array.from(new Set(bar.pieces.map((piece) => piece.orderDetailId).filter(Boolean))) as string[];
}
