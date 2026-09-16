import {
  API_VERSION,
  isRecord,
  readRows,
  requestJson,
  requestJsonOptional,
  stringValue,
} from "@/services/division/http";

/** ที่จัดเก็บหนึ่งแห่ง (ตาราง locations) */
export interface LocationOption {
  id: string;
  code: string;
  name: string;
  type: string;
}

/** ประเภทสต็อกที่ผูกที่จัดเก็บได้ (ตรงกับ stock_location_type_enum ใน DB) */
export type StockLocationType = "Ms_plate" | "Round_bar" | "Wastrel_ms_plate" | "Wastrel_round_bar";

const LOCATION_TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: "คลัง",
  ZONE: "โซน",
  RACK: "ชั้นวาง",
  SHELF: "ชั้น",
  OTHER: "อื่น ๆ",
};

export function locationTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return LOCATION_TYPE_LABELS[type.toUpperCase()] ?? type;
}

function mapLocation(row: unknown): LocationOption | null {
  if (!isRecord(row)) return null;
  const id = stringValue(row.id);
  if (!id) return null;
  return {
    id,
    code: stringValue(row.code),
    name: stringValue(row.name) || stringValue(row.code) || id,
    type: stringValue(row.type),
  };
}

/** รายการที่จัดเก็บทั้งหมด (เฉพาะที่ยังใช้งาน) */
export async function loadLocations(): Promise<LocationOption[]> {
  const payload = await requestJsonOptional(`/api/${API_VERSION}/locations`);
  return readRows(payload)
    .map(mapLocation)
    .filter((row): row is LocationOption => Boolean(row));
}

/** ข้อมูลที่เราบันทึกไว้เองสำหรับสต็อกหนึ่งรหัส */
export interface StockLocationEntry {
  location: LocationOption | null;
  /** วัน-เวลาที่ผู้ใช้กำหนด (ISO) */
  scheduledAt: string | null;
  /** วันที่บันทึกลงระบบ (ISO) */
  recordedAt: string | null;
}

/** ที่จัดเก็บ + วัน-เวลาของสต็อกแต่ละรหัส — คืนเป็น map รหัสสินค้า → ข้อมูล */
export async function loadStockLocationMap(
  stockType: StockLocationType,
): Promise<Record<string, StockLocationEntry>> {
  const payload = await requestJsonOptional(
    `/api/${API_VERSION}/stock-locations?stock_type=${encodeURIComponent(stockType)}`,
  );
  const map: Record<string, StockLocationEntry> = {};
  for (const row of readRows(payload)) {
    const code = stringValue(row.stock_code);
    if (!code) continue;
    map[code] = {
      location: mapLocation(row.location),
      scheduledAt: stringValue(row.scheduled_at) || null,
      recordedAt: stringValue(row.updated_at) || stringValue(row.created_at) || null,
    };
  }
  return map;
}

/**
 * บันทึกที่จัดเก็บ + วัน-เวลาของรหัสสินค้าหนึ่ง (ส่ง null คือล้างค่า)
 * ส่งไปพร้อมกันทั้งคู่เสมอ เพราะฝั่ง API เป็น upsert ทั้งแถว
 */
export async function saveStockLocation(
  stockType: StockLocationType,
  stockCode: string,
  locId: string | null,
  scheduledAt: string | null = null,
): Promise<void> {
  await requestJson(`/api/${API_VERSION}/stock-locations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stock_type: stockType,
      stock_code: stockCode,
      loc_id: locId,
      scheduled_at: scheduledAt,
    }),
  });
}

/** แถวเต็มของที่จัดเก็บ (ใช้ในหน้าจัดการที่จัดเก็บ) */
export interface LocationRow extends LocationOption {
  parent: LocationOption | null;
  detail: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** ฟิลด์ที่ฟอร์มสร้าง/แก้ไขที่จัดเก็บส่งให้ API */
export interface LocationFields {
  code: string;
  name: string;
  type: string;
  parentId: string;
  detail: string;
}

export const LOCATION_TYPES = ["WAREHOUSE", "ZONE", "RACK", "SHELF", "OTHER"] as const;

function mapLocationRow(row: unknown): LocationRow | null {
  const base = mapLocation(row);
  if (!base || !isRecord(row)) return null;
  return {
    ...base,
    parent: mapLocation(row.parent),
    detail: stringValue(row.detail) || null,
    status: stringValue(row.status) || null,
    created_at: stringValue(row.created_at) || null,
    updated_at: stringValue(row.updated_at) || null,
  };
}

export async function loadLocationRows(): Promise<LocationRow[]> {
  const payload = await requestJsonOptional(`/api/${API_VERSION}/locations`);
  return readRows(payload)
    .map(mapLocationRow)
    .filter((row): row is LocationRow => Boolean(row));
}

function locationPayload(fields: LocationFields) {
  return {
    code: fields.code.trim(),
    name: fields.name.trim(),
    type: fields.type,
    parent_id: fields.parentId.trim() === "" ? null : fields.parentId.trim(),
    detail: fields.detail.trim() === "" ? null : fields.detail.trim(),
  };
}

export async function createLocation(fields: LocationFields): Promise<void> {
  await requestJson(`/api/${API_VERSION}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationPayload(fields)),
  });
}

export async function updateLocation(locId: string, fields: LocationFields): Promise<void> {
  await requestJson(`/api/${API_VERSION}/locations/${encodeURIComponent(locId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationPayload(fields)),
  });
}

export async function deleteLocation(locId: string): Promise<void> {
  await requestJson(`/api/${API_VERSION}/locations/${encodeURIComponent(locId)}`, {
    method: "DELETE",
  });
}
