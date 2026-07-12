import type { Metadata } from "next";

import { PurchaseOrdersScreen } from "@/components/purchase-orders/purchase-orders-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Purchase Orders",
  description: "ใบสั่งซื้อและรายการตัดของลูกค้า",
};

export default function PurchaseOrdersPage() {
  return <PurchaseOrdersScreen />;
}
