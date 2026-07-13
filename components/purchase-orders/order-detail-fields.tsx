"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { MaterialAutocomplete } from "./material-autocomplete";
import type { MaterialMaster, OrderDetail } from "@/types/division";

export function newOrderDetailDraft(): OrderDetail {
  return {
    id: `LOCAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`,
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

export function validateDetail(detail: OrderDetail): string | null {
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

export function OrderDetailFields({
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

function positiveInt(value: unknown): number {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function nonNegativeInt(value: unknown): number {
  const numeric = Math.floor(Number(value));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}
