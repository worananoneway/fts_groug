"use client";

import { FactoryAppShell } from "../shell/factory-app-shell";
import { DivisionNav } from "../shell/division-nav";
import { PurchaseOrdersProvider, usePurchaseOrdersContext } from "./purchase-orders-provider";
import { PurchaseOrderPanel } from "./purchase-order-panel";
import { LoadingGate } from "@/components/loading";

export function PurchaseOrdersScreen() {
  return (
    <PurchaseOrdersProvider>
      <PurchaseOrdersContent />
    </PurchaseOrdersProvider>
  );
}

function PurchaseOrdersContent() {
  const { dataStatus, headerSubtitle } = usePurchaseOrdersContext();

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      moduleTabs={<DivisionNav active="po" />}
      subtitle={headerSubtitle}
    >
      <LoadingGate
        isLoading={dataStatus.isLoading}
        className="min-h-[60vh]"
        error={dataStatus.error}
        label="กำลังโหลดใบสั่งซื้อ..."
        onRetry={() => window.location.reload()}
      >
        <PurchaseOrderPanel />
      </LoadingGate>
    </FactoryAppShell>
  );
}
