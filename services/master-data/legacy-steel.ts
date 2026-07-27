import { API_VERSION, isRecord, requestJson, stringValue } from "@/services/division/http";
import { classifyLegacyItem } from "@/services/division/legacy-orders";
import type { MsPlateRow, SteelRoundBarRow } from "@/types/master-data";

interface StockRow {
  stkcod: string;
  stkdes: string;
  balance: number;
  unit: string;
}

function readStockRows(payload: unknown): StockRow[] {
  const details = (payload as { details?: unknown })?.details;
  if (!Array.isArray(details)) return [];
  return details.filter(isRecord).map((r) => ({
    stkcod: stringValue(r.stkcod),
    stkdes: stringValue(r.stkdes),
    balance: Number(r.balance) || 0,
    unit: stringValue(r.unit),
  }));
}

// เหล็กแผ่นจริงจาก Express → รูปแบบ MsPlateRow (แกะ หนา/กว้าง/ยาว จากชื่อสินค้า)
export async function loadPlateStockFromExpress(): Promise<MsPlateRow[]> {
  const payload = await requestJson(`/api/${API_VERSION}/legacy-steel-stock/plates`);
  return readStockRows(payload).map((row) => {
    const dims = classifyLegacyItem(row.stkdes);
    const qty = Math.max(0, Math.round(row.balance));
    return {
      // id ต้องไม่ซ้ำ — รหัสเดียวกันอาจมีหลายชื่อ/ขนาด จึงรวม stkcod + stkdes
      id: `${row.stkcod}::${row.stkdes}`,
      mm_id: null,
      code: row.stkcod,
      length: dims.length,
      width: dims.width,
      thickness: dims.thickness,
      quantity: qty,
      available_quantity: qty,
      loc_id: null,
      location_type: null,
      location: null,
      status: "Active",
      received_date: null,
      remark: row.stkdes,
      created_at: null,
      updated_at: null,
      employee: null,
      material: { id: null, name: row.stkdes, type: dims.grade },
    };
  });
}

// เพลาเหล็กกลมจริงจาก Express → รูปแบบ SteelRoundBarRow (แกะ Ø/ยาว จากชื่อสินค้า)
export async function loadRoundBarStockFromExpress(): Promise<SteelRoundBarRow[]> {
  const payload = await requestJson(`/api/${API_VERSION}/legacy-steel-stock/round-bars`);
  return readStockRows(payload).map((row) => {
    const dims = classifyLegacyItem(row.stkdes);
    const qty = Math.max(0, Math.round(row.balance));
    return {
      // id ต้องไม่ซ้ำ — รหัสเดียวกันอาจมีหลายชื่อ/ขนาด จึงรวม stkcod + stkdes
      id: `${row.stkcod}::${row.stkdes}`,
      mm_id: null,
      code: row.stkcod,
      diameter: dims.diameter,
      length: dims.length,
      quantity: qty,
      available_quantity: qty,
      loc_id: null,
      location_type: null,
      location: null,
      status: "Active",
      received_date: null,
      remark: row.stkdes,
      created_at: null,
      updated_at: null,
    };
  });
}
