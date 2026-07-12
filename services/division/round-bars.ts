import type { RoundBarStock, SavedRoundScrap } from "@/types/division";
import steelRoundBarsApi from "@/hooks/master-data/steel_round_bars";
import { API_VERSION, flatString, isRecord, nestedString, readArray, requestJson } from "./http";
import { mapRoundStock } from "./mappers";

export async function loadSteelRoundBars(): Promise<RoundBarStock[]> {
  const reply = (await steelRoundBarsApi.get()) as { statuscode?: number; details?: unknown };
  const rawRows = reply?.statuscode === 200 && Array.isArray(reply.details)
    ? reply.details.filter(isRecord)
    : [];
  return rawRows
    .map((row) => mapRoundStock(row))
    .filter((row): row is RoundBarStock => row !== null && row.status !== "Inactive");
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

export interface WastrelBarPayload {
  mm_id: string;
  srb_id?: string;
  code: string;
  diameter: number;
  length: number;
  quantity: number;
  available_quantity: number;
  po_id?: string | null;
  podetail_id?: string | null;
  ord_id?: string;
  odd_id?: string;
  remark?: string;
}

export async function createWastrelBar(body: WastrelBarPayload): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-steel-round-bars`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteWastrelBar(id: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-steel-round-bars/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Deleted" }),
  });
}
