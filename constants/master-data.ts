import type { MasterDataNavItem } from "@/types/master-data";

// เมนู Master Data — ทุกหมวดอยู่กลุ่มเดียวกัน (shell/nav ร่วมกัน) แต่แยก path ต่อหมวด
export const MASTER_DATA_NAV: MasterDataNavItem[] = [
  // แท็บ "ลูกค้า" ถูกซ่อนไว้ (ดึงจาก Express แทน) — หน้ายังอยู่ กลับมาเปิดได้ภายหลัง
  // { key: "customer", label: "ลูกค้า", href: "/master-data/setting/customer" },
  { key: "ms_plates", label: "เหล็กแผ่น", href: "/master-data/setting/ms_plates" },
  { key: "steel_round_bars", label: "เพลาเหล็กกลม", href: "/master-data/setting/steel_round_bars" },
  { key: "wastrel_ms_plates", label: "เศษเหล็กแผ่น", href: "/master-data/setting/wastrel_ms_plates" },
  { key: "wastrel_steel_round_bars", label: "เศษเพลาเหล็กกลม", href: "/master-data/setting/wastrel_steel_round_bars" },
];

export const MASTER_DATA_SUBTITLE = "ข้อมูลหลักของระบบ | Master Data";

// สถานะจากทุก entity ใช้ badge โทนเดียวกัน
export const STATUS_TONES: Record<string, "slate" | "blue" | "amber" | "emerald" | "red"> = {
  ACTIVE: "emerald",
  AVAILABLE: "emerald",
  RESERVED: "blue",
  USED: "slate",
  INACTIVE: "amber",
  SCRAP: "amber",
  DELETED: "red",
};
