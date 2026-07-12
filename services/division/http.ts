export const API_VERSION = "v1";

export async function requestJson(url: string, init?: RequestInit): Promise<{
  details?: unknown;
}> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
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
