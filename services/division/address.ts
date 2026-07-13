import type { AddressOption } from "@/types/division";
import { API_VERSION, nestedString, readRows, requestJson, stringValue } from "./http";


export async function loadProvinces(): Promise<AddressOption[]> {
  const payload = await requestJson(`/api/${API_VERSION}/addresses/province`);
  return readRows(payload).map((row) => ({
    id: stringValue(row.id),
    name: nestedString(row.name, "th") || nestedString(row.name, "en") || stringValue(row.id),
    parentId: "",
  }));
}

export async function loadDistricts(): Promise<AddressOption[]> {
  const payload = await requestJson(`/api/${API_VERSION}/addresses/district`);
  return readRows(payload).map((row) => ({
    id: stringValue(row.id),
    name: nestedString(row.name, "th") || nestedString(row.name, "en") || stringValue(row.id),
    parentId: stringValue(row.province_id),
  }));
}

export async function loadSubdistricts(): Promise<AddressOption[]> {
  const payload = await requestJson(`/api/${API_VERSION}/addresses/subdistrict`);
  return readRows(payload).map((row) => ({
    id: stringValue(row.id),
    name: nestedString(row.name, "th") || nestedString(row.name, "en") || stringValue(row.id),
    parentId: stringValue(row.district_id),
  }));
}
