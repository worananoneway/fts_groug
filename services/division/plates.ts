import type { PlateStock, SavedPlateScrap } from "@/types/division";
import { API_VERSION, flatString, nestedString, readArray, requestJson } from "./http";
import { mapPlateStock } from "./mappers";

export async function loadMsPlates(): Promise<PlateStock[]> {
  const payload = await requestJson(`/api/${API_VERSION}/accounting/ms-plates`);
  const rawRows = readArray(payload, "ms_plates");
  return rawRows
    .map((row) => mapPlateStock(row))
    .filter((row): row is PlateStock => Boolean(row));
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
