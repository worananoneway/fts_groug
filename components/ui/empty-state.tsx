import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-400">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-300">
        <Inbox className="h-5 w-5" />
      </span>
      {children}
    </div>
  );
}

