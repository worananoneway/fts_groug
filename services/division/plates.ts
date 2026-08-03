import type { PlateStock, SavedPlateScrap } from "@/types/division";
import { API_VERSION, flatString, isRecord, nestedString, readRows, requestJson, stringValue } from "./http";
import { classifyLegacyItem } from "./legacy-orders";

// ดึงสต็อกเหล็กแผ่นจริงจาก Express (แทนข้อมูลตัวอย่าง PostgreSQL)
export async function loadMsPlates(): Promise<PlateStock[]> {
  const payload = await requestJson(`/api/${API_VERSION}/legacy-steel-stock/plates`);
  const details = (payload as { details?: unknown })?.details;
  if (!Array.isArray(details)) return [];
  return details.filter(isRecord).map((r) => {
    const stkcod = stringValue(r.stkcod);
    const stkdes = stringValue(r.stkdes);
    const dims = classifyLegacyItem(stkdes);
    return {
      id: `${stkcod}::${stkdes}`,
      code: stkcod,
      length: dims.length ?? 0,
      width: dims.width ?? 0,
      thickness: dims.thickness ?? 0,
      available_quantity: Math.max(0, Math.round(Number(r.balance) || 0)),
      status: "Active",
    } as PlateStock;
  }).filter((row) => row.available_quantity > 0);
}

export async function loadWastrelPlates(): Promise<SavedPlateScrap[]> {
  const payload = await requestJson(`/api/${API_VERSION}/wastrel-ms-plates`);
  return readRows(payload)
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

export interface WastrelPlatePayload {
  mm_id: string;
  msp_id?: string | null;
  stock_code: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  available_quantity: number;
  po_id?: string | null;
  podetail_id?: string | null;
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

export async function deleteWastrelPlate(id: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/wastrel-ms-plates/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Deleted" }),
  });
}
