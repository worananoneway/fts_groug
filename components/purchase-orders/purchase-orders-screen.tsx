"use client";

import { FactoryAppShell } from "../shell/factory-app-shell";
import { DivisionNav } from "../shell/division-nav";
import { PurchaseOrdersProvider, usePurchaseOrdersContext } from "./purchase-orders-provider";
import { PurchaseOrderPanel } from "./purchase-order-panel";

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
      <PurchaseOrderPanel />
    </FactoryAppShell>
  );
}
