"use client";

import { Package, Save } from "lucide-react";

import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function RoundBarItemForm() {
  const { addRoundItem, roundEditingItemId, roundForm, setRoundForm } = useCalculationDivision();

  return (
    <div className="mb-4 grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
      <Field
        inputClassName="text-center"
        label="รหัส"
        onChange={(event) => setRoundForm((form) => ({ ...form, code: event.target.value }))}
        placeholder="A-Z"
        value={roundForm.code}
      />
      <Field
        label="ความยาว"
        onChange={(event) => setRoundForm((form) => ({ ...form, length: event.target.value }))}
        placeholder="มม."
        type="number"
        value={roundForm.length}
      />
      <Field
        label="จำนวน"
        min={1}
        onChange={(event) => setRoundForm((form) => ({ ...form, quantity: event.target.value }))}
        type="number"
        value={roundForm.quantity}
      />
      <Button
        className="h-[46px] px-4 md:mt-0"
        icon={roundEditingItemId ? <Save className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        onClick={addRoundItem}
      >
        <span className="sr-only">{roundEditingItemId ? "บันทึกรายการ" : "เพิ่มรายการ"}</span>
      </Button>
    </div>
  );
}

