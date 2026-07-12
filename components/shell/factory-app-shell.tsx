import type { ReactNode } from "react";

import { FactoryHeader } from "./factory-header";
import type { DataStatus } from "@/types/division";

export function FactoryAppShell({
  children,
  dataStatus,
  masterDataActive,
  moduleTabs,
  subTabs,
  subtitle,
}: {
  children: ReactNode;
  dataStatus: DataStatus;
  masterDataActive?: boolean;
  moduleTabs: ReactNode;
  subTabs?: ReactNode;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <FactoryHeader
        dataStatus={dataStatus}
        masterDataActive={masterDataActive}
        moduleTabs={moduleTabs}
        subTabs={subTabs}
        subtitle={subtitle}
      />
      <main className="w-full px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      <footer className="border-t border-slate-200/80 py-6 text-center font-mono text-xs tracking-wide text-slate-400">
        FTS-GROUP
      </footer>
    </div>
  );
}

