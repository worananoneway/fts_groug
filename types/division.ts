import type { ReactNode } from "react";

export type ModuleKey = "po" | "plate" | "roundbar";
export type CuttingType = "plate" | "roundbar";
export type SubTabKey = "settings" | "layout" | "scrap";
export type PurchaseOrderStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type OrderDetailStatus = "DRAFT" | "REVISED" | "PENDING" | "IN_PROCESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type OrderShape = "ROUND" | "PLATE";

export interface TabDefinition<T extends string> {
  key: T;
  label: string;
}

export type DivisionNavKey = "projects" | "po" | "cutting" | "master-data";

export interface DivisionNavItem {
  key: DivisionNavKey;
  label: string;
  href: string;
}

export interface PurchaseOrder {
  id: string;
  no: string;
  customer: string;
  customerId?: string;
  projectId?: string;
  date: string;
  due: string;
  status: PurchaseOrderStatus;
  shipVia?: string;
  qtOn?: string;
  shippingTerms?: string;
  taxRate?: number;
  comment?: string;
  vendorId?: string;
  managerId?: string;

  /** true = รายการสดจาก Express ที่ยังไม่ได้นำเข้า (แสดงในลิสต์ แต่ยังไม่มีใน DB ของเว็บ) */
  isLive?: boolean;
  /** docloc ในระบบ Express สำหรับนำเข้าเงียบ ๆ ตอนผู้ใช้เปิดทำงาน */
  legacyDocId?: string;

  /** แถวดิบจาก GET เก็บไว้ใช้ round-trip ฟิลด์ที่ไม่ได้แก้ในหน้านี้ตอนส่ง PUT (endpoint แทนที่ทั้งแถว) */
  raw?: Record<string, unknown>;
}

export interface PurchaseOrderUpdateFields {
  shipVia: string;
  qtOn: string;
  shippingTerms: string;
  taxRate: number;
  comment: string;
}

// ฟิลด์ที่ฟอร์มสร้าง PO ให้ผู้ใช้กรอก — project_id ถูกเติมอัตโนมัติจากหน้าโปรเจค ที่เหลือ backend รับ null ได้
export interface PurchaseOrderCreateFields {
  customerId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  remark: string;
  comment: string;
  qtOn: string;
  shipVia: string;
  shippingTerms: string;
  conditionPaid: number;
  recipientId: string;
  approvedByEmpId: string;
  purchasingFname: string;
  purchasingLname: string;
  deliveryProvinceId: string;
  deliveryDistrictId: string;
  deliverySubdistrictId: string;
}

export interface AddressOption {
  id: string;
  name: string;
  parentId: string;
}

// ค่าตรงกับ project_enum ในฐานข้อมูล — ฝั่ง update ส่งค่านี้ตรง ๆ (ดู statusForCreate ใน services/division/projects.ts)
export type ProjectStatusValue = "Opened" | "Waiting - PO" | "Closed" | "Completed" | "Cancelled";

export interface Project {
  id: string;
  displayId: string;
  nameTh: string;
  nameEn: string;
  contactName: string;
  contactPhone: string;
  contactFax: string;
  contactEmail: string;
  customerId: string;
  customerName: string;
  managerId: string;
  managerName: string;
  budget: number;
  closingDate: string;
  note: string;
  status: string;
  createdAt: string;
}

/** ฟิลด์ที่ฟอร์มสร้าง/แก้ไขโปรเจคส่งให้ API — backend ต้องการครบทุก key ทั้ง POST และ PUT */
export interface ProjectFields {
  nameTh: string;
  nameEn: string;
  contactName: string;
  contactPhone: string;
  contactFax: string;
  contactEmail: string;
  customerId: string;
  managerId: string;
  budget: number;
  closingDate: string;
  note: string;
  status: ProjectStatusValue;
}

export interface CustomerOption {
  id: string;
  name: string;
}

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface MaterialMaster {
  id: string;
  name: string;
  shape: OrderShape;
  status?: string;
}

export interface OrderDetail {
  id: string;
  shape: OrderShape;
  materialId?: string;
  material: string;
  diameter?: number;
  length: number;
  width?: number;
  thickness?: number;
  qty: number;
  remaining: number;
  status: OrderDetailStatus;
  /** หน่วยนับจากระบบเดิม (เช่น PC, กก.) — ใช้กับรายการที่นำเข้าจาก Express */
  unit?: string;
  /** รหัสสินค้าเดิมจาก Express (stkcod) */
  productCode?: string;
  /** true = รายการอ้างอิงที่นำเข้าจาก Express (ยังไม่ผูกวัสดุ ไม่มีขนาดสำหรับตัด) */
  isReference?: boolean;
  /** Raw purchase_orders_details row, kept so updates round-trip pricing fields untouched by this screen. */
  raw?: Record<string, unknown>;
}

export interface PlateStock {
  id: string;
  code: string;
  length: number;
  width: number;
  thickness: number;
  available_quantity: number;
  status?: string;
  material_master_id?: string;
}

export interface RoundBarStock {
  id: string;
  code: string;
  diameter: number;
  length: number;
  available_quantity: number;
  status?: string;
  material_master_id?: string;
}

export interface PlateItem {
  id: number;
  code: string;
  w: number;
  h: number;
  qty: number;
  color: string;
  thickness?: number;
  orderDetailId?: string;
}

export interface RoundItem {
  id: number;
  code: string;
  length: number;
  qty: number;
  color: string;
  diameter?: number;
  orderDetailId?: string;
}

export interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatePiece {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  orderDetailId?: string;
  rotated: boolean;
}

export interface PlateSheet {
  pieces: PlatePiece[];
  freeRects: FreeRect[];
}

export interface PlateResult {
  sheets: PlateSheet[];
  unplaced: Array<{ code: string; w: number; h: number; orderDetailId?: string }>;
}

export interface RoundPiece {
  code: string;
  start: number;
  length: number;
  color: string;
  orderDetailId?: string;
}

export interface RoundBarLayout {
  pieces: RoundPiece[];
  used: number;
}

export interface RoundResult {
  bars: RoundBarLayout[];
  unplaced: Array<{ code: string; length: number; color?: string; orderDetailId?: string }>;
}

export interface PlateScrap {
  sheetNo: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoundScrap {
  barNo: number;
  length: number;
}

export interface SavedPlateScrap {
  id: string;
  code: string;
  length: number;
  width: number;
  thickness: number;
  remark: string;
  orderId?: string;
  orderDetailId?: string;
}

export interface SavedRoundScrap {
  id: string;
  code: string;
  diameter: number;
  length: number;
  quantity: number;
  remark: string;
  orderId?: string;
  orderDetailId?: string;
}

export interface FormState {
  code: string;
  quantity: string;
}

export interface PlateFormState extends FormState {
  width: string;
  height: string;
}

export interface RoundFormState extends FormState {
  length: string;
}

export interface Notice {
  ok: boolean;
  text: string;
}

export interface DataStatus {
  loading: boolean;
  error: string | null;
  source: "api" | "none";
}

export interface PlanActionOptions {
  detailIds?: string[];
  scrapSourceNo?: number;
}

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
}
