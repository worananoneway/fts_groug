"use client";

import { useState } from "react";
import { Package, Save } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { Modal } from "../../ui/modal";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { Notice } from "../types";

export function PlateItemForm() {
  const { addPlateItem, beginNewPlateItem, plateEditingItemId, plateForm, setPlateForm } =
    useCalculationDivision();
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
    if (!Number(plateForm.width) || !Number(plateForm.height)) {
      setNotice({ ok: false, text: "กรุณากรอกขนาดแผ่นที่ต้องการตัด" });
      return;
    }
    addPlateItem();
    setOpen(false);
    setNotice({ ok: true, text: plateEditingItemId ? "แก้ไขรายการสำเร็จ" : "เพิ่มรายการสำเร็จ" });
  }

  return (
    <div className="mb-4 space-y-3">
      {notice ? (
        <AlertBanner tone={notice.ok ? "success" : "warning"}>{notice.text}</AlertBanner>
      ) : null}
      <Button
        className="w-full sm:w-auto"
        icon={<Package className="h-5 w-5" />}
        onClick={openAddModal}
        variant="secondary"
      >
        เพิ่มรายการ
      </Button>

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
            onChange={(event) => setPlateForm((form) => ({ ...form, quantity: event.target.value }))}
            type="number"
            value={plateForm.quantity}
          />
          <Field
            label="กว้าง W"
            onChange={(event) => setPlateForm((form) => ({ ...form, width: event.target.value }))}
            placeholder="มม."
            type="number"
            value={plateForm.width}
          />
          <Field
            label="ยาว H"
            onChange={(event) => setPlateForm((form) => ({ ...form, height: event.target.value }))}
            placeholder="มม."
            type="number"
            value={plateForm.height}
          />
        </div>
      </Modal>
    </div>
  );
}

