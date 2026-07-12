"use client";

import { usePurchaseOrdersContext } from "@/components/purchase-orders/purchase-orders-provider";

export function usePurchaseOrders() {
  const context = usePurchaseOrdersContext();

  return {
    dataStatus: context.dataStatus,
    headerSubtitle: context.headerSubtitle,
    purchaseOrders: context.filteredPurchaseOrders,
    poSearch: context.poSearch,
    setPoSearch: context.setPoSearch,
    selectedPoId: context.selectedPoId,
    selectPo: context.selectPo,
    selectedPo: context.selectedPo,
    materialMasters: context.materialMasters,
    selectedOrderRows: context.selectedOrderRows,
    selectedRoundRows: context.selectedRoundRows,
    selectedPlateRows: context.selectedPlateRows,
    pushOrderDetailToCutting: context.pushOrderDetailToCutting,
    addOrderDetail: context.addOrderDetail,
    cancelOrderDetail: context.cancelOrderDetail,
    updateOrderDetail: context.updateOrderDetail,
    updatePurchaseOrderFields: context.updatePurchaseOrderFields,
    deletePurchaseOrder: context.deletePurchaseOrder,
    pushRoundFromPo: context.pushRoundFromPo,
    pushPlateFromPo: context.pushPlateFromPo,
  };
}
