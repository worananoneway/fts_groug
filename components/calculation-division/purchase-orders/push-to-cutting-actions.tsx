"use client";

import { ArrowRight, Layers, Ruler } from "lucide-react";

import { Button } from "../../ui/button";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";

export function PushToCuttingActions({
  hasPlateRows,
  hasRoundRows,
  poId,
}: {
  hasPlateRows: boolean;
  hasRoundRows: boolean;
  poId: string | null;
}) {
  const { pushPlateFromPo, pushRoundFromPo } = usePurchaseOrders();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={!hasPlateRows}
        icon={<Layers className="h-4 w-4" />}
        onClick={() => pushPlateFromPo(poId)}
        variant="secondary"
      >
        ส่งไปตัดแผ่น
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        disabled={!hasRoundRows}
        icon={<Ruler className="h-4 w-4" />}
        onClick={() => pushRoundFromPo(poId)}
        variant="secondary"
      >
        ส่งไปตัดเพลา
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

