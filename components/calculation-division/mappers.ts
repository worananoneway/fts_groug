import type {
  FreeRect,
  MaterialMaster,
  OrderDetail,
  OrderDetailStatus,
  PlateItem,
  PlateResult,
  PlateSheet,
  PlateStock,
  PurchaseOrder,
  PurchaseOrderStatus,
  RoundBarLayout,
  RoundBarStock,
  RoundItem,
  RoundResult,
} from "./types";

export function fmt(value: number): string {
  return Number(value || 0).toLocaleString("en-US");
}

export function sqm(width: number, height: number): string {
  return ((width * height) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function nextCode(used: string[]): string {
  for (let i = 0; i < 26; i += 1) {
    const candidate = String.fromCharCode(65 + i);
    if (!used.includes(candidate)) return candidate;
  }
  return `X${used.length + 1}`;
}

function splitFreeRect(sheet: PlateSheet, freeRect: FreeRect, w: number, h: number, kerf: number) {
  const rightW = freeRect.w - w - kerf;
  const bottomH = freeRect.h - h - kerf;

  if (rightW > bottomH) {
    if (rightW > 0) {
      sheet.freeRects.push({ x: freeRect.x + w + kerf, y: freeRect.y, w: rightW, h: freeRect.h });
    }
    if (bottomH > 0) {
      sheet.freeRects.push({ x: freeRect.x, y: freeRect.y + h + kerf, w, h: bottomH });
    }
  } else {
    if (bottomH > 0) {
      sheet.freeRects.push({ x: freeRect.x, y: freeRect.y + h + kerf, w: freeRect.w, h: bottomH });
    }
    if (rightW > 0) {
      sheet.freeRects.push({ x: freeRect.x + w + kerf, y: freeRect.y, w: rightW, h });
    }
  }
}

export function packGuillotine(sheetW: number, sheetH: number, kerf: number, items: PlateItem[]): PlateResult {
  const queue = items
    .flatMap((item) =>
      Array.from({ length: item.qty }, () => ({
        code: item.code,
        w: item.w,
        h: item.h,
        color: item.color,
        orderDetailId: item.orderDetailId,
      })),
    )
    .sort((a, b) => b.w * b.h - a.w * a.h);

  const sheets: PlateSheet[] = [];
  const unplaced: PlateResult["unplaced"] = [];

  const fits = (freeRect: FreeRect, w: number, h: number) => w <= freeRect.w && h <= freeRect.h;

  for (const piece of queue) {
    let placed = false;

    for (const sheet of sheets) {
      let best: { idx: number; rotated: boolean; score: number } | null = null;

      for (let idx = 0; idx < sheet.freeRects.length; idx += 1) {
        const freeRect = sheet.freeRects[idx];
        for (const rotated of [false, true] as const) {
          const w = rotated ? piece.h : piece.w;
          const h = rotated ? piece.w : piece.h;
          if (!fits(freeRect, w, h)) continue;

          const score = Math.min(freeRect.w - w, freeRect.h - h);
          if (!best || score < best.score) best = { idx, rotated, score };
        }
      }

      if (!best) continue;

      const freeRect = sheet.freeRects[best.idx];
      const w = best.rotated ? piece.h : piece.w;
      const h = best.rotated ? piece.w : piece.h;
      sheet.pieces.push({
        code: piece.code,
        x: freeRect.x,
        y: freeRect.y,
        w,
        h,
        color: piece.color,
        orderDetailId: piece.orderDetailId,
        rotated: best.rotated,
      });
      sheet.freeRects.splice(best.idx, 1);
      splitFreeRect(sheet, freeRect, w, h, kerf);
      placed = true;
      break;
    }

    if (placed) continue;

    const canFit = (piece.w <= sheetW && piece.h <= sheetH) || (piece.h <= sheetW && piece.w <= sheetH);
    if (!canFit) {
      unplaced.push({ code: piece.code, w: piece.w, h: piece.h });
      continue;
    }

    const rotated = !(piece.w <= sheetW && piece.h <= sheetH);
    const w = rotated ? piece.h : piece.w;
    const h = rotated ? piece.w : piece.h;
    const sheet: PlateSheet = { pieces: [], freeRects: [] };
    sheet.pieces.push({ code: piece.code, x: 0, y: 0, w, h, color: piece.color, orderDetailId: piece.orderDetailId, rotated });
    splitFreeRect(sheet, { x: 0, y: 0, w: sheetW, h: sheetH }, w, h, kerf);
    sheets.push(sheet);
  }

  return { sheets, unplaced };
}

export function packRoundBars(barLength: number, kerf: number, items: RoundItem[]): RoundResult {
  const queue = items
    .flatMap((item) =>
      Array.from({ length: item.qty }, () => ({
        code: item.code,
        length: item.length,
        color: item.color,
        orderDetailId: item.orderDetailId,
      })),
    )
    .sort((a, b) => b.length - a.length);

  const bars: RoundBarLayout[] = [];
  const unplaced: RoundResult["unplaced"] = [];

  for (const piece of queue) {
    if (piece.length > barLength) {
      unplaced.push(piece);
      continue;
    }

    let target: RoundBarLayout | null = null;
    for (const bar of bars) {
      const needed = bar.pieces.length > 0 ? piece.length + kerf : piece.length;
      if (bar.used + needed <= barLength) {
        target = bar;
        break;
      }
    }

    if (!target) {
      target = { pieces: [], used: 0 };
      bars.push(target);
    }

    const start = target.used + (target.pieces.length > 0 ? kerf : 0);
    target.pieces.push({ code: piece.code, start, length: piece.length, color: piece.color, orderDetailId: piece.orderDetailId });
    target.used = start + piece.length;
  }

  return { bars, unplaced };
}

export function mapPurchaseOrder(raw: Record<string, unknown>): PurchaseOrder | null {
  const id = stringValue(raw.id ?? raw.po_id);
  if (!id) return null;

  return {
    id,
    no: stringValue(raw.no ?? raw.number ?? raw.po_number) || id,
    customer:
      stringValue(raw.customer ?? raw.supplier_name ?? raw.po_supplier_name ?? nestedString(raw.supplier, "name")) ||
      "ไม่ระบุลูกค้า",
    date: formatDateString(raw.date ?? raw.issue_date ?? raw.po_issue_date),
    due: formatDateString(raw.due ?? raw.due_date ?? raw.po_due_date),
    status: mapPoStatus(raw.status ?? raw.po_status),
  };
}

export function mapOrderDetails(raw: unknown): Record<string, OrderDetail[]> {
  if (!Array.isArray(raw)) return {};

  return raw.reduce<Record<string, OrderDetail[]>>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const row = item as Record<string, unknown>;
    const poId = stringValue(row.po_id ?? row.order_id ?? row.ord_id);
    const id = stringValue(row.id ?? row.odd_id ?? row.order_detail_id);
    const shape = stringValue(row.shape ?? row.shape_type).toUpperCase();
    if (!poId || !id || (shape !== "ROUND" && shape !== "PLATE")) return acc;

    const detail: OrderDetail = {
      id,
      shape,
      materialId: stringValue(row.material_id ?? row.mm_id ?? row.odd_mm_id),
      material: stringValue(row.material ?? row.material_name ?? row.mm_name) || "ไม่ระบุวัสดุ",
      diameter: numberValue(row.diameter ?? row.required_diameter ?? row.required_diameter_mm),
      length: numberValue(row.length ?? row.required_length ?? row.required_length_mm),
      width: numberValue(row.width ?? row.required_width ?? row.required_width_mm),
      thickness: numberValue(row.thickness ?? row.required_thickness ?? row.required_thickness_mm),
      qty: Math.max(1, Math.floor(numberValue(row.qty ?? row.quantity) || 1)),
      remaining: Math.max(0, Math.floor(numberValue(row.remaining ?? row.quantity))),
      status: mapOrderDetailStatus(row.status ?? row.odd_status),
    };

    acc[poId] = [...(acc[poId] ?? []), detail];
    return acc;
  }, {});
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

export function statusLabel(status: PurchaseOrderStatus): string {
  if (status === "IN_PROGRESS") return "กำลังตัด";
  if (status === "DONE") return "เสร็จสิ้น";
  return "รอดำเนินการ";
}

export function mapMaterialMasters(raw: unknown): MaterialMaster[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((row) => {
      const id = stringValue(row.id ?? row.mm_id);
      const shape = stringValue(row.shape ?? row.mm_shape_type).toUpperCase();
      if (!id || (shape !== "ROUND" && shape !== "PLATE")) return null;
      return {
        id,
        name: stringValue(row.name ?? row.mm_name) || id,
        shape,
        status: stringValue(row.status ?? row.mm_status),
      };
    })
    .filter((row): row is MaterialMaster => Boolean(row));
}

export function orderDetailStatusLabel(status: OrderDetailStatus): string {
  if (status === "IN_PROCESS") return "กำลังดำเนินการ";
  if (status === "COMPLETED") return "เสร็จสิ้น";
  if (status === "CANCELLED") return "ยกเลิก";
  if (status === "REJECTED") return "ปฏิเสธ";
  if (status === "REVISED") return "แก้ไขแล้ว";
  if (status === "DRAFT") return "ฉบับร่าง";
  return "รอดำเนินการ";
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

function mapPoStatus(value: unknown): PurchaseOrderStatus {
  const normalized = stringValue(value).trim().replace(/\s+/g, "_").toUpperCase();
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
