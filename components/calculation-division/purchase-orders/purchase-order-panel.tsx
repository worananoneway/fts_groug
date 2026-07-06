"use client";

import { PurchaseOrderDetail } from "./purchase-order-detail";
import { PurchaseOrderList } from "./purchase-order-list";

export function PurchaseOrderPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(300px,3fr)_minmax(0,7fr)]">
      <PurchaseOrderList />
      <PurchaseOrderDetail />
    </div>
  );
}

