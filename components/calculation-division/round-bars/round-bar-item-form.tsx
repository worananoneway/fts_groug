"use client";

import { useState } from "react";
import { Package, Save } from "lucide-react";

import { AlertBanner } from "../../ui/alert-banner";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { Modal } from "../../ui/modal";
import { useCalculationDivision } from "../hooks/use-calculation-division";
import type { Notice } from "../types";

export function RoundBarItemForm() {
  const { addRoundItem, beginNewRoundItem, roundEditingItemId, roundForm, setRoundForm } =
    useCalculationDivision();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const modalOpen = open || Boolean(roundEditingItemId);

  function openAddModal() {
    beginNewRoundItem();
    setNotice(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    if (roundEditingItemId) beginNewRoundItem();
  }

  function save() {
    if (!Number(roundForm.length)) {
      setNotice({ ok: false, text: "กรุณากรอกความยาวที่ต้องการตัด" });
      return;
    }
    addRoundItem();
    setOpen(false);
    setNotice({ ok: true, text: roundEditingItemId ? "แก้ไขรายการสำเร็จ" : "เพิ่มรายการสำเร็จ" });
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
        title={roundEditingItemId ? "แก้ไขรายการสั่งตัดเพลา" : "เพิ่มรายการสั่งตัดเพลา"}
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
            onChange={(event) => setRoundForm((form) => ({ ...form, code: event.target.value }))}
            placeholder="A-Z"
            value={roundForm.code}
          />
          <Field
            label="จำนวน"
            min={1}
            onChange={(event) => setRoundForm((form) => ({ ...form, quantity: event.target.value }))}
            type="number"
            value={roundForm.quantity}
          />
          <Field
            label="ความยาว"
            onChange={(event) => setRoundForm((form) => ({ ...form, length: event.target.value }))}
            placeholder="มม."
            type="number"
            value={roundForm.length}
          />
        </div>
      </Modal>
    </div>
  );
}

