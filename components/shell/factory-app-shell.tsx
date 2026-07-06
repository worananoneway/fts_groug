import type { ReactNode } from "react";

import { FactoryHeader } from "./factory-header";
import type { DataStatus } from "../calculation-division/types";

export function FactoryAppShell({
  children,
  dataStatus,
  moduleTabs,
  subTabs,
  subtitle,
}: {
  children: ReactNode;
  dataStatus: DataStatus;
  moduleTabs: ReactNode;
  subTabs?: ReactNode;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <FactoryHeader
        dataStatus={dataStatus}
        moduleTabs={moduleTabs}
        subTabs={subTabs}
        subtitle={subtitle}
      />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center font-mono text-sm text-slate-400">
        FTS-GROUP | Factory Cutting Division
      </footer>
    </div>
  );
}

