import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "./button";

type AlertTone = "info" | "success" | "warning" | "danger";

export function AlertBanner({
  children,
  className,
  tone = "info",
}: {
  children: ReactNode;
  className?: string;
  tone?: AlertTone;
}) {
  const Icon = iconByTone[tone];

  return (
    <div className={cn("flex items-start gap-2 rounded-lg px-4 py-3 text-sm", toneClasses[tone], className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

const iconByTone = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
};

const toneClasses: Record<AlertTone, string> = {
  info: "border border-blue-100 bg-blue-50 text-blue-700",
  success: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-100 bg-amber-50 text-amber-700",
  danger: "border border-red-200 bg-red-50 text-red-700",
};

