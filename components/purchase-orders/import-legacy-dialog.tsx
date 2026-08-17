"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";

import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { EmptyState } from "../ui/empty-state";
import { loadLegacyOrders, type LegacyOrder } from "@/services/division/legacy-orders";

export function ImportLegacyDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (docId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<LegacyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      loadLegacyOrders(search)
        .then((rows) => {
          if (!active) return;
          setOrders(rows);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setError("โหลดข้อมูลจากระบบคลังเดิมไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูล");
          setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, search]);

  async function handleImport(docId: string) {
    setImportingId(docId);
    try {
      await onImport(docId);
    } finally {
      setImportingId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="ดึงใบสั่งตัดจากระบบคลัง (Express)">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Field
          inputClassName="pl-9 font-sans"
          label="ค้นหา"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="เลขใบสั่งตัด (เช่น JP2607212) หรือเลขอ้างอิง SI"
          value={search}
        />
      </div>

      {error ? (
        <EmptyState>{error}</EmptyState>
      ) : loading ? (
        <EmptyState>กำลังโหลดข้อมูล...</EmptyState>
      ) : orders.length === 0 ? (
        <EmptyState>ไม่พบเอกสารที่ตรงกับคำค้นหา</EmptyState>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-slate-800">{order.docNumber}</p>
                <p className="truncate text-sm text-slate-600">{order.customerName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  อ้างอิง {order.customerRef || "—"} · {order.docDate}
                </p>
              </div>
              <Button
                disabled={importingId !== null}
                icon={<Download className="h-4 w-4" />}
                onClick={() => void handleImport(order.id)}
                size="sm"
              >
                {importingId === order.id ? "กำลังนำเข้า..." : "นำเข้า"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        ระบบจะนำเข้าเฉพาะรายการงานตัด (เหล็กแผ่น/เพลา/โบลต์) พร้อมแกะขนาดจากชื่อสินค้า —
        กรุณาตรวจสอบขนาดและเลือกวัสดุก่อนส่งไปคำนวณการตัด
      </p>
    </Modal>
  );
}
