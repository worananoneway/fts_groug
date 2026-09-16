import type { PurchaseOrder } from "@/types/division";
import { API_VERSION, isRecord, readRows, requestJson, requestLegacyJson, stringValue } from "./http";

// ---------------------------------------------------------------------------
// ประเภทข้อมูลจากระบบคลังเดิม (ftsgroupstore MySQL ผ่าน /api/v1/legacy-sales-orders)
// ---------------------------------------------------------------------------

export interface LegacyOrder {
  id: string;
  docNumber: string;
  customerName: string;
  /** เลขอ้างอิงใบ SI ต้นทาง (เช่น SI2607245-ส0038) */
  customerRef: string;
  docDate: string;
  type: string;
}

export interface LegacyOrderItem {
  id: string;
  productCode: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface LegacyOrderDetail extends LegacyOrder {
  items: LegacyOrderItem[];
}

// ---------------------------------------------------------------------------
// โหลดข้อมูลจาก API
// ---------------------------------------------------------------------------

// ใบสั่งตัด = เอกสารเลขขึ้นต้น "JP" ในระบบเดิม (ใบสั่งผลิต/ตัด อ้างอิงจากใบ SI)
export async function loadLegacyOrders(search: string): Promise<LegacyOrder[]> {
  const params = new URLSearchParams({ prefix: "JP", limit: "100" });
  const query = search.trim();
  if (query) {
    // ค้นด้วยเลขเอกสารถ้าขึ้นต้นด้วยตัวอักษร ไม่งั้นค้นด้วยเลขอ้างอิง/ลูกค้า
    if (/^[A-Za-z]/.test(query)) params.set("docnum", query);
    else params.set("cusnam", query);
  }
  const payload = await requestLegacyJson(`/api/${API_VERSION}/legacy-sales-orders?${params.toString()}`);
  return readRows(payload)
    .map(mapLegacyOrder)
    .filter((row): row is LegacyOrder => Boolean(row));
}

// แปลงใบสั่งตัดสดจาก Express เป็น "PO ชั่วคราว" สำหรับแสดงในลิสต์ (ยังไม่นำเข้า)
export function legacyOrderToLivePO(order: LegacyOrder): PurchaseOrder {
  return {
    id: `LIVE-${order.id}`,
    no: order.docNumber,
    customer: order.customerName,
    date: formatThaiShortDate(order.docDate),
    due: "",
    status: "PENDING",
    isLive: true,
    legacyDocId: order.id,
  };
}

function formatThaiShortDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const buddhistYear = Number(m[1]) + 543;
  return `${m[3]}/${m[2]}/${buddhistYear}`;
}

export async function loadLegacyOrderDetail(docId: string): Promise<LegacyOrderDetail> {
  const payload = await requestLegacyJson(
    `/api/${API_VERSION}/legacy-sales-orders/${encodeURIComponent(docId)}`,
  );
  const details = (payload as { details?: unknown }).details;
  if (!isRecord(details)) throw new Error("ไม่พบข้อมูลเอกสาร");
  const header = mapLegacyOrder(details);
  if (!header) throw new Error("ข้อมูลเอกสารไม่สมบูรณ์");
  const items = Array.isArray(details.items)
    ? details.items.filter(isRecord).map(mapLegacyItem).filter((row): row is LegacyOrderItem => Boolean(row))
    : [];
  return { ...header, items };
}

function mapLegacyOrder(row: Record<string, unknown>): LegacyOrder | null {
  const id = stringValue(row.id);
  if (!id) return null;
  const ref = stringValue(row.customer_ref).trim();
  // customer_name = ชื่อลูกค้าจริงที่ resolve จากใบ SI; ถ้าไม่มีให้ใช้เลขอ้างอิง
  const name = stringValue(row.customer_name).trim();
  return {
    id,
    docNumber: stringValue(row.doc_number) || id,
    customerName: name || ref || "(ไม่ระบุลูกค้า)",
    customerRef: ref,
    docDate: stringValue(row.doc_date).slice(0, 10),
    type: stringValue(row.type),
  };
}

function mapLegacyItem(row: Record<string, unknown>): LegacyOrderItem | null {
  const id = stringValue(row.id);
  if (!id) return null;
  // จำนวนจริงอยู่ที่ extended_quantity (xtrnqty) เช่น 140 ตัว — ไม่ใช่ quantity (trnqty=1)
  const extended = Number(row.extended_quantity);
  const base = Number(row.quantity);
  const quantity = Number.isFinite(extended) && extended > 0 ? extended : base || 0;
  return {
    id,
    productCode: stringValue(row.product_code).trim(),
    description: stringValue(row.product_description).trim(),
    quantity,
    unit: stringValue(row.unit).trim(),
  };
}

