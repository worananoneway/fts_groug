import type {
  OrderDetail,
  PurchaseOrder,
  RoundBarStock,
  SavedPlateScrap,
  SavedRoundScrap,
  TabDefinition,
  ModuleKey,
  PlateItem,
  PlateStock,
  RoundItem,
  SubTabKey,
} from "./types";

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

export const SAMPLE_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po1",
    no: "PO-2026-0142",
    customer: "บริษัท ไทย เมทัล เวิร์คส์ จำกัด",
    date: "01/07/2026",
    due: "10/07/2026",
    status: "PENDING",
  },
  {
    id: "po2",
    no: "PO-2026-0143",
    customer: "หจก. เอเชีย สตีล ซัพพลาย",
    date: "03/07/2026",
    due: "12/07/2026",
    status: "IN_PROGRESS",
  },
  {
    id: "po3",
    no: "PO-2026-0144",
    customer: "บริษัท พีเอ็มเค เอ็นจิเนียริ่ง จำกัด",
    date: "05/07/2026",
    due: "15/07/2026",
    status: "PENDING",
  },
];

export const SAMPLE_ORDER_DETAILS: Record<string, OrderDetail[]> = {
  po1: [
    {
      id: "od1",
      shape: "ROUND",
      material: "เพลาเหล็กกลม SS400",
      diameter: 50,
      length: 1200,
      qty: 20,
      remaining: 20,
    },
    {
      id: "od2",
      shape: "ROUND",
      material: "เพลาเหล็กกลม S45C",
      diameter: 50,
      length: 850,
      qty: 35,
      remaining: 35,
    },
    {
      id: "od3",
      shape: "PLATE",
      material: "เหล็กแผ่น SS400",
      thickness: 6,
      width: 600,
      length: 400,
      qty: 8,
      remaining: 8,
    },
  ],
  po2: [
    {
      id: "od4",
      shape: "ROUND",
      material: "เพลาเหล็กกลม S45C",
      diameter: 32,
      length: 2000,
      qty: 12,
      remaining: 12,
    },
    {
      id: "od5",
      shape: "ROUND",
      material: "เพลาเหล็กกลม S45C",
      diameter: 32,
      length: 950,
      qty: 18,
      remaining: 18,
    },
  ],
  po3: [
    {
      id: "od6",
      shape: "PLATE",
      material: "เหล็กแผ่น SS400",
      thickness: 10,
      width: 1000,
      length: 500,
      qty: 15,
      remaining: 15,
    },
    {
      id: "od7",
      shape: "PLATE",
      material: "เหล็กแผ่น SS400",
      thickness: 10,
      width: 450,
      length: 450,
      qty: 10,
      remaining: 10,
    },
  ],
};

export const SAMPLE_PLATE_STOCK: PlateStock[] = [
  {
    id: "p1",
    code: "MSP-2400x1200-01",
    length: 2400,
    width: 1200,
    thickness: 6,
    available_quantity: 18,
    status: "AVAILABLE",
  },
  {
    id: "p2",
    code: "MSP-3000x1500-02",
    length: 3000,
    width: 1500,
    thickness: 10,
    available_quantity: 6,
    status: "AVAILABLE",
  },
];

export const SAMPLE_ROUND_STOCK: RoundBarStock[] = [
  {
    id: "srb1",
    code: "SRB-D50-001",
    diameter: 50,
    length: 6000,
    available_quantity: 14,
    status: "AVAILABLE",
  },
  {
    id: "srb2",
    code: "SRB-D32-002",
    diameter: 32,
    length: 6000,
    available_quantity: 22,
    status: "AVAILABLE",
  },
  {
    id: "srb3",
    code: "SRB-D25-003",
    diameter: 25,
    length: 4000,
    available_quantity: 9,
    status: "AVAILABLE",
  },
];

export const SAMPLE_PLATE_ITEMS: PlateItem[] = [
  { id: 1, code: "A", w: 600, h: 400, qty: 3, color: ITEM_COLORS[0] },
  { id: 2, code: "B", w: 800, h: 300, qty: 2, color: ITEM_COLORS[1] },
  { id: 3, code: "C", w: 400, h: 400, qty: 4, color: ITEM_COLORS[2] },
  { id: 4, code: "D", w: 500, h: 200, qty: 3, color: ITEM_COLORS[3] },
];

export const SAMPLE_ROUND_ITEMS: RoundItem[] = [
  { id: 1, code: "A", length: 1200, qty: 5, color: ITEM_COLORS[0] },
  { id: 2, code: "B", length: 850, qty: 8, color: ITEM_COLORS[1] },
  { id: 3, code: "C", length: 600, qty: 6, color: ITEM_COLORS[2] },
];

export const SAMPLE_SAVED_PLATE_SCRAPS: SavedPlateScrap[] = [
  {
    id: "w1",
    code: "SCRAP-KX8Q-1",
    length: 620,
    width: 340,
    thickness: 6,
    remark: "เศษจากแผ่นที่ 2 (PO-2026-0139)",
  },
];

export const SAMPLE_SAVED_ROUND_SCRAPS: SavedRoundScrap[] = [
  {
    id: "rw1",
    code: "WSRB-KX8Q-1",
    diameter: 50,
    length: 480,
    quantity: 1,
    remark: "เศษจากแท่งที่ 2 (PO-2026-0139)",
  },
];

