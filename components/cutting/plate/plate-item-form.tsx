"use client";

import { useState } from "react";
import { Package, Save } from "lucide-react";

import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { Modal } from "../../ui/modal";
import { TimedToast } from "../../ui/timed-toast";
import { useCutting } from "@/hooks/use-cutting";
import type { Notice } from "@/types/division";

export function PlateItemForm() {
  const { addPlateItem, beginNewPlateItem, plateEditingItemId, plateForm, setPlateForm } =
    useCutting();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const modalOpen = open || Boolean(plateEditingItemId);

  function openAddModal() {
    beginNewPlateItem();
    setNotice(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    if (plateEditingItemId) beginNewPlateItem();
  }

  function save() {
    if (!positiveInt(plateForm.width) || !positiveInt(plateForm.height) || !positiveInt(plateForm.quantity)) {
      setNotice({ ok: false, text: "กรุณากรอกขนาดแผ่นที่ต้องการตัด" });
      return;
    }
    addPlateItem();
    setOpen(false);
    setNotice({ ok: true, text: plateEditingItemId ? "แก้ไขรายการสำเร็จ" : "เพิ่มรายการสำเร็จ" });
  }

  return (
    <div className="mb-4 space-y-3">
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          icon={<Package className="h-5 w-5" />}
          onClick={openAddModal}
          variant="secondary"
        >
          เพิ่มรายการ
        </Button>
      </div>

      <Modal
        open={modalOpen}
        title={plateEditingItemId ? "แก้ไขรายการสั่งตัด" : "เพิ่มรายการสั่งตัด"}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={closeModal} variant="secondary">
              ยกเลิก
            </Button>
            <Button icon={<Save className="h-4 w-4" />} onClick={save}>
              ยืนยัน
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            inputClassName="text-center"
            label="รหัส"
            onChange={(event) => setPlateForm((form) => ({ ...form, code: event.target.value }))}
            placeholder="A-Z"
            value={plateForm.code}
          />
          <Field
            label="จำนวน"
            min={1}
            step={1}
            onChange={(event) => setPlateForm((form) => ({ ...form, quantity: positiveInt(event.target.value) }))}
            type="number"
            value={plateForm.quantity}
          />
          <Field
            label="กว้าง W"
            min={1}
            step={1}
            onChange={(event) => setPlateForm((form) => ({ ...form, width: positiveInt(event.target.value) }))}
            placeholder="มม."
            type="number"
            value={plateForm.width}
          />
          <Field
            label="ยาว H"
            min={1}
            step={1}
            onChange={(event) => setPlateForm((form) => ({ ...form, height: positiveInt(event.target.value) }))}
            placeholder="มม."
            type="number"
            value={plateForm.height}
          />
        </div>
      </Modal>
    </div>
  );
}

function positiveInt(value: unknown): string {
  const numeric = Math.floor(Number(value));
  return String(Number.isFinite(numeric) && numeric > 0 ? numeric : 1);
}

