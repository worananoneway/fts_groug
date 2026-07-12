"use client";

import { Search } from "lucide-react";

import { Badge } from "../ui/badge";
import { Field } from "../ui/field";
import { EmptyState } from "../ui/empty-state";
import { fmt, statusLabel } from "@/utils/format";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { PurchaseOrderStatus } from "@/types/division";

export function PurchaseOrderList() {
  const { poSearch, purchaseOrders, selectPo, selectedPoId, setPoSearch } = usePurchaseOrders();

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">ใบสั่งซื้อ</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {fmt(purchaseOrders.length)} รายการ
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Field
          inputClassName="pl-9 font-sans"
          label="ค้นหา"
          onChange={(event) => setPoSearch(event.target.value)}
          placeholder="เลข PO หรือลูกค้า"
          value={poSearch}
        />
      </div>

      <div className="space-y-2">
        {purchaseOrders.length === 0 ? (
          <EmptyState>ไม่พบใบสั่งซื้อที่ตรงกับคำค้นหา</EmptyState>
        ) : (
          purchaseOrders.map((po) => {
            const active = po.id === selectedPoId;
            return (
              <button
                key={po.id}
                type="button"
                onClick={() => selectPo(po.id)}
                className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border px-4 py-3 pl-5 text-left transition ${
                  active
                    ? "border-blue-500/50 bg-blue-50/80 shadow-sm"
                    : "border-slate-200/80 bg-white hover:border-blue-300/70 hover:bg-blue-50/40 hover:shadow-sm"
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1 transition ${
                    active ? "bg-blue-600" : "bg-transparent group-hover:bg-blue-200"
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-slate-800">{po.no}</p>
                  <p className="truncate text-sm text-slate-500">{po.customer}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    ออก {po.date} | กำหนด {po.due}
                  </p>
                </div>
                <Badge tone={statusTone(po.status)}>{statusLabel(po.status)}</Badge>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function statusTone(status: PurchaseOrderStatus) {
  if (status === "IN_PROGRESS") return "blue";
  if (status === "DONE") return "emerald";
  return "amber";
}

