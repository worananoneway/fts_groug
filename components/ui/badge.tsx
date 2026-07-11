import type { ReactNode } from "react";

import { cn } from "./button";

type BadgeTone = "slate" | "blue" | "amber" | "emerald" | "red";

export function Badge({
  children,
  className,
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const toneClasses: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70",
  amber: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/80",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70",
};

