import type { ReactNode } from "react";
import { Info, Scissors } from "lucide-react";

import { Badge } from "../ui/badge";
import type { DataStatus } from "../calculation-division/types";

export function FactoryHeader({
  dataStatus,
  moduleTabs,
  subTabs,
  subtitle,
}: {
  dataStatus: DataStatus;
  moduleTabs: ReactNode;
  subTabs?: ReactNode;
  subtitle: string;
}) {
  const statusTone = dataStatus.loading ? "blue" : dataStatus.source === "api" ? "emerald" : "amber";
  const statusLabel = dataStatus.loading
    ? "กำลังโหลดข้อมูล"
    : dataStatus.source === "api"
      ? "เชื่อมต่อข้อมูลจริง"
      : "เชื่อมต่อข้อมูลไม่สำเร็จ";

  return (
    <header className="sticky top-0 z-40 bg-[#1a2f7a] text-white shadow-lg">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-[#1a2f7a] shadow-md">
            <Scissors className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-widest">FTS-GROUP</h1>
            <p className="text-sm text-blue-200">{subtitle}</p>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-2 sm:flex">
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-blue-100">
            <Info className="h-4 w-4" />
            Factory Cutting Division
          </div>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>
      </div>

      <nav className="mt-4 w-full px-4 sm:px-6 lg:px-10">{moduleTabs}</nav>
      {subTabs ? <nav className="w-full px-4 pb-1 sm:px-6 lg:px-10">{subTabs}</nav> : null}
    </header>
  );
}

