import type { EmployeeOption } from "@/types/division";
import { API_VERSION, isRecord, nestedString, readRows, requestJson, stringValue } from "./http";

export async function loadActiveEmployees(): Promise<EmployeeOption[]> {
  const payload = await requestJson(`/api/${API_VERSION}/employees?status=Active`);
  return readRows(payload)
    .map((row) => ({
      id: stringValue(row.id),
      name: fullName(row) || stringValue(row.display_id) || stringValue(row.id),
    }))
    .filter((row) => row.id);
}

function fullName(row: Record<string, unknown>): string {
  if (!isRecord(row.name)) return "";
  return nestedString(row.name, "th") || nestedString(row.name, "en") || "";
}
