import type {
  MaterialMaster,
  OrderDetail,
  OrderDetailStatus,
  OrderShape,
  PlateStock,
  PurchaseOrder,
  PurchaseOrderStatus,
  RoundBarStock,
} from "@/types/division";

export function mapPurchaseOrder(raw: Record<string, unknown>): PurchaseOrder | null {
  const id = stringValue(raw.id ?? raw.po_id);
  if (!id) return null;

  const comment = stringValue(raw.comment ?? raw.po_comment);
  const legacyRef = comment.match(/Express:\s*(JP\d+)/);
  const poNumber = stringValue(raw.no ?? raw.number ?? raw.po_number) || id;
  const legacyCustomer = legacyRef ? stringValue(raw.remark ?? raw.po_remark) : "";

  return {
    id,
    no: legacyRef ? legacyRef[1] : poNumber,
    customer:
      stringValue(raw.customer ?? raw.supplier_name ?? raw.po_supplier_name) ||
      nestedString(raw.customer, "name_th") ||
      nestedString(raw.customer, "name_en") ||
      nestedString(raw.supplier, "name") ||
      legacyCustomer ||
      "ไม่ระบุลูกค้า",
    customerId: nestedString(raw.customer, "id") || stringValue(raw.po_customer_id ?? raw.po_cus_id),
    projectId: nestedString(raw.project, "id") || stringValue(raw.po_project_id),
    date: formatDateString(raw.date ?? raw.issue_date ?? raw.po_issue_date),
    due: formatDateString(raw.due ?? raw.due_date ?? raw.po_due_date),
    status: mapPoStatus(raw.status ?? raw.po_status),
    shipVia: stringValue(raw.ship_via ?? raw.po_ship_via),
    qtOn: stringValue(raw.qt_on ?? raw.po_qt_on),
    shippingTerms: stringValue(raw.shipping_terms ?? raw.po_shipping_terms),
    taxRate: numberValue(raw.tax_rate ?? raw.po_tax_rate),
    comment: stringValue(raw.comment ?? raw.po_comment),
    raw,
  };
}

export function mapOrderDetails(raw: unknown): Record<string, OrderDetail[]> {
  if (!Array.isArray(raw)) return {};

  return raw.reduce<Record<string, OrderDetail[]>>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const row = item as Record<string, unknown>;
    const poId = stringValue(row.po_id ?? row.order_id ?? row.ord_id);
    const id = stringValue(row.id ?? row.odd_id ?? row.order_detail_id);
    // แถวที่นำเข้าจากระบบเดิมยังไม่มีวัสดุ (mm_id null) — เดารูปทรงจากขนาดที่มี ไม่งั้นถือเป็นแผ่น
    const shape =
      mapShape(stringValue(row.shape ?? row.shape_type) || nestedString(row.material, "shape_type")) ??
      (numberValue(row.required_diameter ?? row.required_diameter_mm) ? "ROUND" : "PLATE");
    if (!poId || !id) return acc;

    const materialId =
      stringValue(row.material_id ?? row.mm_id ?? row.odd_mm_id) || nestedString(row.material, "id");
    const description = stringValue(row.description);
    const dia = numberValue(row.diameter ?? row.required_diameter ?? row.required_diameter_mm);
    const len = numberValue(row.length ?? row.required_length ?? row.required_length_mm);
    const wid = numberValue(row.width ?? row.required_width ?? row.required_width_mm);
    const thk = numberValue(row.thickness ?? row.required_thickness ?? row.required_thickness_mm);
    const hasDimensions = dia > 0 || len > 0 || wid > 0 || thk > 0;
    // รายการอ้างอิง = ไม่มีวัสดุผูก + ไม่มีขนาดตัด (เช่น สินค้าทั่วไปที่ import มาแต่เดิม)
    // ส่วนงานตัดเหล็กที่ import (มีขนาด) ไม่ถือเป็น reference — แก้ไข/ส่งตัดได้ปกติ
    const isReference = !materialId && Boolean(description) && !hasDimensions;
    const materialName =
      stringValue(row.material ?? row.material_name ?? row.mm_name) ||
      nestedString(row.material, "name") ||
      description ||
      "ไม่ระบุวัสดุ";

    const detail: OrderDetail = {
      id,
      shape,
      materialId,
      material: materialName,
      diameter: numberValue(row.diameter ?? row.required_diameter ?? row.required_diameter_mm),
      length: numberValue(row.length ?? row.required_length ?? row.required_length_mm),
      width: numberValue(row.width ?? row.required_width ?? row.required_width_mm),
      thickness: numberValue(row.thickness ?? row.required_thickness ?? row.required_thickness_mm),
      qty: Math.max(1, Math.floor(numberValue(row.cut_quantity ?? row.qty ?? row.quantity) || 1)),
      remaining: Math.max(0, Math.floor(numberValue(row.remaining_quantity ?? row.remaining ?? row.quantity))),
      status: mapOrderDetailStatus(row.status ?? row.odd_status),
      unit: stringValue(row.unit) || undefined,
      productCode: extractProductCode(stringValue(row.remark)),
      isReference,
      raw: row,
    };

    acc[poId] = [...(acc[poId] ?? []), detail];
    return acc;
  }, {});
}

