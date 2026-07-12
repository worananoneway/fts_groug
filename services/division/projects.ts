import type { CustomerOption, Project, ProjectFields } from "@/types/division";
import { API_VERSION, isRecord, nestedString, readRows, requestJson, stringValue } from "./http";

export async function loadProjects(): Promise<Project[]> {
  const payload = await requestJson(`/api/${API_VERSION}/projects`);
  return readRows(payload)
    .map((row) => mapProject(row))
    .filter((row): row is Project => Boolean(row));
}

export async function loadProject(projectId: string): Promise<Project | null> {
  const payload = await requestJson(`/api/${API_VERSION}/projects/${encodeURIComponent(projectId)}`);
  const [row] = readRows(payload);
  return row ? mapProject(row) : null;
}

export async function createProject(fields: ProjectFields): Promise<void> {
  await requestJson(`/api/${API_VERSION}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...projectPayload(fields), status: statusForCreate(fields.status) }),
  });
}

export async function updateProject(projectId: string, fields: ProjectFields): Promise<void> {
  await requestJson(`/api/${API_VERSION}/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...projectPayload(fields), status: fields.status }),
  });
}

export async function loadCustomerOptions(): Promise<CustomerOption[]> {
  const payload = await requestJson(`/api/${API_VERSION}/customers`);
  return readRows(payload)
    .filter((row) => stringValue(row.status) === "Active")
    .map((row) => ({
      id: stringValue(row.id),
      name: stringValue(row.name_th) || stringValue(row.name_en) || stringValue(row.id),
    }))
    .filter((row) => row.id);
}

function projectPayload(fields: ProjectFields) {
  return {
    name_th: fields.nameTh.trim(),
    name_en: fields.nameEn.trim(),
    contact_name: fields.contactName.trim(),
    contact_phone: fields.contactPhone.trim(),
    contact_fax: fields.contactFax.trim(),
    contact_email: fields.contactEmail.trim(),
    customer_id: fields.customerId,
    manager_id: fields.managerId.trim(),
    budget: fields.budget,
    closing_date: fields.closingDate,
    note: fields.note.trim(),
  };
}

// controller ฝั่ง create ตรวจ status ด้วย enum KEY (แทนช่องว่างด้วย _) ทำให้ค่า "Waiting - PO" ไม่ผ่าน
// ต้องส่งแบบไม่มีขีด ("Waiting PO" → WAITING_PO) แล้ว backend จะ map กลับเป็นค่า enum ในฐานข้อมูลเอง
// ส่วนฝั่ง update ไม่ตรวจ/ไม่แปลง จึงต้องส่งค่า enum ตรง ๆ ("Waiting - PO")
function statusForCreate(status: string): string {
  return status.replace(/\s*-\s*/g, " ");
}

function mapProject(row: Record<string, unknown>): Project | null {
  const id = stringValue(row.id);
  if (!id) return null;

  const contact = isRecord(row.contact) ? row.contact : {};
  const customer = isRecord(row.customer) ? row.customer : {};
  const manager = isRecord(row.manager) ? row.manager : {};
  const customerName = isRecord(customer.name)
    ? stringValue(customer.name.th) || stringValue(customer.name.en)
    : "";
  const managerName = isRecord(manager.name)
    ? stringValue(manager.name.th) || stringValue(manager.name.en)
    : "";

  return {
    id,
    displayId: stringValue(row.display_id) || id,
    nameTh: stringValue(row.name_th),
    nameEn: stringValue(row.name_en),
    contactName: nestedString(contact, "name") ?? "",
    contactPhone: nestedString(contact, "phone") ?? "",
    contactFax: nestedString(contact, "fax") ?? "",
    contactEmail: nestedString(contact, "email") ?? "",
    customerId: nestedString(customer, "id") ?? "",
    customerName,
    managerId: nestedString(manager, "id") ?? "",
    managerName,
    budget: Number(row.budget) || 0,
    closingDate: stringValue(row.closing_date),
    note: stringValue(row.note),
    status: stringValue(row.status),
    createdAt: stringValue(row.created_at),
  };
}
