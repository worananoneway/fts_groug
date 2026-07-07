"use client";

import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { ConfirmDialog } from "../../ui/confirm-dialog";
import { EmptyState } from "../../ui/empty-state";
import { Field } from "../../ui/field";
import { Modal } from "../../ui/modal";
import { PushToCuttingActions } from "./push-to-cutting-actions";
import { OrderShapeTable } from "./order-shape-table";
import { fmt, orderDetailStatusLabel } from "../mappers";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";
import type { Notice, OrderDetail } from "../types";

export function PurchaseOrderDetail() {
  const {
    addOrderDetailLocal,
    cancelOrderDetail,
    pushOrderDetailToCutting,
    selectedOrderRows,
    selectedPlateRows,
    selectedPo,
    selectedPoId,
    selectedRoundRows,
    updateOrderDetailLocal,
  } = usePurchaseOrders();
  const [detailView, setDetailView] = useState<OrderDetail | null>(null);
  const [addDetail, setAddDetail] = useState<OrderDetail | null>(null);
  const [editDetail, setEditDetail] = useState<OrderDetail | null>(null);
  const [deleteDetail, setDeleteDetail] = useState<OrderDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  function handleRowClick(row: OrderDetail) {
    if (row.status === "COMPLETED" || row.status === "CANCELLED") {
      setDetailView(row);
      return;
    }
    pushOrderDetailToCutting(row.id);
  }

  function saveEdit() {
    if (!editDetail) return;
    const result = updateOrderDetailLocal(editDetail);
    setNotice(result);
    if (result.ok) setEditDetail(null);
  }

  function saveAdd() {
    if (!addDetail) return;
    const normalized: OrderDetail = {
      ...addDetail,
      material: addDetail.material.trim() || "ไม่ระบุวัสดุ",
      qty: Math.max(1, Math.floor(addDetail.qty || 1)),
      remaining: Math.max(0, Math.floor(addDetail.remaining || addDetail.qty || 1)),
    };
    const result = addOrderDetailLocal(normalized);
    setNotice(result);
    if (result.ok) setAddDetail(null);
  }

  async function confirmDelete() {
    if (!deleteDetail) return;
    const result = await cancelOrderDetail(deleteDetail.id);
    setNotice(result);
    if (result.ok) setDeleteDetail(null);
  }

  if (!selectedPo || !selectedPoId) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <EmptyState>เลือกใบสั่งซื้อจากรายการด้านซ้ายเพื่อดูรายการตัด</EmptyState>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm lg:sticky lg:top-64 lg:h-[calc(100vh-18rem)] lg:overflow-auto">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            {selectedPo.no}
          </h2>
          <p className="text-sm text-slate-500">{selectedPo.customer}</p>
          <p className="mt-1 text-xs text-slate-400">
            ออก {selectedPo.date} | กำหนด {selectedPo.due}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddDetail(newOrderDetailDraft())}>
            เพิ่มรายการ
          </Button>
          <PushToCuttingActions
            hasPlateRows={selectedPlateRows.length > 0}
            hasRoundRows={selectedRoundRows.length > 0}
            poId={selectedPoId}
          />
        </div>
      </div>

      {notice ? (
        <AlertBanner className="mb-4" tone={notice.ok ? "success" : "warning"}>{notice.text}</AlertBanner>
      ) : null}

      <div className="space-y-5">
        <OrderShapeTable
          onDelete={setDeleteDetail}
          onEdit={setEditDetail}
          onRowClick={handleRowClick}
          rows={selectedOrderRows}
          title="รายการทั้งหมด"
        />
      </div>

      <Modal open={Boolean(detailView)} title="รายละเอียดรายการ" onClose={() => setDetailView(null)}>
        {detailView ? <DetailReadOnly row={detailView} /> : null}
      </Modal>

      <Modal
        open={Boolean(addDetail)}
        title="เพิ่มรายการ"
        onClose={() => setAddDetail(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setAddDetail(null)} variant="secondary">
              ยกเลิก
            </Button>
            <Button onClick={saveAdd}>ยืนยัน</Button>
          </div>
        }
      >
        {addDetail ? <OrderDetailFields detail={addDetail} onChange={setAddDetail} /> : null}
      </Modal>

      <Modal
        open={Boolean(editDetail)}
        title="แก้ไขรายละเอียด"
        onClose={() => setEditDetail(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setEditDetail(null)} variant="secondary">
              ยกเลิก
            </Button>
            <Button onClick={saveEdit}>ยืนยัน</Button>
          </div>
        }
      >
        {editDetail ? <OrderDetailFields detail={editDetail} onChange={setEditDetail} /> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteDetail)}
        title="ยืนยันการลบรายการ"
        onCancel={() => setDeleteDetail(null)}
        onConfirm={() => void confirmDelete()}
      >
        ต้องการลบรายการนี้จริงหรือไม่? ระบบจะเปลี่ยนสถานะรายการเป็น Cancelled
      </ConfirmDialog>
    </section>
  );
}

