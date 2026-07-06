import type { OrderDetail, PlateStock, PurchaseOrder, RoundBarStock } from "./types";
import { mapPlateStock, mapPurchaseOrder, mapRoundStock } from "./mappers";

const API_VERSION = "v1";

export interface FactoryData {
  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  stockPlates: PlateStock[];
  stockBars: RoundBarStock[];
}

export async function loadFactoryData(): Promise<Partial<FactoryData>> {
  const [purchaseOrders, stockPlates, stockBars] = await Promise.all([
    safeRequest(loadPurchaseOrders),
    safeRequest(loadMsPlates),
    safeRequest(loadSteelRoundBars),
  ]);

  return {
    purchaseOrders,
    stockPlates,
    stockBars,
    orderDetails: {},
  };
}

export async function loadPurchaseOrders(): Promise<PurchaseOrder[]> {
  const payload = await requestJson(`/api/${API_VERSION}/accounting/purchase-orders`);
  const rawRows = readArray(payload, "purchase_orders");
  return rawRows
    .map((row) => mapPurchaseOrder(row))
    .filter((row): row is PurchaseOrder => Boolean(row));
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

export async function calculateDivision(body: unknown): Promise<unknown> {
  const payload = await requestJson(`/api/${API_VERSION}/calculation-division`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return payload?.details?.calculation_plan ?? null;
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
  return response.json();
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
