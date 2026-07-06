"use client";

import { ClipboardList } from "lucide-react";

import { EmptyState } from "../../ui/empty-state";
import { PushToCuttingActions } from "./push-to-cutting-actions";
import { OrderShapeTable } from "./order-shape-table";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";

export function PurchaseOrderDetail() {
  const {
    pushOrderDetailToCutting,
    selectedOrderRows,
    selectedPlateRows,
    selectedPo,
    selectedPoId,
    selectedRoundRows,
  } = usePurchaseOrders();

  if (!selectedPo || !selectedPoId) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <EmptyState>เลือกใบสั่งซื้อจากรายการด้านซ้ายเพื่อดูรายการตัด</EmptyState>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            {selectedPo.no}
          </h2>
          <p className="text-sm text-slate-500">{selectedPo.customer}</p>
          <p className="mt-1 text-xs text-slate-400">
            ออก {selectedPo.date} | กำหนด {selectedPo.due}
          </p>
        </div>
        <PushToCuttingActions
          hasPlateRows={selectedPlateRows.length > 0}
          hasRoundRows={selectedRoundRows.length > 0}
          poId={selectedPoId}
        />
      </div>

      <div className="space-y-5">
        <OrderShapeTable
          onRowClick={(row) => pushOrderDetailToCutting(row.id)}
          rows={selectedOrderRows}
          title="รายการทั้งหมด"
        />
      </div>
    </section>
  );
}

