"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { EmptyState } from "../ui/empty-state";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { TimedToast } from "../ui/timed-toast";
import { MaterialAutocomplete } from "./material-autocomplete";
import { PushToCuttingActions } from "./push-to-cutting-actions";
import { OrderShapeTable } from "./order-shape-table";
import { fmt, orderDetailStatusLabel } from "@/utils/format";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { MaterialMaster, Notice, OrderDetail, PurchaseOrder, PurchaseOrderUpdateFields } from "@/types/division";

export function PurchaseOrderDetail() {
  const {
    addOrderDetail,
    cancelOrderDetail,
    materialMasters,
    pushOrderDetailToCutting,
    selectedOrderRows,
    selectedPlateRows,
    selectedPo,
    selectedPoId,
    selectedRoundRows,
    updateOrderDetail,
    updatePurchaseOrderFields,
  } = usePurchaseOrders();
  const [detailView, setDetailView] = useState<OrderDetail | null>(null);
  const [addDetail, setAddDetail] = useState<OrderDetail | null>(null);
  const [editDetail, setEditDetail] = useState<OrderDetail | null>(null);
  const [deleteDetail, setDeleteDetail] = useState<OrderDetail | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [poFields, setPoFields] = useState<PurchaseOrderUpdateFields>(toPoFields(selectedPo));
  const [savingPo, setSavingPo] = useState(false);

  useEffect(() => {
    setPoFields(toPoFields(selectedPo));
    // ซิงก์ค่าในฟอร์มใหม่ทุกครั้งที่เปลี่ยน PO ที่เลือก (ไม่ใช่ทุกครั้งที่ selectedPo อัปเดตหลังบันทึก)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPo?.id]);

  async function savePoFields() {
    setSavingPo(true);
    try {
      const result = await updatePurchaseOrderFields(poFields);
      setNotice(result);
    } finally {
      setSavingPo(false);
    }
  }

  function handleRowClick(row: OrderDetail) {
    if (row.status === "COMPLETED" || row.status === "CANCELLED") {
      setDetailView(row);
      return;
    }
    pushOrderDetailToCutting(row.id);
  }

  async function saveEdit() {
    if (!editDetail) return;
    const validation = validateDetail(editDetail);
    if (validation) {
      setNotice({ ok: false, text: validation });
      return;
    }
    const result = await updateOrderDetail(editDetail);
    setNotice(result);
    if (result.ok) setEditDetail(null);
  }

  async function saveAdd() {
    if (!addDetail) return;
    const normalized: OrderDetail = {
      ...addDetail,
      material: addDetail.material.trim() || "ไม่ระบุวัสดุ",
      qty: Math.max(1, Math.floor(addDetail.qty || 1)),
      remaining: Math.max(0, Math.floor(addDetail.remaining || addDetail.qty || 1)),
    };
    const validation = validateDetail(normalized);
    if (validation) {
      setNotice({ ok: false, text: validation });
      return;
    }
    const result = await addOrderDetail(normalized);
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
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:sticky lg:top-42 lg:h-[calc(100vh-12rem)] lg:overflow-auto">
        <EmptyState>เลือกใบสั่งซื้อจากรายการด้านซ้ายเพื่อดูรายการตัด</EmptyState>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:sticky lg:top-42 lg:h-[calc(100vh-12rem)] lg:overflow-auto">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <div className="mb-5 rounded-xl border border-slate-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-slate-800">{selectedPo.no}</h2>
            <p className="text-sm text-slate-500">{selectedPo.customer}</p>
            <p className="mt-1 text-xs text-slate-400">
              ออก {selectedPo.date} | กำหนด {selectedPo.due} | {fmt(selectedOrderRows.length)} รายการ
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-blue-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="ช่องทางขนส่ง"
            onChange={(event) => setPoFields((current) => ({ ...current, shipVia: event.target.value }))}
            value={poFields.shipVia}
          />
          <Field
            label="อ้างอิงใบเสนอราคา"
            onChange={(event) => setPoFields((current) => ({ ...current, qtOn: event.target.value }))}
            value={poFields.qtOn}
          />
          <Field
            label="เงื่อนไขการส่ง"
            onChange={(event) => setPoFields((current) => ({ ...current, shippingTerms: event.target.value }))}
            value={poFields.shippingTerms}
          />
          <Field
            label="อัตราภาษี %"
            min={0}
            onChange={(event) =>
              setPoFields((current) => ({ ...current, taxRate: Number(event.target.value) || 0 }))
            }
            step="0.01"
            type="number"
            value={String(poFields.taxRate)}
          />
          <Field
            className="sm:col-span-2 lg:col-span-3"
            label="หมายเหตุ"
            onChange={(event) => setPoFields((current) => ({ ...current, comment: event.target.value }))}
            value={poFields.comment}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button disabled={savingPo} onClick={() => void savePoFields()} variant="secondary">
            {savingPo ? "กำลังบันทึก..." : "บันทึกรายละเอียด PO"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddDetail(newOrderDetailDraft())}>
            เพิ่มรายการ
          </Button>
          <PushToCuttingActions
            hasPlateRows={selectedPlateRows.length > 0}
            hasRoundRows={selectedRoundRows.length > 0}
            poId={selectedPoId}
          />
        </div>
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
        {addDetail ? (
          <OrderDetailFields detail={addDetail} materials={materialMasters} onChange={setAddDetail} />
        ) : null}
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
        {editDetail ? (
          <OrderDetailFields detail={editDetail} materials={materialMasters} onChange={setEditDetail} lockShape />
        ) : null}
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

function toPoFields(po: PurchaseOrder | null): PurchaseOrderUpdateFields {
  return {
    shipVia: po?.shipVia ?? "",
    qtOn: po?.qtOn ?? "",
    shippingTerms: po?.shippingTerms ?? "",
    taxRate: po?.taxRate ?? 0,
    comment: po?.comment ?? "",
  };
}

function newOrderDetailDraft(): OrderDetail {
  return {
    id: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
    shape: "PLATE",
    material: "",
    length: 1,
    width: 1,
    thickness: 1,
    qty: 1,
    remaining: 1,
    status: "PENDING",
  };
}

function OrderDetailFields({
  detail,
  materials,
  onChange,
  lockShape = false,
}: {
  detail: OrderDetail;
  materials: MaterialMaster[];
  onChange: (detail: OrderDetail) => void;
  lockShape?: boolean;
}) {
  const updateQty = (qty: number) => onChange({ ...detail, qty, remaining: Math.max(0, detail.remaining || qty) });

  return (
    <div className="space-y-4">
      {lockShape ? (
        <Badge tone="slate">{detail.shape === "ROUND" ? "เพลา" : "แผ่น"}</Badge>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={() =>
              onChange({
                ...detail,
                diameter: undefined,
                material: "",
                materialId: undefined,
                shape: "PLATE",
                thickness: positiveInt(detail.thickness),
                width: positiveInt(detail.width),
              })
            }
            variant={detail.shape === "PLATE" ? "primary" : "secondary"}
          >
            แผ่น
          </Button>
          <Button
            onClick={() =>
              onChange({
                ...detail,
                diameter: positiveInt(detail.diameter),
                material: "",
                materialId: undefined,
                shape: "ROUND",
                thickness: undefined,
                width: undefined,
              })
            }
            variant={detail.shape === "ROUND" ? "primary" : "secondary"}
          >
            เพลา
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <MaterialAutocomplete
          materialId={detail.materialId}
          materialName={detail.material}
          materials={materials}
          shape={detail.shape}
          onChange={(material) => onChange({ ...detail, material: material.name, materialId: material.id })}
        />
        <Field
          label="จำนวน"
          min={1}
          step={1}
          type="number"
          value={String(detail.qty)}
          onChange={(event) => updateQty(positiveInt(event.target.value))}
        />
        <Field
          label="คงเหลือ"
          min={0}
          step={1}
          type="number"
          value={String(detail.remaining)}
          onChange={(event) => onChange({ ...detail, remaining: nonNegativeInt(event.target.value) })}
        />
        {detail.shape === "ROUND" ? (
          <>
            <Field
              label="เส้นผ่านศูนย์กลาง Ø"
              min={1}
              step={1}
              type="number"
              value={String(detail.diameter ?? "")}
              onChange={(event) => onChange({ ...detail, diameter: positiveInt(event.target.value) })}
            />
            <Field
              label="ความยาว"
              min={1}
              step={1}
              type="number"
              value={String(detail.length)}
              onChange={(event) => onChange({ ...detail, length: positiveInt(event.target.value) })}
            />
          </>
        ) : (
          <>
            <Field
              label="กว้าง W"
              min={1}
              step={1}
              type="number"
              value={String(detail.width ?? "")}
              onChange={(event) => onChange({ ...detail, width: positiveInt(event.target.value) })}
            />
            <Field
              label="ยาว H"
              min={1}
              step={1}
              type="number"
              value={String(detail.length)}
              onChange={(event) => onChange({ ...detail, length: positiveInt(event.target.value) })}
            />
            <Field
              label="หนา"
              min={1}
              step={1}
              type="number"
              value={String(detail.thickness ?? "")}
              onChange={(event) => onChange({ ...detail, thickness: positiveInt(event.target.value) })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function validateDetail(detail: OrderDetail): string | null {
  if (!detail.materialId) return "กรุณาเลือกวัสดุจากรายการ";
  if (detail.qty < 1) return "จำนวนต้องมากกว่า 0";
  if (detail.remaining < 0) return "คงเหลือต้องไม่ติดลบ";
  if (detail.length < 1) return "ความยาวต้องมากกว่า 0";
  if (detail.shape === "ROUND" && (detail.diameter ?? 0) < 1) return "เส้นผ่านศูนย์กลางต้องมากกว่า 0";
  if (detail.shape === "PLATE" && ((detail.width ?? 0) < 1 || (detail.thickness ?? 0) < 1)) {
    return "ขนาดแผ่นและความหนาต้องมากกว่า 0";
  }
  return null;
}

function positiveInt(value: unknown): number {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function nonNegativeInt(value: unknown): number {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
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

