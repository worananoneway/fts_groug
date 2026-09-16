export const API_VERSION = "v1";

// กันหน้าเว็บหมุนค้าง: ถ้า API ไม่ตอบภายในเวลานี้ ให้ถือว่าโหลดไม่สำเร็จ
const REQUEST_TIMEOUT_MS = 20_000;

export async function requestJson(url: string, init?: RequestInit): Promise<{
  details?: unknown;
}> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...init });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error(`API ไม่ตอบกลับภายใน ${REQUEST_TIMEOUT_MS / 1000} วินาที: ${url}`);
    }
    throw error;
  }
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * เหมือน requestJson แต่ถือว่า 404 = "ไม่มีข้อมูล" (คืน {} ไม่ throw)
 * controller ฝั่ง backend ตอบ 404 เมื่อ query ไม่เจอแถวเลย
 */
export async function requestJsonOptional(url: string, init?: RequestInit): Promise<{
  details?: unknown;
}> {
  try {
    return await requestJson(url, init);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Request failed: 404")) return {};
    throw error;
  }
}

/** ข้อความเดียวกันทุกที่เมื่อคลังเดิม (Express / MySQL ที่โรงงาน) ต่อไม่ได้ */
export const LEGACY_UNREACHABLE =
  "ต่อฐานข้อมูลคลังเดิม (Express) ไม่ได้ — ตรวจสอบว่าเปิด ZeroTier/VPN อยู่ และเซิร์ฟเวอร์คลังเปิดใช้งาน แล้วกดรีเฟรชอีกครั้ง";

/**
 * เรียก endpoint ที่อ่านข้อมูลจากคลังเดิม — ถ้าล้มเหลวจะโยน error
 * ที่มีข้อความอ่านรู้เรื่อง (เอาไปแสดงบนหน้าเว็บได้ตรง ๆ)
 */
export async function requestLegacyJson(url: string, init?: RequestInit): Promise<{
  details?: unknown;
}> {
  try {
    return await requestJson(url, init);
  } catch (error) {
    console.error("[Legacy] เรียกข้อมูลจากคลังเดิมไม่สำเร็จ:", url, error);
    throw new Error(LEGACY_UNREACHABLE);
  }
}

/**
 * สต็อกที่ดึงจาก Express มี id เป็น "รหัส::ชื่อสินค้า" ซึ่งยาวเกิน 20 ตัวอักษร
 * และไม่มีแถวจริงในตารางของเรา — ใช้เป็น FK ไม่ได้ (API จะตอบ 422)
 * ตัวช่วยนี้คืน id เฉพาะตอนที่เป็น id จริงของฐานข้อมูลเท่านั้น ไม่งั้นคืน null
 */
export function dbStockId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.includes("::") || id.length > 20) return null;
  return id;
}

export async function safeRequest<T>(loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

export function readArray(payload: unknown, key: string): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const details = (payload as { details?: unknown }).details;
  if (!isRecord(details)) return [];
  const rows = details[key];
  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}

export function readRows(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const details = (payload as { details?: unknown }).details;
  return Array.isArray(details) ? details.filter(isRecord) : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function nestedString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nested = (value as Record<string, unknown>)[key];
  if (nested === null || nested === undefined || typeof nested === "object") return undefined;
  return String(nested);
}

export function flatString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && typeof value !== "object" && String(value)) {
      return String(value);
    }
  }
  return undefined;
}

export function stringValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === "object") return "";
  return String(value);
}
