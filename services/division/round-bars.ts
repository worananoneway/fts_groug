import type { RoundBarStock, SavedRoundScrap } from "@/types/division";
import { API_VERSION, flatString, isRecord, nestedString, readArray, requestJson, stringValue } from "./http";
import { classifyLegacyItem } from "./legacy-orders";

// ดึงสต็อกเพลาเหล็กกลมจริงจาก Express (แทนข้อมูลตัวอย่าง PostgreSQL)
export async function loadSteelRoundBars(): Promise<RoundBarStock[]> {
  const payload = await requestJson(`/api/${API_VERSION}/legacy-steel-stock/round-bars`);
  const details = (payload as { details?: unknown })?.details;
  if (!Array.isArray(details)) return [];
  return details.filter(isRecord).map((r) => {
    const stkcod = stringValue(r.stkcod);
    const stkdes = stringValue(r.stkdes);
    const dims = classifyLegacyItem(stkdes);
    return {
      id: `${stkcod}::${stkdes}`,
      code: stkcod,
      diameter: dims.diameter ?? 0,
      length: dims.length ?? 0,
      available_quantity: Math.max(0, Math.round(Number(r.balance) || 0)),
      status: "Active",
    } as RoundBarStock;
  }).filter((row) => row.available_quantity > 0);
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
  srb_id?: string | null;
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
