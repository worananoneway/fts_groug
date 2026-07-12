import type { ReactNode } from "react";
import Link from "next/link";
import { Database, Scissors } from "lucide-react";

import { Badge } from "../ui/badge";
import { cn } from "../ui/button";
import { MASTER_DATA_ENTRY_HREF } from "@/constants/division";
import type { DataStatus } from "@/types/division";

export function FactoryHeader({
  dataStatus,
  masterDataActive = false,
  moduleTabs,
  subTabs,
  subtitle,
}: {
  dataStatus: DataStatus;
  masterDataActive?: boolean;
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
    <header className="sticky top-0 z-40 bg-[#1a2f7a] text-white shadow-lg shadow-slate-900/10">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 pt-5 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-[#1a2f7a] shadow-lg shadow-amber-900/30 ring-2 ring-white/20">
            <Scissors className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-widest">FTS-GROUP</h1>
            <p className="text-sm text-blue-200/90">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={MASTER_DATA_ENTRY_HREF}
            aria-current={masterDataActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition",
              masterDataActive
                ? "bg-amber-400 text-[#1a2f7a] shadow-amber-900/30 ring-2 ring-white/20"
                : "border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20",
            )}
          >
            <Database className="h-4 w-4" strokeWidth={2.5} />
            ข้อมูลหลัก
          </Link>

          <div className="hidden flex-col items-end gap-2 sm:flex">
            <Badge className="shadow-sm" tone={statusTone}>{statusLabel}</Badge>
          </div>
        </div>
      </div>

      <nav className="mt-4 w-full px-4 sm:px-6 lg:px-10">{moduleTabs}</nav>
      {subTabs ? <nav className="mt-2 w-full px-4 pb-3 sm:px-6 lg:px-10">{subTabs}</nav> : null}
    </header>
  );
}

