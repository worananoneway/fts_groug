import type {
  MaterialMaster,
  OrderDetail,
  OrderDetailStatus,
  PlateStock,
  PurchaseOrder,
  PurchaseOrderStatus,
  RoundBarStock,
  SavedPlateScrap,
  SavedRoundScrap,
} from "./types";
import {
  mapMaterialMasters,
  mapOrderDetails,
  mapPlateStock,
  mapPurchaseOrder,
  mapRoundStock,
  orderDetailApiStatus,
} from "./mappers";

const API_VERSION = "v1";

export interface FactoryData {
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  materialMasters: MaterialMaster[];
  stockPlates: PlateStock[];
  stockBars: RoundBarStock[];
  scrapPlates: SavedPlateScrap[];
  scrapBars: SavedRoundScrap[];
}

export async function loadFactoryData(): Promise<Partial<FactoryData>> {
  const [orders, stockPlates, stockBars, scrapPlates, scrapBars] = await Promise.all([
    loadOrders().catch(() => ({ materialMasters: [], purchaseOrders: [], orderDetails: {} })),
    safeRequest(loadMsPlates),
    safeRequest(loadSteelRoundBars),
    safeRequest(loadWastrelPlates),
    safeRequest(loadWastrelBars),
  ]);

  return {
    purchaseOrders: orders.purchaseOrders,
    orderDetails: orders.orderDetails,
    materialMasters: orders.materialMasters,
    stockPlates,
    stockBars,
    scrapPlates,
    scrapBars,
  };
}

export async function loadOrders(): Promise<{
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  materialMasters: MaterialMaster[];
}> {
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

export async function loadMsPlates(): Promise<PlateStock[]> {
  const payload = await requestJson(`/api/${API_VERSION}/accounting/ms-plates`);
  const rawRows = readArray(payload, "ms_plates");
  return rawRows
    .map((row) => mapPlateStock(row))
    .filter((row): row is PlateStock => Boolean(row));
}

export async function loadSteelRoundBars(): Promise<RoundBarStock[]> {
  const payload = await requestJson(`/api/${API_VERSION}/steel-round-bars`);
  const rawRows = readArray(payload, "steel_round_bars");
  return rawRows
    .map((row) => mapRoundStock(row))
    .filter((row): row is RoundBarStock => Boolean(row));
}

export async function loadWastrelPlates(): Promise<SavedPlateScrap[]> {
  const payload = await requestJson(`/api/${API_VERSION}/wastrel-ms-plates`);
  return readArray(payload, "wastrel_ms_plates")
    .filter((row) => row.status !== "Deleted" && row.status !== "Inactive")
    .map((row) => ({
      id: String(row.id ?? ""),
      code: String(row.stock_code ?? row.code ?? ""),
      length: Number(row.length) || 0,
      width: Number(row.width) || 0,
      thickness: Number(row.thickness) || 0,
      remark: String(row.remark ?? ""),
      orderId: flatString(row, "ord_id", "wmsp_ord_id") ?? nestedString(row.order, "id"),
      orderDetailId: flatString(row, "odd_id", "wmsp_odd_id") ?? nestedString(row.order_detail, "id"),
    }))
    .filter((row) => row.id);
}

export async function loadWastrelBars(): Promise<SavedRoundScrap[]> {
  const payload = await requestJson(`/api/${API_VERSION}/wastrel-steel-round-bars`);
  return readArray(payload, "wastrel_steel_round_bars")
    .filter((row) => row.status !== "Deleted" && row.status !== "Inactive")
    .map((row) => ({
      id: String(row.id ?? ""),
      code: String(row.code ?? ""),
      diameter: Number(row.diameter) || 0,
      length: Number(row.length) || 0,
      quantity: Number(row.quantity) || 1,
      remark: String(row.remark ?? ""),
      orderId: flatString(row, "ord_id", "wsrb_ord_id") ?? nestedString(row.order, "id"),
      orderDetailId: flatString(row, "odd_id", "wsrb_odd_id") ?? nestedString(row.order_detail, "id"),
    }))
    .filter((row) => row.id);
}

export interface WastrelPlatePayload {
  mm_id: string;
  msp_id?: string;
  stock_code: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  available_quantity: number;
  ord_id?: string;
  odd_id?: string;
  remark?: string;
}

export interface WastrelBarPayload {
  mm_id: string;
  srb_id?: string;
  code: string;
  diameter: number;
  length: number;
  quantity: number;
  available_quantity: number;
  ord_id?: string;
  odd_id?: string;
  remark?: string;
}

export async function createWastrelPlate(body: WastrelPlatePayload): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-ms-plates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function createWastrelBar(body: WastrelBarPayload): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-steel-round-bars`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteWastrelPlate(id: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-ms-plates/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Deleted" }),
  });
}

export async function deleteWastrelBar(id: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-steel-round-bars/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Deleted" }),
  });
}

export async function calculateDivision(body: unknown): Promise<unknown> {
  const payload = await requestJson(`/api/${API_VERSION}/calculation-division`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return isRecord(payload?.details) ? payload.details.calculation_plan ?? null : null;
}

export async function updateOrderDetailStatus(
  orderId: string,
  detail: OrderDetail,
  status: OrderDetailStatus,
): Promise<void> {
  await putOrderDetail(orderId, { ...detail, status });
}

export async function createOrderDetail(orderId: string, detail: OrderDetail): Promise<void> {
  const item = orderDetailPayload(orderId, detail);
  // controller ของ purchase-order-details validate ฟิลด์จาก body ชั้นนอก แต่บันทึกจาก items
  await requestJson(`/api/${API_VERSION}/purchase-order-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, items: [item] }),
  });
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

function readArray(payload: unknown, key: string): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const details = (payload as { details?: unknown }).details;
  if (!isRecord(details)) return [];
  const rows = details[key];
  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}

function readRows(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const details = (payload as { details?: unknown }).details;
  return Array.isArray(details) ? details.filter(isRecord) : [];
}

async function requestJson(url: string, init?: RequestInit): Promise<{
  details?: unknown;
}> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function safeRequest<T>(loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function nestedString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as Record<string, unknown>)[key];
  if (nested === null || nested === undefined || typeof nested === "object") return undefined;
  return String(nested);
}

function flatString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && typeof value !== "object" && String(value)) {
      return String(value);
    }
  }
  return undefined;
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

function stringValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === "object") return "";
  return String(value);
}
