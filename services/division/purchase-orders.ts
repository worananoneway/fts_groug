import type {
  MaterialMaster,
  OrderDetail,
  OrderDetailStatus,
  PurchaseOrder,
  PurchaseOrderCreateFields,
  PurchaseOrderStatus,
  PurchaseOrderUpdateFields,
} from "@/types/division";
import { API_VERSION, isRecord, readRows, requestJson, stringValue } from "./http";
import { mapMaterialMasters, mapOrderDetails, mapPurchaseOrder, orderDetailApiStatus } from "./mappers";

export interface OrdersData {
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  materialMasters: MaterialMaster[];
}

// โหลด PO เฉพาะของโปรเจคหนึ่ง ๆ — GET จะตอบ 404 เมื่อโปรเจคยังไม่มี PO เลย ให้ถือเป็นลิสต์ว่าง
export async function loadProjectOrders(projectId: string): Promise<PurchaseOrder[]> {
  let payload: { details?: unknown };
  try {
    payload = await requestJson(`/api/${API_VERSION}/purchase-orders?project_id=${encodeURIComponent(projectId)}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) return [];
    throw error;
  }
  return readRows(payload)
    .filter((row) => stringValue(row.status) !== "Deleted")
    .map((row) => mapPurchaseOrder(row))
    .filter((row): row is PurchaseOrder => Boolean(row));
}

// สร้าง PO ใต้โปรเจค — backend บังคับให้มี key ครบทุกตัว (field_validator) แต่ค่าเป็น null ได้ทั้งหมด
// ยกเว้นที่ผู้ใช้กรอกจริง จึงส่ง null ให้ฟิลด์ที่ยังไม่ใช้ในหน้านี้
export async function createProjectOrder(projectId: string, fields: PurchaseOrderCreateFields): Promise<string> {
  const payload = {
    cus_id: fields.customerId || null,
    due_date: fields.dueDate || null,
    issue_date: fields.issueDate || null,
    ship_via: null,
    qt_on: null,
    shipping_terms: null,
    tax_rate: fields.taxRate,
    recipient_id: null,
    comment: null,
    status_sent_date: null,
    status_goods_received_: null,
    status_paid_date: null,
    status_note: null,
    remark: fields.remark.trim() || null,
    project_id: projectId,
    condition_paid: null,
    delivery_province_id: null,
    delivery_district_id: null,
    delivery_subdistrict_id: null,
    approved_by_emp_id: null,
    purchasing_fname: null,
    purchasing_lname: null,
  };
  const reply = await requestJson(`/api/${API_VERSION}/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const details = (reply as { details?: unknown }).details;
  const newId = isRecord(details) ? stringValue(details.id) : "";
  if (!newId) throw new Error("สร้างใบสั่งซื้อสำเร็จ แต่ไม่พบเลขที่อ้างอิงเพื่อบันทึกรายการเหล็ก");
  return newId;
}

export async function loadOrders(): Promise<OrdersData> {
  const payload = await requestJson(`/api/${API_VERSION}/purchase-orders`);
  const poRows = readRows(payload).filter((row) => stringValue(row.status) !== "Deleted");
  const detailRows = poRows.flatMap((row) => (Array.isArray(row.details) ? row.details.filter(isRecord) : []));
  const orderDetails = mapOrderDetails(detailRows);
  const purchaseOrders = poRows
    .map((row) => mapPurchaseOrder(row))
    .filter((row): row is PurchaseOrder => Boolean(row))
    .map((po) => ({ ...po, status: poStatusFromDetails(orderDetails[po.id] ?? []) }));
  const materialMasters = dedupeById(
    mapMaterialMasters(detailRows.map((row) => row.material).filter(isRecord)),
  );
  return { purchaseOrders, orderDetails, materialMasters };
}

// po_status ในตาราง purchase_orders เป็นสถานะจัดซื้อ (Paid, Waiting Delivery, ...)
// สถานะงานตัดของหน้านี้จึงสรุปจากสถานะของรายการตัดแทน
function poStatusFromDetails(details: OrderDetail[]): PurchaseOrderStatus {
  const active = details.filter((row) => row.status !== "CANCELLED" && row.status !== "REJECTED");
  if (active.some((row) => row.status === "IN_PROCESS")) return "IN_PROGRESS";
  if (active.length > 0 && active.every((row) => row.status === "COMPLETED")) return "DONE";
  return "PENDING";
}

function dedupeById(rows: MaterialMaster[]): MaterialMaster[] {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export async function updateOrderDetailStatus(
  orderId: string,
  detail: OrderDetail,
  status: OrderDetailStatus,
): Promise<void> {
  await putOrderDetail(orderId, { ...detail, status });
}

export async function createOrderDetail(orderId: string, detail: OrderDetail): Promise<string | undefined> {
  const item = orderDetailPayload(orderId, detail);
  // controller ของ purchase-order-details validate ฟิลด์จาก body ชั้นนอก แต่บันทึกจาก items
  const payload = await requestJson(`/api/${API_VERSION}/purchase-order-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, items: [item] }),
  });
  return createdOrderDetailId(payload.details);
}

// POST คืนแถวที่สร้าง (RETURNING *) มาเป็น array ซ้อน array — ดึง podetail_id ของแถวแรกออกมา
function createdOrderDetailId(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const row = details.flat(2).filter(isRecord).find((item) => item.podetail_id ?? item.id);
  const value = row?.podetail_id ?? row?.id;
  return value === undefined || value === null ? undefined : String(value);
}

export async function updateOrderDetail(orderId: string, detail: OrderDetail): Promise<void> {
  await putOrderDetail(orderId, detail);
}

async function putOrderDetail(orderId: string, detail: OrderDetail): Promise<void> {
  const item = { id: detail.id, ...orderDetailPayload(orderId, detail) };
  await requestJson(`/api/${API_VERSION}/purchase-order-details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, items: [item] }),
  });
}

