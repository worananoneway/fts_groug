"use client";

import { PurchaseOrderDetail } from "./purchase-order-detail";
import { PurchaseOrderList } from "./purchase-order-list";

export function PurchaseOrderPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[5fr_7fr]">
      <PurchaseOrderList />
      <PurchaseOrderDetail />
    </div>
  );
}

