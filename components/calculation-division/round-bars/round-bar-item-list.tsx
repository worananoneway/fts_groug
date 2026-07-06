"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "../../ui/badge";
import { EmptyState } from "../../ui/empty-state";
import { IconButton } from "../../ui/icon-button";
import { fmt } from "../mappers";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function RoundBarItemList() {
  const { barDiameter, editRoundItem, removeRoundItem, roundItems } = useCalculationDivision();

  return (
    <div className="flex-1 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
      {roundItems.length === 0 ? (
        <EmptyState>ยังไม่มีรายการ เพิ่มชิ้นงานที่ต้องการตัดด้านบน</EmptyState>
      ) : (
        roundItems.map((item) => {
          const mismatch = item.diameter && Number(item.diameter) !== Number(barDiameter);
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white"
                  style={{ background: item.color }}
                >
                  {item.code}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-slate-800">{fmt(item.length)} มม.</p>
                  {item.diameter ? (
                    <p className="text-xs text-slate-400">Ø{fmt(item.diameter)} มม.</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {mismatch ? <Badge tone="amber">ไม่ตรง Ø</Badge> : null}
                <span className="font-mono text-sm text-slate-500">x{item.qty}</span>
                <IconButton
                  icon={<Pencil className="h-4 w-4" />}
                  label={`แก้ไขรายการ ${item.code}`}
                  onClick={() => editRoundItem(item.id)}
                  tone="primary"
                />
                <IconButton
                  icon={<Trash2 className="h-4 w-4" />}
                  label={`ลบรายการ ${item.code}`}
                  onClick={() => removeRoundItem(item.id)}
                  tone="danger"
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

