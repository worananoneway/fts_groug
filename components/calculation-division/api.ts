import type {
  OrderDetail,
  OrderDetailStatus,
  PlateStock,
  PurchaseOrder,
  RoundBarStock,
  SavedPlateScrap,
  SavedRoundScrap,
} from "./types";
import { mapOrderDetails, mapPlateStock, mapPurchaseOrder, mapRoundStock, orderDetailApiStatus } from "./mappers";

const API_VERSION = "v1";

export interface FactoryData {
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  stockPlates: PlateStock[];
  stockBars: RoundBarStock[];
  scrapPlates: SavedPlateScrap[];
  scrapBars: SavedRoundScrap[];
}

export async function loadFactoryData(): Promise<Partial<FactoryData>> {
  const [orders, stockPlates, stockBars, scrapPlates, scrapBars] = await Promise.all([
    loadOrders().catch(() => ({ purchaseOrders: [], orderDetails: {} })),
    safeRequest(loadMsPlates),
    safeRequest(loadSteelRoundBars),
    safeRequest(loadWastrelPlates),
    safeRequest(loadWastrelBars),
  ]);

  return {
    purchaseOrders: orders.purchaseOrders,
    orderDetails: orders.orderDetails,
    stockPlates,
    stockBars,
    scrapPlates,
    scrapBars,
  };
}

export async function loadOrders(): Promise<{
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
}> {
  const payload = await requestJson(`/api/${API_VERSION}/orders`);
  const purchaseOrders = readArray(payload, "orders")
    .map((row) => mapPurchaseOrder(row))
    .filter((row): row is PurchaseOrder => Boolean(row));
  const orderDetails = mapOrderDetails(readArray(payload, "order_details"));
  return { purchaseOrders, orderDetails };
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

  return payload?.details?.calculation_plan ?? null;
}

export async function updateOrderStatus(orderId: string, status: OrderDetailStatus): Promise<void> {
  await requestJson(`/api/${API_VERSION}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: orderDetailApiStatus(status) }),
  });
}

export async function updateOrderDetailStatus(orderDetailId: string, status: OrderDetailStatus): Promise<void> {
  await requestJson(`/api/${API_VERSION}/orders/details/${orderDetailId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: orderDetailApiStatus(status) }),
  });
}

function readArray(payload: unknown, key: string): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const details = (payload as { details?: Record<string, unknown> }).details;
  const rows = details?.[key];
  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}

async function requestJson(url: string, init?: RequestInit): Promise<{
  details?: Record<string, unknown>;
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
