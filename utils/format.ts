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
