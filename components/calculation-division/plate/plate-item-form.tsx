"use client";

import { Package, Save } from "lucide-react";

import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateItemForm() {
  const { addPlateItem, plateEditingItemId, plateForm, setPlateForm } = useCalculationDivision();

  return (
    <div className="mb-4 grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <Field
        inputClassName="text-center"
        label="รหัส"
        onChange={(event) => setPlateForm((form) => ({ ...form, code: event.target.value }))}
        placeholder="A-Z"
        value={plateForm.code}
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
      <Field
        label="จำนวน"
        min={1}
        onChange={(event) => setPlateForm((form) => ({ ...form, quantity: event.target.value }))}
        type="number"
        value={plateForm.quantity}
      />
      <Button
        className="h-[46px] px-4 md:mt-0"
        icon={plateEditingItemId ? <Save className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        onClick={addPlateItem}
      >
        <span className="sr-only">{plateEditingItemId ? "บันทึกรายการ" : "เพิ่มรายการ"}</span>
      </Button>
    </div>
  );
}