function extractProductCode(remark: string): string | undefined {
  const match = remark.match(/รหัสสินค้าเดิม:\s*(.+)/);
  return match ? match[1].trim() : undefined;
}

export function mapPlateStock(raw: Record<string, unknown>): PlateStock | null {
  const id = stringValue(raw.id ?? raw.msp_id);
  if (!id) return null;

  return {
    id,
    code: stringValue(raw.code ?? raw.msp_code) || id,
    length: numberValue(raw.length ?? raw.msp_length),
    width: numberValue(raw.width ?? raw.msp_width),
    thickness: numberValue(raw.thickness ?? raw.msp_thickness),
    available_quantity: numberValue(raw.available_quantity ?? raw.msp_available_quantity),
    status: stringValue(raw.status ?? raw.msp_status),
    material_master_id: stringValue(raw.mm_id ?? raw.msp_mm_id),
  };
}

export function mapRoundStock(raw: Record<string, unknown>): RoundBarStock | null {
  const id = stringValue(raw.id ?? raw.srb_id);
  if (!id) return null;

  return {
    id,
    code: stringValue(raw.code ?? raw.srb_code) || id,
    diameter: numberValue(raw.diameter ?? raw.srb_diameter),
    length: numberValue(raw.length ?? raw.srb_length),
    available_quantity: numberValue(raw.available_quantity ?? raw.srb_available_quantity),
    status: stringValue(raw.status ?? raw.srb_status),
    material_master_id: stringValue(raw.mm_id ?? raw.srb_mm_id),
  };
}

export function mapMaterialMasters(raw: unknown): MaterialMaster[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((row): MaterialMaster | null => {
      const id = stringValue(row.id ?? row.mm_id);
      const shape = mapShape(stringValue(row.shape ?? row.shape_type ?? row.mm_shape_type));
      if (!id || !shape) return null;
      return {
        id,
        name: stringValue(row.name ?? row.mm_name) || id,
        shape,
        status: stringValue(row.status ?? row.mm_status),
      };
    })
    .filter((row): row is MaterialMaster => Boolean(row));
}

export function mapOrderDetailStatus(value: unknown): OrderDetailStatus {
  const normalized = stringValue(value).trim().replace(/\s+/g, "_").toUpperCase();
  if (normalized === "IN_PROGRESS" || normalized === "IN_PROCESS" || normalized === "PROCESSING") return "IN_PROCESS";
  if (normalized === "DONE" || normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "CANCELLED" || normalized === "CANCELED") return "CANCELLED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "REVISED") return "REVISED";
  if (normalized === "DRAFT") return "DRAFT";
  return "PENDING";
}

export function orderDetailApiStatus(status: OrderDetailStatus): string {
  if (status === "IN_PROCESS") return "In Process";
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "REJECTED") return "Rejected";
  if (status === "REVISED") return "Revised";
  if (status === "DRAFT") return "Draft";
  return "Pending";
}

// material_masters.mm_shape_type ในฐานข้อมูลใช้ค่า Round_bar / Ms_plate
export function mapShape(value: string): OrderShape | null {
  const normalized = value.trim().replace(/\s+/g, "_").toUpperCase();
  if (normalized === "ROUND" || normalized === "ROUND_BAR" || normalized === "ROUNDBAR") return "ROUND";
  if (normalized === "PLATE" || normalized === "MS_PLATE" || normalized === "MSPLATE") return "PLATE";
  return null;
}

function mapPoStatus(value: unknown): PurchaseOrderStatus {
  const normalized = stringValue(value).trim().replace(/\s+/g, "_").toUpperCase();
  if (normalized === "CANCELLED" || normalized === "CANCELED") return "CANCELLED";
  if (normalized === "DONE" || normalized === "PAID" || normalized === "COMPLETED") return "DONE";
  if (normalized === "IN_PROGRESS" || normalized === "IN_PROCESS" || normalized === "PROCESSING") return "IN_PROGRESS";
  return "PENDING";
}

function formatDateString(value: unknown): string {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value);
}

function nestedString(value: unknown, key: string): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return stringValue(record[key]);
}

function numberValue(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
