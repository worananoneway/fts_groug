"use client";

import { Field } from "../../ui/field";
import type { MaterialMaster, OrderShape } from "../types";

export function MaterialAutocomplete({
  materialId,
  materialName,
  materials,
  onChange,
  shape,
}: {
  materialId?: string;
  materialName: string;
  materials: MaterialMaster[];
  onChange: (value: { id?: string; name: string }) => void;
  shape: OrderShape;
}) {
  const options = materials.filter((material) => material.shape === shape);
  const listId = `material-options-${shape.toLowerCase()}`;

  return (
    <Field
      helper={materialId ? undefined : "เลือกวัสดุจากรายการที่ดึงจาก material_masters"}
      label="วัสดุ"
      list={listId}
      value={materialName}
      onChange={(event) => {
        const name = event.target.value;
        const matched = options.find((material) => material.name === name);
        onChange({ id: matched?.id, name });
      }}
    >
      <datalist id={listId}>
        {options.map((material) => (
          <option key={material.id} value={material.name} />
        ))}
      </datalist>
    </Field>
  );
}
