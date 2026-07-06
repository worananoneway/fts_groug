"use client";

import { FactoryAppShell } from "../shell/factory-app-shell";
import { CalculationDivisionProvider } from "./calculation-division-provider";
import { useCalculationDivision } from "./hooks/use-calculation-division";
import { PlateModule } from "./plate/plate-module";
import { PurchaseOrderPanel } from "./purchase-orders/purchase-order-panel";
import { RoundBarModule } from "./round-bars/round-bar-module";
import { ModuleTabs } from "./shared/module-tabs";
import { SubTabs } from "./shared/sub-tabs";

export function CalculationDivisionScreen() {
  return (
    <CalculationDivisionProvider>
      <CalculationDivisionContent />
    </CalculationDivisionProvider>
  );
}

function CalculationDivisionContent() {
  const { dataStatus, headerSubtitle, module } = useCalculationDivision();

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      moduleTabs={<ModuleTabs />}
      subTabs={<SubTabs />}
      subtitle={headerSubtitle}
    >
      {module === "po" ? <PurchaseOrderPanel /> : null}
      {module === "plate" ? <PlateModule /> : null}
      {module === "roundbar" ? <RoundBarModule /> : null}
    </FactoryAppShell>
  );
}

