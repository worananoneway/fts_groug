"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { PurchaseOrderDetail } from "./purchase-order-detail";
import { PurchaseOrderList } from "./purchase-order-list";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";

/**
 * จอกว้าง (lg ขึ้นไป): แสดงรายการซ้าย + รายละเอียดขวา เหมือนเดิม
 * จอเล็ก: แสดงทีละหน้า — เห็นรายการก่อน เลือกใบสั่งซื้อแล้วสลับไปหน้ารายละเอียด
 *         พร้อมปุ่ม "กลับไปรายการ" ด้านบน (ไม่ต้องเลื่อนหาตารางเอง)
 */
export function PurchaseOrderPanel() {
  const { clearSelectedPo, selectedPo, selectedPoId } = usePurchaseOrders();
  const showDetail = Boolean(selectedPoId);

  // จอเล็ก: พอสลับหน้าแล้วเลื่อนขึ้นบนสุดให้เลย
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedPoId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,3fr)_minmax(0,7fr)]">
      <div className={showDetail ? "hidden lg:block" : "block"}>
        <PurchaseOrderList />
      </div>

      <div className={showDetail ? "block" : "hidden lg:block"}>
        {showDetail ? (
          <button
            type="button"
            onClick={clearSelectedPo}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปรายการใบสั่งซื้อ
            {selectedPo?.no ? <span className="font-mono text-xs text-slate-400">· {selectedPo.no}</span> : null}
          </button>
        ) : null}
        <PurchaseOrderDetail />
      </div>
    </div>
  );
}
