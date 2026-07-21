"use client";

import { useState } from "react";
import { Database, Search, Trash2 } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Field } from "../ui/field";
import { IconButton } from "../ui/icon-button";
import { EmptyState } from "../ui/empty-state";
import { TimedToast } from "../ui/timed-toast";
import { fmt, statusLabel } from "@/utils/format";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { usePurchaseOrdersContext } from "./purchase-orders-provider";
import { ImportLegacyDialog } from "./import-legacy-dialog";
import type { Notice, PurchaseOrder, PurchaseOrderStatus } from "@/types/division";

export function PurchaseOrderList() {
  const { deletePurchaseOrder, poSearch, purchaseOrders, selectPo, selectedPoId, setPoSearch } = usePurchaseOrders();
  const { importFromLegacy } = usePurchaseOrdersContext();
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  async function handleImport(docId: string) {
    const result = await importFromLegacy(docId);
    setNotice(result);
    if (result.ok) setImportOpen(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deletePurchaseOrder(deleteTarget.id);
      setNotice(result);
      if (result.ok) setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">ใบสั่งซื้อ</h2>
        <div className="flex items-center gap-2">
          <Button
            icon={<Database className="h-4 w-4" />}
            onClick={() => setImportOpen(true)}
            size="sm"
            variant="secondary"
          >
            ดึงจาก Express
          </Button>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {fmt(purchaseOrders.length)} รายการ
          </span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Field
          inputClassName="pl-9 font-sans"
          label="ค้นหา"
          onChange={(event) => setPoSearch(event.target.value)}
          placeholder="เลข PO หรือลูกค้า"
          value={poSearch}
        />
      </div>

      <div className="space-y-2">
        {purchaseOrders.length === 0 ? (
          <EmptyState>ไม่พบใบสั่งซื้อที่ตรงกับคำค้นหา</EmptyState>
        ) : (
          purchaseOrders.map((po) => {
            const active = po.id === selectedPoId;
            return (
              <div
                key={po.id}
                role="button"
                tabIndex={0}
                onClick={() => selectPo(po.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectPo(po.id);
                  }
                }}
                className={`group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border px-4 py-3 pl-5 text-left transition ${
                  active
                    ? "border-blue-500/50 bg-blue-50/80 shadow-sm"
                    : "border-slate-200/80 bg-white hover:border-blue-300/70 hover:bg-blue-50/40 hover:shadow-sm"
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-1 transition ${
                    active ? "bg-blue-600" : "bg-transparent group-hover:bg-blue-200"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-slate-800">{po.no}</p>
                    {po.isLive ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        สดจาก Express
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-slate-500">{po.customer}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {po.isLive ? `ออก ${po.date} · คลิกเพื่อเริ่มทำงาน` : `ออก ${po.date} | กำหนด ${po.due}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {po.isLive ? (
                    <Badge tone="amber">ยังไม่นำเข้า</Badge>
                  ) : (
                    <>
                      <Badge tone={statusTone(po.status)}>{statusLabel(po.status)}</Badge>
                      <IconButton
                        icon={<Trash2 className="h-4 w-4" />}
                        label="ลบใบสั่งซื้อ"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(po);
                        }}
                        tone="danger"
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ImportLegacyDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบใบสั่งซื้อ"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        loading={isDeleting}
      >
        ต้องการลบใบสั่งซื้อ {deleteTarget?.no} จริงหรือไม่? ระบบจะเปลี่ยนสถานะเป็น Deleted และซ่อนออกจากรายการ
      </ConfirmDialog>
    </section>
  );
}

function statusTone(status: PurchaseOrderStatus) {
  if (status === "CANCELLED") return "red";
  if (status === "IN_PROGRESS") return "blue";
  if (status === "DONE") return "emerald";
  return "amber";
}
