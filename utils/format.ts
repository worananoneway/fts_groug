import type { OrderDetailStatus, PurchaseOrderStatus } from "@/types/division";

export function fmt(value: number): string {
  return Number(value || 0).toLocaleString("en-US");
}

export function sqm(width: number, height: number): string {
  return ((width * height) / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function statusLabel(status: PurchaseOrderStatus): string {
  if (status === "CANCELLED") return "ยกเลิก";
  if (status === "IN_PROGRESS") return "กำลังตัด";
  if (status === "DONE") return "เสร็จสิ้น";
  return "รอดำเนินการ";
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

/** แสดงวัน-เวลาแบบไทย เช่น "9 ก.ย. 2569 14:30" (ว่าง = "—") */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} ${date.toLocaleTimeString(
    "th-TH",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

/** ISO → ค่าที่ใส่ใน <input type="datetime-local"> (เวลาท้องถิ่น) */
export function toDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** ค่าจาก <input type="datetime-local"> → ISO (ว่าง = null) */
export function fromDateTimeInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
