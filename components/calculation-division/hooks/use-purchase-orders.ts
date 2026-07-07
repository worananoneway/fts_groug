"use client";

import { useCalculationDivisionContext } from "../calculation-division-provider";

export function usePurchaseOrders() {
  const context = useCalculationDivisionContext();

  return {
    purchaseOrders: context.filteredPurchaseOrders,
    poSearch: context.poSearch,
    setPoSearch: context.setPoSearch,
    selectedPoId: context.selectedPoId,
    selectPo: context.selectPo,
    selectedPo: context.selectedPo,
    selectedOrderRows: context.selectedOrderRows,
    selectedRoundRows: context.selectedRoundRows,
    selectedPlateRows: context.selectedPlateRows,
    pushOrderDetailToCutting: context.pushOrderDetailToCutting,
    addOrderDetailLocal: context.addOrderDetailLocal,
    cancelOrderDetail: context.cancelOrderDetail,
    updateOrderDetailLocal: context.updateOrderDetailLocal,
    pushRoundFromPo: context.pushRoundFromPo,
    pushPlateFromPo: context.pushPlateFromPo,
  };
}

