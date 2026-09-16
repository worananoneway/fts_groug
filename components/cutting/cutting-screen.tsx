"use client";

import { FactoryAppShell } from "../shell/factory-app-shell";
import { DivisionNav } from "../shell/division-nav";
import { CuttingProvider, useCuttingContext } from "./cutting-provider";
import { CuttingSubTabs } from "./shared/cutting-sub-tabs";
import { PlateModule } from "./plate/plate-module";
import { RoundBarModule } from "./round-bars/round-bar-module";
import { LoadingGate } from "@/components/loading";
import type { CuttingType } from "@/types/division";

export function CuttingScreen({
  initialType,
  poId,
  detailId,
}: {
  initialType: CuttingType;
  poId?: string;
  detailId?: string;
}) {
  return (
    <CuttingProvider detailId={detailId} initialType={initialType} poId={poId}>
      <CuttingContent />
    </CuttingProvider>
  );
}

function CuttingContent() {
  const { dataStatus, headerSubtitle, module } = useCuttingContext();

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      moduleTabs={<DivisionNav active="cutting" />}
      subTabs={<CuttingSubTabs />}
      subtitle={headerSubtitle}
    >
      <LoadingGate
        isLoading={dataStatus.isLoading}
        className="min-h-[60vh]"
        error={dataStatus.error}
        label="กำลังโหลดข้อมูลงานตัด..."
        onRetry={() => window.location.reload()}
      >
        {module === "plate" ? <PlateModule /> : <RoundBarModule />}
      </LoadingGate>
    </FactoryAppShell>
  );
}