// สร้าง payload ของ purchase_orders_details โดยดึงฟิลด์ฝั่งบัญชี (ราคา, ส่วนลด, หน่วย ฯลฯ)
// กลับมาจาก raw เดิม เพื่อไม่ให้การอัปเดตจากหน้างานตัดไปล้างข้อมูลเหล่านั้น
function orderDetailPayload(orderId: string, detail: OrderDetail) {
  const raw = detail.raw ?? {};
  return {
    po_id: orderId,
    mm_id: detail.materialId || null,
    required_length_mm: detail.length,
    required_width_mm: detail.shape === "PLATE" ? detail.width ?? null : null,
    required_thickness_mm: detail.shape === "PLATE" ? detail.thickness ?? null : null,
    required_diameter_mm: detail.shape === "ROUND" ? detail.diameter ?? null : null,
    cut_quantity: detail.qty,
    remaining_quantity: detail.remaining,
    allow_wastrel: typeof raw.allow_wastrel === "boolean" ? raw.allow_wastrel : true,
    allow_rotation: typeof raw.allow_rotation === "boolean" ? raw.allow_rotation : true,
    status: orderDetailApiStatus(detail.status),
    remark: raw.remark ?? null,
    on: raw.on ?? null,
    unit: raw.unit ?? null,
    description: raw.description ?? null,
    qty: raw.qty ?? null,
    discount: raw.discount ?? null,
    unit_price: raw.unit_price ?? null,
  };
}

// endpoint นี้เป็น PUT แทนที่ทั้งแถว (ไม่ใช่ PATCH) — ต้อง round-trip ทุกฟิลด์จาก raw เดิม
// ไม่งั้นฟิลด์ที่หน้านี้ไม่ได้แก้ (ลูกค้า, โครงการ, ที่อยู่จัดส่ง, ผู้อนุมัติ ฯลฯ) จะถูกเซ็ตเป็น NULL ทิ้ง
export async function updatePurchaseOrder(
  poId: string,
  fields: PurchaseOrderUpdateFields,
  raw: Record<string, unknown>,
): Promise<void> {
  const payload = {
    cus_id: nestedId(raw, "customer", "id") ?? null,
    due_date: raw.due_date ?? null,
    remark: raw.remark ?? null,
    issue_date: raw.issue_date ?? null,
    ship_via: fields.shipVia,
    qt_on: fields.qtOn,
    shipping_terms: fields.shippingTerms,
    tax_rate: fields.taxRate,
    recipient_id: nestedId(raw, "recipient", "id") ?? null,
    comment: fields.comment,
    project_id: nestedId(raw, "project", "id") ?? null,
    condition_paid: raw.condition_paid ?? null,
    delivery_province_id: nestedId(raw, "delivery_address", "province", "id") ?? null,
    delivery_district_id: nestedId(raw, "delivery_address", "district", "id") ?? null,
    delivery_subdistrict_id: nestedId(raw, "delivery_address", "subdistrict", "id") ?? null,
    approved_by_emp_id: nestedId(raw, "approved_by", "id") ?? null,
    purchasing_fname: raw.purchasing_fname ?? null,
    purchasing_lname: raw.purchasing_lname ?? null,
  };
  await requestJson(`/api/${API_VERSION}/purchase-orders/${poId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletePurchaseOrder(poId: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/purchase-orders/${poId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Deleted" }),
  });
}

function nestedId(row: Record<string, unknown>, ...path: string[]): string | undefined {
  let current: unknown = row;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current === null || current === undefined || typeof current === "object" ? undefined : String(current);
}
