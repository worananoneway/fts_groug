import type { ReactNode } from "react";
import { Info, Scissors } from "lucide-react";

import { Badge } from "../ui/badge";
import type { DataStatus } from "@/types/division";

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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#14225c] via-[#1a2f7a] to-[#23409e] text-white shadow-lg shadow-slate-900/10">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#1a2f7a] shadow-lg shadow-amber-900/30 ring-2 ring-white/20">
            <Scissors className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-widest">FTS-GROUP</h1>
            <p className="text-sm text-blue-200/90">{subtitle}</p>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-2 sm:flex">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-blue-100 backdrop-blur">
            <Info className="h-4 w-4" />
            Factory Cutting Division
          </div>
          <Badge className="shadow-sm" tone={statusTone}>{statusLabel}</Badge>
        </div>
      </div>

      <nav className="mt-4 w-full px-4 sm:px-6 lg:px-10">{moduleTabs}</nav>
      {subTabs ? <nav className="mt-2 w-full px-4 pb-3 sm:px-6 lg:px-10">{subTabs}</nav> : null}
    </header>
  );
}

