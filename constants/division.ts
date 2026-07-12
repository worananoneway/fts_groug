import type { DivisionNavItem, ModuleKey, SubTabKey, TabDefinition } from "@/types/division";

export const ITEM_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
];

// หน้า /cutting มีแท็บเดียว — เนื้อหาข้างใน (แผ่น/เพลากลม) เปลี่ยนตามงานที่ส่งมาจากหน้า PO
export const DIVISION_NAV: DivisionNavItem[] = [
  { key: "po", label: "ใบสั่งซื้อ PO", href: "/po" },
  { key: "cutting", label: "ตัดแผ่นเหล็ก", href: "/cutting" },
];

// ปลายทางของปุ่ม "ข้อมูลหลัก" ที่มุมขวาบน header (แยกจากแท็บงานตัด)
export const MASTER_DATA_ENTRY_HREF = "/master-data/setting/customer";

export const SUB_TABS: Array<TabDefinition<SubTabKey>> = [
  { key: "settings", label: "ตั้งค่าและสั่งตัด" },
  { key: "layout", label: "แผนผังการตัด" },
  { key: "scrap", label: "คลังเศษเหล็ก" },
];

export const MODULE_SUBTITLES: Record<ModuleKey, string> = {
  po: "ใบสั่งซื้อและรายการตัดของลูกค้า | Purchase Orders",
  plate: "ระบบคำนวณการตัดเหล็กแผ่น | Guillotine Packing",
  roundbar: "ระบบคำนวณการตัดเพลาเหล็กกลม | 1D Cutting Stock",
};
