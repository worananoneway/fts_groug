"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "./button";
import { IconButton } from "./icon-button";

export function Modal({
  children,
  footer,
  fullscreen = false,
  wide = false,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  fullscreen?: boolean;
  wide?: boolean;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl",
          fullscreen ? "h-[92vh] max-w-[96vw]" : wide ? "max-w-3xl" : "max-w-xl",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <IconButton icon={<X className="h-4 w-4" />} label="ปิด" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
