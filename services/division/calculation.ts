import { API_VERSION, isRecord, requestJson } from "./http";

export async function calculateDivision(body: unknown): Promise<unknown> {
  const payload = await requestJson(`/api/${API_VERSION}/calculation-division`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return isRecord(payload?.details) ? payload.details.calculation_plan ?? null : null;
}