// ---------------------------------------------------------------------------
// จำแนกสินค้า Express ว่าเป็นงานตัดเหล็กหรือไม่ + แกะขนาด/เกรด
//
// เพลากลม  : "เหล็กเพลา SS400 6.8 มม.x 190 mm." → ROUND, เกรด SS400, dia 6.8, ยาว 190
//            "เหล็กเพลา SS400 6 มม.x6m."        → ยาว 6 ม. = 6000 มม.
// แผ่น     : "PLATE ..."/"แผ่นเพลท..." → PLATE, แกะ หนา/กว้าง/ยาว เท่าที่ได้
// อื่น ๆ   : น็อต ท่อ พุ๊ก ฯลฯ → kind "skip" (ไม่ใช่งานตัด)
// ---------------------------------------------------------------------------

export interface SteelClassification {
  kind: "round" | "plate" | "skip";
  grade: string | null;
  diameter: number | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
}

export function classifyLegacyItem(stkdes: string): SteelClassification {
  const text = stkdes.trim();
  const normalized = text.replace(/,/g, "").replace(/[×X]/g, "x");
  const gradeMatch = normalized.match(/\b(SS400|SS41|S45C|SCM4|SUS\d*|A36)\b/i);
  const grade = gradeMatch ? gradeMatch[1].toUpperCase() : null;

  // ---- แผ่น: ชื่อมี PLATE / แผ่นเพลท / เหล็กแผ่น (รวมแผ่นวงกลม/สามเหลี่ยม) ----
  // รูปแบบ JP: "PLATE หนา 6 มิล x สั่งทำ" → หนา 6, กว้าง/ยาว = สั่งทำ (ไม่ระบุ)
  if (/PLATE|แผ่นเพลท|เหล็กแผ่น|^PL/i.test(normalized)) {
    // ความหนา: "หนา N มิล" หรือ "หนา N"
    const thickMatch = normalized.match(/หนา\s*([\d.]+)/);
    // กว้าง x ยาว (ถ้ามี ไม่ใช่ "สั่งทำ")
    const dimMatch = normalized.match(/(\d[\d.]*)\s*x\s*(\d[\d.]*)/);
    return {
      kind: "plate",
      grade,
      diameter: null,
      length: dimMatch ? toPositive(dimMatch[2]) : null,
      width: dimMatch ? toPositive(dimMatch[1]) : null,
      thickness: thickMatch ? toPositive(thickMatch[1]) : null,
    };
  }

  // ---- เพลากลม: ชื่อขึ้นต้น "เหล็กเพลา <เกรด>" ----
  const roundMatch = normalized.match(/เหล็กเพลา\s+([A-Za-z0-9]+)/);
  if (roundMatch) {
    const diaMatch = normalized.match(/([\d.]+)\s*มม\.?/);
    const lenMatch = normalized.match(/x\s*([\d.]+)\s*(mm|มม\.?|m\.?|ม\.?|เมตร)/i);
    return {
      kind: "round",
      grade: roundMatch[1],
      diameter: diaMatch ? toPositive(diaMatch[1]) : null,
      length: lenMatch ? toLengthMm(lenMatch[1], lenMatch[2]) : null,
      width: null,
      thickness: null,
    };
  }

  // ---- โบลต์/สตัด (ทำจากเหล็กเพลา ดัด/กลึงเกลียว) ----
  // "L-Bolt SS400 M20x600x100(T100)", "J-Bolt SS400 M20 x 600 x 100", "สตัดเกลียว 2 ข้าง M16 x 1150 mm."
  if (/Bolt|สตัดเกลียว|เกลียวตลอด/i.test(normalized)) {
    // ขนาดเกลียว M<n> ใช้เป็นเส้นผ่านศูนย์กลางเพลาตั้งต้น
    const mMatch = normalized.match(/M\s*([\d.]+)/i);
    // ความยาวเส้นแรกหลัง M-size (เช่น M20 x 600 → 600)
    const lenMatch = normalized.match(/M\s*[\d.]+\s*x\s*([\d.]+)/i)
      || normalized.match(/x\s*([\d.]+)\s*(mm|มม)/i);
    return {
      kind: "round",
      grade,
      diameter: mMatch ? toPositive(mMatch[1]) : null,
      length: lenMatch ? toPositive(lenMatch[1]) : null,
      width: null,
      thickness: null,
    };
  }

  // ---- อื่น ๆ ไม่ใช่งานตัด ----
  return { kind: "skip", grade: null, diameter: null, length: null, width: null, thickness: null };
}

