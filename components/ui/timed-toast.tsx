"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

import { cn } from "./button";
import { IconButton } from "./icon-button";
import type { Notice } from "@/types/division";

export function TimedToast({
  notice,
  onClose,
}: {
  notice: Notice | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;

  return (
    <div className="fixed right-5 top-5 z-[60] w-[min(92vw,360px)]">
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border bg-white p-4 text-sm shadow-2xl ring-1 ring-black/5",
          notice.ok ? "border-emerald-100" : "border-amber-100",
        )}
      >
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            notice.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
          )}
        >
          {notice.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{notice.ok ? "สำเร็จ" : "โปรดตรวจสอบ"}</p>
          <p className="mt-0.5 text-slate-500">{notice.text}</p>
        </div>
        <IconButton icon={<X className="h-4 w-4" />} label="ปิดแจ้งเตือน" onClick={onClose} />
      </div>
    </div>
  );
}
