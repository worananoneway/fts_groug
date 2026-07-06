import type { TabDefinition, ModuleKey, SubTabKey } from "./types";

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

export const MODULE_TABS: Array<TabDefinition<ModuleKey>> = [
  { key: "po", label: "ใบสั่งซื้อ PO" },
  { key: "plate", label: "ตัดแผ่นเหล็ก" },
  { key: "roundbar", label: "ตัดเพลาเหล็กกลม" },
];

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


