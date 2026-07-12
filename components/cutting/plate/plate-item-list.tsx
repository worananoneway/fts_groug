"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "../../ui/confirm-dialog";
import { EmptyState } from "../../ui/empty-state";
import { IconButton } from "../../ui/icon-button";
import { TimedToast } from "../../ui/timed-toast";
import { fmt } from "@/utils/format";
import { useCutting } from "@/hooks/use-cutting";
import type { Notice, PlateItem } from "@/types/division";

export function PlateItemList() {
  const { editPlateItem, plateItems, removePlateItem } = useCutting();
  const [deleteTarget, setDeleteTarget] = useState<PlateItem | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  function confirmDelete() {
    if (!deleteTarget) return;
    removePlateItem(deleteTarget.id);
    setNotice({ ok: true, text: `ลบรายการ ${deleteTarget.code} สำเร็จ` });
    setDeleteTarget(null);
  }

  return (
    <>
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
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
                  icon={<Pencil className="h-4 w-4" />}
                  label={`แก้ไขรายการ ${item.code}`}
                  onClick={() => editPlateItem(item.id)}
                  tone="primary"
                />
                <IconButton
                  icon={<Trash2 className="h-4 w-4" />}
                  label={`ลบรายการ ${item.code}`}
                  onClick={() => setDeleteTarget(item)}
                  tone="danger"
                />
              </div>
            </div>
          ))
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบรายการ"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        ต้องการลบรายการ {deleteTarget?.code} จริงหรือไม่?
      </ConfirmDialog>
    </>
  );
}

