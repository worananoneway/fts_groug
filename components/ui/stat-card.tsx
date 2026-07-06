import type { ReactNode } from "react";

export function StatCard({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

