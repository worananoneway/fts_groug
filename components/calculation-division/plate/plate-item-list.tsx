"use client";

import { Trash2 } from "lucide-react";

import { EmptyState } from "../../ui/empty-state";
import { IconButton } from "../../ui/icon-button";
import { fmt } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateItemList() {
  const { plateItems, removePlateItem } = useCalculationDivision();

  return (
    <div className="flex-1 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
      {plateItems.length === 0 ? (
        <EmptyState>ยังไม่มีรายการ เพิ่มชิ้นงานที่ต้องการตัดด้านบน</EmptyState>
      ) : (
        plateItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white"
                style={{ background: item.color }}
              >
                {item.code}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-slate-800">
                  {fmt(item.w)} x {fmt(item.h)} มม.
                </p>
                {item.thickness ? (
                  <p className="text-xs text-slate-400">หนา {fmt(item.thickness)} มม.</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-slate-500">x{item.qty}</span>
              <IconButton
                icon={<Trash2 className="h-4 w-4" />}
                label={`ลบรายการ ${item.code}`}
                onClick={() => removePlateItem(item.id)}
                tone="danger"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