function toPositive(value: string | undefined): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

// แปลงความยาวเป็นมิลลิเมตร โดยดูหน่วย (เมตร → x1000)
function toLengthMm(value: string, unit: string): number | null {
  const num = toPositive(value);
  if (num === null) return null;
  const u = unit.toLowerCase().replace(/\./g, "");
  const isMeter = u === "m" || u === "ม" || u === "เมตร";
  return isMeter ? num * 1000 : num;
}

// ---------------------------------------------------------------------------
// นำเข้าเอกสารจากระบบเดิม → สร้าง PO + รายการตัดในระบบใหม่
// รายการที่นำเข้าจะเป็นสถานะ Draft ให้ผู้ใช้เลือกวัสดุ/ตรวจขนาดก่อนส่งตัด
// ---------------------------------------------------------------------------

export async function importLegacyOrder(docId: string): Promise<string> {
  const legacy = await loadLegacyOrderDetail(docId);

  // 1) สร้าง PO — endpoint บังคับให้มี key ครบทุกตัว แต่ค่า null ได้
  const poPayload = {
    cus_id: null,
    due_date: null,
    issue_date: legacy.docDate || null,
    ship_via: null,
    qt_on: null,
    shipping_terms: null,
    tax_rate: 7,
    recipient_id: null,
    comment: `นำเข้าจาก Express: ${legacy.docNumber} — อ้างอิง ${legacy.customerRef}`,
    status_sent_date: null,
    status_goods_received_: null,
    status_paid_date: null,
    status_note: null,
    // remark เก็บชื่อลูกค้าจริง (ดึงจากใบ SI) — ใช้แสดงเป็นชื่อลูกค้าของ PO ที่นำเข้า
    remark: legacy.customerName,
    project_id: null,
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
    body: JSON.stringify(poPayload),
  });
  const details = (reply as { details?: unknown }).details;
  const newPoId = isRecord(details) ? stringValue(details.id) : "";
  if (!newPoId) throw new Error("สร้างใบสั่งซื้อไม่สำเร็จ");

  // 2) สร้างรายการ — เอาเฉพาะงานตัดเหล็ก (เพลากลม/แผ่น) ตัดสินค้าทั่วไปทิ้ง
  const items = legacy.items
    .map((item) => {
      const steel = classifyLegacyItem(item.description);
      if (steel.kind === "skip") return null; // ไม่ใช่งานตัด — ข้าม
      const qty = Math.max(1, Math.floor(item.quantity) || 1);
      return {
        po_id: newPoId,
        mm_id: null,
        required_length_mm: steel.length,
        required_width_mm: steel.kind === "plate" ? steel.width : null,
        required_thickness_mm: steel.kind === "plate" ? steel.thickness : null,
        required_diameter_mm: steel.kind === "round" ? steel.diameter : null,
        cut_quantity: qty,
        remaining_quantity: qty,
        allow_wastrel: true,
        allow_rotation: true,
        // Pending = พร้อมส่งไปตัด (แต่ยังควรตรวจ/เลือกวัสดุ master ก่อน)
        status: "Pending",
        // เก็บเกรด + รหัสสินค้าเดิมไว้ใน remark
        remark: [
          steel.grade ? `เกรด: ${steel.grade}` : null,
          item.productCode ? `รหัสเดิม: ${item.productCode}` : null,
        ]
          .filter(Boolean)
          .join(" | ") || null,
        on: null,
        unit: item.unit || null,
        // description = ชื่อสินค้าเต็มจาก Express (ใช้แสดงเป็นชื่อวัสดุในตาราง)
        description: item.description || null,
        qty: item.quantity > 0 ? item.quantity : null,
        discount: null,
        unit_price: null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (items.length === 0) {
    throw new Error("เอกสารนี้ไม่มีรายการงานตัดเหล็ก (มีแต่สินค้าทั่วไป)");
  }

  await requestJson(`/api/${API_VERSION}/purchase-order-details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...items[0], items }),
  });

  return newPoId;
}