function newOrderDetailDraft(): OrderDetail {
  return {
    id: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
    shape: "PLATE",
    material: "",
    length: 0,
    width: 0,
    thickness: 0,
    qty: 1,
    remaining: 1,
    status: "PENDING",
  };
}

function OrderDetailFields({
  detail,
  onChange,
}: {
  detail: OrderDetail;
  onChange: (detail: OrderDetail) => void;
}) {
  const updateQty = (qty: number) => onChange({ ...detail, qty, remaining: Math.max(0, detail.remaining || qty) });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => onChange({ ...detail, shape: "PLATE", diameter: undefined })}
          variant={detail.shape === "PLATE" ? "primary" : "secondary"}
        >
          แผ่น
        </Button>
        <Button
          onClick={() => onChange({ ...detail, shape: "ROUND", width: undefined, thickness: undefined })}
          variant={detail.shape === "ROUND" ? "primary" : "secondary"}
        >
          เพลา
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="วัสดุ"
          value={detail.material}
          onChange={(event) => onChange({ ...detail, material: event.target.value })}
        />
        <Field
          label="จำนวน"
          type="number"
          value={String(detail.qty)}
          onChange={(event) => updateQty(Number(event.target.value) || 1)}
        />
        <Field
          label="คงเหลือ"
          type="number"
          value={String(detail.remaining)}
          onChange={(event) => onChange({ ...detail, remaining: Number(event.target.value) || 0 })}
        />
        {detail.shape === "ROUND" ? (
          <>
            <Field
              label="เส้นผ่านศูนย์กลาง Ø"
              type="number"
              value={String(detail.diameter ?? "")}
              onChange={(event) => onChange({ ...detail, diameter: Number(event.target.value) || 0 })}
            />
            <Field
              label="ความยาว"
              type="number"
              value={String(detail.length)}
              onChange={(event) => onChange({ ...detail, length: Number(event.target.value) || 0 })}
            />
          </>
        ) : (
          <>
            <Field
              label="กว้าง W"
              type="number"
              value={String(detail.width ?? "")}
              onChange={(event) => onChange({ ...detail, width: Number(event.target.value) || 0 })}
            />
            <Field
              label="ยาว H"
              type="number"
              value={String(detail.length)}
              onChange={(event) => onChange({ ...detail, length: Number(event.target.value) || 0 })}
            />
            <Field
              label="หนา"
              type="number"
              value={String(detail.thickness ?? "")}
              onChange={(event) => onChange({ ...detail, thickness: Number(event.target.value) || 0 })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function DetailReadOnly({ row }: { row: OrderDetail }) {
  return (
    <div className="space-y-3 text-sm text-slate-600">
      <p><b className="text-slate-800">วัสดุ:</b> {row.material}</p>
      <p><b className="text-slate-800">สถานะ:</b> {orderDetailStatusLabel(row.status)}</p>
      <p><b className="text-slate-800">จำนวน:</b> {fmt(row.qty)} ชิ้น</p>
      <p><b className="text-slate-800">คงเหลือ:</b> {fmt(row.remaining)} ชิ้น</p>
      <p>
        <b className="text-slate-800">ขนาด:</b>{" "}
        {row.shape === "ROUND"
          ? `Ø${fmt(row.diameter ?? 0)} x ${fmt(row.length)} มม.`
          : `${fmt(row.width ?? 0)} x ${fmt(row.length)} x หนา ${fmt(row.thickness ?? 0)} มม.`}
      </p>
    </div>
  );
}

